#!/usr/bin/env node

/**
 * Teaching Skills Framework - Static Validator
 * Zero-dependency robust ESM validator for Skills, Knowledge, Templates, and Packs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

// Simple zero-dependency YAML Front Matter parser
export function parseYamlFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontMatter: null, body: content };
  }

  const rawYaml = match[1];
  const body = match[2];
  const frontMatter = parseSimpleYaml(rawYaml);
  return { frontMatter, body };
}

export function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split(/\r?\n/);
  let currentKey = null;
  let currentArray = null;
  let currentNestedObj = null;
  let nestedKey = null;

  for (let line of lines) {
    line = line.trimEnd();
    if (!line || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Check for nested array item
    if (trimmed.startsWith('- ')) {
      const itemVal = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
      if (currentNestedObj && nestedKey) {
        if (!Array.isArray(currentNestedObj[nestedKey])) {
          currentNestedObj[nestedKey] = [];
        }
        currentNestedObj[nestedKey].push(itemVal);
      } else if (currentArray) {
        currentArray.push(itemVal);
      }
      continue;
    }

    // Check for key: value
    const kvMatch = trimmed.match(/^([a-zA-Z0-9_.-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val = kvMatch[2].trim();

      if (indent === 0) {
        currentNestedObj = null;
        nestedKey = null;
        currentKey = key;
        currentArray = null;

        if (val === '' || val === '[]') {
          if (val === '[]') {
            result[key] = [];
          } else {
            // Might be object or array next
            result[key] = [];
            currentArray = result[key];
          }
        } else if (val.startsWith('[') && val.endsWith(']')) {
          result[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        } else {
          result[key] = cleanVal(val);
        }
      } else if (indent > 0) {
        // Indented property -> nested object or property
        if (typeof result[currentKey] !== 'object' || Array.isArray(result[currentKey])) {
          result[currentKey] = {};
        }
        currentNestedObj = result[currentKey];
        nestedKey = key;
        currentArray = null;

        if (val === '' || val === '[]') {
          if (val === '[]') {
            currentNestedObj[key] = [];
          } else {
            currentNestedObj[key] = [];
          }
        } else if (val.startsWith('[') && val.endsWith(']')) {
          currentNestedObj[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        } else {
          currentNestedObj[key] = cleanVal(val);
        }
      }
    }
  }

  return result;
}

function cleanVal(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/^['"]|['"]$/g, '');
}

export class FrameworkValidator {
  constructor(rootDir = ROOT_DIR) {
    this.rootDir = rootDir;
    this.skills = new Map();
    this.packs = new Map();
    this.templates = new Set();
    this.knowledge = new Set();
    this.errors = [];
    this.warnings = [];
  }

  collectTemplates() {
    const templatesDir = path.join(this.rootDir, 'templates');
    if (!fs.existsSync(templatesDir)) return;
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        this.templates.add(ent.name);
      }
    }
  }

  collectKnowledge() {
    const knowledgeDir = path.join(this.rootDir, 'knowledge');
    if (!fs.existsSync(knowledgeDir)) return;

    const walk = (dir, prefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const nextPrefix = prefix ? `${prefix}.${ent.name}` : ent.name;
          walk(path.join(dir, ent.name), nextPrefix);
        } else if (ent.isFile() && ent.name.endsWith('.md')) {
          const baseName = ent.name.replace(/\.md$/, '');
          const id = prefix ? `${prefix}.${baseName}` : baseName;
          this.knowledge.add(id);
          // also allow shorthand like `information-technology.curriculum`
          if (prefix) this.knowledge.add(prefix);
        }
      }
    };
    walk(knowledgeDir);
  }

  validateSkills(skillsDir = path.join(this.rootDir, 'skills')) {
    if (!fs.existsSync(skillsDir)) {
      this.errors.push(`Skills directory not found: ${skillsDir}`);
      return;
    }

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          const skillFile = path.join(fullPath, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            this.validateSingleSkill(skillFile, fullPath);
          }
          walk(fullPath);
        }
      }
    };
    walk(skillsDir);

    // Dependency check
    for (const [id, skill] of this.skills.entries()) {
      if (skill.depends_on && Array.isArray(skill.depends_on)) {
        for (const dep of skill.depends_on) {
          if (!this.skills.has(dep)) {
            this.errors.push(`[Skill: ${id}] depends_on references non-existent skill: '${dep}'`);
          }
        }
      }
    }

    // Circular dependency check
    for (const id of this.skills.keys()) {
      const visited = new Set();
      const inStack = new Set();
      if (this.hasCycle(id, visited, inStack)) {
        this.errors.push(`[Skill: ${id}] Detected circular dependency in depends_on graph!`);
      }
    }
  }

  hasCycle(currId, visited, inStack) {
    visited.add(currId);
    inStack.add(currId);

    const skill = this.skills.get(currId);
    if (skill && Array.isArray(skill.depends_on)) {
      for (const dep of skill.depends_on) {
        if (!visited.has(dep)) {
          if (this.hasCycle(dep, visited, inStack)) return true;
        } else if (inStack.has(dep)) {
          return true;
        }
      }
    }

    inStack.delete(currId);
    return false;
  }

  validateSingleSkill(skillFile, dirPath) {
    const relPath = path.relative(this.rootDir, skillFile);
    const content = fs.readFileSync(skillFile, 'utf-8');
    const { frontMatter, body } = parseYamlFrontMatter(content);

    if (!frontMatter) {
      this.errors.push(`[${relPath}] Missing or invalid YAML front matter (must be enclosed in ---).`);
      return;
    }

    const requiredFields = ['id', 'name', 'display_name', 'version', 'type', 'subject', 'education_level', 'outputs'];
    for (const field of requiredFields) {
      if (!frontMatter[field]) {
        this.errors.push(`[${relPath}] Missing required front matter field: '${field}'`);
      }
    }

    if (frontMatter.type && frontMatter.type !== 'teaching-skill') {
      this.errors.push(`[${relPath}] Field 'type' must be 'teaching-skill', got '${frontMatter.type}'`);
    }

    // ID validation
    if (frontMatter.id) {
      if (this.skills.has(frontMatter.id)) {
        this.errors.push(`[${relPath}] Duplicate skill ID: '${frontMatter.id}' (already defined in ${this.skills.get(frontMatter.id).file})`);
      } else {
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(frontMatter.id)) {
          this.warnings.push(`[${relPath}] Skill ID '${frontMatter.id}' should follow '<scope>.<name>' format.`);
        }
        this.skills.set(frontMatter.id, {
          ...frontMatter,
          file: relPath,
          dir: dirPath
        });
      }
    }

    // Output template validation
    if (Array.isArray(frontMatter.outputs)) {
      for (const out of frontMatter.outputs) {
        if (!this.templates.has(out)) {
          this.errors.push(`[${relPath}] Output template '${out}' does not exist in templates/ directory.`);
        }
      }
    }

    // Knowledge requirement validation
    if (frontMatter.requires && frontMatter.requires.knowledge && Array.isArray(frontMatter.requires.knowledge)) {
      for (const kn of frontMatter.requires.knowledge) {
        if (!this.knowledge.has(kn)) {
          this.warnings.push(`[${relPath}] requires.knowledge '${kn}' not explicitly matched in knowledge/ tree.`);
        }
      }
    }

    // Workflow check in body
    const workflowKeywords = ['Workflow', 'Input', 'Context', 'Planning', 'Generation', 'Validation', 'Output'];
    let matchedKeywords = 0;
    for (const kw of workflowKeywords) {
      if (new RegExp(kw, 'i').test(body)) {
        matchedKeywords++;
      }
    }
    if (matchedKeywords < 3) {
      this.warnings.push(`[${relPath}] SKILL.md body seems to lack standard 7-step Workflow description.`);
    }

    // Accompanying files check
    const readmeFile = path.join(dirPath, 'README.md');
    if (!fs.existsSync(readmeFile)) {
      this.warnings.push(`[${relPath}] Recommended README.md missing in skill directory.`);
    }
  }

  validatePacks(packsDir = path.join(this.rootDir, 'packs')) {
    if (!fs.existsSync(packsDir)) return;

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          const packFile = path.join(fullPath, 'pack.yaml');
          if (fs.existsSync(packFile)) {
            this.validateSinglePack(packFile);
          }
          walk(fullPath);
        }
      }
    };
    walk(packsDir);
  }

  validateSinglePack(packFile) {
    const relPath = path.relative(this.rootDir, packFile);
    const content = fs.readFileSync(packFile, 'utf-8');
    const { frontMatter } = parseYamlFrontMatter(`---\n${content.replace(/^---\r?\n/, '')}`);
    const data = frontMatter || parseSimpleYaml(content);

    if (!data.id || !data.name) {
      this.errors.push(`[${relPath}] Pack missing required 'id' or 'name'.`);
      return;
    }

    if (this.packs.has(data.id)) {
      this.errors.push(`[${relPath}] Duplicate pack ID: '${data.id}'`);
    } else {
      this.packs.set(data.id, { ...data, file: relPath });
    }

    if (Array.isArray(data.skills)) {
      for (const sk of data.skills) {
        if (!this.skills.has(sk)) {
          this.errors.push(`[Pack: ${data.id}] Declared skill '${sk}' not found in framework skills.`);
        }
      }
    }

    if (Array.isArray(data.templates)) {
      for (const tpl of data.templates) {
        if (!this.templates.has(tpl)) {
          this.errors.push(`[Pack: ${data.id}] Declared template '${tpl}' not found in templates/ directory.`);
        }
      }
    }
  }

  run(options = {}) {
    this.collectTemplates();
    this.collectKnowledge();

    if (!options.target || options.target === 'skills' || options.target === 'all') {
      this.validateSkills();
    }
    if (!options.target || options.target === 'packs' || options.target === 'all') {
      this.validatePacks();
    }

    return {
      success: this.errors.length === 0,
      skillsCount: this.skills.size,
      packsCount: this.packs.size,
      templatesCount: this.templates.size,
      knowledgeCount: this.knowledge.size,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => a.startsWith('--target='));
  const target = targetArg ? targetArg.split('=')[1] : 'all';

  console.log(`\n🔍 Running Teaching Skills Framework Validator (Target: ${target})...\n`);
  const validator = new FrameworkValidator();
  const report = validator.run({ target });

  console.log(`📦 Discovered:`);
  console.log(`   - Skills:    ${report.skillsCount}`);
  console.log(`   - Packs:     ${report.packsCount}`);
  console.log(`   - Templates: ${report.templatesCount}`);
  console.log(`   - Knowledge: ${report.knowledgeCount}`);
  console.log('');

  if (report.warnings.length > 0) {
    console.log(`⚠️  Warnings (${report.warnings.length}):`);
    report.warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  if (report.errors.length > 0) {
    console.error(`❌ Validation Failed (${report.errors.length} errors):`);
    report.errors.forEach(e => console.error(`   - ${e}`));
    console.log('');
    process.exit(1);
  } else {
    console.log(`✅ Validation Passed: All skills and packs are valid!\n`);
    process.exit(0);
  }
}
