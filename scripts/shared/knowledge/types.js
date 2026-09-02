/**
 * @fileoverview
 * scripts/shared/knowledge/types.js
 * -----------------------------------------------------------
 * 统一知识服务提供者接口（Knowledge Provider SPI）数据类型契约。
 * 纯 JSDoc 规范定义，无需编译，原生兼容 ESM 与 CommonJS。
 */

/**
 * 知识检索查询请求对象
 * @typedef {Object} KnowledgeQuery
 * @property {string} query - 核心检索词或学生问题
 * @property {('it'|'te'|'physics'|'math'|'common'|string)} [subject] - 所属学科
 * @property {string} [stage] - 教学环节 (如 predict, investigate, modify, 1, 2, 3)
 * @property {number} [limit=5] - 最大返回条数
 * @property {number} [minScore=0.0] - 最低相关度阈值
 * @property {Record<string, any>} [options] - 适配器专有扩展参数
 */

/**
 * 知识检索命中结果切片
 * @typedef {Object} KnowledgeHit
 * @property {string} title - 来源文档/教材名称 (如《信息技术必修1 数据与计算》)
 * @property {string} content - 核心段落、概念解析或代码片段
 * @property {('ima'|'local'|'rest'|'dify'|'feishu'|'mcp'|string)} sourceType - 知识提供源类型
 * @property {string} [sourceUrl] - 在线原文链接或本地文件路径
 * @property {number} [score] - 匹配置信度或分数
 * @property {Record<string, any>} [metadata] - 扩展元数据 (如 mediaId, pageNumber, chapter)
 */

/**
 * 知识服务提供者通用配置
 * @typedef {Object} KnowledgeProviderConfig
 * @property {string} id - 连接器唯一标识
 * @property {('ima'|'local'|'rest'|'dify'|'feishu'|'mcp')} type - 适配器类型
 * @property {string} [description] - 连接器用途说明
 * @property {Record<string, any>} [options] - 适配器初始化配置
 */

module.exports = {};
