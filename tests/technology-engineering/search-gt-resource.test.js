import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const searchScript = require('../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 既有用例：纯函数与默认 KB 注册
// ---------------------------------------------------------------------------

test('search_gt_resource suite: extractKeywords should extract GT domain terms', () => {
  const query = '分析一下闭环控制系统中的干扰因素与稳定性测定实验';
  const kws = searchScript.extractKeywords(query);

  assert.ok(Array.isArray(kws), 'Keywords should be an array');
  assert.ok(kws.includes('闭环控制') || kws.includes('控制系统'), 'Should extract 闭环控制 or 控制系统');
  assert.ok(kws.includes('稳定性'), 'Should extract 稳定性');
  assert.ok(kws.includes('干扰'), 'Should extract 干扰');
});

test('search_gt_resource suite: extractKeywords for short query returns self', () => {
  const shortQuery = '榫卯';
  const kws = searchScript.extractKeywords(shortQuery);
  assert.deepEqual(kws, ['榫卯']);
});

test('search_gt_resource suite: parseArgs parses CLI arguments correctly', () => {
  const customArgv = [
    'node',
    'search_gt_resource.cjs',
    '--query',
    '结构强度',
    '--subject',
    'gt',
    '--limit',
    '5',
    '--format',
    'json'
  ];

  const parsed = searchScript.parseArgs(customArgv);
  assert.equal(parsed.query, '结构强度');
  assert.equal(parsed.subject, 'gt');
  assert.equal(parsed.limit, 5);
  assert.equal(parsed.format, 'json');
});

test('search_gt_resource suite: KB_CONFIG has valid GT and IT knowledge base mappings', () => {
  assert.ok(searchScript.KB_CONFIG.gt, 'gt knowledge base must be defined');
  assert.equal(searchScript.KB_CONFIG.gt.id, 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=');
  assert.ok(searchScript.KB_CONFIG.it, 'it knowledge base must be defined');
  assert.equal(searchScript.KB_CONFIG.it.id, '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=');
});

// ---------------------------------------------------------------------------
// P0 修复：本地路径不再硬编码
// ---------------------------------------------------------------------------

test('search_gt_resource suite: KB_CONFIG localDir defaults to null (no hardcoded path)', () => {
  // 默认情况下不应残留任何本地绝对路径，避免污染其他开发者机器
  assert.equal(searchScript.KB_CONFIG.gt.localDir, null, 'gt.localDir must default to null when WOODPECKER_GT_LOCAL_DIR is unset');
  assert.equal(searchScript.KB_CONFIG.it.localDir, null, 'it.localDir must default to null when WOODPECKER_IT_LOCAL_DIR is unset');

  // 不应在 KB_CONFIG 任意位置出现 /home/、C:\ 等本地绝对路径前缀
  const serialized = JSON.stringify(searchScript.KB_CONFIG);
  assert.ok(!serialized.includes('/home/'), 'KB_CONFIG must not contain /home/ paths');
  assert.ok(!/localDir"\s*:\s*"[^"]*\/[^"]*"/.test(serialized) || !serialized.match(/"\/[^"]+"/g),
    'KB_CONFIG must not embed filesystem paths');
});

test('search_gt_resource suite: searchLocalTextbooks handles null/non-existent dir gracefully', async () => {
  // null 直接返回空数组
  const nullResult = await searchScript.searchLocalTextbooks(null, '闭环控制');
  assert.deepEqual(nullResult, [], 'null localDir should yield []');

  // 不存在的路径返回空数组，不抛错
  const missingResult = await searchScript.searchLocalTextbooks('/path/that/definitely/does/not/exist/1234567', '闭环控制');
  assert.deepEqual(missingResult, [], 'missing localDir should yield []');

  // 空字符串也返回空数组
  const emptyResult = await searchScript.searchLocalTextbooks('', '闭环控制');
  assert.deepEqual(emptyResult, [], 'empty localDir should yield []');
});

// ---------------------------------------------------------------------------
// P2 集成测试：并发限流 + execFile 防注入
// ---------------------------------------------------------------------------

test('search_gt_resource suite: runWithConcurrency respects concurrency limit', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 12 }, (_, i) => async () => {
    active++;
    peak = Math.max(peak, active);
    // 让事件循环切换以暴露真实并发
    await new Promise(r => setTimeout(r, 20));
    active--;
    return i;
  });

  const results = await searchScript.runWithConcurrency(tasks, 3, (task) => task());
  assert.deepEqual(results, Array.from({ length: 12 }, (_, i) => i), 'results should preserve order');
  assert.ok(peak <= 3, `concurrency must not exceed limit (peak=${peak})`);
  assert.ok(peak >= 2, 'concurrency should actually parallelize');
});

test('search_gt_resource suite: runWithConcurrency handles empty input', async () => {
  const results = await searchScript.runWithConcurrency([], 4, async () => 1);
  assert.deepEqual(results, []);
});

test('search_gt_resource suite: extractSnippetFromPdf uses execFile (no shell injection)', () => {
  // 静态校验：脚本不再使用 child_process.execSync 拼 shell 字符串
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs'),
    'utf8'
  );
  // 不应出现 `pdftotext` 后跟着 grep shell 拼接的模式
  // （按"grep " 后跟引号或 $ 插值判定为仍可能注入）
  assert.ok(!/`[^`]*pdftotext[^`]*grep/.test(src), 'source must not pipe pdftotext through grep via shell');
  assert.ok(!/execSync\s*\(/.test(src), 'source must not use execSync (avoid shell injection)');
  // 必须引用 execFile
  assert.ok(/execFile/.test(src), 'source must use execFile for child processes');
});