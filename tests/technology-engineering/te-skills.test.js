import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
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
