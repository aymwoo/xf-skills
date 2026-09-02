import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const toulminScript = require('../../skills/technology-engineering/toulmin-assistant/scripts/query_engineering_evidence.cjs');

test('toulmin_assistant suite: extractKeywords should extract GT concepts from project descriptions', (t) => {
  const query = '纸梁受弯破坏与跨中挠度实测';
  const kws = toulminScript.extractKeywords(query);

  assert.ok(Array.isArray(kws), 'Keywords should be an array');
  assert.ok(kws.includes('纸梁') || kws.includes('弯曲') || kws.includes('破坏'), 'Should extract 纸梁/弯曲/破坏');
});

test('toulmin_assistant suite: parseArgs parses topic and stage flags correctly', (t) => {
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

test('toulmin_assistant suite: KB_CONFIG points to official GT knowledge base', (t) => {
  assert.ok(toulminScript.KB_CONFIG.gt, 'GT knowledge base mapping exists');
  assert.equal(toulminScript.KB_CONFIG.gt.id, 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=');
});
