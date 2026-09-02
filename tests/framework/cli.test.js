import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '../../bin/xf-skills.cjs');

test('cli suite: xf-skills --version returns package version', async () => {
  const { stdout } = await execFileP(CLI_PATH, ['--version']);
  assert.match(stdout.trim(), /^teaching-skills v\d+\.\d+\.\d+$/);
});

test('cli suite: xf-skills search finds matching skills', async () => {
  const { stdout } = await execFileP(CLI_PATH, ['search', '递归']);
  assert.ok(stdout.includes('it.algorithm'));
});

test('cli suite: xf-skills info displays skill details', async () => {
  const { stdout } = await execFileP(CLI_PATH, ['info', 'it.primm-debugger']);
  assert.ok(stdout.includes('PRIMM 编程思维与认知调试助教'));
  assert.ok(stdout.includes('适用学科: information-technology'));
});

test('cli suite: xf-skills chat --mock runs Socratic demonstration', async () => {
  const { stdout } = await execFileP(CLI_PATH, ['chat', 'it.primm-debugger', '--mock']);
  assert.ok(stdout.includes('模拟对话演示模式'));
  assert.ok(stdout.includes('年轻的程序员'));
});

test('cli suite: xf-skills kb cascades to local knowledge', async () => {
  const { stdout } = await execFileP(CLI_PATH, ['kb', '计算思维']);
  assert.ok(stdout.includes('找到') && stdout.includes('LOCAL'));
});
