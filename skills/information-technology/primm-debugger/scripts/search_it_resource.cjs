#!/usr/bin/env node
'use strict';

/**
 * search_it_resource.cjs
 * -----------------------------------------------------------
 * 中小学信息科技 PRIMM 调试助教所用的 IMA 知识库检索器。
 *
 * 核心规范：
 *   - 默认不依赖任何硬编码本地目录（localDir 默认为 null，云端优先）。
 *   - 支持 PRIMM_IT_LOCAL_DIR / PRIMM_GT_LOCAL_DIR 环境变量开启本地教材 PDF 检索。
 *   - KB ID 统一由 scripts/shared/kb-registry.cjs 加载，支持 PRIMM_IT_KB_ID 覆盖。
 *   - 调用 pdftotext 时使用 execFile（不经过 shell），杜绝注入隐患。
 *   - 包含面向 Python 编程与算法调试的领域关键词提取算法。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileP = promisify(execFile);

// 从共享模块加载 KB 注册表，严禁在脚本中出现裸 ID
const { loadKbRegistry, buildKbConfig } = require('../../../../scripts/shared/kb-registry.cjs');

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

const _registry = loadKbRegistry({ warnOnFallback: true });
const KB_CONFIG = buildKbConfig(_registry, {
  it: {
    kbId: process.env.PRIMM_IT_KB_ID,
    localDir: process.env.PRIMM_IT_LOCAL_DIR
  },
  gt: {
    kbId: process.env.PRIMM_GT_KB_ID,
    localDir: process.env.PRIMM_GT_LOCAL_DIR
  }
});

const IT_DOMAIN_KEYWORDS = [
  'IndexError', 'KeyError', 'TypeError', 'ValueError', 'ZeroDivisionError',
  'IndentationError', 'SyntaxError', 'NameError', 'AttributeError',
  '冒泡排序', '选择排序', '插入排序', '二分查找', '顺序查找', '递归', '穷举',
  '列表', '字典', '切片', '循环', 'for循环', 'while循环', '分支', '条件语句',
  '函数', '形参', '实参', '作用域', '全局变量', '局部变量', '返回值',
  '算法', '计算思维', 'Traceback', '调试', '断点', '时间复杂度', '空间复杂度'
];

function extractKeywords(rawQuery) {
  if (!rawQuery) return [];
  const clean = rawQuery.trim();
  if (clean.length <= 3) return [clean];

  const matched = [];
  for (const kw of IT_DOMAIN_KEYWORDS) {
    if (clean.toLowerCase().includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }

  matched.sort((a, b) => b.length - a.length);

  if (matched.length > 0) {
    return Array.from(new Set(matched));
  }

  const chunks = clean.split(/[,，。！？\s、；;：“”"'\(\)（）\-_]/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && s.length <= 10);

  return chunks.length > 0 ? chunks : [clean];
}

function parseArgs(argv = process.argv) {
  const args = {
    query: '',
    stage: 'all',
    subject: 'it',
    limit: 5,
    format: 'markdown',
    extract: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--query' || arg === '-q') {
      args.query = argv[++i] || '';
    } else if (arg === '--stage' || arg === '-s') {
      args.stage = argv[++i] || 'all';
    } else if (arg === '--subject') {
      args.subject = (argv[++i] || 'it').toLowerCase();
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

async function runWithConcurrency(items, limit, workerFn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => workerFn(item)).then(r => {
      if (r !== null && r !== undefined) results.push(r);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
      for (let i = executing.length - 1; i >= 0; i--) {
        if (executing[i].settled) executing.splice(i, 1);
      }
    }
  }
  await Promise.all(executing);
  return results;
}

async function extractSnippetFromPdf(pdfPath, targetTerm, contextLines = 3) {
  try {
    const { stdout } = await execFileP('/usr/bin/pdftotext', [pdfPath, '-'], {
      maxBuffer: 15 * 1024 * 1024,
      timeout: 6000
    });
    if (!stdout) return null;

    const lines = stdout.split('\n');
    const termLower = targetTerm.toLowerCase();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(termLower)) {
        const start = Math.max(0, i - contextLines);
        const end = Math.min(lines.length, i + contextLines + 1);
        const cleanLines = lines.slice(start, end)
          .filter(l => !l.includes('Syntax Error') && !l.includes('Marked Content') && l.trim().length > 0)
          .map(l => l.trimEnd());
        if (cleanLines.length > 0) {
          return cleanLines.join('\n');
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function searchLocalTextbooks(localDir, query, limit = 2) {
  if (!localDir || !fs.existsSync(localDir)) return [];

  const candidateFiles = [];
  try {
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full);
        } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.pdf')) {
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
    const lowerName = file.name.toLowerCase();
    for (const kw of keywords) {
      if (lowerName.includes(kw.toLowerCase())) score += 5;
    }
    if (lowerName.includes('必修1') && keywords.some(k => ['循环', '列表', '函数', '算法'].includes(k))) score += 4;
    if (lowerName.includes('数据与计算') || lowerName.includes('算法')) score += 3;
    return { ...file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const targetFiles = scored.filter(f => f.score > 0).slice(0, Math.min(limit * 3, 10));
  if (targetFiles.length === 0) return [];

  const grepTarget = keywords.length > 0 ? keywords[0] : query;
  const snippets = await runWithConcurrency(targetFiles, 4, async (item) => {
    const text = await extractSnippetFromPdf(item.fullPath, grepTarget, 3);
    if (text) {
      return { file: item.name, snippet: text };
    }
    return null;
  });

  return snippets.slice(0, limit);
}

async function main() {
  const { query, stage, subject, limit, format, extract } = parseArgs(process.argv);

  if (!query) {
    console.error(JSON.stringify({ error: 'Missing required argument: --query or -q' }));
    process.exit(1);
  }

  const activeKb = KB_CONFIG[subject] || KB_CONFIG.it;
  const imaHits = await smartSearchIma(activeKb.id, query, limit);
  let hits = Array.isArray(imaHits) ? imaHits : [];

  let localHits = [];
  if ((extract || hits.length === 0) && activeKb.localDir) {
    localHits = await searchLocalTextbooks(activeKb.localDir, query, 2);
  }

  if (format === 'json') {
    console.log(JSON.stringify({
      query,
      stage,
      subject,
      kb_id: activeKb.id,
      kb_name: activeKb.name,
      extractedKeywords: extractKeywords(query),
      textbookHits: hits.map(h => ({ title: h.title, mediaId: h.media_id })),
      snippets: localHits
    }, null, 2));
    return;
  }

  const keywords = extractKeywords(query);
  console.log(`### 💻 PRIMM 编程思维·权威教材依据（知识点：${query}）\n`);
  if (keywords.length > 0 && keywords[0] !== query) {
    console.log(`> **关联计算概念**：${keywords.map(k => `\`${k}\``).join(', ')}\n`);
  }

  if (hits.length > 0) {
    console.log(`**参考官方教材与课标 (${hits.length} 册)**:`);
    for (const h of hits) {
      console.log(`- ${h.title}`);
    }
    console.log('');
  }

  if (localHits.length > 0) {
    console.log(`**教材标准代码/概念出处**:`);
    for (const loc of localHits) {
      console.log(`> *出处：《${loc.file}》*`);
      console.log('```python');
      console.log(loc.snippet);
      console.log('```\n');
    }
  }

  if (stage === 'predict' || stage === 'investigate' || stage === 'modify') {
    console.log(`💡 **PRIMM 调试启发支架**：`);
    if (stage === 'predict') {
      console.log(`- 引导学生在运行前先手工追踪，预测第 1 次迭代与最后 1 次迭代的变量值；`);
    } else if (stage === 'investigate') {
      console.log(`- 结合 Traceback 报错行号，指导学生在报错行上方插入 \`print("DEBUG:", ...)\` 探针；`);
    } else if (stage === 'modify') {
      console.log(`- 引导学生分析修改方案的边界情况（如空列表、边界索引 0 与 len-1），防范衍生 Bug。`);
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
  runWithConcurrency,
  extractSnippetFromPdf,
  searchLocalTextbooks,
  KB_CONFIG,
  __registry: _registry
};
