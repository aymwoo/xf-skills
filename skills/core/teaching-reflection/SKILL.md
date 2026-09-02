---
id: core.teaching-reflection
name: teaching-reflection
display_name: 教学反思与改进
description: |
  基于教学实证数据的课后反思与教案再迭代技能。
  围绕教学目标达成度、生成性问题、意外状况与学生反馈，提供多维度归因分析及针对性教案改进策略。
  触发词：教学反思、课后反思、评课反思、教案复盘、教学诊改、改进建议。
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
    - common.pedagogy.bloom-taxonomy
  templates:
    - lesson-plan

depends_on: []

outputs:
  - lesson-plan

tags:
  - reflection
  - professional-development
  - action-research
---

# 教学反思与改进 (Teaching Reflection)

## 1. 技能概述 (Description & Purpose)
本技能辅助教师在课堂授课后，依据课堂实际生成数据、学生互动表现、预设与生成的偏差进行深度复盘，提炼成功经验，诊断失误原因，并生成具体的迭代重构方案。

## 2. 适用边界 (When to use / When NOT to use)
- **何时使用**：
  - 授课结束后进行课后札记记录与磨课教研时。
  - 公开课或比赛课后的自我诊断与答辩准备时。
- **何时不使用**：
  - 课前进行全新教学方案起草时（请使用 `core.lesson-design`）。

## 3. 输入与约束 (Inputs & Constraints)
- **输入参数**：
  - `original_lesson_plan`: 原教学设计概要
  - `classroom_observations`: 课堂真实生成情况（如时间超时、某个提问冷场、实验成功率低）
  - `student_assessment_results`: 课后小测或任务单反馈数据
- **教学约束**：
  - 反思必须深入到“学生认知机制”与“教学支架有效性”，严禁停留在“课堂纪律好不好”等浅层表面。
  - 必须给出下一轮教学的“可落地改进动作清单”。

## 4. 标准执行工作流 (Workflow)

```mermaid
graph TD
    Input[1. Input: 输入原教案与课后观察数据] --> Context[2. Context Analysis: 对比预设目标与实际达成度差距]
    Context --> Knowledge[3. Knowledge Retrieval: 检索教学反思模型 (Gibbs 反思环/Korthagen)]
    Knowledge --> Planning[4. Planning: 定位核心失误归因与教学闪光点]
    Planning --> Generation[5. Generation: 生成教学反思札记与迭代改进行动项]
    Generation --> Validation[6. Validation: 校验改进方案的针对性与操作可行性]
    Validation --> Output[7. Output: 输出结构化课后反思报告]
```

### 环节详解：
1. **Input**：导入原教案关键目标及课后收集到的关键事件与数据。
2. **Context Analysis**：分析目标达成率偏差，识别哪些环节学生出现了非预期的困惑或卡点。
3. **Knowledge Retrieval**：调取吉布斯反思循环（Gibbs Reflective Cycle）。
4. **Planning**：从教学目标设定、支架铺设、时间管理、师生对话四个维度梳理归因。
5. **Generation**：输出反思文本，重点阐述“如果重新教这节课，我将如何调整”。
6. **Validation**：检查提出的调整建议是否具体可测。
7. **Output**：输出结构化教学反思与再设计附录。

## 5. 质量评估基准 (Quality Criteria)
- [ ] **深度归因**：从教师单向讲授视角转向学生学习证据视角。
- [ ] **行动导向**：提供明确的二次教学调整策略（如调整引入情境、降低第一步门槛）。

## 6. 关联资源与产物 (Dependencies & Outputs)
- **关联模板**：`templates/lesson-plan/lesson-plan.md`
- **关联知识**：`knowledge/common/pedagogy/bloom-taxonomy.md`
