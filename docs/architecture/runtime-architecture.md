# Runtime 架构设计 (Runtime Architecture)

本文档定义 Teaching Skills Framework 未来的执行引擎与生命周期管理架构。

> ⚠️ **说明**：当前阶段以规范、技能库和静态校验器为主。本设计为后续实现独立执行器（CLI / Agent SDK / 服务化运行时）提供统一的接口契约与分层规范。

---

## 1. Runtime 核心生命周期流

```
[教师输入 / Agent Request]
          │
          ▼
┌──────────────────┐
│   SkillRegistry  │ ── 发现并注册所有可用 Skills / Packs
└──────────────────┘
          │
          ▼
┌──────────────────┐
│   SkillResolver  │ ── 拓扑解析 depends_on 依赖图与加载顺序
└──────────────────┘
          │
          ▼
┌──────────────────────┐
│ KnowledgeRetriever   │ ── 根据 Skill.requires 检索并注入学科课标与认知模型
└──────────────────────┘
          │
          ▼
┌──────────────────┐
│  PromptPipeline  │ ── 组装结构化上下文、7步工作流与约束提示词
└──────────────────┘
          │
          ▼
┌──────────────────┐
│ OutputGenerator  │ ── 调用底层模型执行生成 (支持流式传输与重试)
└──────────────────┘
          │
          ▼
┌──────────────────┐
│    Validator     │ ── 校验输出是否符合 Template Schema 及质量基准
└──────────────────┘
          │
          ▼
[最终交付标准化教学产物]
```

---

## 2. 核心抽象组件与接口定义

### 2.1 注册与发现 (Discovery & Loading)

- **`SkillRegistry`**
  - `register(skill: SkillDefinition): void`
  - `get(id: string): SkillDefinition | undefined`
  - `list(filter?: SkillFilter): SkillDefinition[]`
- **`SkillLoader`**
  - `loadFromDirectory(dirPath: string): Promise<SkillDefinition[]>`
  - `parseFrontMatter(content: string): SkillMetadata`
- **`SkillResolver`**
  - `resolveDependencies(skillId: string): SkillDefinition[]` (拓扑排序，检测循环依赖)

### 2.2 知识检索与供给 (Knowledge Engine)

- **`KnowledgeProvider`**
  - `loadKnowledge(path: string): Promise<KnowledgeEntry>`
- **`KnowledgeRetriever`**
  - `retrieve(query: KnowledgeQuery): Promise<KnowledgeSlice[]>`

### 2.3 管道与生成 (Execution Pipeline)

- **`PromptPipeline`**
  - `buildPrompt(skill: SkillDefinition, context: ExecutionContext): CompiledPrompt`
- **`OutputGenerator`**
  - `generate(compiledPrompt: CompiledPrompt): Promise<GenerationResult>`
- **`Validator`**
  - `validateSkillSyntax(filePath: string): ValidationReport`
  - `validateOutputSchema(output: string, templateId: string): SchemaValidationResult`

### 2.4 扩展机制与生命周期钩子 (Hooks & Events)

- **`HookManager`**
  - `beforeSkillLoad`, `afterSkillResolved`, `beforePromptAssembly`, `afterGeneration`, `onValidationFail`
- **`EventBus`**
  - 提供异步事件通知：`skill:invoked`, `knowledge:retrieved`, `output:validated`
- **`CacheManager`**
  - 缓存解析后的 Skill 语法树与知识库切片，提升批量调用吞吐量
- **`RuntimeConfig`**
  - 全局配置：当前学段、地区课标版本、默认语言与严格校验模式

---

## 3. 设计原则

1. **零外部大模型锁定**：`OutputGenerator` 仅作为抽象驱动层，上层业务逻辑完全独立于任何特定 LLM API。
2. **渐进式演进**：第一阶段提供离线验证器与静态组装脚本，未来可无缝平移至 Node.js / Python SDK。
