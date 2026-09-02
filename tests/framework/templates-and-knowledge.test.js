import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSimpleYaml } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('templates suite: all 6 template directories must contain valid template.yaml and template markdown', () => {
  const templatesDir = path.join(ROOT_DIR, 'templates');
  assert.ok(fs.existsSync(templatesDir), 'templates directory must exist');

  const expectedTemplates = [
    'assessment',
    'lesson-plan',
    'presentation',
    'project',
    'task-sheet',
    'teaching-script'
  ];

  for (const tpl of expectedTemplates) {
    const tplDir = path.join(templatesDir, tpl);
    assert.ok(fs.existsSync(tplDir), `Template directory '${tpl}' must exist`);

    const yamlPath = path.join(tplDir, 'template.yaml');
    assert.ok(fs.existsSync(yamlPath), `template.yaml must exist for '${tpl}'`);

    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parsed = parseSimpleYaml(yamlContent);
    assert.ok(parsed.id, `Template '${tpl}' must define id`);
    assert.ok(parsed.name, `Template '${tpl}' must define name`);
    assert.ok(parsed.version, `Template '${tpl}' must define version`);

    // Check for companion markdown template
    const entries = fs.readdirSync(tplDir);
    const mdFiles = entries.filter(e => e.endsWith('.md'));
    assert.ok(mdFiles.length > 0, `Template '${tpl}' must have at least one .md template file`);

    const mdContent = fs.readFileSync(path.join(tplDir, mdFiles[0]), 'utf8');
    assert.ok(mdContent.trim().length > 50, `Markdown template for '${tpl}' must not be empty`);
  }
});

test('knowledge suite: all knowledge markdown files must contain valid headings and concepts', () => {
  const knowledgeDir = path.join(ROOT_DIR, 'knowledge');
  assert.ok(fs.existsSync(knowledgeDir), 'knowledge directory must exist');

  const mdFiles = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) mdFiles.push(full);
    }
  };
  walk(knowledgeDir);

  assert.ok(mdFiles.length >= 10, `Expected at least 10 knowledge markdown files, got ${mdFiles.length}`);

  for (const file of mdFiles) {
    const rel = path.relative(ROOT_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.trim().length > 100, `Knowledge file '${rel}' must contain meaningful text (>100 chars)`);
    assert.match(content, /^#\s+/m, `Knowledge file '${rel}' must contain a level-1 heading (# ...)`);
  }
});
