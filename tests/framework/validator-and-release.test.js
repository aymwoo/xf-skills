import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSimpleYaml, FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('validator: parseSimpleYaml should parse multiline strings (| and >)', () => {
  const yamlContent = `
id: test.multiline
name: multiline
description: |
  Line 1 of description
  Line 2 of description
version: 1.0.0
tags:
  - tag1
  - tag2
`;

  const parsed = parseSimpleYaml(yamlContent);
  assert.equal(parsed.id, 'test.multiline');
  assert.equal(parsed.version, '1.0.0');
  assert.equal(parsed.description, 'Line 1 of description\nLine 2 of description');
  assert.deepEqual(parsed.tags, ['tag1', 'tag2']);
});

test('framework: all 23 skills must have description in frontmatter', () => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();
  assert.equal(report.success, true);
  assert.equal(validator.skills.size, 23);

  for (const [id, skill] of validator.skills.entries()) {
    assert.ok(skill.description, `Skill ${id} must have description`);
    assert.ok(typeof skill.description === 'string' && skill.description.trim().length > 10,
      `Skill ${id} description must be meaningful text`);
  }
});

test('framework: kb.registry.schema.json exists and is valid JSON', () => {
  const schemaPath = path.join(ROOT_DIR, 'examples/kb.registry.schema.json');
  assert.ok(fs.existsSync(schemaPath), 'examples/kb.registry.schema.json must exist');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.equal(schema.type, 'object');
  assert.ok(Array.isArray(schema.required));
});

test('framework: scripts/build/build-catalog.js and bin/xf-skills.cjs exist', () => {
  const buildPath = path.join(ROOT_DIR, 'scripts/build/build-catalog.js');
  assert.ok(fs.existsSync(buildPath), 'scripts/build/build-catalog.js must exist');
  const cliPath = path.join(ROOT_DIR, 'bin/xf-skills.cjs');
  assert.ok(fs.existsSync(cliPath), 'bin/xf-skills.cjs must exist');
});

// 回归门：保证任何新增的 Skill 都不会丢失 tests/ 与 examples/ 两类资产。
// v0.6.1 起作为 CI 必要门棁，防止未来 PR 隐含退化。
test('framework: every skill must have both tests/ and examples/ directories', () => {
  const skillsDir = path.join(ROOT_DIR, 'skills');
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(parent =>
      fs.readdirSync(path.join(skillsDir, parent.name), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => path.join(skillsDir, parent.name, e.name))
    );

  assert.ok(skillDirs.length >= 23, `Expected at least 23 skills, found ${skillDirs.length}`);

  for (const dir of skillDirs) {
    const skillName = path.basename(dir);
    const testsDir = path.join(dir, 'tests');
    const examplesDir = path.join(dir, 'examples');

    assert.ok(fs.existsSync(testsDir), `${skillName} must have tests/ directory`);
    assert.ok(fs.existsSync(examplesDir), `${skillName} must have examples/ directory`);

    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.json'));
    assert.ok(testFiles.length > 0,
      `${skillName} tests/ must have at least one .json fixture (got: ${JSON.stringify(testFiles)})`);

    const exampleFiles = fs.readdirSync(examplesDir).filter(f => f.endsWith('.md'));
    assert.ok(exampleFiles.length > 0,
      `${skillName} examples/ must have at least one .md transcript (got: ${JSON.stringify(exampleFiles)})`);
  }
});
