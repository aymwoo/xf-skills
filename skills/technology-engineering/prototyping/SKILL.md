---
id: te.prototyping
name: prototyping
display_name: 样品制作与原型加工
description: |
  通用技术物化原型制作、加工工艺与创客制造教学设计技能。
  涵盖传统金工、木工、连接工艺（榫卯/焊接），以及 3D 打印、激光切割等现代数字制造工艺与装配流程。
  触发词：样品制作、原型加工、木工工艺、金工加工、3D打印教学、激光切割、物化能力。
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
  - prototyping
  - rapid-prototyping
  - 3d-printing
  - laser-cutting
  - fabrication
---

# 样品制作与原型加工 (Prototyping & Fabrication)

## 1. 技能概述 (Description & Purpose)
本技能负责指导技术与工程课堂中的快速原型制造（Rapid Prototyping）与样品加工，包括**材料选用（木材/金属/塑料/复合材料）、加工工艺（划线/锯割/锉削/钻孔/连接/表面处理）、现代数字制造（3D 打印切片、激光切割排版、CNC雕刻）**等。

## 2. 适用边界 (When to use / When NOT to use)
- **何时使用**：
  - 指导学生将二维图纸转化为三维实物构件、操作机床或数字化制造设备时。
  - 需要培养学生的材料手感、装配公差意识与工具使用规范时。
- **何时不使用**：
  - 纯方案论证而不动手制作的阶段（请使用 `te.technology-design`）。

## 3. 输入与约束 (Inputs & Constraints)
- **输入参数**：
  - `fabrication_method`: 加工工艺（传统手工金工木工 / 3D 打印 FDM / 激光切割）
  - `material_type`: 材料（木板、PVC板、PLA耗材、铝合金条）
  - `safety_level`: 安全等级（需佩戴防尘口罩、防护眼镜、严禁戴手套操作旋转设备等）
- **教学约束**：
  - 必须包含严谨的“五步加工法”：识图 ➔ 划线备料 ➔ 粗加工 ➔ 精加工 ➔ 装配调试。
  - 必须包含安全警示红线条款。

## 4. 标准执行工作流 (Workflow)

```mermaid
graph TD
    Input[1. Input: 解析加工图纸与工艺要求] --> Context[2. Context Analysis: 分析操作失误风险与材料加工特性]
    Context --> Knowledge[3. Knowledge Retrieval: 检索材料工艺知识与实操安全规程]
    Knowledge --> Planning[4. Planning: 制定工序卡 (Routing Sheet) 与装配序列]
    Planning --> Generation[5. Generation: 生成加工指引、安全操作清单与工件自检表]
    Generation --> Validation[6. Validation: 校验工艺公差合理性与安全防护完备性]
    Validation --> Output[7. Output: 按照模板输出教案与实操任务单]
```

### 环节详解：
1. **Input**：接收加工图纸、毛坯尺寸与设备清单。
2. **Context Analysis**：评估学生工具操作熟练度，标记容易发生工件报废的关键工序。
3. **Knowledge Retrieval**：调取金工/木工标准操作规范与切削参数标准。
4. **Planning**：编写工艺卡（工序号、工序名称、使用工具、技术要求、检验方法）。
5. **Generation**：输出任务单中的划线基准选择指引、刀具安全防范要点、公差配合测量表。
6. **Validation**：检查废料利用与环保安全回收机制。
7. **Output**：生成教案与学习任务单。

## 5. 质量评估基准 (Quality Criteria)
- [ ] **工序科学性**：基准面加工在先，孔位加工在后，避免工序倒置导致无法夹紧。
- [ ] **尺寸公差意识**：引导学生使用游标卡尺或钢直尺进行过程测量与误差控制。

## 6. 关联资源与产物 (Dependencies & Outputs)
- **依赖技能**：`core.lesson-design`, `core.activity-design`
- **关联模板**：`templates/lesson-plan/lesson-plan.md`, `templates/task-sheet/task-sheet.md`
- **关联知识**：`knowledge/technology-engineering/pedagogy/engineering-design-loop.md`
