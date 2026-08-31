#!/usr/bin/env node

/**
 * Teaching Skills Framework - Release Readiness Checker
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

function checkRelease() {
  console.log('🚀 Checking release readiness...\n');
  const requiredFiles = [
    'README.md',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    'LICENSE',
    'package.json',
    '.gitignore',
    '.github/workflows/validate.yml',
    'docs/architecture/overview.md',
    'docs/specifications/skill-spec.md'
  ];

  let missing = 0;
  for (const f of requiredFiles) {
    const full = path.join(ROOT_DIR, f);
    if (!fs.existsSync(full)) {
      console.error(`❌ Missing critical file: ${f}`);
      missing++;
    } else {
      console.log(`✅ Found: ${f}`);
    }
  }

  if (missing > 0) {
    console.error(`\n❌ Release check failed with ${missing} missing files.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All release criteria satisfied! Ready for v0.1.0 release.\n`);
  }
}

checkRelease();
