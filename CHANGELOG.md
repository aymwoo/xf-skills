# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-09-02

### Security
- **防回退机制：SKILL.md 与 Skill 脚本不再出现裸 KB ID**：
  - v0.3.1 修复了脚本中的 `execSync` 拼接注入面，本次进一步保证**任何未来 PR 都不可能再次把裸 KB ID 写进 Skill 脚本或 SKILL.md**。
  - `tests/technology-engineering/kb-registry.test.js` 末尾的反向扫描 walker（递归 `skills/` 与 `scripts/shared/`，排除 `kb-registry.cjs` 本体）作为 CI 网门拦截，扫描到任意外泄 ID 字符串即断言失败。

### Removed
- **从 Skill 脚本与 SKILL.md 正文移除裸 KB ID**：
  - `search_gt_resource.cjs` / `query_engineering_evidence.cjs` 不再内联 `aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=` / `72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=`。
  - 两个 SKILL.md 不再在正文中明文列出 KB ID。
  - `examples/.env.example` 不再以未注释形式重复默认值。

### Changed
- **KB 注册迁出 SKILL.md / 脚本正文，统一到 `examples/kb.registry.json` 资源文件**：
  - 新增集中注册表文件 `examples/kb.registry.json`，含 `gt`（技术与工程教学，59 册）与 `it`（信息科技教学）两个知识库的结构化元数据（ID、名称、描述、教材数量、出版社、覆写策略）。
  - 新增共享加载器 `scripts/shared/kb-registry.cjs`，提供 `loadKbRegistry()` / `buildKbConfig()` / `validateRegistryShape()`，供所有 Skill 脚本统一调用。
  - 重构 `search_gt_resource.cjs` / `query_engineering_evidence.cjs`：KB ID 不再在本脚本内置，默认从 `examples/kb.registry.json` 加载；fallback 仅作为「所有文件都不可用」的极端场景兑底，且 `stderr` 警告。
  - 更新两个 Skill 的 `SKILL.md` §3/§5 章节：将硬编码的 KB ID 改为引用 `examples/kb.registry.json` 相对路径，附带 `KB_REGISTRY_PATH` 环境变量覆写说明。
  - 重写 `examples/.env.example`：KB ID 默认值不再在此重复列出，全部以注释提示「请使用 `kb.registry.json` 作为单一权威」；新增 `KB_REGISTRY_PATH` 覆写示例。

### Added
- **14 个 kb-registry 集成测试**（`tests/technology-engineering/kb-registry.test.js`）：
  - 默认注册表文件存在性 / 包含 gt+it 两个 key / ID 与历史 IMA 默认一致。
  - `getDefaultRegistryPath()` 返回规范路径。
  - `loadKbRegistry()` 接受 `options.registryPath` 自定义路径覆写。
  - `loadKbRegistry()` 接受 `KB_REGISTRY_PATH` 环境变量覆写。
  - `loadKbRegistry()` 在所有候选都不可用时退回 fallback。
  - `validateRegistryShape()` 拒绝 null / 缺 `knowledge_bases` / 缺 ID / 缺 name 四类畸形输入。
  - `buildKbConfig()` 正确应用 env var 覆写。
  - woodpecker / toulmin 脚本层的 `__registry` 与注册表源路径交叉验证。
  - **反向检测**：递归扫描 `skills/` 与 `scripts/shared/`（排除 `kb-registry.cjs` 本体），断言不出现裸 KB ID（防止新增 Skill 重复踩坑）。
  - 两个 SKILL.md 都引用 `kb.registry.json` 且不含裸 KB ID。

### Tests
- `npm test` 用例数从 25 扩充至 **39**（净增 14）。
- `npm run validate`：全部 20 个 Skill + 2 个 Pack + 6 个 Template + 19 个 Knowledge 模块依旧全量通过静态验证。

## [0.3.1] - 2026-09-02

### Security
- **去除检索脚本中的命令注入面**：`search_gt_resource.cjs` / `query_engineering_evidence.cjs` 原本使用 `execSync + grep` shell 拼接，存在命令注入风险。现改用 `execFile`（不走 shell），杜绝关键词中的恶意字符被作为 shell 命令执行。

