#!/usr/bin/env node
'use strict';

/**
 * search_gt_resource.cjs
 * -----------------------------------------------------------
 * 高中通用技术 / 信息科技教案审计所用的 IMA 知识库检索器。
 *
 * 重要约束（修复 hardcoded local path 后）：
 *   - 默认不依赖任何本地文件系统目录（localDir 默认为 null）。
 *   - 仅当设置了 WOODPECKER_GT_LOCAL_DIR / WOODPECKER_IT_LOCAL_DIR 环境变量
 *     且路径真实存在时，才会启用本地教材 PDF 兜底检索。
 *   - KB ID 也可通过 WOODPECKER_GT_KB_ID / WOODPECKER_IT_KB_ID 覆盖，便于
 *     教师在自己环境指向自建 RAG / 私有 IMA 知识库。
 *   - 调用 pdftotext 时改用 execFile（不经过 shell），杜绝命令注入。
 *   - 多文件 PDF 处理采用有界并发，避免 60 本教材 5 分钟串行阻塞。
 *
 * 设计原则遵循 README 中"Portable · Local-first · Agent-friendly"三大约束。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileP = promisify(execFile);

// KB 注册表由 scripts/shared/kb-registry.cjs 提供，避免在本脚本中硬编码 KB ID
const { loadKbRegistry, buildKbConfig } = require('../../../../scripts/shared/kb-registry.cjs');

// ---------------------------------------------------------------------------
// IMA API 解析
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 知识库注册（localDir 默认 null，避免写死本地路径）
//   加载优先级详见 scripts/shared/kb-registry.cjs：
//   1. env var (WOODPECKER_*_KB_ID / WOODPECKER_*_LOCAL_DIR)
//   2. KB_REGISTRY_PATH 指向的自定义注册表
//   3. examples/kb.registry.json 仓库默认
//   4. 硬编码 fallback（仅在极端场景，并 stderr 警告）
// ---------------------------------------------------------------------------

const _registry = loadKbRegistry({ warnOnFallback: true });
const KB_CONFIG = buildKbConfig(_registry, {
  gt: { idEnv: 'WOODPECKER_GT_KB_ID', localDirEnv: 'WOODPECKER_GT_LOCAL_DIR' },
  it: { idEnv: 'WOODPECKER_IT_KB_ID', localDirEnv: 'WOODPECKER_IT_LOCAL_DIR' }
});

// ---------------------------------------------------------------------------
// 通用技术 / 信息科技学科关键词词典
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CLI 参数解析
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// IMA 云端检索
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 本地教材兜底检索（异步、有界并发、零 shell 注入）
// ---------------------------------------------------------------------------

/**
 * 简易并发执行器（避免引入额外依赖）。
 *   items: 待处理任务数组
 *   concurrency: 最大并发数
 *   fn: 单任务异步函数
 */
async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * 从单个 PDF 中安全提取匹配关键词的上下文片段。
 * 使用 execFile（不经过 shell）调用 pdftotext，杜绝命令注入。
 */
async function extractSnippetFromPdf(pdfPath, keyword) {
  // 1) pdftotext <file> -  → stdout（参数化，无 shell）
  const { stdout: text } = await execFileP('pdftotext', [pdfPath, '-'], {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 5000
  });

  // 2) 在 JS 中做关键词 + 上下文切片（替换原 grep -C 3）
  const lines = String(text).split('\n');
  const matchIdx = lines.findIndex(l => l && l.includes(keyword));
  if (matchIdx < 0) return null;

  const start = Math.max(0, matchIdx - 3);
  const end = Math.min(lines.length, matchIdx + 4);
  const context = lines
    .slice(start, end)
    .filter(l => l && !l.includes('Syntax Error') && !l.includes('Marked Content') && l.trim().length > 0)
    .slice(0, 10)
    .join('\n');

  return context.trim() || null;
}

/**
 * 在本地教材目录中按关键词打分检索。
 * 当 localDir 为 null / 不存在 / 不是目录时静默返回空数组。
 */
async function searchLocalTextbooks(localDir, query, matchedTitles = [], limit = 3, { concurrency = 4 } = {}) {
  if (!localDir) return [];
  if (!fs.existsSync(localDir)) return [];
  let stat;
  try {
    stat = fs.statSync(localDir);
  } catch (err) {
    return [];
  }
  if (!stat.isDirectory()) return [];

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

  const grepTarget = keywords.length > 0 ? keywords[0] : query;
  const snippets = await runWithConcurrency(targetFiles, concurrency, async (item) => {
    try {
      const snippet = await extractSnippetFromPdf(item.fullPath, grepTarget);
      if (!snippet) return null;
      return {
        file: item.name,
        fullPath: item.fullPath,
        matchedKeyword: grepTarget,
        snippet
      };
    } catch (e) {
      return null; // 解析失败 / 超时均静默跳过
    }
  });

  return snippets.filter(Boolean);
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

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
      localHits = await searchLocalTextbooks(conf.localDir, query, matchedTitles, 3);
    }

    allResults.push({
      subject: key,
      kbName: conf.name,
      kbId: conf.id,
      localDirConfigured: Boolean(conf.localDir),
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
    } else if (!res.localDirConfigured) {
      console.log(`> ℹ️ 未配置本地教材目录（\`WOODPECKER_GT_LOCAL_DIR\` / \`WOODPECKER_IT_LOCAL_DIR\`），仅展示 IMA 云端命中。\n`);
    }
  }

  console.log(`---`);
  console.log(`💡 **啄木鸟审计追问指引**：可结合上述教材标准案例与参数指标，针对教师教案中的"虚化大词"或"缺乏工程约束"展开苏格拉底式追问。`);
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
  extractSnippetFromPdf,
  runWithConcurrency,
  KB_CONFIG,
  // 透出注册表加载器，供上层脚本或测试复用
  __registry: _registry
};