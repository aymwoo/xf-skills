# 高中物理数字化实验探究教学 Skill Pack

> **Pack ID**: `pack.physics.high-school`  
> **学科**: Physics（普通高中物理）  
> **学段**: 高一 / 高二 / 高三  
> **版本**: 0.1.0

## 📦 包内能力一览

| 技能 ID | 名称 | 作用 |
| :--- | :--- | :--- |
| `core.lesson-design` | 通用教学设计 | 课时教学设计 ABCD 目标与教-学-评对齐 |
| `core.activity-design` | 课堂活动设计 | 加涅九事件驱动的探究式任务链 |
| `core.assessment-design` | 学习评价设计 | 过程性 + 总结性评价方案 |
| `core.rubric-design` | 评价量规设计 | 多维度 4 等级分析型量规 |
| `core.project-learning` | 项目式学习设计 | STEM 跨学科 PBL 单元 |
| `core.teaching-reflection` | 教学反思与改进 | 基于课堂实证数据的迭代 |
| ⭐ `physics.experiment-inquiry` | DIS 数字化实验探究 | 力 / 光电门 / 位移传感器毫秒级采集 + 坐标拟合 + 误差归因 |

## 🎯 适用场景

- 高中物理力学实验探究（探究加速度与力、质量关系、验证机械能守恒、探究向心力等）；
- 高中物理电磁学实验探究（测定电池电动势和内阻、探究感应电流方向、LC 振荡电路等）；
- 设计含真实 DIS 传感器数据采集的学生探究任务单与伴随式科学探究评价量规。

## 📚 知识库注入

- 高中物理课程标准与核心素养框架（`physics.curriculum.physics-curriculum-framework`）
- 通用教学法（Bloom 目标分类、加涅九事件、核心素养、形成性 - 总结性评价模型）

## 📝 标准输出模板

- `lesson-plan`（教学设计）
- `task-sheet`（学生探究任务单 / 实验报告）
- `assessment`（伴随式科学探究评价量规）

## 🚀 快速上手

```bash
# 引入本 Pack 后,Agent 可直接调度
xf-skills info physics.experiment-inquiry
xf-skills search "DIS 传感器"
```

详细技能规约：[`skills/physics/experiment-inquiry/SKILL.md`](../../../skills/physics/experiment-inquiry/SKILL.md)