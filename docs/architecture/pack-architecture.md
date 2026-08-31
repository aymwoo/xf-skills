# Pack 架构 (Pack Architecture)

Pack（组合包）是面向真实教学场景（如“高中信息科技新教师备课”、“高中技术与工程项目设计”）而组装的一组 Skill、Knowledge 与 Template 的集合。

---

## 1. 为什么需要 Pack？

单个 Skill（如 `it.programming`）提供了单一教学能力，但教师在准备一个完整教学单元或学期课程时，往往需要综合调用多个技能（教学设计、活动设计、评价量规、项目学习）以及匹配的课标知识与模板。

Pack 提供了**一站式打包交付与分发方案**。

---

## 2. Pack 目录结构

```text
packs/
├── information-technology/
│   └── high-school/
│       ├── pack.yaml                     # Pack 核心清单声明
│       └── README.md                     # Pack 教学场景与调用指南
│
└── technology-engineering/
    └── high-school/
        ├── pack.yaml
        └── README.md
```

---

## 3. `pack.yaml` 规格定义

每个 Pack 的根目录下必须包含一个标准 `pack.yaml` 文件：

```yaml
---
id: pack.it.high-school
name: high-school-information-technology
display_name: 高中信息科技教学 Skill Pack
version: 0.1.0
description: 专为普通高中信息科技教师打造的完整教学能力包，涵盖编程、算法、AI、数据与计算思维培养。

subject:
  - information-technology

education_level:
  - high-school

skills:
  - core.lesson-design
  - core.activity-design
  - core.assessment-design
  - core.rubric-design
  - it.programming
  - it.algorithm
  - it.data
  - it.artificial-intelligence
  - it.computational-thinking
  - it.project-learning

knowledge:
  - common.pedagogy.bloom-taxonomy
  - information-technology.curriculum
  - information-technology.discipline
  - information-technology.pedagogy

templates:
  - lesson-plan
  - teaching-script
  - task-sheet
  - assessment
  - project
  - presentation
---
```

---

## 4. Pack 的解析与组合规则

1. **完整性校验**：Pack 中声明的所有 Skill ID、Knowledge 引用和 Template 名称必须在仓库中完全存在且校验合法。
2. **依赖闭包**：Pack 中声明的 Skills 必须能够自包含其所有 `depends_on` 依赖项（或自动解析补齐）。
3. **分发打包**：未来 Runtime 支持将单一 Pack 打包导出为便携的 Agent 配置文件或单文件 Context。
