#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function findImaApi() {
  const candidatePaths = [
    process.env.IMA_API_PATH,
    path.join(__dirname, 'ima_api.cjs'),
    path.join(__dirname, '../../../scripts/shared/ima_api.cjs'),
    path.join(os.homedir(), '.gemini/config/skills/ima-skills/ima_api.cjs'),
    path.join(os.homedir(), '.gemini/antigravity/skills/@tencent-adm/ima-skills/ima_api.cjs')
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return require(p).imaApi;
      } catch (e) {
        // continue search
      }
    }
  }
  return null;
}

const imaApi = findImaApi();

function parseArgs() {
  const args = { title: '', file: '', content: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--title' || process.argv[i] === '-t') {
      args.title = process.argv[++i] || '';
    } else if (process.argv[i] === '--file' || process.argv[i] === '-f') {
      args.file = process.argv[++i] || '';
    } else if (process.argv[i] === '--content' || process.argv[i] === '-c') {
      args.content = process.argv[++i] || '';
    }
  }
  return args;
}

async function main() {
  if (!imaApi) {
    console.error(JSON.stringify({
      error: 'ima_api.cjs not found in standard paths (~/.gemini/config/skills/ima-skills/ or ~/.gemini/antigravity/skills/@tencent-adm/ima-skills/). Please verify ima-skills installation.'
    }));
    process.exit(1);
  }

  const args = parseArgs();
  let content = args.content;
  if (!content && args.file) {
    content = fs.readFileSync(args.file, 'utf8');
  }

  if (!content) {
    console.error(JSON.stringify({ error: 'No content provided. Use --file or --content.' }));
    process.exit(1);
  }

  const title = args.title || '多版本教学设计方案';

  // Import doc to IMA Notes
  const respRaw = await imaApi('openapi/note/v1/import_doc', {
    title: title,
    content: content,
    content_format: 1 // Markdown format
  });

  console.log(respRaw);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
