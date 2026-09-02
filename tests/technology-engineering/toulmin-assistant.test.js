import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const toulminScript = require('../../skills/technology-engineering/toulmin-assistant/scripts/query_engineering_evidence.cjs');

// ---------------------------------------------------------------------------
// 既有用例
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// P0 修复：本地路径不再硬编码
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// P2 集成测试
// ---------------------------------------------------------------------------

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