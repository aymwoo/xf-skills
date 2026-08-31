# 如何开发一个 Skill (Create a Skill)

本指南指导开发者与骨干教师如何在 Teaching Skills Framework 中开发并集成一个新的教学能力单元。

---

## 步骤 1：明确 Skill 的定位与边界

在动手编写文件前，请先明确以下问题：
1. **所属学科与分类**：属于 `core/`、`information-technology/`、`technology-engineering/` 还是未来的新学科？
2. **唯一标识符**：格式为 `<scope>.<skill-name>`，例如 `it.algorithm` 或 `core.rubric-design`。
3. **依赖关系**：是否可以复用已有的 Core Skill（如 `core.lesson-design`）？避免重复实现通用逻辑。
4. **输出标准**：本 Skill 输出何种教学产物？是否已在 `templates/` 中定义？

---

## 步骤 2：创建标准目录结构

在对应的学科目录下创建子目录：

```bash
mkdir -p skills/information-technology/my-new-skill/{examples,tests}
```

目录包含 4 个核心文件：
- `SKILL.md` (主规范)
- `README.md` (说明与快速指引)
- `examples/example-1.md` (真实案例)
- `tests/test-1.json` (测试输入与预期验证)

---

## 步骤 3：编写 `SKILL.md`

1. 包含完整的 YAML Front Matter：
```yaml
---
id: it.my-new-skill
name: my-new-skill
display_name: 我的新技能
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

2. 编写 Markdown 正文，必须完整包含 7 步闭环工作流：
   - 1. Input
   - 2. Context Analysis
   - 3. Knowledge Retrieval
   - 4. Planning
   - 5. Generation
   - 6. Validation
   - 7. Output

---

## 步骤 4：编写示例与测试

- 在 `examples/` 目录下提供一个真实备课场景的输入与产出范例。
- 在 `tests/` 目录下编写测试用例配置（包含样例输入与期望包含的关键词/维度）。

---

## 步骤 5：运行验证

运行框架校验命令：

```bash
npm run validate
```

如果校验器输出 `Validation Passed: All skills and packs are valid!`，则说明定义完全合规。
