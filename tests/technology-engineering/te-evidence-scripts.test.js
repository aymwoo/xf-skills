import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const searchScript = require('../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs');
const toulminScript = require('../../skills/technology-engineering/toulmin-assistant/scripts/query_engineering_evidence.cjs');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===========================================================================
// search_gt_resource (woodpecker-auditor) 脚本套件
// ===========================================================================

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

test('search_gt_resource suite: KB_CONFIG localDir defaults to null (no hardcoded path)', () => {
  assert.equal(searchScript.KB_CONFIG.gt.localDir, null, 'gt.localDir must default to null when WOODPECKER_GT_LOCAL_DIR is unset');
  assert.equal(searchScript.KB_CONFIG.it.localDir, null, 'it.localDir must default to null when WOODPECKER_IT_LOCAL_DIR is unset');

  const serialized = JSON.stringify(searchScript.KB_CONFIG);
  assert.ok(!serialized.includes('/home/'), 'KB_CONFIG must not contain /home/ paths');
  assert.ok(!/localDir"\s*:\s*"[^"]*\/[^"]*"/.test(serialized) || !serialized.match(/"\/[^"]+"/g),
    'KB_CONFIG must not embed filesystem paths');
});

test('search_gt_resource suite: searchLocalTextbooks handles null/non-existent dir gracefully', async () => {
  const nullResult = await searchScript.searchLocalTextbooks(null, '闭环控制');
  assert.deepEqual(nullResult, [], 'null localDir should yield []');

  const missingResult = await searchScript.searchLocalTextbooks('/path/that/definitely/does/not/exist/1234567', '闭环控制');
  assert.deepEqual(missingResult, [], 'missing localDir should yield []');

  const emptyResult = await searchScript.searchLocalTextbooks('', '闭环控制');
  assert.deepEqual(emptyResult, [], 'empty localDir should yield []');
});

test('search_gt_resource suite: runWithConcurrency respects concurrency limit', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 12 }, (_, i) => async () => {
    active++;
    peak = Math.max(peak, active);
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
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs'),
    'utf8'
  );
  assert.ok(!/`[^`]*pdftotext[^`]*grep/.test(src), 'source must not pipe pdftotext through grep via shell');
  assert.ok(!/execSync\s*\(/.test(src), 'source must not use execSync (avoid shell injection)');
  assert.ok(/execFile/.test(src), 'source must use execFile for child processes');
});

// ===========================================================================
// toulmin_assistant (query_engineering_evidence) 脚本套件
// ===========================================================================

test('toulmin_assistant suite: extractKeywords should extract GT concepts from project descriptions', () => {
  const query = '纸梁受弯破坏与跨中挠度实测';
  const kws = toulminScript.extractKeywords(query);

  assert.ok(Array.isArray(kws), 'Keywords should be an array');
  assert.ok(kws.includes('纸梁') || kws.includes('弯曲') || kws.includes('破坏'), 'Should extract 纸梁/弯曲/破坏');
});

test('toulmin_assistant suite: parseArgs parses topic and stage flags correctly', () => {
  const customArgv = [
    'node',
    'query_engineering_evidence.cjs',
    '--topic',
    '闭环温控系统',
    '--stage',
    'data',
    '--limit',
    '3',
    '--format',
    'json'
  ];

  const parsed = toulminScript.parseArgs(customArgv);
  assert.equal(parsed.topic, '闭环温控系统');
  assert.equal(parsed.stage, 'data');
  assert.equal(parsed.limit, 3);
  assert.equal(parsed.format, 'json');
});

test('toulmin_assistant suite: KB_CONFIG points to official GT knowledge base', () => {
  assert.ok(toulminScript.KB_CONFIG.gt, 'GT knowledge base mapping exists');
  assert.equal(toulminScript.KB_CONFIG.gt.id, 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=');
});

test('toulmin_assistant suite: KB_CONFIG localDir defaults to null (no hardcoded path)', () => {
  assert.equal(toulminScript.KB_CONFIG.gt.localDir, null, 'gt.localDir must default to null when TOULMIN_GT_LOCAL_DIR is unset');
  assert.equal(toulminScript.KB_CONFIG.it.localDir, null, 'it.localDir must default to null when TOULMIN_IT_LOCAL_DIR is unset');

  const serialized = JSON.stringify(toulminScript.KB_CONFIG);
  assert.ok(!serialized.includes('/home/'), 'KB_CONFIG must not contain /home/ paths');
});

test('toulmin_assistant suite: searchLocalTextbooks handles null/non-existent dir gracefully', async () => {
  const nullResult = await toulminScript.searchLocalTextbooks(null, '纸梁');
  assert.deepEqual(nullResult, [], 'null localDir should yield []');

  const missingResult = await toulminScript.searchLocalTextbooks('/path/that/definitely/does/not/exist/1234567', '纸梁');
  assert.deepEqual(missingResult, [], 'missing localDir should yield []');
});

test('toulmin_assistant suite: runWithConcurrency respects concurrency limit', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 10 }, (_, i) => async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(r => setTimeout(r, 15));
    active--;
    return i;
  });

  const results = await toulminScript.runWithConcurrency(tasks, 3, (task) => task());
  assert.deepEqual(results, Array.from({ length: 10 }, (_, i) => i));
  assert.ok(peak <= 3, `concurrency must not exceed limit (peak=${peak})`);
});

test('toulmin_assistant suite: source uses execFile (no shell injection)', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const src = fs.readFileSync(
    path.resolve(here, '../../skills/technology-engineering/toulmin-assistant/scripts/query_engineering_evidence.cjs'),
    'utf8'
  );
  assert.ok(!/grep\s+-/.test(src), 'source must not shell out to grep');
  assert.ok(!/execSync\s*\(/.test(src), 'source must not use execSync');
  assert.ok(/execFile/.test(src), 'source must use execFile');
});
