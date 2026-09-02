import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const searchScript = require('../../skills/information-technology/primm-debugger/scripts/search_it_resource.cjs');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('search_it_resource suite: extractKeywords should extract Python error types and concepts', () => {
  const query = 'Python循环中遇到 IndexError 列表越界如何排查';
  const kws = searchScript.extractKeywords(query);

  assert.ok(Array.isArray(kws), 'Keywords should be an array');
  assert.ok(kws.includes('IndexError'), 'Should extract IndexError');
  assert.ok(kws.includes('列表'), 'Should extract 列表');
  assert.ok(kws.includes('循环'), 'Should extract 循环');
});

test('search_it_resource suite: extractKeywords for short query returns self', () => {
  const shortQuery = '二分';
  const kws = searchScript.extractKeywords(shortQuery);
  assert.deepEqual(kws, ['二分']);
});

test('search_it_resource suite: parseArgs parses CLI arguments correctly', () => {
  const customArgv = [
    'node',
    'search_it_resource.cjs',
    '--query',
    '二分查找死循环',
    '--stage',
    'investigate',
    '--subject',
    'it',
    '--limit',
    '3',
    '--format',
    'json'
  ];

  const parsed = searchScript.parseArgs(customArgv);
  assert.equal(parsed.query, '二分查找死循环');
  assert.equal(parsed.stage, 'investigate');
  assert.equal(parsed.subject, 'it');
  assert.equal(parsed.limit, 3);
  assert.equal(parsed.format, 'json');
});

test('search_it_resource suite: KB_CONFIG loads IT knowledge base from registry', () => {
  assert.ok(searchScript.KB_CONFIG.it, 'it knowledge base must be defined');
  assert.ok(searchScript.KB_CONFIG.it.id, 'it knowledge base id must be defined');
  assert.equal(searchScript.__registry.__source.endsWith('kb.registry.json'), true);
});

test('search_it_resource suite: KB_CONFIG localDir defaults to null (no hardcoded path)', () => {
  assert.equal(searchScript.KB_CONFIG.it.localDir, null);
  assert.equal(searchScript.KB_CONFIG.gt.localDir, null);
});

test('search_it_resource suite: source uses execFile (no shell injection)', () => {
  const scriptPath = path.resolve(__dirname, '../../skills/information-technology/primm-debugger/scripts/search_it_resource.cjs');
  const src = fs.readFileSync(scriptPath, 'utf8');

  assert.ok(src.includes('execFileP(') || src.includes('execFile('), 'Must use execFile');
  assert.ok(!src.includes('execSync('), 'Must NOT use execSync');
  assert.ok(!src.includes('child_process\').exec('), 'Must NOT use raw exec');
});
