'use strict';

/**
 * scripts/shared/knowledge/base-adapter.cjs
 * -----------------------------------------------------------
 * 知识库适配器抽象基类 (BaseKnowledgeAdapter)
 * 定义所有在线与离线连接器的标准生命周期与操作契约。
 */

class BaseKnowledgeAdapter {
  /**
   * @param {string} id - 适配器实例标识符
   * @param {Object} [options] - 适配器配置项
   * @param {number} [options.timeoutMs=8000] - 检索超时时间(毫秒)
   */
  constructor(id, options = {}) {
    if (!id) {
      throw new Error('Knowledge adapter must have an id');
    }
    this.id = id;
    this.type = 'base';
    this.options = options;
    this.timeoutMs = options.timeoutMs || 8000;
  }

  /**
   * 检查当前适配器在当前环境下是否可用（凭证是否就绪、环境是否连通）
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true;
  }

  /**
   * 执行知识检索核心操作
   * @param {import('./types').KnowledgeQuery} query
   * @returns {Promise<import('./types').KnowledgeHit[]>}
   */
  async search(query) {
    throw new Error(`search() method must be implemented by adapter '${this.id}'`);
  }

  /**
   * 超时包装工具方法
   * @protected
   * @template T
   * @param {Promise<T>} promise
   * @param {number} [ms]
   * @returns {Promise<T>}
   */
  async withTimeout(promise, ms = this.timeoutMs) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Knowledge adapter [${this.id}] operation timed out after ${ms}ms`));
      }, ms);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutHandle);
      return result;
    } catch (err) {
      clearTimeout(timeoutHandle);
      throw err;
    }
  }

  /**
   * 规范化输出结果切片，确保数据结构严密符合 KnowledgeHit 契约
   * @protected
   * @param {Array<Partial<import('./types').KnowledgeHit>>} hits
   * @returns {import('./types').KnowledgeHit[]}
   */
  normalizeHits(hits = []) {
    if (!Array.isArray(hits)) return [];
    return hits.map(h => ({
      title: h.title || '未知来源',
      content: h.content || '',
      sourceType: h.sourceType || this.type,
      sourceUrl: h.sourceUrl || null,
      score: typeof h.score === 'number' ? h.score : 1.0,
      metadata: h.metadata || {}
    }));
  }
}

module.exports = {
  BaseKnowledgeAdapter
};
