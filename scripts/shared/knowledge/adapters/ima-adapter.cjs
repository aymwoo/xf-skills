'use strict';

/**
 * scripts/shared/knowledge/adapters/ima-adapter.cjs
 * -----------------------------------------------------------
 * 腾讯 IMA OpenAPI 知识库适配器 (ImaKnowledgeAdapter)
 * 对接云端通用技术（59册）与信息科技（48册）官方教材及个人知识库。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { BaseKnowledgeAdapter } = require('../base-adapter.cjs');
const { loadKbRegistry, buildKbConfig } = require('../../kb-registry.cjs');

class ImaKnowledgeAdapter extends BaseKnowledgeAdapter {
  /**
   * @param {string} id - 适配器实例标识
   * @param {Object} [options]
   * @param {string} [options.kbId] - IMA 知识库唯一 ID
   * @param {string} [options.subject='it'] - 默认学科（用于未显式指定 kbId 时从注册表回落）
   * @param {Function} [options.imaApi] - 可选直接注入的 imaApi 执行函数 (测试友好)
   */
  constructor(id = 'ima-default', options = {}) {
    super(id, options);
    this.type = 'ima';
    this.subject = options.subject || 'it';
    this._injectedApi = options.imaApi || null;
    this.kbId = options.kbId || this._resolveKbId();
  }

  _resolveKbId() {
    const registry = loadKbRegistry({ warnOnFallback: false });
    const config = buildKbConfig(registry);
    const target = config[this.subject] || config.it;
    return (target && target.id) || null;
  }

  _findImaApi() {
    if (this._injectedApi) return this._injectedApi;

    const candidatePaths = [
      path.join(os.homedir(), '.gemini/config/skills/ima-skills/ima_api.cjs'),
      path.join(os.homedir(), '.gemini/antigravity/skills/@tencent-adm/ima-skills/ima_api.cjs')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return require(p).imaApi;
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  }

  async isAvailable() {
    const api = this._findImaApi();
    return typeof api === 'function' && Boolean(this.kbId);
  }

  async search(queryObj) {
    const api = this._findImaApi();
    if (!api) {
      return [];
    }

    const q = typeof queryObj === 'string' ? queryObj : queryObj.query;
    const limit = (queryObj && queryObj.limit) || 5;
    const targetKbId = (queryObj && queryObj.options && queryObj.options.kbId) || this.kbId;

    if (!targetKbId || !q) return [];

    const callPromise = (async () => {
      try {
        const raw = await api('openapi/wiki/v1/search_knowledge', {
          knowledge_base_id: targetKbId,
          query: q,
          cursor: ''
        });
        const parsed = JSON.parse(raw);
        const list = (parsed.data && parsed.data.info_list) || [];
        return list.slice(0, limit).map(h => ({
          title: h.title || 'IMA 教材文档',
          content: h.snippet || h.summary || h.title || '',
          sourceType: 'ima',
          sourceUrl: h.file_url || null,
          score: 1.0,
          metadata: {
            mediaId: h.media_id,
            kbId: targetKbId
          }
        }));
      } catch (err) {
        return [];
      }
    })();

    const hits = await this.withTimeout(callPromise, this.timeoutMs).catch(() => []);
    return this.normalizeHits(hits);
  }
}

module.exports = {
  ImaKnowledgeAdapter
};
