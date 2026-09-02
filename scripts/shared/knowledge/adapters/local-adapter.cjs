'use strict';

/**
 * scripts/shared/knowledge/adapters/local-adapter.cjs
 * -----------------------------------------------------------
 * 本地知识库适配器 (LocalKnowledgeAdapter)
 * 支持离线机房环境，扫描指定目录下的校本 Markdown 与 PDF 教材。
 * 严格遵循安全沙箱设计：使用 execFile 调用 pdftotext，杜绝 Shell 注入。
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { BaseKnowledgeAdapter } = require('../base-adapter.cjs');

const execFileP = promisify(execFile);

class LocalKnowledgeAdapter extends BaseKnowledgeAdapter {
  /**
   * @param {string} id
   * @param {Object} [options]
   * @param {string} [options.localDir] - 本地知识库目录绝对路径
   * @param {string} [options.pdftotextPath='/usr/bin/pdftotext']
   */
  constructor(id = 'local-default', options = {}) {
    super(id, options);
    this.type = 'local';
    this.localDir = options.localDir || null;
    this.pdftotextPath = options.pdftotextPath || '/usr/bin/pdftotext';
  }

  async isAvailable() {
    if (!this.localDir) return false;
    try {
      const stat = fs.statSync(this.localDir);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  }

  _collectFiles(dir, maxDepth = 3, currentDepth = 0) {
    if (!dir || currentDepth > maxDepth || !fs.existsSync(dir)) return [];
    const files = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          files.push(...this._collectFiles(full, maxDepth, currentDepth + 1));
        } else if (ent.isFile()) {
          const lower = ent.name.toLowerCase();
          if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.pdf')) {
            files.push({ name: ent.name, fullPath: full });
          }
        }
      }
    } catch (e) {
      // ignore read error
    }
    return files;
  }

  async _extractSnippetFromPdf(pdfPath, targetTerm, contextLines = 3) {
    try {
      const { stdout } = await execFileP(this.pdftotextPath, [pdfPath, '-'], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 5000
      });
      if (!stdout) return null;

      const lines = stdout.split('\n');
      const termLower = targetTerm.toLowerCase();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(termLower)) {
          const start = Math.max(0, i - contextLines);
          const end = Math.min(lines.length, i + contextLines + 1);
          return lines.slice(start, end).join('\n').trim();
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async _searchMarkdownFile(filePath, term, contextLines = 3) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const termLower = term.toLowerCase();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(termLower)) {
          const start = Math.max(0, i - contextLines);
          const end = Math.min(lines.length, i + contextLines + 1);
          return lines.slice(start, end).join('\n').trim();
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async search(queryObj) {
    const isAvail = await this.isAvailable();
    if (!isAvail) return [];

    const q = typeof queryObj === 'string' ? queryObj : queryObj.query;
    const limit = (queryObj && queryObj.limit) || 3;
    if (!q) return [];

    const files = this._collectFiles(this.localDir);
    if (files.length === 0) return [];

    const hits = [];
    const term = q.trim();

    for (const f of files) {
      if (hits.length >= limit) break;

      const lower = f.name.toLowerCase();
      let snippet = null;

      if (lower.endsWith('.pdf')) {
        snippet = await this._extractSnippetFromPdf(f.fullPath, term);
      } else if (lower.endsWith('.md') || lower.endsWith('.txt')) {
        snippet = await this._searchMarkdownFile(f.fullPath, term);
      }

      if (snippet) {
        hits.push({
          title: f.name,
          content: snippet,
          sourceType: 'local',
          sourceUrl: f.fullPath,
          score: 1.0,
          metadata: {
            filePath: f.fullPath,
            ext: path.extname(f.name)
          }
        });
      }
    }

    return this.normalizeHits(hits);
  }
}

module.exports = {
  LocalKnowledgeAdapter
};
