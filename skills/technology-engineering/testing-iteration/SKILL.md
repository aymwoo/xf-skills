---
id: te.testing-iteration
name: testing-iteration
display_name: 试验测试与迭代优化
description: |
  工程破坏性与功能性技术试验测试与闭环迭代教学设计技能。
  指导学生设计科学的技术试验方案（承重测试、稳定性测试、环境适应性测试），建立测试台账，依据失效模式（FMEA）驱动方案改进。
  触发词：技术试验、试验测试、迭代优化、破坏性试验、测试台账、失效分析。
version: 0.1.0
status: experimental
type: teaching-skill

subject:
  - technology-engineering

education_level:
  - middle-school
  - high-school

language:
  - zh-CN

requires:
  knowledge:
    - technology-engineering.curriculum
    - technology-engineering.pedagogy
  templates:
    - lesson-plan
    - task-sheet

depends_on:
  - core.lesson-design
  - core.activity-design

outputs:
  - lesson-plan
  - task-sheet

tags:
  - testing-iteration
  - technical-experiment
  - failure-analysis
  - redesign
  - optimization
---

# 试验测试与迭代优化 (Testing & Iterative Optimization)

## 1. 技能概述 (Description & Purpose)
本技能负责技术试验（Technical Testing）与工程迭代（Engineering Iteration）教学设计。涵盖**技术试验类型（优选试验法、模拟试验法、虚拟试验法、强化试验法、移植试验法）**、测试数据采集、失效机理分析与结构/参数的二次重构优化。

## 2. 适用边界 (When to use / When NOT to use)
- **何时使用**：
  - 样机制作完成后，开展破坏性测试、耐久度测试、气密性检测、电路带载调试时。
  - 引导学生从测试失败中寻找改进灵感，进行工程迭代升级时。
- **何时不使用**：
  - 初始需求定义与方案头脑风暴阶段（请使用 `te.technology-design`）。

## 3. 输入与约束 (Inputs & Constraints)
- **输入参数**：
  - `tested_prototype`: 待测试的工程样机名称
  - `experiment_method`: 采用的技术试验方法（如模拟试验、强化试验）
  - `failure_modes`: 预期或常见失效模式（如焊点脱落、轴承发热、共振断裂）
- **教学约束**：
  - 必须包含严谨的“试验记录报告单”与对照实验控制变量设计。
  - 必须产出具体的“迭代优化工程方案对比表（Before vs After）”。

## 4. 标准执行工作流 (Workflow)

```mermaid
graph TD
    Input[1. Input: 解析样机结构与待测技术参数] --> Context[2. Context Analysis: 识别测试安全风险与数据噪声]
    Context --> Knowledge[3. Knowledge Retrieval: 检索五大技术试验法与失效分析模型]
    Knowledge --> Planning[4. Planning: 制定测试步骤、传感器布点与迭代路径]
    Planning --> Generation[5. Generation: 生成试验指导书、数据记录单、失效诊断卡与教案]
    Generation --> Validation[6. Validation: 校验测试工况真实性与迭代措施针对性]
    Validation --> Output[7. Output: 按照模板输出教案与试验任务单]
```

### 环节详解：
1. **Input**：接收样机测试目标与测试仪器设备。
2. **Context Analysis**：评估测试中的安全防护需求及数据误差来源。
3. **Knowledge Retrieval**：调取普通高中通用技术五大试验方法与工程失效学常识。
4. **Planning**：确定测试工况条件（载荷梯度、环境温度、振动频率）及数据采集点。
5. **Generation**：输出任务单中的试验操作规范、数据曲线记录表、失效机理分析树及结构增强方案。
6. **Validation**：确保测试过程可重复、数据可验证。
7. **Output**：生成教案与学习任务单。

## 5. 质量评估基准 (Quality Criteria)
- [ ] **试验方法规范**：明确指出属于哪一种技术试验方法（如强化试验法）。
- [ ] **证据闭环**：迭代方案直接针对测试中暴露的数据缺陷或断裂点，具有因果证据链。

## 6. 关联资源与产物 (Dependencies & Outputs)
- **依赖技能**：`core.lesson-design`, `core.activity-design`
- **关联模板**：`templates/lesson-plan/lesson-plan.md`, `templates/task-sheet/task-sheet.md`
- **关联知识**：`knowledge/technology-engineering/pedagogy/engineering-design-loop.md`
