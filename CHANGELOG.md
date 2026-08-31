# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-31

### Added
- **Initial Teaching Skills Framework**: 建立了首个面向中小学教师与 AI Agent 的可组合、学科化教学 AI Skill 开源框架。
- **Core Skills 基础教学能力层 (6个)**:
  - `core.lesson-design`: 通用教学设计（教材/学情/目标/活动/评价闭环）
  - `core.activity-design`: 课堂学习活动设计（任务链驱动与合作探究）
  - `core.assessment-design`: 学习评价设计（表现性评价与过程性评价）
  - `core.rubric-design`: 评价量规设计（分层标准与观察要点）
  - `core.project-learning`: 项目式学习设计（真实情境与驱动性问题）
  - `core.teaching-reflection`: 教学反思与迭代改进
- **Information Technology 信息科技技能集 (6个)**:
  - `it.programming`: 编程教学设计（PRIMM 模型、脚手架与调试认知支持）
  - `it.algorithm`: 算法与计算思维教学（生活化情境与算法可视化）
  - `it.data`: 数据与数据处理教学（数据意识、编码与分析实践）
  - `it.artificial-intelligence`: 人工智能教学（AI 体验、原理认知与伦理审视）
  - `it.computational-thinking`: 计算思维培养（分解、抽象、模式识别与算法设计）
  - `it.project-learning`: 信息科技项目学习（数字化产品原型与软硬件融合）
- **Technology & Engineering 技术与工程技能集 (6个)**:
  - `te.technology-design`: 技术设计（结构/流程/系统/控制基础分析）
  - `te.engineering-design`: 工程设计（真实约束、权衡决策与方案优化）
  - `te.project-learning`: 工程项目学习（工程思维驱动的项目落地）
  - `te.prototyping`: 样品制作与原型加工（工艺选择、工具安全与装配）
  - `te.testing-iteration`: 试验测试与迭代优化（技术试验、数据采集与结构改进）
  - `te.technical-practice`: 技术实践（劳动工具、金工/木工/电子实训与工匠精神）
- **Knowledge 知识体系 (19个知识模块)**:
  - `knowledge/common/`: 通用教学论（Bloom目标分类、加涅九步教学法）、课标核心素养、评价模型
  - `knowledge/information-technology/`: 课标标准、计算思维四维度、PRIMM 编程教学法
  - `knowledge/technology-engineering/`: 通用技术课标、工程思维闭环模型与 Pugh 决策矩阵、五大技术试验法
- **Templates 标准化教学模板 (6类)**:
  - 教学设计 (`lesson-plan`), 教学逐字稿 (`teaching-script`), 学习任务单 (`task-sheet`), 学习评价 (`assessment`), 项目方案 (`project`), 课件与板书提纲 (`presentation`)
- **Packs 组合包机制**:
  - `pack.it.high-school`: 高中信息科技学科教学组合包
  - `pack.te.high-school`: 高中技术与工程学科教学组合包
- **Examples 真实落地端到端案例**:
  - `examples/information-technology/python-sorting-algorithms`: 粤教版 Python 冒泡排序探究与实现
  - `examples/technology-engineering/bridge-structure-design`: 地质版桁架桥梁结构设计与承重试验
- **Validation 静态分析验证与自动化测试系统**:
  - 内置基于 Node.js 原生的零依赖 Skill & Pack 静态分析验证器 (`scripts/validate/validator.js`)
  - 自动化单元测试集与集成用例 (`tests/`)，100% 覆盖 Core、IT、TE 及 Packs
  - 全局资产聚合生成器 (`scripts/build/build-catalog.js`)
  - 发布就绪度检测工具 (`scripts/release/check-release.js`)
- **完善的架构设计与开发者规范文档**:
  - 架构总览、Skill 规范、Knowledge 规范、Pack 规范、Runtime 预留架构、贡献与开发指南
- **架构治理守则与不可妥协边界模型 (Architectural Governance & Invariants)**:
  - 确立单一职责、Core/Subject 严格单向分层、知识外部化、输出模板化与组合包声明式装配规则
