import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Physics Suite: physics.experiment-inquiry must be valid and correctly inherit from Core', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true);
  assert.ok(validator.skills.has('physics.experiment-inquiry'), 'Skill physics.experiment-inquiry must be registered');

  const skill = validator.skills.get('physics.experiment-inquiry');
  assert.equal(skill.type, 'teaching-skill');
  assert.ok(skill.subject.includes('physics'), "Skill must belong to 'physics'");
  assert.ok(skill.depends_on.includes('core.lesson-design'), 'Must depend on core.lesson-design');
  assert.ok(skill.depends_on.includes('core.activity-design'), 'Must depend on core.activity-design');
});

test('Physics Suite: SKILL.md must contain four physics core competencies', () => {
  const skillPath = path.join(ROOT_DIR, 'skills/physics/experiment-inquiry/SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.ok(content.includes('物理观念'), 'Must mention 物理观念');
  assert.ok(content.includes('科学思维'), 'Must mention 科学思维');
  assert.ok(content.includes('科学探究'), 'Must mention 科学探究');
  assert.ok(content.includes('科学态度与责任'), 'Must mention 科学态度与责任');
});

test('Physics Suite: curriculum knowledge module must exist', () => {
  const knowPath = path.join(ROOT_DIR, 'knowledge/physics/curriculum/physics-curriculum-framework.md');
  assert.ok(fs.existsSync(knowPath), 'Physics curriculum knowledge module must exist');
});
