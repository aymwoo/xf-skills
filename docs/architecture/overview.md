# 架构总览 (Architecture Overview)

本文档系统介绍 **Teaching Skills Framework** 的总体架构设计、分层理念与核心交互机制。

---

## 1. 架构目标与定位

Teaching Skills Framework 旨在解决基础教育领域 AI 教学辅助的碎片化、不可复用和缺乏学科特异性等问题。

框架的核心架构目标：
1. **分层清晰**：区分能力（Skill）、知识（Knowledge）、格式（Template）和组装（Pack）。
2. **学科解耦**：Core 通用层提供纯教学法元能力，学科层继承并注入学科特色认知模型，未来多学科（数理化生语英等）可平滑扩充。
3. **平台中立**：以标准 Markdown + YAML 描述，AI Agent 既能作为 Prompt 链加载，也能由自动化 Runtime 解析执行。

---

## 2. 总体逻辑架构图

```
+-----------------------------------------------------------------------------+
|                                User / Agent Layer                           |
|       (K-12 Teachers, Curriculum Designers, Claude, Cursor, Antigravity)   |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                          Runtime / Orchestration Layer                      |
|  [SkillRegistry]  [SkillResolver]  [KnowledgeRetriever]  [PromptPipeline]   |
+-----------------------------------------------------------------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+--------------------+       +--------------------+       +-------------------+
|     Pack Layer     |       |    Template Layer  |       |  Knowledge Layer  |
| (packs/it/hs, ...) |       | (lesson-plan, ...) |       | (common, it, te)  |
+--------------------+       +--------------------+       +-------------------+
          |
          v
+-----------------------------------------------------------------------------+
|                                 Skill Layer                                 |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |                       Subject Specialized Layer                     |   |
|   |   (e.g., it.programming, it.algorithm, te.engineering-design, ...) |   |
|   +---------------------------------------------------------------------+   |
|                                      | depends_on                           |
|                                      v                                      |
|   +---------------------------------------------------------------------+   |
|   |                           Core Skills Layer                         |   |
|   |   (core.lesson-design, core.activity-design, core.rubric-design, ...) |   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
```

---

## 3. 六大核心抽象定义

| 抽象实体 | 物理目录 | 核心职责 | 举例 |
| :--- | :--- | :--- | :--- |
| **Skill (技能)** | `skills/` | 定义“做什么”：标准 7 步闭环教学工作流、输入输出约束与质量标准 | `core.lesson-design`, `it.programming` |
| **Knowledge (知识)** | `knowledge/` | 定义“知道什么”：课程标准、学科概念体系、教学策略与常见误区 | `bloom-taxonomy.md`, `curriculum-2022.md` |
| **Template (模板)** | `templates/` | 定义“输出成什么”：标准 Markdown 教学产物输出结构 | `lesson-plan.md`, `task-sheet.md` |
| **Pack (组合包)** | `packs/` | 定义“如何组合”：面向具体学段与学科的一组 Skill + Knowledge 集合 | `pack.it.high-school` |
| **Example (案例)** | `examples/` | 提供真实落地示范：输入参数、上下文、生成结果对照 | `python-sorting-algorithms` |
| **Runtime (运行时)** | `docs/` & `scripts/` | 提供执行、静态校验、依赖解析与生命周期调度规范 | `validator.js`, `SkillResolver` |

---

## 4. 依赖流向与分层原则

1. **单向依赖规则**：
   - Subject Skills 可以依赖 Core Skills（`it.programming -> core.lesson-design`）。
   - Core Skills **严禁**依赖任何 Subject Skills。
   - Skill 严禁循环依赖。
2. **知识外部化规则**：
   - Skill 内部只定义“如何调用知识”的检索指引，禁止直接硬编码教材章节或知识点细节。
3. **输出标准化规则**：
   - 所有 Skill 产生的产物必须严格符合 `templates/` 目录中约定的模板格式。
