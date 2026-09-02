'use strict';

/**
 * scripts/shared/knowledge/provider-factory.cjs
 * -----------------------------------------------------------
 * 知识库适配器工厂与级联调度中枢 (KnowledgeProviderFactory)
 * 管理适配器生命周期，提供多源并发与故障自动降级阶梯 (Cascade Fallback)。
 */

const { ImaKnowledgeAdapter } = require('./adapters/ima-adapter.cjs');
const { LocalKnowledgeAdapter } = require('./adapters/local-adapter.cjs');
const { RestKnowledgeAdapter } = require('./adapters/rest-adapter.cjs');

class KnowledgeProviderFactory {
  constructor() {
    this._adapterClasses = new Map();
    this.register('ima', ImaKnowledgeAdapter);
    this.register('local', LocalKnowledgeAdapter);
    this.register('rest', RestKnowledgeAdapter);
    this.register('dify', RestKnowledgeAdapter);
  }

  /**
   * 注册自定义适配器类
   * @param {string} type
   * @param {typeof import('./base-adapter').BaseKnowledgeAdapter} AdapterClass
   */
  register(type, AdapterClass) {
    this._adapterClasses.set(type.toLowerCase(), AdapterClass);
  }

  /**
   * 实例化指定类型的适配器
   * @param {string} type
   * @param {string} [id]
   * @param {Object} [options]
   * @returns {import('./base-adapter').BaseKnowledgeAdapter}
   */
  create(type, id, options = {}) {
    const normType = (type || 'ima').toLowerCase();
    const AdapterCls = this._adapterClasses.get(normType);
    if (!AdapterCls) {
      throw new Error(`Unknown knowledge provider type: '${type}'`);
    }
    const instId = id || `${normType}-inst`;
    return new AdapterCls(instId, options);
  }

  /**
   * 构建默认的级联适配器执行链
   * 顺序：指定的优先 Provider ➔ IMA 官方教材库 ➔ 本地校本/离线目录
   * @param {Object} [options]
   * @returns {Array<import('./base-adapter').BaseKnowledgeAdapter>}
   */
  buildCascadeChain(options = {}) {
    const path = require('path');
    const chain = [];
    const requested = options.provider || process.env.KNOWLEDGE_PROVIDER;
    const defaultLocalDir = options.localDir || process.env.LOCAL_KNOWLEDGE_DIR || path.resolve(__dirname, '../../../knowledge');

    if (requested && requested !== 'auto') {
      try {
        const opts = requested === 'local' && !options.localDir ? { ...options, localDir: defaultLocalDir } : options;
        chain.push(this.create(requested, `${requested}-primary`, opts));
      } catch (e) {
        // ignore
      }
    }

    // 默认链条：IMA (云端教材) -> Local (本地目录兜底)
    if (!chain.some(a => a.type === 'ima')) {
      chain.push(this.create('ima', 'ima-cascade', options));
    }
    if (!chain.some(a => a.type === 'local')) {
      chain.push(this.create('local', 'local-cascade', { ...options, localDir: defaultLocalDir }));
    }

    return chain;
  }

  /**
   * 执行级联多源检索
   * 优先尝试主源，主源无结果或异常时顺次降级，保障教学流程不中断
   * @param {import('./types').KnowledgeQuery} query
   * @param {Object} [options]
   * @returns {Promise<import('./types').KnowledgeHit[]>}
   */
  async searchCascade(query, options = {}) {
    const chain = this.buildCascadeChain(options);
    const limit = (query && query.limit) || 5;

    for (const adapter of chain) {
      try {
        const isAvail = await adapter.isAvailable();
        if (!isAvail) continue;

        const hits = await adapter.search(query);
        if (Array.isArray(hits) && hits.length > 0) {
          return hits.slice(0, limit);
        }
      } catch (err) {
        // 当前源异常，记录并无缝平移到下一级兜底源
        continue;
      }
    }

    return [];
  }
}

const defaultFactory = new KnowledgeProviderFactory();

module.exports = {
  KnowledgeProviderFactory,
  defaultFactory
};