### Changed
- **解除检索脚本对本地绝对路径的硬编码**：原本两脚本中均写死 `/home/wuxf/Develop/ChinaTextbook/...` 路径，违反仓库 `Portable` 与 `Local-first & Portable` 架构原则。现重构为：
  - 本地教材 PDF 兑底目录默认 `null`（仅云端检索），可通过 `WOODPECKER_GT_LOCAL_DIR` / `WOODPECKER_IT_LOCAL_DIR` / `TOULMIN_GT_LOCAL_DIR` / `TOULMIN_IT_LOCAL_DIR` 环境变量按需启用。
  - IMA KB ID 默认不变，但可通过 `WOODPECKER_GT_KB_ID` / `WOODPECKER_IT_KB_ID` / `TOULMIN_GT_KB_ID` / `TOULMIN_IT_KB_ID` 覆盖，方便教师切换自建 RAG。
  - 新增根仓门示例文件 `examples/.env.example`，避免每个 Skill 各自重复一份配置模板。
- **PDF 检索从串行改为有界并发**：新增 `runWithConcurrency` 助手函数，默认 4 worker 并发调用 `pdftotext`，避免 60 本教材 5 分钟串行阻塞。
- **`te.woodpecker-auditor` 红线二增加教师主动解锁例外协议**：明确教师明确请求跳过某个阶段时，审计专家可警示一次风险后允许跳阶段，同时记录目标层隐患，避免「步骤锁死」过严误伤合法需求。
- **`te.woodpecker-auditor` 三道防线 × 五大核心素养显式映射**：在 `SKILL.md §4` 每阶段标题下加「本阶段重点素养」标注，并在 `§5.1` 提供 3×5 可视映射表，让教师/Agent 一眼看到当前阶段主诊项。
- **`te.woodpecker-auditor` 场景三苏格拉底密度精炼**：原本 ~110 字的「打开课标独立填方括号」超长反问拆为两轮（「封锁+拒代」+「追问查证方法论」），避免教师阅读疲劳，同时升级出新教学法点「查证路径 > 查证结果」。
- **`te.toulmin-assistant` 四阶段 × 五大核心素养映射表 + 字数硬校验流程**：`SKILL.md §6.1` 提供 4×5 可视映射表，`§6.2` 提供 5 步字数拆分规则（含极端场景例外说明）。
- **同步 `te.woodpecker-auditor/meta.json` 版本号**：从 `1.0.0` 修正为 `0.1.0`，与 `SKILL.md` Front Matter 一致。
- **`pack.te.high-school` 正式收容两个实验性 Skill**：在 `packs/technology-engineering/high-school/pack.yaml` 的 `skills:` 列表中加入 `te.woodpecker-auditor` 与 `te.toulmin-assistant`，教师引入 Pack 后一键获得全部能力。

### Added
- **5 份完整教学案例**（`examples/`）补齐至 `CONTRIBUTING.md §三` 规范要求：
  - `skills/technology-engineering/woodpecker-auditor/examples/`:
    - `case-01-objective-audit.md`：第一道防线「目标可测量」审计完整 transcript。
    - `case-02-engineering-friction.md`：第三道防线「工程思维摩擦」审计 + Pugh 决策矩阵嵌入。
    - `case-03-freeze-and-skeleton.md`：红线四+五「整篇冻结与拒绝代劳」双重防御实录。
  - `skills/technology-engineering/toulmin-assistant/examples/`:
    - `case-paper-bridge-4turn.md`：瓦楞纸梁「Claim→Data→Warrant→Rebuttal」四轮交锋。
    - `case-rebuttal-tradeoff.md`：闭环温控「反驳阶段」Trade-off 权衡。
- **2 份 Skill README 升级**：woodpecker-auditor 与 toulmin-assistant 的 `README.md` 从 4 行简介扩充为「简介 + 适用年级模块表 + 防线/阶段速查卡 + 与另一个 Skill 的边界对照表 + 5 分钟快速上手 + 关联资源 + 维护信息」七段式。
- **环境变量示例文件 `examples/.env.example`**：统一两个 Skill 的配置项，含 `IMA_OPENAPI_CLIENTID/APIKEY`、`*_KB_ID`、`*_LOCAL_DIR` 三个分组，并在注释中明确「严禁写死其他开发者机器绝对路径」。
- **5 个 P2 集成测试**（`tests/technology-engineering/te-packs.test.js`）：
  - pack.yaml 引用两 Skill 的静态校验。
  - woodpecker SKILL.md 包含「三道防线 × 五大核心素养映射表」。
  - woodpecker SKILL.md 红线二包含「教师主动解锁例外协议」。
  - woodpecker SKILL.md 场景三拆为两轮。
  - toulmin SKILL.md 包含「四阶段 × 五大核心素养映射表」与「字数硬校验流程」。

