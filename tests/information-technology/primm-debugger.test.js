import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('primm-debugger: SKILL.md contains required cognitive friction red lines', () => {
  const skillPath = path.join(ROOT_DIR, 'skills/information-technology/primm-debugger/SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'SKILL.md must exist');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.ok(content.includes('零代码代劳原则'), 'Must contain 零代码代劳原则');
  assert.ok(content.includes('Traceback 门禁原则'), 'Must contain Traceback 门禁原则');
  assert.ok(content.includes('打印探针强制令'), 'Must contain 打印探针强制令');
  assert.ok(content.includes('150 字以内'), 'Must enforce 150 words limit');
});

test('primm-debugger: SKILL.md contains core competencies mapping table', () => {
  const skillPath = path.join(ROOT_DIR, 'skills/information-technology/primm-debugger/SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.ok(content.includes('信息意识'), 'Mapping table must mention 信息意识');
  assert.ok(content.includes('计算思维'), 'Mapping table must mention 计算思维');
  assert.ok(content.includes('数字化学习与创新'), 'Mapping table must mention 数字化学习与创新');
  assert.ok(content.includes('信息社会责任'), 'Mapping table must mention 信息社会责任');
});

test('primm-debugger: pack.it.high-school includes it.primm-debugger', () => {
  const packPath = path.join(ROOT_DIR, 'packs/information-technology/high-school/pack.yaml');
  const content = fs.readFileSync(packPath, 'utf8');
  assert.ok(content.includes('it.primm-debugger'), 'pack.it.high-school must include it.primm-debugger');
});

test('primm-debugger: must not contain hardcoded raw KB IDs', () => {
  const checkDir = path.join(ROOT_DIR, 'skills/information-technology/primm-debugger');
  const rawGtId = 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=';
  const rawItId = '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=';

  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) { walk(full); continue; }
      if (!ent.isFile()) continue;
      const src = fs.readFileSync(full, 'utf8');
      assert.ok(!src.includes(rawGtId), `${full} must not hardcode GT KB ID`);
      assert.ok(!src.includes(rawItId), `${full} must not hardcode IT KB ID`);
    }
  };
  walk(checkDir);
});
