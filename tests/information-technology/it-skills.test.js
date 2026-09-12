import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Information Technology Suite: All 9 IT skills must be valid and correctly depend on Core', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true);

  const expectedItSkills = [
    'it.programming',
    'it.algorithm',
    'it.data',
    'it.artificial-intelligence',
    'it.computational-thinking',
    'it.project-learning',
    'it.primm-debugger',
    'it.woodpecker-auditor',
    'it.multi-version-teaching-designer'
  ];

  for (const skillId of expectedItSkills) {
    assert.ok(validator.skills.has(skillId), `IT skill '${skillId}' should be registered`);
    const skill = validator.skills.get(skillId);
    assert.equal(skill.type, 'teaching-skill');
    assert.ok(skill.subject.includes('information-technology'), `Skill ${skillId} must belong to 'information-technology'`);

    // Verify it inherits from core skills
    assert.ok(Array.isArray(skill.depends_on) && skill.depends_on.length > 0, `IT Skill ${skillId} should declare depends_on`);
    const hasCoreDep = skill.depends_on.some(dep => dep.startsWith('core.'));
    assert.ok(hasCoreDep, `IT Skill ${skillId} must depend on at least one core.* skill`);
  }
});

// ---------------------------------------------------------------------------
// it.woodpecker-auditor 审计规范与反硬编码测试
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// it.primm-debugger 认知摩擦与调试规范测试
// ---------------------------------------------------------------------------

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
