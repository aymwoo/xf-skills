#!/usr/bin/env node

/**
 * Teaching Skills Framework - Catalog Builder
 * Compiles all framework metadata into a structured catalog.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

function buildCatalog() {
  console.log('🔨 Building catalog.json for Teaching Skills Framework...');
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  if (!report.success) {
    console.error('❌ Cannot build catalog: Validation failed.');
    process.exit(1);
  }

  let frameworkVersion = '0.3.2';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
    if (pkg.version) frameworkVersion = pkg.version;
  } catch (e) {
    // fallback to default
  }

  const catalog = {
    version: frameworkVersion,
    generated_at: new Date().toISOString(),
    skills_count: validator.skills.size,
    packs_count: validator.packs.size,
    templates_count: validator.templates.size,
    knowledge_count: validator.knowledge.size,
    skills: Array.from(validator.skills.values()).map(s => ({
      id: s.id,
      name: s.name,
      display_name: s.display_name,
      description: s.description || '',
      version: s.version,
      status: s.status,
      subject: s.subject,
      education_level: s.education_level,
      depends_on: s.depends_on || [],
      outputs: s.outputs || [],
      tags: s.tags || [],
      file: s.file
    })),
    packs: Array.from(validator.packs.values()),
    templates: Array.from(validator.templates),
    knowledge_modules: Array.from(validator.knowledge)
  };

  const outputPath = path.join(ROOT_DIR, 'catalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`✅ Catalog built successfully! Output saved to: ${outputPath} (${validator.skills.size} skills aggregated)\n`);
}

buildCatalog();