### Tests
- `npm test` 用例数从 11 扩充至 **25**（净增 14）：
  - 原有 11 个 Core / IT / Packs / 检索器单元测试不变。
  - 新增 8 个检索脚本集成测试（localDir 默认 null / null 路径兑底 / 有界并发实测 / execFile 防注入静态扫描）。
  - 新增 5 个 TE Packs 集成测试（见上节）。
- `npm run validate`：全部 20 个 Skill + 2 个 Pack + 6 个 Template + 19 个 Knowledge 模块依旧全量通过静态验证。

## [0.3.0] - 2026-09-02

### Added
- **图尔敏论证式工程助教 (`te.toulmin-assistant`)**:
  - 新增专注于高中通用技术（技术与工程）实践项目的“图尔敏论证式工程助教”技能。
  - **图尔敏四阶段引导模型**：落实阶段一“澄清主张 (Claim)”、阶段二“索取论据 (Data)”、阶段三“建立推理 (Warrant)”、阶段四“引入反驳与权衡 (Rebuttal & Trade-off)”。
  - **三大认知摩擦红线**：绝不直接提供现成方案或图纸、坚持“看证据不凭感觉”数据拦截门禁、单步轻量推进且每次回答严格控制在 150 字以内。
  - **IMA 知识库工程实证联动**：内置 `query_engineering_evidence.cjs` 检索工具，支持调取 IMA 59 册官方教材力学极限、规范量纲与典型失效数据作为追问事实源。
  - **自动化测试集成**：新增 `tests/technology-engineering/toulmin-assistant.test.js`，更新 `te-skills.test.js` 至 8 项 TE 技能，全量通过。

## [0.2.1] - 2026-09-02

### Changed
- **优化啄木鸟审计专家 (`te.woodpecker-auditor`)**:
  - **规约与渐进式发现优化**：在 `SKILL.md` YAML Front Matter 中补全 `description` 描述及触发词，修复 Antigravity 平台识别该 Skill 时描述为空的问题。
  - **红线对抗防御升级**：新增红线四（整篇冻结截断协议）与红线五（防套话与骨架拒绝原则），完备应对教师“整篇教案轰炸”与“苦求代劳示范”两类极限行为。
  - **IMA 检索脚本长句鲁棒性提升**：`search_gt_resource.cjs` 引入通用技术领域关键词智能提取算法，在复杂自然语言查询下自动降级提炼核心工程词，避免云端 0 匹配。
  - **测试覆盖度扩充**：新增 `tests/technology-engineering/search-gt-resource.test.js` 单元测试套件，全面覆盖关键词提取、参数解析与知识库映射。

## [0.2.0] - 2026-09-01

### Added
- **高中技术与工程教案“啄木鸟”审计专家 (`te.woodpecker-auditor`)**:
  - 新增面向高中通用技术（技术与工程）学科的苏格拉底追问式教案审计专家技能。
  - **三道防线审计工作流**：闭环实现阶段一（目标可测与物理极限指标）、阶段二（教学评一致性与过程伴随式量规）、阶段三（工程思维摩擦力、参数博弈 Trade-off 与图尔敏论证自辩）。
  - **交互红线算法控制**：严格实施严禁代劳（不替写教案）、步骤锁死（前序未达标拒绝越级）、人在回路（保留教师最终决策主权）三大原则。
  - **IMA 知识库连接器**：内置 `search_gt_resource.cjs` 检索工具，支持直连 IMA 检索 59 本官方高中教材（人教版、苏教版、地质社版、粤教粤科版、豫科版）及课标实证依据。
  - **自动化测试集成**：同步更新 `tests/technology-engineering/te-skills.test.js`，TE 技能套件扩充至 7 项，全量通过静态验证与测试。

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
