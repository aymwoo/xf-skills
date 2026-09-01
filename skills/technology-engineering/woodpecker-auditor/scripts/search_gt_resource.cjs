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

const GT_DOMAIN_KEYWORDS = [
  '电子控制', '控制系统', '闭环控制', '开环控制', '闭环', '开环', '控制', '反馈', '干扰', '控制器', '执行器', '传感器',
  '结构与设计', '结构设计', '稳定性', '结构强度', '受力', '形变', '应力', '榫卯', '桁架', '重力', '载荷', '梁',
  '流程与设计', '流程设计', '时序', '环节', '流程优化', '工期',
  '系统与设计', '系统分析', '系统优化', '输入输出', '子系统',
  '工程设计', '技术试验', '权衡', 'Trade-off', '原型制作', '三维设计', '3D打印', '激光切割',
  '机器人', '智能家居', '机械传动', '齿轮', '连杆', '凸轮', '材料', '工艺', '锯割', '锉削'
];

function extractKeywords(rawQuery) {
  if (!rawQuery) return [];
  const clean = rawQuery.trim();
  if (clean.length <= 4) return [clean];

  const matched = [];
  for (const kw of GT_DOMAIN_KEYWORDS) {
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
    query: '',
    subject: 'gt',
    publisher: 'all',
    limit: 10,
    format: 'markdown',
    extract: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--query' || arg === '-q') {
      args.query = argv[++i] || '';
    } else if (arg === '--subject' || arg === '-s') {
      args.subject = argv[++i] || 'gt';
    } else if (arg === '--publisher' || arg === '-p') {
      args.publisher = argv[++i] || 'all';
    } else if (arg === '--limit' || arg === '-l') {
      args.limit = parseInt(argv[++i] || '10', 10);
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

async function smartSearchIma(kbId, query, limit = 10) {
  // 1. Direct query
  let directHits = await searchImaKb(kbId, query);
  if (Array.isArray(directHits) && directHits.length > 0) {
    return directHits.slice(0, limit);
  }

  // 2. Fallback to smart extracted keywords
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

  const keywords = extractKeywords(query);

  const scored = candidateFiles.map(file => {
    let score = 0;
    if (matchedTitles.some(t => t && (file.name.includes(t) || t.includes(file.name.replace('.pdf', ''))))) {
      score += 10;
    }
    for (const kw of keywords) {
      if (file.name.includes(kw)) score += 5;
    }
    if (file.name.includes('技术与设计2') && keywords.some(k => ['控制', '结构', '流程', '系统'].includes(k))) score += 3;
    if (file.name.includes('技术与设计1') && keywords.some(k => ['设计', '工艺', '材料', '图样'].includes(k))) score += 3;
    if (file.name.includes('电子控制') && keywords.some(k => ['控制', '闭环', '开环', '传感器'].includes(k))) score += 4;
    return { ...file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const targetFiles = scored.filter(f => f.score > 0).slice(0, limit);

  const results = [];
  for (const item of targetFiles) {
    try {
      const grepTarget = keywords.length > 0 ? keywords[0] : query;
      const cmd = `pdftotext "${item.fullPath}" - 2>/dev/null | grep -E -C 3 "${grepTarget}" | head -n 25`;
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
            matchedKeyword: grepTarget,
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
  const { query, subject, publisher, limit, format, extract } = parseArgs(process.argv);

  if (!query) {
    console.error(JSON.stringify({ error: 'Missing required argument: --query or -q' }));
    process.exit(1);
  }

  const targetKbs = subject === 'all' ? ['gt', 'it'] : [subject];
  const allResults = [];

  for (const key of targetKbs) {
    const conf = KB_CONFIG[key];
    if (!conf) continue;

    // 1. Smart Search IMA Knowledge Base
    const imaHits = await smartSearchIma(conf.id, query, limit);
    let hits = Array.isArray(imaHits) ? imaHits : [];

    if (publisher !== 'all') {
      hits = hits.filter(h => h.title.includes(publisher));
    }
    hits = hits.slice(0, limit);

    // 2. Extract local textbook excerpts if requested or if hits present
    let localHits = [];
    if (extract || hits.length === 0) {
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
    console.log(JSON.stringify({ query, extractedKeywords: extractKeywords(query), results: allResults }, null, 2));
    return;
  }

  // Format as Markdown for easy consumption
  const keywords = extractKeywords(query);
  console.log(`### 🔍 IMA 知识库检索报告（针对知识点：${query}）\n`);
  if (keywords.length > 0 && keywords[0] !== query) {
    console.log(`> **智能关键词解析**：${keywords.map(k => `\`${k}\``).join(', ')}\n`);
  }

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
        console.log(`> **出处：${loc.file}**（匹配词：\`${loc.matchedKeyword || query}\`）`);
        console.log('```');
        console.log(loc.snippet);
        console.log('```\n');
      }
    }
  }

  console.log(`---`);
  console.log(`💡 **啄木鸟审计追问指引**：可结合上述教材标准案例与参数指标，针对教师教案中的“虚化大词”或“缺乏工程约束”展开苏格拉底式追问。`);
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
