#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function findImaApi() {
  const candidatePaths = [
    process.env.IMA_API_PATH,
    path.join(__dirname, 'ima_api.cjs'),
    path.join(__dirname, '../../../scripts/shared/ima_api.cjs'),
    path.join(os.homedir(), '.gemini/config/skills/ima-skills/ima_api.cjs'),
    path.join(os.homedir(), '.gemini/antigravity/skills/@tencent-adm/ima-skills/ima_api.cjs')
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return require(p).imaApi;
      } catch (e) {
        // continue search
      }
    }
  }
  return null;
}

const imaApi = findImaApi();

const DEFAULT_KB_CONFIG = {
  it: {
    id: '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=',
    name: '信息科技教学'
  },
  gt: {
    id: 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=',
    name: '技术与工程教学'
  }
};

function resolveLocalDir(...envVars) {
  for (const ev of envVars) {
    const dir = process.env[ev];
    if (dir && typeof dir === 'string') {
      try {
        const stat = fs.statSync(dir);
        if (stat.isDirectory()) return dir;
      } catch {
        // ignore invalid directory
      }
    }
  }
  return null;
}

const KB_MAP = {
  it: {
    id: process.env.TEXTBOOK_IT_KB_ID || process.env.MULTI_VER_IT_KB_ID || DEFAULT_KB_CONFIG.it.id,
    name: DEFAULT_KB_CONFIG.it.name,
    localDir: resolveLocalDir('TEXTBOOK_IT_LOCAL_DIR', 'MULTI_VER_IT_LOCAL_DIR')
  },
  gt: {
    id: process.env.TEXTBOOK_GT_KB_ID || process.env.MULTI_VER_GT_KB_ID || DEFAULT_KB_CONFIG.gt.id,
    name: DEFAULT_KB_CONFIG.gt.name,
    localDir: resolveLocalDir('TEXTBOOK_GT_LOCAL_DIR', 'MULTI_VER_GT_LOCAL_DIR')
  }
};

function parseArgs() {
  const args = { query: '', subject: 'all', limit: 20 };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--query' || process.argv[i] === '-q') {
      args.query = process.argv[++i] || '';
    } else if (process.argv[i] === '--subject' || process.argv[i] === '-s') {
      args.subject = process.argv[++i] || 'all';
    } else if (process.argv[i] === '--limit') {
      args.limit = parseInt(process.argv[++i] || '20', 10);
    }
  }
  if (!args.query) {
    console.error(JSON.stringify({ error: 'Missing --query argument' }));
    process.exit(1);
  }
  return args;
}

async function searchKB(kbKey, query, limit) {
  const kb = KB_MAP[kbKey];
  if (!kb) return [];

  try {
    const respRaw = await imaApi('openapi/wiki/v1/search_knowledge', {
      query: query,
      knowledge_base_id: kb.id,
      cursor: ''
    });
    const resp = JSON.parse(respRaw);
    const list = (resp.data && resp.data.info_list) || [];
    return list.map((item) => ({
      kbName: kb.name,
      title: item.title,
      highlight: item.highlight_content || '',
      mediaId: item.media_id
    }));
  } catch (err) {
    return [];
  }
}

async function getBooksList(kbKey) {
  const kb = KB_MAP[kbKey];
  if (!kb) return [];
  try {
    let all = [];
    let cursor = '';
    while (true) {
      const respRaw = await imaApi('openapi/wiki/v1/get_knowledge_list', {
        knowledge_base_id: kb.id,
        cursor: cursor,
        limit: 50
      });
      const data = JSON.parse(respRaw).data;
      if (data.knowledge_list) all.push(...data.knowledge_list);
      if (data.is_end || !data.next_cursor) break;
      cursor = data.next_cursor;
    }
    return all.map((b) => ({
      kbName: kb.name,
      title: b.title,
      publisher: (b.title.split('-')[0] || '').trim(),
      mediaId: b.media_id
    }));
  } catch (err) {
    return [];
  }
}

async function main() {
  if (!imaApi) {
    console.error(JSON.stringify({
      error: 'ima_api.cjs not found in standard paths (~/.gemini/config/skills/ima-skills/ or ~/.gemini/antigravity/skills/@tencent-adm/ima-skills/). Please verify ima-skills installation.'
    }));
    process.exit(1);
  }

  const { query, subject, limit } = parseArgs();
  const targetKbs = subject === 'all' ? ['it', 'gt'] : [subject];

  const searchResults = [];
  const relatedBooks = [];

  for (const kbKey of targetKbs) {
    const kbResults = await searchKB(kbKey, query, limit);
    searchResults.push(...kbResults);

    const books = await getBooksList(kbKey);
    for (const b of books) {
      relatedBooks.push(b);
    }
  }

  const byPublisher = {};
  for (const item of searchResults) {
    const pub = (item.title.split('-')[0] || '通用').trim();
    if (!byPublisher[pub]) byPublisher[pub] = [];
    byPublisher[pub].push(item);
  }

  const output = {
    query,
    subject,
    totalHits: searchResults.length,
    resultsByPublisher: byPublisher,
    availableTextbooks: relatedBooks.map((b) => b.title)
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
