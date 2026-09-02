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
