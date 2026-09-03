import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const CLI_PATH = path.resolve(ROOT_DIR, 'bin/xf-skills.cjs');
const CATALOG_PATH = path.join(ROOT_DIR, 'catalog.json');

// Self-healing: cli 子测试依赖 catalog.json。在干净 checkout 下(例如初次 npm install 之后)
// 该文件不存在,直接跳出会报 "尚未生成 catalog.json"。这里用 node:test 的 before 钩子
// 做幂等预处理:文件缺失则自动调 build:catalog 生成,存在则什么都不做(≈0ms 开销)。
test.before(async () => {
  if (!fs.existsSync(CATALOG_PATH)) {
    const { execFileSync } = await import('node:child_process');
    execFileSync('node', ['scripts/build/build-catalog.js'], {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
  }
});

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
