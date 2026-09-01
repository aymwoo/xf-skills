import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const searchScript = require('../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs');

test('search_gt_resource suite: extractKeywords should extract GT domain terms', (t) => {
  const query = '分析一下闭环控制系统中的干扰因素与稳定性测定实验';
  const kws = searchScript.extractKeywords(query);

  assert.ok(Array.isArray(kws), 'Keywords should be an array');
  assert.ok(kws.includes('闭环控制') || kws.includes('控制系统'), 'Should extract 闭环控制 or 控制系统');
  assert.ok(kws.includes('稳定性'), 'Should extract 稳定性');
  assert.ok(kws.includes('干扰'), 'Should extract 干扰');
});

test('search_gt_resource suite: extractKeywords for short query returns self', (t) => {
  const shortQuery = '榫卯';
  const kws = searchScript.extractKeywords(shortQuery);
  assert.deepEqual(kws, ['榫卯']);
});

test('search_gt_resource suite: parseArgs parses CLI arguments correctly', (t) => {
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

test('search_gt_resource suite: KB_CONFIG has valid GT and IT knowledge base mappings', (t) => {
  assert.ok(searchScript.KB_CONFIG.gt, 'gt knowledge base must be defined');
  assert.equal(searchScript.KB_CONFIG.gt.id, 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=');
  assert.ok(searchScript.KB_CONFIG.it, 'it knowledge base must be defined');
  assert.equal(searchScript.KB_CONFIG.it.id, '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=');
});
