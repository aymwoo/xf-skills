#!/usr/bin/env node
'use strict';

/**
 * query_engineering_evidence.cjs
 * -----------------------------------------------------------
 * 高中通用技术图尔敏论证式助教所用的 IMA 知识库检索器。
 *
 * 重要约束（与 search_gt_resource.cjs 保持一致）：
 *   - 默认不依赖任何本地文件系统目录（localDir 默认为 null）。
 *   - 仅当设置了 TOULMIN_GT_LOCAL_DIR / TOULMIN_IT_LOCAL_DIR 环境变量
 *     且路径真实存在时，才会启用本地教材 PDF 兜底检索。
 *   - KB ID 也可通过 TOULMIN_GT_KB_ID / TOULMIN_IT_KB_ID 覆盖。
 *   - 调用 pdftotext 时改用 execFile（不经过 shell），杜绝命令注入。
 *   - 多文件 PDF 处理采用有界并发。
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
//   1. env var (TOULMIN_*_KB_ID / TOULMIN_*_LOCAL_DIR)
//   2. KB_REGISTRY_PATH 指向的自定义注册表
//   3. examples/kb.registry.json 仓库默认
//   4. 硬编码 fallback（仅在极端场景，并 stderr 警告）
// ---------------------------------------------------------------------------

const _registry = loadKbRegistry({ warnOnFallback: true });
const KB_CONFIG = buildKbConfig(_registry, {
  gt: { idEnv: 'TOULMIN_GT_KB_ID', localDirEnv: 'TOULMIN_GT_LOCAL_DIR' },
  it: { idEnv: 'TOULMIN_IT_KB_ID', localDirEnv: 'TOULMIN_IT_LOCAL_DIR' }
});

// ---------------------------------------------------------------------------
// 学科关键词词典
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CLI 参数解析
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 本地教材兜底检索（异步、有界并发、零 shell 注入）
// ---------------------------------------------------------------------------

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

async function extractSnippetFromPdf(pdfPath, keyword) {
  const { stdout: text } = await execFileP('pdftotext', [pdfPath, '-'], {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 5000
  });

  const lines = String(text).split('\n');
  const matchIdx = lines.findIndex(l => l && l.includes(keyword));
  if (matchIdx < 0) return null;

  const start = Math.max(0, matchIdx - 3);
  const end = Math.min(lines.length, matchIdx + 4);
  const context = lines
    .slice(start, end)
    .filter(l => l && !l.includes('Syntax Error') && !l.includes('Marked Content') && l.trim().length > 0)
    .slice(0, 8)
    .join('\n');

  return context.trim() || null;
}

async function searchLocalTextbooks(localDir, query, limit = 2, { concurrency = 4 } = {}) {
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
    for (const kw of keywords) {
      if (file.name.includes(kw)) score += 5;
    }
    if (file.name.includes('技术与设计2') && keywords.some(k => ['结构', '受力', '形变', '控制', '闭环'].includes(k))) score += 4;
    if (file.name.includes('电子控制') && keywords.some(k => ['控制', '闭环', '传感器', '反馈'].includes(k))) score += 4;
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
        snippet
      };
    } catch (e) {
      return null;
    }
  });

  return snippets.filter(Boolean);
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

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
    localHits = await searchLocalTextbooks(KB_CONFIG.gt.localDir, topic, 2);
  }

  if (format === 'json') {
    console.log(JSON.stringify({
      topic,
      stage,
      extractedKeywords: extractKeywords(topic),
      localDirConfigured: Boolean(KB_CONFIG.gt.localDir),
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
  } else if (!KB_CONFIG.gt.localDir) {
    console.log(`> ℹ️ 未配置本地教材目录（\`TOULMIN_GT_LOCAL_DIR\`），仅展示 IMA 云端命中。\n`);
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
  extractSnippetFromPdf,
  runWithConcurrency,
  KB_CONFIG,
  __registry: _registry
};