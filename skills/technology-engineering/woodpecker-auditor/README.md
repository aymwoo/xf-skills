# te.woodpecker-auditor · 高中技术与工程教案啄木鸟审计专家

## 简介
`te.woodpecker-auditor` 是专属于高中通用技术（技术与工程）课程的**苏格拉底追问式教案审计专家**。
基于《普通高中通用技术课程标准》(2017 版 2020 年修订) 与 IMA 多版本教材知识库（59 本教材），
落地**"目标可测 / 教学评一致性 / 工程思维认知摩擦"三道防线**审计，坚决**拒绝代写**，迫使教师进行深度的专业与教学法反思。

> 🔑 **核心定位**：本 Skill 是**面向教师**的"思维镜像与逻辑监理"——逼出教案背后的真实专业含金量，**笔永远留在人类教师手里**。
> 与 `te.toulmin-assistant`（**面向学生**的图尔敏论证式工程助教）形成完整闭环：**一个管教师备课，一个管学生实做**。

---

## 1. 适用年级与模块对照表

| 学段 | 模块 | 适用场景 | 备注 |
| :--- | :--- | :--- | :--- |
| 高一 | 必修1《技术与设计1》 | 设计基础、图样表达、材料工艺 | 第 1 道防线最常见虚化 |
| 高一 | 必修2《技术与设计2》 | 结构 / 流程 / 系统 / 控制四大领域 | 第 3 道防线摩擦力最足 |
| 高二 | 选择性必修1《电子控制技术》 | 开闭环 / 传感器 / 执行器 / PID | 第 1 道防线缺物理极限 |
| 高二 | 选择性必修2《机器人设计与制作》 | 机械传动 / 单片机 / 调试迭代 | 第 2 道防线常缺量规 |
| 高三 | 选择性必修3《工程设计基础》 | 真实约束 / 方案博弈 / 项目化 | 第 3 道防线全维度挑战 |

---

## 2. 三道防线速查卡

```
┌──────────────────────────────────────────────────────────────┐
│  第 1 道：目标可测审计      ✅ 含行为动词 + 物理极限 + 课标锚点 │
│  第 2 道：教学评一致性审计  ✅ 目标-活动-评价三元强映射 + 量规   │
│  第 3 道：工程思维摩擦审计  ✅ 隐藏尺寸 + 硬约束 + 失效自辩      │
└──────────────────────────────────────────────────────────────┘
```

每一道防线都通过后，方可进入下一道；任何一道失守，必须**冻结后续环节**重做。

---

## 3. 与 `te.toulmin-assistant` 的边界

| 维度 | `te.woodpecker-auditor`（本 Skill） | `te.toulmin-assistant` |
| :--- | :--- | :--- |
| **服务对象** | 教师 | 学生 |
| **触发时机** | 教师备课时 | 学生实做时 |
| **核心输出** | 教案破绽诊断与追问 | 主张/论据/推理/反驳四要素的对话推进 |
| **代写红线** | 🚫 拒绝任何成品目标/活动文本 | 🚫 拒绝任何图纸/代码/数据 |
| **单次回复** | 不限字数，但要求**分步推进** | **≤150 字**，单步轻量 |
| **知识库** | IMA 59 本教材（课标循证） | IMA 59 本教材（物理依据） |

> 📌 **协作模式**：教师先用本 Skill 完成教案打磨 → 学生进课堂实做时切换至 `toulmin-assistant` 跟组。两者**绝不混用**。

---

## 4. 五大红线速查

| 红线 | 一句话 | 触发信号 |
| :--- | :--- | :--- |
| **红线一** | 严禁代劳 | 教师出现"帮我写" / "给个示范" |
| **红线二** | 步骤锁死 | 前一阶段未通过就跳到下一阶段 |
| **红线三** | 人在回路 | 每次回复末尾必须附主权确认声明 |
| **红线四** | 整篇冻结 | 教师一次性提交 >2000 字未指定审计阶段 |
| **红线五** | 防套话 | 拒绝任何可直接复制的成品文字 |

完整红线定义见 [`SKILL.md §3.2`](./SKILL.md)。

---

## 5. 5 分钟快速上手

### 5.1 在 AI Agent 中挂载本 Skill

将 `SKILL.md` 作为 System Context 或 Agent Skill 注入，触发词示例：

> "请按 `te.woodpecker-auditor` 的三道防线规范，帮我诊断下面这节《闭环控制系统》教案的教学目标：……"

### 5.2 配置知识库（可选）

如需扫描本地教材 PDF 目录作为兜底检索源：

```bash
cp examples/.env.example .env
# 编辑 .env，填入 WOODPECKER_GT_LOCAL_DIR 等变量
```

⚠️ 严禁写死 `/home/...` 绝对路径——本仓库已通过 `tests/technology-engineering/search-gt-resource.test.js` 自动校验。

### 5.3 三份完整案例

- [`examples/case-01-objective-audit.md`](./examples/case-01-objective-audit.md) — 第一道防线：捕获"大词虚化"
- [`examples/case-02-engineering-friction.md`](./examples/case-02-engineering-friction.md) — 第三道防线：工程思维摩擦
- [`examples/case-03-freeze-and-skeleton.md`](./examples/case-03-freeze-and-skeleton.md) — 红线四 + 五：整篇冻结与拒绝代劳

---

## 6. 关联资源

- **依赖技能**：`core.lesson-design`、`core.assessment-design`
- **关联模板**：`templates/lesson-plan/lesson-plan.md`、`templates/assessment/assessment.md`
- **关联知识**：
  - [`knowledge/technology-engineering/curriculum/general-technology-standards.md`](../../../knowledge/technology-engineering/curriculum/general-technology-standards.md)
  - [`knowledge/technology-engineering/discipline/engineering-thinking-process.md`](../../../knowledge/technology-engineering/discipline/engineering-thinking-process.md)
  - [`knowledge/technology-engineering/pedagogy/engineering-design-loop.md`](../../../knowledge/technology-engineering/pedagogy/engineering-design-loop.md)
- **检索器**：`scripts/search_gt_resource.cjs`（环境变量配置见 `examples/.env.example`）

---

## 7. 维护信息

- **当前版本**：`0.1.0`（experimental）
- **测试**：`npm test` → 全 20 项通过
- **静态校验**：`npm run validate` → 全库通过
- **下次升级方向**：见 SKILL.md 第 6 章质量评估基准与 README.md 末尾的 Roadmap