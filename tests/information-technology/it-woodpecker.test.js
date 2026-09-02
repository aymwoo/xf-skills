import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('it-woodpecker: SKILL.md contains required five red lines', () => {
  const skillPath = path.join(ROOT_DIR, 'skills/information-technology/woodpecker-auditor/SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'SKILL.md must exist');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.ok(content.includes('严禁代劳原则'), 'Must contain 严禁代劳原则');
  assert.ok(content.includes('步骤锁定与漏洞清零原则'), 'Must contain 步骤锁定与漏洞清零原则');
  assert.ok(content.includes('人在回路最终决策主权'), 'Must contain 人在回路最终决策主权');
  assert.ok(content.includes('整篇冻结截断协议'), 'Must contain 整篇冻结截断协议');
  assert.ok(content.includes('防套话与骨架拒绝原则'), 'Must contain 防套话与骨架拒绝原则');
  assert.ok(content.includes('Teacher-Initiated Skip Override'), 'Must contain Teacher-Initiated Skip Override clause');
});

test('it-woodpecker: SKILL.md contains core competencies × three defenses mapping table', () => {
  const skillPath = path.join(ROOT_DIR, 'skills/information-technology/woodpecker-auditor/SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.ok(content.includes('语法泡沫与认知负荷'), 'Must mention 语法泡沫与认知负荷');
  assert.ok(content.includes('计算思维与过程评价'), 'Must mention 计算思维与过程评价');
  assert.ok(content.includes('探究留白与防抄袭摩擦'), 'Must mention 探究留白与防抄袭摩擦');
  assert.ok(content.includes('信息意识'), 'Must mention 信息意识');
  assert.ok(content.includes('计算思维'), 'Must mention 计算思维');
  assert.ok(content.includes('数字化学习与创新'), 'Must mention 数字化学习与创新');
  assert.ok(content.includes('信息社会责任'), 'Must mention 信息社会责任');
});

test('it-woodpecker: pack.it.high-school includes it.woodpecker-auditor', () => {
  const packPath = path.join(ROOT_DIR, 'packs/information-technology/high-school/pack.yaml');
  const content = fs.readFileSync(packPath, 'utf8');
  assert.ok(content.includes('it.woodpecker-auditor'), 'pack.it.high-school must include it.woodpecker-auditor');
});

test('it-woodpecker: must not contain hardcoded raw KB IDs', () => {
  const checkDir = path.join(ROOT_DIR, 'skills/information-technology/woodpecker-auditor');
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
