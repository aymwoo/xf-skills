#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Locate imaApi
function findImaApi() {
  const candidatePaths = [
    path.join(os.homedir(), '.gemini/config/skills/ima-skills/ima_api.cjs'),
    path.join(os.homedir(), '.gemini/antigravity/skills/@tencent-adm/ima-skills/ima_api.cjs')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return require(p).imaApi;
    }
  }
  return null;
}

const imaApi = findImaApi();

const KB_CONFIG = {
  gt: {
    id: 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=',
    name: '技术与工程教学',
    localDir: '/home/wuxf/Develop/ChinaTextbook/高中/通用技术'
  },
  it: {
    id: '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=',
    name: '信息科技教学',
    localDir: '/home/wuxf/Develop/ChinaTextbook/高中/信息技术'
  }
};

function parseArgs() {
  const args = {
    query: '',
    subject: 'gt',
    publisher: 'all',
    limit: 10,
    format: 'markdown',
    extract: false
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--query' || arg === '-q') {
      args.query = process.argv[++i] || '';
    } else if (arg === '--subject' || arg === '-s') {
      args.subject = process.argv[++i] || 'gt';
    } else if (arg === '--publisher' || arg === '-p') {
      args.publisher = process.argv[++i] || 'all';
    } else if (arg === '--limit' || arg === '-l') {
      args.limit = parseInt(process.argv[++i] || '10', 10);
    } else if (arg === '--format' || arg === '-f') {
      args.format = process.argv[++i] || 'markdown';
    } else if (arg === '--extract' || arg === '-e') {
      args.extract = true;
    }
  }

  if (!args.query) {
    console.error(JSON.stringify({ error: 'Missing required argument: --query or -q' }));
    process.exit(1);
  }

  return args;
}

async function searchImaKb(kbId, query) {
  if (!imaApi) {
    return { error: 'ima_api.cjs not found in standard paths' };
  }

  try {
    const raw = await imaApi('openapi/wiki/v1/search_knowledge', {
      knowledge_base_id: kbId,
      query: query,
      cursor: ''
    });
    const parsed = JSON.parse(raw);
    return (parsed.data && parsed.data.info_list) || [];
  } catch (err) {
    return { error: err.message };
  }
}

function searchLocalTextbooks(localDir, query, matchedTitles = [], limit = 3) {
  if (!fs.existsSync(localDir)) return [];

  const candidateFiles = [];
  try {
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full);
        } else if (ent.isFile() && ent.name.endsWith('.pdf')) {
          candidateFiles.push({ name: ent.name, fullPath: full });
        }
      }
    };
    walk(localDir);
  } catch (err) {
    return [];
  }

  // Sort candidate files: prioritize those whose name contains matched titles or the query
  const scored = candidateFiles.map(file => {
    let score = 0;
    if (matchedTitles.some(t => t && (file.name.includes(t) || t.includes(file.name.replace('.pdf', ''))))) {
      score += 10;
    }
    if (file.name.includes(query)) score += 5;
    if (file.name.includes('技术与设计2') && (query.includes('控制') || query.includes('结构') || query.includes('流程') || query.includes('系统'))) score += 3;
    if (file.name.includes('技术与设计1') && (query.includes('设计') || query.includes('工艺') || query.includes('图样'))) score += 3;
    if (file.name.includes('电子控制') && query.includes('控制')) score += 4;
    return { ...file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const targetFiles = scored.filter(f => f.score > 0).slice(0, limit);

  const results = [];
  for (const item of targetFiles) {
    try {
      const cmd = `pdftotext "${item.fullPath}" - 2>/dev/null | grep -E -C 3 "${query}" | head -n 25`;
      const textMatch = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 5000 });
      if (textMatch && textMatch.trim().length > 0) {
        const cleanLines = textMatch
          .split('\n')
          .filter(l => !l.includes('Syntax Error') && !l.includes('Marked Content') && l.trim().length > 0)
          .slice(0, 10)
          .join('\n');

        if (cleanLines.trim()) {
          results.push({
            file: item.name,
            fullPath: item.fullPath,
            snippet: cleanLines.trim()
          });
        }
      }
    } catch (e) {
      // Ignore conversion or timeout issues
    }
  }

  return results;
}

async function main() {
  const { query, subject, publisher, limit, format, extract } = parseArgs();

  const targetKbs = subject === 'all' ? ['gt', 'it'] : [subject];
  const allResults = [];

  for (const key of targetKbs) {
    const conf = KB_CONFIG[key];
    if (!conf) continue;

    // 1. Search IMA Knowledge Base
    const imaHits = await searchImaKb(conf.id, query);
    let hits = Array.isArray(imaHits) ? imaHits : [];

    if (publisher !== 'all') {
      hits = hits.filter(h => h.title.includes(publisher));
    }
    hits = hits.slice(0, limit);

    // 2. Extract local textbook excerpts if requested or if hits present
    let localHits = [];
    if (extract) {
      const matchedTitles = hits.map(h => h.title);
      localHits = searchLocalTextbooks(conf.localDir, query, matchedTitles, 3);
    }

    allResults.push({
      subject: key,
      kbName: conf.name,
      kbId: conf.id,
      imaCount: hits.length,
      imaHits: hits.map(h => ({
        title: h.title,
        mediaId: h.media_id,
        highlight: h.highlight_content || ''
      })),
      localHits: localHits
    });
  }

  if (format === 'json') {
    console.log(JSON.stringify({ query, results: allResults }, null, 2));
    return;
  }

  // Format as Markdown for easy consumption
  console.log(`### 🔍 IMA 知识库检索报告（针对知识点：${query}）\n`);
  for (const res of allResults) {
    console.log(`#### 📚 知识库：${res.kbName} (命中 ${res.imaHits.length} 册教材)\n`);
    if (res.imaHits.length > 0) {
      console.log(`| 版本 / 教材名称 | 媒体 ID | 章节定位提示 |`);
      console.log(`| :--- | :--- | :--- |`);
      for (const hit of res.imaHits) {
        console.log(`| **${hit.title}** | \`${hit.mediaId.slice(0, 20)}...\` | ${hit.highlight || '相关章节'} |`);
      }
      console.log('');
    }

    if (res.localHits && res.localHits.length > 0) {
      console.log(`##### 📖 权威教材原文/图例佐证片段：\n`);
      for (const loc of res.localHits) {
        console.log(`> **出处：${loc.file}**`);
        console.log('```');
        console.log(loc.snippet);
        console.log('```\n');
      }
    }
  }

  console.log(`---`);
  console.log(`💡 **啄木鸟审计追问指引**：可结合上述教材标准案例与参数指标，针对教师教案中的“虚化大词”或“缺乏工程约束”展开苏格拉底式追问。`);
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
