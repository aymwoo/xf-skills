# Skill Specification (Skill 规范标准)

版本：`1.0.0`  
适用范围：`skills/*` 下的所有 `SKILL.md` 文件。

---

## 1. 结构规范

每个 Skill 必须包含两个主要组成部分：
1. **YAML Front Matter**（必须位于文件最开头，以 `---` 包裹）
2. **Markdown 主体规范内容**（清晰描述目标、边界、输入输出、7 步流程与质量基准）

---

## 2. YAML Front Matter 字段定义

| 字段 | 类型 | 是否必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | 是 | 唯一全局标识符，格式 `<scope>.<skill-name>` | `it.programming` |
| `name` | `string` | 是 | 短横线命名名称 | `programming` |
| `display_name` | `string` | 是 | 中文显示名称 | `编程教学设计` |
| `description` | `string` | 推荐 | 技能简要描述与意图触发词（供 Agent 渐进式发现检索） | `面向中小学信息科技的编程教学设计...` |
| `version` | `string` | 是 | 语义化版本号 | `0.1.0` |
| `status` | `string` | 是 | 状态：`experimental` / `stable` / `deprecated` | `experimental` |
| `type` | `string` | 是 | 必须为 `teaching-skill` | `teaching-skill` |
| `subject` | `array` | 是 | 所属学科代码，如 `common`, `information-technology`, `technology-engineering` | `["information-technology"]` |
| `education_level` | `array` | 是 | 适用学段，如 `primary-school`, `middle-school`, `high-school` | `["high-school"]` |
| `language` | `array` | 是 | 支持语言，默认包含 `zh-CN` | `["zh-CN"]` |
| `depends_on` | `array` | 否 | 依赖的基础/上层 Skill ID 列表 | `["core.lesson-design"]` |
| `requires.knowledge` | `array` | 否 | 所需引用的外部知识库标识 | `["information-technology.curriculum"]` |
| `requires.templates` | `array` | 否 | 所需引用的输出模板标识 | `["lesson-plan"]` |
| `outputs` | `array` | 是 | 产物模板名称列表 | `["lesson-plan"]` |
| `tags` | `array` | 否 | 检索标签 | `["programming", "python"]` |

---

## 3. Markdown 正文标准章节

正文必须包含以下二级标题结构：

```markdown
# [中文显示名称] ([英文名称])

## 1. 技能概述 (Description & Purpose)
简明扼要说明本 Skill 的教育目标与核心功能。

## 2. 适用边界 (When to use / When NOT to use)
- **何时使用**：列举适用场景。
- **何时不使用**：列举不适用场景及推荐替代 Skill。

## 3. 输入与约束 (Inputs & Constraints)
- **输入参数**：课题、年级、课时、学生基础、实验环境等。
- **教学约束**：如时间分配、安全规范、认知负荷要求。

## 4. 标准执行工作流 (Workflow)
详细展开 7 步闭环过程：
1. Input
2. Context Analysis
3. Knowledge Retrieval
4. Planning
5. Generation
6. Validation
7. Output

## 5. 质量评估基准 (Quality Criteria)
列举该教学产物必须达到的教学法与学科素养标准。

## 6. 关联资源与产物 (Dependencies & Outputs)
说明调用的知识文件与输出模板。
```
