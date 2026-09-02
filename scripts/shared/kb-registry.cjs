'use strict';

/**
 * scripts/shared/kb-registry.cjs
 * -----------------------------------------------------------
 * 高中 TE / IT 教学 Skill 共享的 IMA 知识库注册表加载器。
 *
 * 加载优先级（从高到低）：
 *   1. 调用方在 options.kbIdOverrides 中显式传入的覆盖（env var 派生）
 *   2. KB_REGISTRY_PATH 环境变量指向的自定义注册表文件
 *   3. examples/kb.registry.json 仓库内默认注册表
 *   4. 硬编码 fallback（仅在所有文件加载失败时启用，且 stderr 警告）
 *
 * 所有 Skill 脚本应通过本工具加载 KB 注册，禁止在 Skill 内部硬编码 KB ID。
 */

const fs = require('fs');
const path = require('path');

/**
 * 默认 fallback：当注册表文件不可用时使用的最小 ID 集合。
 * 仅用于"在没有仓库也没有自定义注册表的极端场景"下保证脚本不崩溃。
 * 任何真实的部署都应通过 KB_REGISTRY_PATH 提供有效注册表。
 */
const FALLBACK_KB_CONFIG = {
  gt: {
    id: 'aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=',
    name: '技术与工程教学'
  },
  it: {
    id: '72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=',
    name: '信息科技教学'
  }
};

/**
 * 定位仓库内默认注册表文件路径。
 * 脚本位于 scripts/shared/kb-registry.cjs，仓库默认注册表位于 examples/kb.registry.json，
 * 因此相对路径为 ../../examples/kb.registry.json。
 */
function getDefaultRegistryPath() {
  return path.resolve(__dirname, '../../examples/kb.registry.json');
}

/**
 * 校验注册表对象的最小结构合法性。
 * 抛出 Error 而不是静默通过，避免 KB ID 拼写错误悄悄溜进生产。
 */
function validateRegistryShape(registry) {
  if (!registry || typeof registry !== 'object') {
    throw new Error('KB registry must be a JSON object');
  }
  if (!registry.knowledge_bases || typeof registry.knowledge_bases !== 'object') {
    throw new Error('KB registry must contain a "knowledge_bases" object');
  }
  for (const [key, kb] of Object.entries(registry.knowledge_bases)) {
    if (!kb || typeof kb !== 'object') {
      throw new Error(`KB registry: knowledge_bases.${key} must be an object`);
    }
    if (typeof kb.id !== 'string' || kb.id.length === 0) {
      throw new Error(`KB registry: knowledge_bases.${key}.id must be a non-empty string`);
    }
    if (typeof kb.name !== 'string' || kb.name.length === 0) {
      throw new Error(`KB registry: knowledge_bases.${key}.name must be a non-empty string`);
    }
  }
}

/**
 * 加载并返回 KB 注册表对象。
 *
 * @param {object} [options]
 * @param {string} [options.registryPath] - 自定义注册表路径；缺省则依次尝试
 *                                          KB_REGISTRY_PATH 环境变量 → 仓库默认
 * @param {boolean} [options.warnOnFallback=false] - 是否在回退到 FALLBACK 时打印 stderr 警告
 * @returns {object} 注册表对象，结构形如：
 *   {
 *     gt: { id, name, description?, textbook_count?, publishers? },
 *     it: { id, name, description?, textbook_count?, publishers? },
 *     ...
 *   }
 */
function loadKbRegistry(options = {}) {
  const candidates = [];

  if (options.registryPath) {
    candidates.push({ source: 'options.registryPath', path: options.registryPath });
  }
  if (process.env.KB_REGISTRY_PATH) {
    candidates.push({ source: 'KB_REGISTRY_PATH', path: process.env.KB_REGISTRY_PATH });
  }
  candidates.push({ source: 'default', path: getDefaultRegistryPath() });

  for (const cand of candidates) {
    if (!fs.existsSync(cand.path)) continue;
    try {
      const raw = fs.readFileSync(cand.path, 'utf8');
      const parsed = JSON.parse(raw);
      validateRegistryShape(parsed);
      parsed.__source = cand.path;
      return parsed;
    } catch (err) {
      if (options.warnOnFallback) {
        process.stderr.write(
          `[kb-registry] failed to load from ${cand.source} (${cand.path}): ${err.message}\n`
        );
      }
    }
  }

  if (options.warnOnFallback) {
    process.stderr.write(
      '[kb-registry] WARNING: no valid KB registry found, falling back to hardcoded IDs. ' +
      'Set KB_REGISTRY_PATH or ship examples/kb.registry.json.\n'
    );
  }
  return {
    knowledge_bases: { ...FALLBACK_KB_CONFIG },
    __fallback: true
  };
}

/**
 * 把注册表对象转换为脚本可消费的扁平 KB_CONFIG 形式。
 * 可选地应用 key → id 字段的 env 覆盖。
 *
 * @param {object} registry - loadKbRegistry() 的返回值
 * @param {object} [envOverrides] - { key: { idEnv?: string, localDirEnv?: string } }
 *   例如：{ gt: { idEnv: 'WOODPECKER_GT_KB_ID', localDirEnv: 'WOODPECKER_GT_LOCAL_DIR' } }
 * @returns {object} KB_CONFIG 形如：
 *   {
 *     gt: { id, name, localDir },
 *     it: { id, name, localDir }
 *   }
 */
function buildKbConfig(registry, envOverrides = {}) {
  const kbs = (registry && registry.knowledge_bases) || {};
  const config = {};

  for (const [key, kb] of Object.entries(kbs)) {
    const overrides = envOverrides[key] || {};
    const idFromEnv = overrides.idEnv ? process.env[overrides.idEnv] : undefined;
    const localDirFromEnv = overrides.localDirEnv ? process.env[overrides.localDirEnv] : undefined;

    config[key] = {
      id: (idFromEnv && idFromEnv.length > 0) ? idFromEnv : kb.id,
      name: kb.name,
      localDir: (localDirFromEnv && localDirFromEnv.length > 0) ? localDirFromEnv : null
    };
  }

  return config;
}

module.exports = {
  loadKbRegistry,
  buildKbConfig,
  validateRegistryShape,
  getDefaultRegistryPath,
  FALLBACK_KB_CONFIG
};