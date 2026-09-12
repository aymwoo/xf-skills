---
id: xf-skills
name: xf-skills
display_name: K-12 基础教育 AI 教学技能全套库
description: 面向中小学基础教育（高中信息科技、通用技术、物理探究及通用教学法）的模块化、多版本教材对比与可组合 AI 教学技能框架。
version: 0.8.1
status: stable
type: teaching-skill
subject:
  - common
  - information-technology
  - technology-engineering
  - physics
education_level:
  - primary-school
  - middle-school
  - high-school
language:
  - zh-CN
outputs:
  - lesson-plan
  - task-sheet
  - assessment
  - teaching-script
  - project
  - presentation
tags:
  - teaching-skills
  - k12-education
  - information-technology
  - technology-engineering
  - physics
  - lesson-plan
---

# K-12 基础教育 AI 教学技能全套库 (Teaching Skills Framework)

## 1. 技能概述 (Description & Purpose)

本技能库是面向基础教育一线教师、教研员与 AI Agent 的全套教学能力与知识增强引擎。
库内收录 24 项高标准闭环教学技能，涵盖：
1. **通用教学法核心技能 (Core)**：教学设计 (`core.lesson-design`)、活动设计、评价量规、分层任务单、学案剧本等。
2. **信息科技学科技能 (Information Technology)**：多版本教材横向对比与教学设计二次创生 (`it.multi-version-teaching-designer`)、PRIMM 编程调试助教 (`it.primm-debugger`)、啄木鸟教案合规审计 (`it.woodpecker-auditor`)、算法、数据与人工智能。
3. **技术与工程学科技能 (Technology & Engineering)**：图尔敏论证式工程助教 (`te.toulmin-assistant`)、结构设计与试验迭代、物化原型制作等。
4. **数字化物理实验技能 (Physics)**：DIS 传感器毫秒级数据采集拟合与探究反思 (`physics.experiment-inquiry`)。

---

## 2. 适用边界 (When to use / When NOT to use)

- **何时使用**：
  - 教师进行新课备课、公开课打磨、跨版本教材对比、设计项目式学习（PBL）任务单。
  - 需要根据课标、核心素养与教材真实内容生成高确定性、无幻觉的专业教学物料。
  - 引导学生在编程排错（PRIMM）或工程设计（图尔敏论证）中自主思辨，拒绝代码代写与答案代包。
- **何时不使用**：
  - 纯应试刷题与标准答案机械抄袭。
  - 超出基础教育（小学、初中、高中）学段的高等专业教育场景。

---

## 3. 输入与约束 (Inputs & Constraints)

- **核心输入参数**：
  - `topic`：课程主题或探究项目（例如：Python 冒泡排序、闭环温控系统、牛顿第二定律验证）。
  - `grade_level`：学段年级（小学、初中、高一、高二、高三）。
  - `subject`：学科方向（信息科技、通用技术/技术与工程、物理、通用）。
  - `textbook_edition`：（可选）教材版本（粤教版、人教版、地质版、苏科版、浙教版等）。
- **教学约束**：
  - 严格落实学科核心素养对齐与认知阶梯递进。
  - 严格遵守认知摩擦与防代劳红线。

---

## 4. 标准执行工作流 (Standard 7-Step Workflow)

1. **Input (需求解析)**：结构化解析教师输入的课题、课时、学生基础与教材版本。
2. **Context Analysis (学情研判)**：分析该年龄段学生的先验概念、前概念误区及认知负荷承受度。
3. **Knowledge Retrieval (知识检索)**：检索关联学科课程标准（2017版/2022版）与真实教材知识库。
4. **Planning (教学规划)**：构建驱动性任务链、问题层级与支架脚手架。
5. **Generation (内容生成)**：生成细化的教学活动流程、师生对话、实验指导或任务单。
6. **Validation (质量质检)**：依据五大素养维度与防套话红线进行自我合规检验。
7. **Output (标准交付)**：按框架标准 Template 规范输出结构化 Markdown 交付物。

---

## 5. 质量评估基准 (Quality Criteria)

- **素养显性化**：每个教学活动必须对应具体核心素养维度（如计算思维、工程思维、科学探究）。
- **支架确定性**：提供脚手架而非直接给出终局产物，保持合理的探究留白。
- **格式规范性**：产物结构严谨，标题层级严密，支持多平台无缝渲染与打印。

---

## 6. 关联资源与产物 (Dependencies & Outputs)

- **输出模板支持**：`lesson-plan` (教学设计), `task-sheet` (任务单), `assessment` (量规评价), `teaching-script` (教学剧本), `project` (项目方案)。
- **外部知识模块**：课标知识库、教材版本对比库、评价模型库。
