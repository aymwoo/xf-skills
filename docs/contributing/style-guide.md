# 风格指南 (Style Guide)

本文档规定 Teaching Skills Framework 中代码、YAML 元数据与 Markdown 文档的书写风格。

---

## 1. 命名规范

- **Skill 目录名**：全小写短横线命名 (kebab-case)，如 `skills/core/lesson-design/`
- **Skill ID**：`<scope>.<skill-name>`，如 `core.lesson-design`, `it.programming`, `te.engineering-design`
- **Knowledge 目录名**：全小写短横线命名，如 `knowledge/common/pedagogy/`
- **Template 标识**：全小写短横线命名，如 `lesson-plan`, `task-sheet`
- **Pack ID**：`pack.<subject-short>.<level>`，如 `pack.it.high-school`

---

## 2. YAML Front Matter 规范

- 缩进使用 2 个空格，严禁使用 Tab。
- 列表字段一律显式声明为数组（如 `subject: ["information-technology"]` 或 `- information-technology`）。
- 状态字段目前允许：`experimental`（试验性）、`stable`（稳定可用）、`deprecated`（已废弃）。

---

## 3. Markdown 正文规范

- 二级标题采用统一序号与英文双语对照，如 `## 1. 技能概述 (Description & Purpose)`。
- 流程图优先使用 GitHub 支持的原生 Mermaid 语法。
- 教学术语优先采用国家课程标准权威表述（如“计算思维”、“技术意识”、“工程思维”、“图样表达”、“物化能力”等）。
