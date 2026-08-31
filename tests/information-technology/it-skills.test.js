import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Information Technology Suite: All 6 IT skills must be valid and correctly depend on Core', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true);

  const expectedItSkills = [
    'it.programming',
    'it.algorithm',
    'it.data',
    'it.artificial-intelligence',
    'it.computational-thinking',
    'it.project-learning'
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
