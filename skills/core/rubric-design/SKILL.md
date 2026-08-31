---
id: core.rubric-design
name: rubric-design
display_name: 评价量规设计
version: 0.1.0
status: experimental
type: teaching-skill

subject:
  - common

education_level:
  - primary-school
  - middle-school
  - high-school

language:
  - zh-CN

requires:
  knowledge:
    - common.assessment.formative-summative-models
  templates:
    - assessment

depends_on: []

outputs:
  - assessment

tags:
  - rubric
  - grading-criteria
  - authentic-assessment
---

# 评价量规设计 (Rubric Design)

## 1. 技能概述 (Description & Purpose)
本技能负责为开放式作业、实验操作、口头展示、项目成果等表现性任务设计多维度、分等级的分项评价量规（Analytic Rubric），明确各等级的行为表现特征。

## 2. 适用边界 (When to use / When NOT to use)
- **何时使用**：
  - 需要评估学生的小组海报、设计方案、实物作品、演讲展示或综合实验报告时。
  - 需要引导学生进行自评与同伴互评（Peer Assessment）时。
- **何时不使用**：
  - 纯单选/多选/判断等客观试卷判分时。

## 3. 输入与约束 (Inputs & Constraints)
- **输入参数**：
  - `task_description`: 表现性任务名称与要求
  - `evaluation_dimensions`: 评估维度（如创新性、功能性、团队协作、表达规范）
  - `levels_count`: 划分等级数（通常为 3 级或 4 级：优秀、良好、合格、待改进）
- **教学约束**：
  - 各层级的描述必须基于“可观察的行为事实”，避免主观模糊词（如“非常好”、“差”）。
  - 必须对学生公开透明，作为学习支架引导学生反思作品质量。

## 4. 标准执行工作流 (Workflow)

```mermaid
graph TD
    Input[1. Input: 解析任务与评价维度] --> Context[2. Context Analysis: 识别高水平与低水平典型差异]
    Context --> Knowledge[3. Knowledge Retrieval: 检索量规构建理论与素养水平划分]
    Knowledge --> Planning[4. Planning: 确立维度权重与等级标尺 (Levels)]
    Planning --> Generation[5. Generation: 生成各维度各等级的具体行为指标描述]
    Generation --> Validation[6. Validation: 校验等级梯度的连续性与可观察性]
    Validation --> Output[7. Output: 按照表格格式输出标准评价量规]
```

### 环节详解：
1. **Input**：确定评价任务与核心观察维度。
2. **Context Analysis**：提炼优秀作品与平庸作品的关键特征对比。
3. **Knowledge Retrieval**：调取表现性评价量规设计规范。
4. **Planning**：确定 3-4 个评估维度及每个维度的分值权重。
5. **Generation**：为每个单元格编写详尽的水平描述语（Descriptor）。
6. **Validation**：检查相邻等级之间是否有明确区分度，消除歧义。
7. **Output**：注入 `templates/assessment/assessment-design.md` 输出量规表格。

## 5. 质量评估基准 (Quality Criteria)
- [ ] **行为化描述**：所有层级指标均指称具体动作或成果表现。
- [ ] **正向引导**：低等级描述指明改进空间，而非单纯惩罚性否定。
- [ ] **易用性**：教师或学生能在 3 分钟内完成单份作品的打分与定级。

## 6. 关联资源与产物 (Dependencies & Outputs)
- **关联模板**：`templates/assessment/assessment-design.md`
- **关联知识**：`knowledge/common/assessment/formative-summative-models.md`
