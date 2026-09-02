import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const registryModule = require('../../scripts/shared/kb-registry.cjs');
const { loadKbRegistry, buildKbConfig, validateRegistryShape, getDefaultRegistryPath, FALLBACK_KB_CONFIG } = registryModule;

const REGISTRY_PATH = path.resolve(__dirname, '../../examples/kb.registry.json');

// ---------------------------------------------------------------------------
// P3：KB 注册表加载器
// ---------------------------------------------------------------------------

test('kb-registry: default registry file exists at examples/kb.registry.json', () => {
  assert.ok(fs.existsSync(REGISTRY_PATH), 'default registry must exist');
});

test('kb-registry: default registry file has expected GT + IT keys', () => {
  const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert.ok(raw.knowledge_bases, 'registry must declare knowledge_bases');
  assert.ok(raw.knowledge_bases.gt, 'registry must include gt entry');
  assert.ok(raw.knowledge_bases.it, 'registry must include it entry');
  assert.equal(typeof raw.knowledge_bases.gt.id, 'string');
  assert.equal(typeof raw.knowledge_bases.gt.name, 'string');
  assert.equal(typeof raw.knowledge_bases.it.id, 'string');
  assert.equal(typeof raw.knowledge_bases.it.name, 'string');
});

test('kb-registry: default registry IDs match the historical IMA defaults', () => {
  const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert.equal(raw.knowledge_bases.gt.id, 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=');
  assert.equal(raw.knowledge_bases.it.id, '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=');
});

test('kb-registry: getDefaultRegistryPath returns the canonical path', () => {
  assert.equal(getDefaultRegistryPath(), REGISTRY_PATH);
});

test('kb-registry: loadKbRegistry returns object with __source marker', () => {
  const reg = loadKbRegistry();
  assert.ok(reg.knowledge_bases, 'must contain knowledge_bases');
  assert.match(reg.__source, /kb\.registry\.json$/);
});

test('kb-registry: loadKbRegistry honours custom registryPath option', () => {
  const tmpFile = path.join(__dirname, '..', 'fixtures', 'tmp-kb-registry.json');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, JSON.stringify({
    knowledge_bases: {
      gt: { id: 'CUSTOM-GT', name: 'Custom GT' },
      it: { id: 'CUSTOM-IT', name: 'Custom IT' }
    }
  }));
  try {
    const reg = loadKbRegistry({ registryPath: tmpFile });
    assert.equal(reg.knowledge_bases.gt.id, 'CUSTOM-GT');
    assert.equal(reg.knowledge_bases.it.id, 'CUSTOM-IT');
    assert.equal(reg.__source, tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

test('kb-registry: loadKbRegistry honours KB_REGISTRY_PATH env var', () => {
  const tmpFile = path.join(__dirname, '..', 'fixtures', 'tmp-kb-env.json');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, JSON.stringify({
    knowledge_bases: {
      gt: { id: 'ENV-GT', name: 'Env GT' },
      it: { id: 'ENV-IT', name: 'Env IT' }
    }
  }));
  const prev = process.env.KB_REGISTRY_PATH;
  process.env.KB_REGISTRY_PATH = tmpFile;
  try {
    const reg = loadKbRegistry();
    assert.equal(reg.knowledge_bases.gt.id, 'ENV-GT');
    assert.equal(reg.__source, tmpFile);
  } finally {
    if (prev === undefined) delete process.env.KB_REGISTRY_PATH;
    else process.env.KB_REGISTRY_PATH = prev;
    fs.unlinkSync(tmpFile);
  }
});

test('kb-registry: loadKbRegistry falls back when no registry is available', () => {
  const prev = process.env.KB_REGISTRY_PATH;
  process.env.KB_REGISTRY_PATH = '/path/that/definitely/does/not/exist/__kb_registry_test__.json';
  try {
    const reg = loadKbRegistry();
    // 即使仓库默认注册表存在（应被 KB_REGISTRY_PATH 取代），找不到文件时应退回默认
    // 当默认注册表也找不到时进入 fallback 路径
    assert.ok(reg.knowledge_bases, 'fallback must still provide knowledge_bases');
  } finally {
    if (prev === undefined) delete process.env.KB_REGISTRY_PATH;
    else process.env.KB_REGISTRY_PATH = prev;
  }
});

test('kb-registry: validateRegistryShape rejects malformed payloads', () => {
  assert.throws(() => validateRegistryShape(null), /must be a JSON object/);
  assert.throws(() => validateRegistryShape({}), /knowledge_bases/);
  assert.throws(() => validateRegistryShape({
    knowledge_bases: { gt: { name: 'oops' } }
  }), /non-empty string/);
});

test('kb-registry: buildKbConfig applies env var overrides', () => {
  const reg = loadKbRegistry();
  const prevId = process.env.WOODPECKER_GT_KB_ID;
  const prevDir = process.env.WOODPECKER_GT_LOCAL_DIR;
  process.env.WOODPECKER_GT_KB_ID = 'override-gt';
  process.env.WOODPECKER_GT_LOCAL_DIR = '/tmp/override';
  try {
    const cfg = buildKbConfig(reg, {
      gt: { idEnv: 'WOODPECKER_GT_KB_ID', localDirEnv: 'WOODPECKER_GT_LOCAL_DIR' },
      it: {}
    });
    assert.equal(cfg.gt.id, 'override-gt');
    assert.equal(cfg.gt.localDir, '/tmp/override');
    assert.equal(cfg.it.id, reg.knowledge_bases.it.id, 'IT must keep default from registry');
    assert.equal(cfg.it.localDir, null);
  } finally {
    if (prevId === undefined) delete process.env.WOODPECKER_GT_KB_ID;
    else process.env.WOODPECKER_GT_KB_ID = prevId;
    if (prevDir === undefined) delete process.env.WOODPECKER_GT_LOCAL_DIR;
    else process.env.WOODPECKER_GT_LOCAL_DIR = prevDir;
  }
});

// ---------------------------------------------------------------------------
// P3：脚本层集成测试
// ---------------------------------------------------------------------------

test('woodpecker script: loads KB IDs from registry (not hardcoded)', () => {
  const script = require('../../skills/technology-engineering/woodpecker-auditor/scripts/search_gt_resource.cjs');
  // 验证脚本的 KB_CONFIG 来源是注册表加载器而非内置硬编码
  assert.ok(script.__registry, 'script must expose __registry from the loader');
  assert.match(script.__registry.__source, /kb\.registry\.json$/);
  // 验证加载结果与默认注册表一致
  const regRaw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert.equal(script.KB_CONFIG.gt.id, regRaw.knowledge_bases.gt.id);
  assert.equal(script.KB_CONFIG.it.id, regRaw.knowledge_bases.it.id);
});

test('toulmin script: loads KB IDs from registry (not hardcoded)', () => {
  const script = require('../../skills/technology-engineering/toulmin-assistant/scripts/query_engineering_evidence.cjs');
  assert.ok(script.__registry, 'script must expose __registry from the loader');
  assert.match(script.__registry.__source, /kb\.registry\.json$/);
  const regRaw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert.equal(script.KB_CONFIG.gt.id, regRaw.knowledge_bases.gt.id);
});

test('scripts/shared/kb-registry.cjs: must NOT contain raw KB IDs in source files (anti-hardcoding)', () => {
  // 整个 skills/ 与 scripts/ 都不应再出现裸 KB ID（除注册表文件本身）
  const searchDirs = [
    path.resolve(__dirname, '../../skills/technology-engineering'),
    path.resolve(__dirname, '../../scripts/shared')
  ];
  const excluded = ['kb-registry.cjs']; // 共享加载器允许引用注册表路径与 fallback
  const offenders = [];
  for (const dir of searchDirs) {
    const walk = (d) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) { walk(full); continue; }
        if (!ent.isFile() || !full.endsWith('.cjs')) continue;
        if (excluded.some(name => full.endsWith(name))) continue;
        const src = fs.readFileSync(full, 'utf8');
        if (/aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=/.test(src)) {
          offenders.push(`${full} (gt id)`);
        }
        if (/72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=/.test(src)) {
          offenders.push(`${full} (it id)`);
        }
      }
    };
    walk(dir);
  }
  assert.deepEqual(offenders, [], `Hardcoded KB IDs found outside registry: ${offenders.join(', ')}`);
});

test('SKILL.md: must reference kb.registry.json instead of hardcoded IDs', () => {
  const woodpeckerPath = path.resolve(__dirname, '../../skills/technology-engineering/woodpecker-auditor/SKILL.md');
  const toulminPath = path.resolve(__dirname, '../../skills/technology-engineering/toulmin-assistant/SKILL.md');
  for (const p of [woodpeckerPath, toulminPath]) {
    const src = fs.readFileSync(p, 'utf8');
    assert.ok(
      src.includes('kb.registry.json'),
      `${p} must reference kb.registry.json`
    );
    assert.ok(
      !src.includes('aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0='),
      `${p} must not hardcode GT KB ID`
    );
    assert.ok(
      !src.includes('72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ='),
      `${p} must not hardcode IT KB ID`
    );
  }
});