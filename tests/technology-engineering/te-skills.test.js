import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Technology & Engineering Suite: All 8 TE skills must be valid and reflect engineering process', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true);

  const expectedTeSkills = [
    'te.technology-design',
    'te.engineering-design',
    'te.project-learning',
    'te.prototyping',
    'te.testing-iteration',
    'te.technical-practice',
    'te.woodpecker-auditor',
    'te.toulmin-assistant'
  ];

  for (const skillId of expectedTeSkills) {
    assert.ok(validator.skills.has(skillId), `TE skill '${skillId}' should be registered`);
    const skill = validator.skills.get(skillId);
    assert.equal(skill.type, 'teaching-skill');
    assert.ok(skill.subject.includes('technology-engineering'), `Skill ${skillId} must belong to 'technology-engineering'`);
    assert.ok(Array.isArray(skill.depends_on) && skill.depends_on.length > 0, `TE Skill ${skillId} should declare depends_on`);
  }
});

// ---------------------------------------------------------------------------
// te.woodpecker-auditor 教学设计微调（三道防线 × 五大核心素养 映射表）
// ---------------------------------------------------------------------------

test('woodpecker SKILL: must include five-core-competency × three-defenses mapping table', () => {
  const skillPath = path.join(
    ROOT_DIR,
    'skills/technology-engineering/woodpecker-auditor/SKILL.md'
  );
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.ok(
    src.includes('三道防线 × 五大核心素养'),
    'woodpecker SKILL.md must declare the three-defenses × five-competency mapping'
  );
  assert.match(src, /本阶段重点素养.*工程思维/, 'Stage 1 must declare focus competencies');
  assert.ok(src.includes('⚖️ 【第二阶段'), 'Stage 2 marker present');
  assert.ok(src.includes('🛠️ 【第三阶段'), 'Stage 3 marker present');
});

test('woodpecker SKILL: red-line 2 must include teacher-initiated skip override', () => {
  const skillPath = path.join(
    ROOT_DIR,
    'skills/technology-engineering/woodpecker-auditor/SKILL.md'
  );
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.ok(
    src.includes('教师主动解锁例外协议'),
    'red-line 2 must document Explicit Skip Override'
  );
  assert.ok(
    src.includes('我只需你诊断第X阶段'),
    'red-line 2 must list example teacher-initiated skip phrasings'
  );
});

test('woodpecker SKILL: scenario 3 must be split into two turns (Socratic density refined)', () => {
  const skillPath = path.join(
    ROOT_DIR,
    'skills/technology-engineering/woodpecker-auditor/SKILL.md'
  );
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.ok(
    src.includes('啄木鸟响应 · 第 1 轮（封锁 + 拒代）'),
    'scenario 3 must split into round 1'
  );
  assert.ok(
    src.includes('啄木鸟响应 · 第 2 轮（追问查证方法论）'),
    'scenario 3 must split into round 2'
  );
  assert.ok(
    !src.includes('请你现在打开课标必修1《技术与设计1》材料工艺章节'),
    'old single-turn long question must be replaced'
  );
});

// ---------------------------------------------------------------------------
// te.toulmin-assistant 阶段 ↔ 素养映射 + 字数拆分规则
// ---------------------------------------------------------------------------

test('toulmin SKILL: must include four-stages × five-competency mapping table', () => {
  const skillPath = path.join(
    ROOT_DIR,
    'skills/technology-engineering/toulmin-assistant/SKILL.md'
  );
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.ok(
    src.includes('四阶段 × 五大核心素养'),
    'toulmin SKILL.md must declare stage × competency mapping'
  );
  assert.ok(
    src.includes('字数硬校验流程'),
    'toulmin SKILL.md must declare 150-char hard check procedure'
  );
});
