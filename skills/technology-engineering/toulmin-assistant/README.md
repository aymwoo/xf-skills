# te.toulmin-assistant · 图尔敏论证式工程助教

## 简介
`te.toulmin-assistant` 专注于高中工程与技术（通用技术）课程的**实践项目**。
作为学生的**"思辨伙伴"**，引导学生在面对结构失效、控制系统不稳定、设计参数冲突等工程挑战时，
运用图尔敏论证四要素——**主张（Claim）/ 论据（Data）/ 推理（Warrant）/ 反驳与权衡（Rebuttal）**——
展开闭环自辩。

> 🔑 **核心定位**：本 Skill 是**面向学生**的工程论证推手——执行"认知摩擦红线"（不提供现成答案、用数据说话门禁、单步轻量交互 ≤150 字），
> 联动 IMA 云端 59 本教材知识库提供客观物理依据。
> 与 `te.woodpecker-auditor`（**面向教师**的教案审计专家）形成完整闭环：**一个管教师备课，一个管学生实做**。

---

## 1. 适用场景与年级

| 学段 | 模块 | 典型应用 | 主要触发阶段 |
| :--- | :--- | :--- | :--- |
| 高一 | 必修2《技术与设计2》结构与设计 | 桁架桥 / 榫卯 / 纸梁承重 | Claim + Data |
| 高一 | 必修2《技术与设计2》控制与设计 | 闭环温控 / 自动浇花 / 调光灯 | Warrant + Rebuttal |
| 高二 | 选择性必修1《电子控制技术》 | PID 调参 / 传感器数据采集 | Data + Rebuttal |
| 高二 | 选择性必修2《机器人设计与制作》 | 巡线 / 抓取 / 越障迭代 | Rebuttal |
| 高三 | 选择性必修3《工程设计基础》 | 真实约束下的项目化答辩 | 全四阶段 |

---

## 2. 图尔敏四阶段速查

```
   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Claim   │ →  │   Data   │ →  │ Warrant  │ →  │ Rebuttal │
   │  主张    │    │   论据    │    │   推理    │    │  反驳/权衡│
   └──────────┘    └──────────┘    └──────────┘    └──────────┘
       你想做什么      测了什么        为什么有效       在什么条件下失败
```

每一阶段都必须由**学生本人**填充；AI 永远只做追问与方向校准。

---

## 3. 与 `te.woodpecker-auditor` 的边界

| 维度 | `te.toulmin-assistant`（本 Skill） | `te.woodpecker-auditor` |
| :--- | :--- | :--- |
| **服务对象** | 学生 | 教师 |
| **触发时机** | 学生实做 / 项目答辩 | 教师备课 / 磨课 |
| **核心输出** | 单步 ≤150 字追问 | 多维度诊断报告 |
| **代写红线** | 🚫 拒绝图纸 / 代码 / 数据 | 🚫 拒绝成品教案文本 |
| **典型场景** | "助教，我搭的纸梁断了，怎么办？" | "老师，我这节课教案有什么问题？" |

> 📌 **协作模式**：教师先用 `woodpecker-auditor` 打磨教案 → 学生进课堂实做时切换至本 Skill 跟组。
> 两者**绝不混用**：用错对象会出现"教师得到 150 字短答"或"学生被审计三道防线"的尴尬场景。

---

## 4. 三大红线速查

| 红线 | 一句话 | 触发信号 |
| :--- | :--- | :--- |
| **认知摩擦** | 不直接给答案 | 学生请求"给我图纸 / 公式 / 代码" |
| **数据硬屏障** | 无数据不推进 | 学生说"感觉行 / 差不多 / 应该可以" |
| **单步轻量** | 单次回复 ≤150 字 | 教师 / Agent 想一次性给完整方案 |

完整红线定义见 [`SKILL.md §3`](./SKILL.md)。

---

## 5. 5 分钟快速上手

### 5.1 在 AI Agent 中挂载本 Skill

将 `SKILL.md` 作为 System Context 或 Agent Skill 注入，触发词示例：

> "请按 `te.toulmin-assistant` 的图尔敏四要素，跟进下面这位高一学生在《纸梁承重》项目中的迭代。"

### 5.2 配置知识库（可选）

```bash
cp ../../../../examples/.env.example .env
# 编辑 .env，填入 TOULMIN_GT_LOCAL_DIR 等变量
```

⚠️ 严禁写死 `/home/...` 绝对路径——本仓库已通过 `tests/technology-engineering/toulmin-assistant.test.js` 自动校验。

### 5.3 两份完整案例

- [`examples/case-paper-bridge-4turn.md`](./examples/case-paper-bridge-4turn.md) — 瓦楞纸梁：Claim→Data→Warrant→Rebuttal 四轮交锋
- [`examples/case-rebuttal-tradeoff.md`](./examples/case-rebuttal-tradeoff.md) — 闭环温控：反驳阶段的 Trade-off 权衡

---

## 6. 关联资源

- **依赖技能**：`te.engineering-design`、`te.testing-iteration`
- **关联模板**：`templates/task-sheet/task-sheet.md`、`templates/assessment/assessment.md`
- **关联知识**：
  - [`knowledge/technology-engineering/curriculum/general-technology-standards.md`](../../../knowledge/technology-engineering/curriculum/general-technology-standards.md)
  - [`knowledge/technology-engineering/discipline/engineering-thinking-process.md`](../../../knowledge/technology-engineering/discipline/engineering-thinking-process.md)
  - [`knowledge/technology-engineering/pedagogy/engineering-design-loop.md`](../../../knowledge/technology-engineering/pedagogy/engineering-design-loop.md)
- **检索器**：`scripts/query_engineering_evidence.cjs`

---

## 7. 维护信息

- **当前版本**：`0.1.0`（experimental）
- **测试**：`npm test` → 全 20 项通过
- **静态校验**：`npm run validate` → 全库通过