import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const {
  BaseKnowledgeAdapter,
  ImaKnowledgeAdapter,
  LocalKnowledgeAdapter,
  RestKnowledgeAdapter,
  KnowledgeProviderFactory,
  defaultFactory,
  searchKnowledge
} = require('../../scripts/shared/knowledge/index.cjs');

test('knowledge-connector: BaseKnowledgeAdapter enforces ID and normalizes hits', () => {
  assert.throws(() => new BaseKnowledgeAdapter(''), /must have an id/);

  const adapter = new BaseKnowledgeAdapter('test-adapter');
  assert.equal(adapter.id, 'test-adapter');

  const rawHits = [
    { title: 'Doc 1', content: 'Sample text' },
    { content: 'No title' }
  ];

  const normalized = adapter.normalizeHits(rawHits);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].title, 'Doc 1');
  assert.equal(normalized[0].score, 1.0);
  assert.equal(normalized[1].title, '未知来源');
});

test('knowledge-connector: ImaKnowledgeAdapter works with injected API', async () => {
  const mockImaApi = async (path, params) => {
    assert.equal(path, 'openapi/wiki/v1/search_knowledge');
    assert.equal(params.query, '递归');
    return JSON.stringify({
      data: {
        info_list: [
          { title: '信息科技必修1', snippet: '递归定义与基线条件', media_id: 'med-123' }
        ]
      }
    });
  };

  const adapter = new ImaKnowledgeAdapter('ima-test', {
    kbId: 'test-kb-id',
    imaApi: mockImaApi
  });

  const isAvail = await adapter.isAvailable();
  assert.equal(isAvail, true);

  const hits = await adapter.search({ query: '递归', limit: 2 });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].title, '信息科技必修1');
  assert.equal(hits[0].content, '递归定义与基线条件');
  assert.equal(hits[0].sourceType, 'ima');
  assert.equal(hits[0].metadata.mediaId, 'med-123');
});

test('knowledge-connector: LocalKnowledgeAdapter searches markdown files', async () => {
  const localDir = path.join(ROOT_DIR, 'knowledge/common/pedagogy');
  const adapter = new LocalKnowledgeAdapter('local-test', { localDir });

  const isAvail = await adapter.isAvailable();
  assert.equal(isAvail, true);

  const hits = await adapter.search({ query: '布鲁姆', limit: 3 });
  assert.ok(hits.length > 0, 'Should find hits in common pedagogy markdown');
  assert.equal(hits[0].sourceType, 'local');
  assert.ok(hits[0].content.includes('布鲁姆') || hits[0].title.includes('bloom'));
});

test('knowledge-connector: LocalKnowledgeAdapter handles non-existent dir gracefully', async () => {
  const adapter = new LocalKnowledgeAdapter('local-empty', { localDir: '/non/existent/path/123' });
  const isAvail = await adapter.isAvailable();
  assert.equal(isAvail, false);

  const hits = await adapter.search('测试');
  assert.deepEqual(hits, []);
});

test('knowledge-connector: RestKnowledgeAdapter parses Dify response with injected fetch', async () => {
  const mockFetch = async (url, options) => {
    assert.ok(url.includes('datasets/ds-test/retrieve'));
    assert.equal(options.method, 'POST');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        records: [
          {
            title: '校本教案切片',
            content: '二分查找必须在有序序列中执行',
            score: 0.95,
            segment: { id: 'seg-1' }
          }
        ]
      })
    };
  };

  const adapter = new RestKnowledgeAdapter('rest-test', {
    endpoint: 'https://api.dify.ai/v1',
    apiKey: 'test-key',
    datasetId: 'ds-test',
    fetchFn: mockFetch
  });

  const isAvail = await adapter.isAvailable();
  assert.equal(isAvail, true);

  const hits = await adapter.search({ query: '二分查找', limit: 3 });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].title, '校本教案切片');
  assert.equal(hits[0].content, '二分查找必须在有序序列中执行');
  assert.equal(hits[0].sourceType, 'dify');
  assert.equal(hits[0].score, 0.95);
});

test('knowledge-connector: RestKnowledgeAdapter handles server 500 error gracefully', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'Internal Server Error' })
  });

  const adapter = new RestKnowledgeAdapter('rest-err', {
    endpoint: 'https://api.dify.ai/v1',
    fetchFn: mockFetch
  });

  const hits = await adapter.search('异常');
  assert.deepEqual(hits, []);
});

test('knowledge-connector: KnowledgeProviderFactory creates and cascades providers', async () => {
  const factory = new KnowledgeProviderFactory();

  const mockFailAdapter = {
    type: 'fail',
    isAvailable: async () => true,
    search: async () => { throw new Error('Primary source network down'); }
  };

  const mockBackupAdapter = {
    type: 'backup',
    isAvailable: async () => true,
    search: async () => [
      { title: '备用校本库', content: '本地安全降级内容', sourceType: 'local', score: 1.0, metadata: {} }
    ]
  };

  factory.buildCascadeChain = () => [mockFailAdapter, mockBackupAdapter];

  const hits = await factory.searchCascade({ query: '降级测试' });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].title, '备用校本库');
  assert.equal(hits[0].content, '本地安全降级内容');
});

test('knowledge-connector: searchKnowledge facade runs without throwing', async () => {
  // Test searchKnowledge helper function with default factory
  const hits = await searchKnowledge('测试查询', { provider: 'local' });
  assert.ok(Array.isArray(hits));
});
