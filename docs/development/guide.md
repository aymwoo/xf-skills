# Skill 开发与验证指南 (Skill Development & Validation Guide)

本指南系统指导开发者与骨干教师如何在 Teaching Skills Framework 中开发、测试并静态验证一个新的教学能力单元。

---

## 第一部分：开发一个 Skill (Create a Skill)

### 步骤 1：明确 Skill 的定位与边界
在编写文件前，请先明确以下核心要素：
1. **所属学科与分类**：属于 `core/`、`information-technology/`、`technology-engineering/`、`physics/` 还是未来的新学科？
2. **唯一标识符**：格式为 `<scope>.<skill-name>`，例如 `it.algorithm` 或 `core.rubric-design`。
3. **依赖关系**：优先复用已有的 Core Skill（如 `core.lesson-design`），避免重复造轮子。
4. **输出标准**：明确本 Skill 产出的教学物料类型，必须在 `templates/` 中已注册（如 `lesson-plan`, `task-sheet`）。

---

### 步骤 2：创建标准目录结构
在对应的学科目录下创建子目录：

```bash
mkdir -p skills/<subject>/<my-new-skill>/{examples,tests}
```

每个 Skill 目录标准包含：
- `SKILL.md` (主规范，包含 YAML Front Matter 和 7 步工作流)
- `README.md` (说明与快速指引)
- `examples/` (真实场景示例，至少 1 个 `.md` 样例)
- `tests/` (自动化测试夹具，至少 1 个 `.json` 测试配置)

---

### 步骤 3：编写 `SKILL.md`
1. 包含完整的 YAML Front Matter 声明：
```yaml
---
id: it.my-new-skill
name: my-new-skill
display_name: 我的新技能
description: 面向信息科技的教学设计技能...
version: 0.1.0
status: experimental
type: teaching-skill
subject:
  - information-technology
education_level:
  - high-school
language:
  - zh-CN
depends_on:
  - core.lesson-design
requires:
  knowledge:
    - information-technology.curriculum
  templates:
    - lesson-plan
outputs:
  - lesson-plan
tags:
  - my-tag
---
```

2. 编写 Markdown 正文，必须严密包含统一的 7 步闭环工作流：
   - 1. Input (输入解析)
   - 2. Context Analysis (学情与情境分析)
   - 3. Knowledge Retrieval (外部课标与教学法检索)
   - 4. Planning (教学主线与任务规划)
   - 5. Generation (内容与活动生成)
   - 6. Validation (素养对齐与自检)
   - 7. Output (标准化模板产出)

---

## 第二部分：验证 Skill (Validate a Skill)

Teaching Skills Framework 提供了严密的静态契约校验与自动化门禁，确保每一个 Skill、Knowledge、Template 和 Pack 合规。

### 1. 验证器校验维度
运行 `npm run validate` 时，验证器自动执行以下检查：
1. **文件存在性**：检查每个 Skill 目录下是否存在 `SKILL.md`。
2. **YAML Front Matter 合法性**：检查 Front Matter 是否能够正确解析为结构化对象。
3. **必需元数据字段**：检查 `id`, `name`, `display_name`, `version`, `type`, `subject`, `education_level`, `outputs` 是否齐全且类型匹配。
4. **全局 ID 唯一性**：检查所有 Skill ID 与 Pack ID 在全库唯一。
5. **依赖存在性**：检查 `depends_on` 声明的依赖 Skill ID 真实存在。
6. **循环依赖检测**：检测 `depends_on` 拓扑图中是否存在有向环。
7. **知识依赖有效性**：检查 `requires.knowledge` 声明的知识引用是否在 `knowledge/` 中有效。
8. **模板输出有效性**：检查 `outputs` 声明的产物模板在 `templates/` 中已注册。
9. **工作流完整性**：检查 `SKILL.md` 正文中是否包含标准的 7 步 Workflow 核心环节。
10. **资产完整性门禁**：每个 Skill 必须包含 `tests/` (.json) 与 `examples/` (.md) 目录与测试资产。

---

### 2. 常用验证与测试命令

```bash
# 1. 完整静态验证（Skill + Pack + Knowledge + Template）
npm run validate

# 2. 构建全库集中式元数据目录
npm run build:catalog

# 3. 运行全量自动化测试套件
npm test

# 4. 一键全流水线检查 (Validate + Catalog + Test)
npm run check
```

---

### 3. 常见报错与排错方案
- **`Missing required field: id`**：检查 `SKILL.md` Front Matter 中是否包含合法的 `id`。
- **`Duplicate Skill ID`**：Skill ID 全库冲突，需保持命名唯一。
- **`Unknown dependency in depends_on`**：引用的父 Skill 不存在，请修正依赖或先声明基础技能。
- **`every skill must have both tests/ and examples/ directories`**：确保技能子目录下存在 `tests/*.json` 与 `examples/*.md`。
