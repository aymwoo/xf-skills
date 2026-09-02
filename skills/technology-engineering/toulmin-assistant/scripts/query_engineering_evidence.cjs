#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

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

const TOULMIN_DOMAIN_KEYWORDS = [
  '结构', '稳定性', '结构强度', '受力', '形变', '压应力', '拉应力', '弯矩', '弯曲', '桁架', '纸梁', '桥梁', '榫卯', '破坏',
  '控制', '闭环控制', '开环控制', '传感器', '反馈', '干扰', '被控量', '控制器', '执行器', '温控', '阈值',
  '系统', '子系统', '整体性', '系统优化', '流程', '时序', '工艺', '锯割', '锉削', '公差', '3D打印', '激光切割'
];

function extractKeywords(rawQuery) {
  if (!rawQuery) return [];
  const clean = rawQuery.trim();
  if (clean.length <= 4) return [clean];

  const matched = [];
  for (const kw of TOULMIN_DOMAIN_KEYWORDS) {
    if (clean.includes(kw)) {
      matched.push(kw);
    }
  }

  matched.sort((a, b) => b.length - a.length);

  if (matched.length > 0) {
    return Array.from(new Set(matched));
  }

  const chunks = clean.split(/[,，。！？\s、；;：“”"'\(\)（）\-_]/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && s.length <= 8);

  return chunks.length > 0 ? chunks : [clean];
}

function parseArgs(argv = process.argv) {
  const args = {
    topic: '',
    stage: 'all',
    limit: 5,
    format: 'markdown',
    extract: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--topic' || arg === '-t' || arg === '--query' || arg === '-q') {
      args.topic = argv[++i] || '';
    } else if (arg === '--stage' || arg === '-s') {
      args.stage = argv[++i] || 'all';
    } else if (arg === '--limit' || arg === '-l') {
      args.limit = parseInt(argv[++i] || '5', 10);
    } else if (arg === '--format' || arg === '-f') {
      args.format = argv[++i] || 'markdown';
    } else if (arg === '--extract' || arg === '-e') {
      args.extract = true;
    }
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

async function smartSearchIma(kbId, query, limit = 5) {
  let directHits = await searchImaKb(kbId, query);
  if (Array.isArray(directHits) && directHits.length > 0) {
    return directHits.slice(0, limit);
  }

  const keywords = extractKeywords(query);
  const seenIds = new Set();
  const aggregated = [];

  for (const kw of keywords) {
    if (kw === query) continue;
    const subHits = await searchImaKb(kbId, kw);
    if (Array.isArray(subHits)) {
      for (const h of subHits) {
        if (!seenIds.has(h.media_id)) {
          seenIds.add(h.media_id);
          aggregated.push(h);
          if (aggregated.length >= limit) break;
        }
      }
    }
    if (aggregated.length >= limit) break;
  }

  return aggregated;
}

function searchLocalTextbooks(localDir, query, limit = 2) {
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

  const keywords = extractKeywords(query);
  const scored = candidateFiles.map(file => {
    let score = 0;
    for (const kw of keywords) {
      if (file.name.includes(kw)) score += 5;
    }
    if (file.name.includes('技术与设计2') && keywords.some(k => ['结构', '受力', '形变', '控制', '闭环'].includes(k))) score += 4;
    if (file.name.includes('电子控制') && keywords.some(k => ['控制', '闭环', '传感器', '反馈'].includes(k))) score += 4;
    return { ...file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const targetFiles = scored.filter(f => f.score > 0).slice(0, limit);

  const results = [];
  for (const item of targetFiles) {
    try {
      const grepTarget = keywords.length > 0 ? keywords[0] : query;
      const cmd = `pdftotext "${item.fullPath}" - 2>/dev/null | grep -E -C 3 "${grepTarget}" | head -n 20`;
      const textMatch = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 5000 });
      if (textMatch && textMatch.trim().length > 0) {
        const cleanLines = textMatch
          .split('\n')
          .filter(l => !l.includes('Syntax Error') && !l.includes('Marked Content') && l.trim().length > 0)
          .slice(0, 8)
          .join('\n');

        if (cleanLines.trim()) {
          results.push({
            file: item.name,
            snippet: cleanLines.trim()
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return results;
}

async function main() {
  const { topic, stage, limit, format, extract } = parseArgs(process.argv);

  if (!topic) {
    console.error(JSON.stringify({ error: 'Missing required argument: --topic or -t' }));
    process.exit(1);
  }

  const imaHits = await smartSearchIma(KB_CONFIG.gt.id, topic, limit);
  let hits = Array.isArray(imaHits) ? imaHits : [];

  let localHits = [];
  if (extract || hits.length === 0) {
    localHits = searchLocalTextbooks(KB_CONFIG.gt.localDir, topic, 2);
  }

  if (format === 'json') {
    console.log(JSON.stringify({
      topic,
      stage,
      extractedKeywords: extractKeywords(topic),
      textbookHits: hits.map(h => ({ title: h.title, mediaId: h.media_id })),
      evidenceSnippets: localHits
    }, null, 2));
    return;
  }

  const keywords = extractKeywords(topic);
  console.log(`### 📐 图尔敏工程论证·权威教材证据（知识点：${topic}）\n`);
  if (keywords.length > 0 && keywords[0] !== topic) {
    console.log(`> **关联工程概念**：${keywords.map(k => `\`${k}\``).join(', ')}\n`);
  }

  if (hits.length > 0) {
    console.log(`**参考官方教材 (${hits.length} 册)**:`);
    for (const h of hits) {
      console.log(`- ${h.title}`);
    }
    console.log('');
  }

  if (localHits.length > 0) {
    console.log(`**教材标准实验/物理定义出处**:`);
    for (const loc of localHits) {
      console.log(`> *出处：《${loc.file}》*`);
      console.log('```');
      console.log(loc.snippet);
      console.log('```\n');
    }
  }

  if (stage === 'data' || stage === 'rebuttal') {
    console.log(`💡 **助教追问支架提示**：`);
    if (stage === 'data') {
      console.log(`- 要求学生提供传感器具体读数或破坏荷载（N/mm/℃/V），拒绝“感觉行”；`);
    } else {
      console.log(`- 结合教材材料自重与工艺极限，抛出“成本超标/自重增加/环境干扰”等 Trade-off 反驳条件。`);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
}

module.exports = {
  findImaApi,
  extractKeywords,
  parseArgs,
  searchImaKb,
  smartSearchIma,
  searchLocalTextbooks,
  KB_CONFIG
};
