'use strict';

/**
 * scripts/shared/knowledge/index.cjs
 * -----------------------------------------------------------
 * Teaching Skills Framework - 统一知识连接器门面 (Knowledge Provider SPI Facade)
 */

const { BaseKnowledgeAdapter } = require('./base-adapter.cjs');
const { ImaKnowledgeAdapter } = require('./adapters/ima-adapter.cjs');
const { LocalKnowledgeAdapter } = require('./adapters/local-adapter.cjs');
const { RestKnowledgeAdapter } = require('./adapters/rest-adapter.cjs');
const { KnowledgeProviderFactory, defaultFactory } = require('./provider-factory.cjs');

/**
 * 便捷级联检索助手函数
 * @param {import('./types').KnowledgeQuery|string} query
 * @param {Object} [options]
 * @returns {Promise<import('./types').KnowledgeHit[]>}
 */
async function searchKnowledge(query, options = {}) {
  const queryObj = typeof query === 'string' ? { query } : query;
  return defaultFactory.searchCascade(queryObj, options);
}

module.exports = {
  BaseKnowledgeAdapter,
  ImaKnowledgeAdapter,
  LocalKnowledgeAdapter,
  RestKnowledgeAdapter,
  KnowledgeProviderFactory,
  defaultFactory,
  searchKnowledge
};
