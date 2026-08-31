import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Core Skills Suite: All 6 core skills must be present and valid', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true, `Validator should pass without errors. Got: ${JSON.stringify(report.errors)}`);

  const expectedCoreSkills = [
    'core.lesson-design',
    'core.activity-design',
    'core.assessment-design',
    'core.rubric-design',
    'core.project-learning',
    'core.teaching-reflection'
  ];

  for (const skillId of expectedCoreSkills) {
    assert.ok(validator.skills.has(skillId), `Core skill '${skillId}' should be registered`);
    const skill = validator.skills.get(skillId);
    assert.equal(skill.type, 'teaching-skill');
    assert.ok(skill.subject.includes('common'), `Core skill ${skillId} must belong to 'common' subject`);
    assert.ok(Array.isArray(skill.outputs) && skill.outputs.length > 0, `Skill ${skillId} must define outputs`);
  }
});
