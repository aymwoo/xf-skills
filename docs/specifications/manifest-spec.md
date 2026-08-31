# Manifest Specification (清单与元数据规范)

版本：`1.0.0`

本文档定义框架生成的集中式清单 `catalog.json` 以及组合包清单 `pack.yaml` 的标准模式（Schema）。

---

## 1. `pack.yaml` 清单规范

每个组合包必须包含根目录下的 `pack.yaml`，其字段定义如下：

```yaml
id: pack.<subject-short>.<level>   # 例如 pack.it.high-school
name: string                      # 短横线命名
display_name: string              # 中文名称
version: string                   # 语义化版本号
description: string               # 组合包描述
subject: string[]                 # 关联学科
education_level: string[]         # 适用学段
skills: string[]                  # 包含的所有 Skill ID 列表
knowledge: string[]               # 包含的所有 Knowledge 路径/标识
templates: string[]               # 包含的所有 Template 标识
```

---

## 2. 集中式目录清单 (`catalog.json`) 模式

通过运行 `npm run build:catalog` 自动聚合整个框架的所有资源，输出格式如下：

```json
{
  "version": "0.1.0",
  "generated_at": "2026-08-31T00:00:00.000Z",
  "skills_count": 18,
  "packs_count": 2,
  "skills": [
    {
      "id": "it.programming",
      "name": "programming",
      "display_name": "编程教学设计",
      "version": "0.1.0",
      "path": "skills/information-technology/programming/SKILL.md",
      "subject": ["information-technology"],
      "education_level": ["high-school"],
      "depends_on": ["core.lesson-design", "core.activity-design"],
      "outputs": ["lesson-plan", "task-sheet"]
    }
  ],
  "packs": [
    {
      "id": "pack.it.high-school",
      "name": "high-school-information-technology",
      "path": "packs/information-technology/high-school/pack.yaml"
    }
  ],
  "templates": ["lesson-plan", "task-sheet", "assessment", "teaching-script", "project", "presentation"],
  "knowledge_modules": [
    "common.pedagogy.bloom-taxonomy",
    "information-technology.curriculum",
    "technology-engineering.curriculum"
  ]
}
```
