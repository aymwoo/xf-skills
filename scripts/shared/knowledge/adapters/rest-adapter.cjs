'use strict';

/**
 * scripts/shared/knowledge/adapters/rest-adapter.cjs
 * -----------------------------------------------------------
 * 通用 REST / 云端 RAG (Dify / FastGPT) 适配器 (RestKnowledgeAdapter)
 * 基于 Node.js 18+ 原生内置 fetch 实现，保持零外部 npm 依赖。
 */

const { BaseKnowledgeAdapter } = require('../base-adapter.cjs');

class RestKnowledgeAdapter extends BaseKnowledgeAdapter {
  /**
   * @param {string} id
   * @param {Object} [options]
   * @param {string} [options.endpoint] - API 完整请求地址
   * @param {string} [options.apiKey] - Bearer Token 或 API Key
   * @param {string} [options.datasetId] - 数据集 ID (Dify 模式)
   * @param {('dify'|'generic')} [options.protocol='dify'] - 协议模板
   * @param {Function} [options.fetchFn] - 可注入的 fetch 实现 (用于测试模拟)
   */
  constructor(id = 'rest-default', options = {}) {
    super(id, options);
    this.type = 'rest';
    this.endpoint = options.endpoint || process.env.KNOWLEDGE_REST_ENDPOINT || null;
    this.apiKey = options.apiKey || process.env.KNOWLEDGE_REST_APIKEY || null;
    this.datasetId = options.datasetId || process.env.KNOWLEDGE_REST_DATASET_ID || null;
    this.protocol = options.protocol || 'dify';
    this._fetch = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  }

  async isAvailable() {
    return Boolean(this.endpoint && this._fetch);
  }

  /**
   * 构造 Dify 格式检索请求
   * @private
   */
  _buildDifyRequest(query, limit) {
    let url = this.endpoint;
    if (this.datasetId && !url.includes(this.datasetId)) {
      url = `${url.replace(/\/$/, '')}/datasets/${this.datasetId}/retrieve`;
    }

    return {
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey || ''}`
      },
      body: JSON.stringify({
        query: query,
        retrieval_model: {
          search_method: 'semantic_search',
          top_k: limit
        }
      })
    };
  }

  /**
   * 解析 Dify 返回数据
   * @private
   */
  _parseDifyResponse(data) {
    const records = data.records || data.data || [];
    return records.map(r => {
      const seg = r.segment || r;
      return {
        title: (seg.document && seg.document.name) || r.title || 'Dify 知识片段',
        content: seg.content || r.content || '',
        sourceType: 'dify',
        sourceUrl: null,
        score: r.score || 1.0,
        metadata: {
          segmentId: seg.id,
          documentId: seg.document_id
        }
      };
    });
  }

  async search(queryObj) {
    const isAvail = await this.isAvailable();
    if (!isAvail) return [];

    const q = typeof queryObj === 'string' ? queryObj : queryObj.query;
    const limit = (queryObj && queryObj.limit) || 5;
    if (!q) return [];

    const req = this._buildDifyRequest(q, limit);

    const callPromise = (async () => {
      const resp = await this._fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: req.body
      });

      if (!resp.ok) {
        throw new Error(`REST knowledge query failed with status: ${resp.status}`);
      }

      const json = await resp.json();
      return this._parseDifyResponse(json);
    })();

    const hits = await this.withTimeout(callPromise, this.timeoutMs).catch(() => []);
    return this.normalizeHits(hits);
  }
}

module.exports = {
  RestKnowledgeAdapter
};
