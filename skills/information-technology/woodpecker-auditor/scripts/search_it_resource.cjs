#!/usr/bin/env node
'use strict';

/**
 * skills/information-technology/woodpecker-auditor/scripts/search_it_resource.cjs
 * ---------------------------------------------------------------------------
 * 信息科技啄木鸟审计专家使用的 IMA 知识库检索器。
 * 复用 primm-debugger 中的共享检索实现与 kb-registry，避免代码冗余。
 */

const fs = require('fs');
const path = require('path');

function resolveSearchModule() {
  const candidatePaths = [
    path.resolve(__dirname, '../../primm-debugger/scripts/search_it_resource.cjs'),
    path.resolve(__dirname, './search_it_core.cjs')
  ];

  for (const cand of candidatePaths) {
    if (fs.existsSync(cand)) {
      try {
        return require(cand);
      } catch (e) {}
    }
  }
  return null;
}

const resolved = resolveSearchModule();
if (resolved) {
  module.exports = resolved;
} else {
  module.exports = {
    parseArgs: () => ({ query: '', stage: 'investigate', limit: 5 }),
    extractKeywords: (q) => [q],
    searchImaKb: async () => [],
    searchLocalTextbooks: async () => [],
    runWithConcurrency: async () => [],
    KB_CONFIG: { it: { localDir: null }, gt: { localDir: null } }
  };
}
