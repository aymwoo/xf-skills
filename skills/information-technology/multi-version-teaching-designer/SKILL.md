---
id: it.multi-version-teaching-designer
name: multi-version-teaching-designer
display_name: 多版本教材教学设计副驾驶
description: |
  基于多版本高中教材（信息技术 / 通用技术 / 技术与工程）的跨版本横向对比、教学设计与二次创生专家。
  当教师需要针对特定知识点进行多版本教材横向对比、教学设计起草、项目式学习任务构思、驱动性问题链设计、跨学科技术与工程融合课例开发时，使用此 Skill。
  触发词：教学设计、教案、跨版本、备课、知识点教学、教学活动设计、课例、教学反思、信息技术教学设计、通用技术教学设计、技术与工程教学设计。
version: 0.1.0
status: experimental
type: teaching-skill

subject:
  - information-technology
  - technology-engineering

education_level:
  - high-school

language:
  - zh-CN

requires:
  knowledge:
    - information-technology.curriculum
    - information-technology.discipline
  templates:
    - lesson-plan
    - teaching-case

depends_on:
  - core.lesson-design

outputs:
  - lesson-plan
  - task-sheet

tags:
  - textbook-comparison
  - multi-version
  - cross-version
  - information-technology
  - general-technology
  - lesson-design
---

# 多版本教材教学设计副驾驶 (multi-version-teaching-designer)

本 Skill 旨在辅助教师针对高中**信息技术**（信息科技）与**通用技术**（技术与工程）课程中的具体知识点，联动检索云端多版本教材知识库，进行多版本横向对比透视，并完成高质量的教学设计二次创生。

---

## 📚 底层教材知识库资源

- **【信息科技教学】知识库** (`72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=`):
  - 覆盖 **48 本** 高中信息技术教材，包含 6 大版本：**人教中图版、华东师大版、教科版、沪科教版、浙教版、粤教版**（各版本必修 1~2、选择性必修 1~6 全套）。
- **【技术与工程教学】知识库** (`aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=`):
  - 覆盖 **59 本** 高中通用技术教材，包含 5 大版本：**人教版、地质社版、粤教粤科版、苏教版、豫科版**（各版本必修 1~2、选择性必修 1~11 全套）。
- **配置覆写与本地离线支持（环境变量）**：
  - `TEXTBOOK_IT_KB_ID` / `TEXTBOOK_GT_KB_ID`：可覆盖默认云端教材库 ID。
  - `TEXTBOOK_IT_LOCAL_DIR` / `TEXTBOOK_GT_LOCAL_DIR`：可选指定本地教材 PDF/Markdown 离线目录（默认 `null`，严禁写死本地绝对路径）。


---

## 🔄 标准执行工作流 (Standard Workflow)

遵循从课题输入 (Input) 与教学情境定位 (Context)、多版本规划 (Planning)、教案创生 (Generation)、教学目标一致性校验 (Validation) 至教案产出 (Output) 的完整闭环：

### Step 1: 知识点解析与学科定位
1. 判断知识点所属领域：
   - 信息技术领域（如算法与程序设计、数据结构、人工智能、网络与物联网、信息系统）
   - 通用技术/技术与工程领域（如结构与设计、流程与设计、系统与设计、控制与设计、电子控制、机器人、现代家政、三维设计与制造等）
   - 跨学科融合课例（信息+工程+数学/物理融合）
2. 映射对应的《普通高中课程标准》核心素养维度（计算思维/工程思维等）。

### Step 2: 多版本跨库检索与内容提取
使用内置脚本进行多版本检索（在仓库根目录或独立技能目录下执行）：
```bash
node skills/information-technology/multi-version-teaching-designer/scripts/cross_textbook_search.cjs \
  --query "<知识点关键词>" \
  --subject <it|gt|all>
```
*(注：若在技能独立目录执行，可使用 `node scripts/cross_textbook_search.cjs`)*
提取各版本关于该知识点的：
- **切入情境**（生活化案例、科技前沿、工程实例）
- **概念建构顺序与推导逻辑**
- **典型代码、电路图、机械图纸或物理制作任务**
- **课后项目式探究活动**

### Step 3: 构建多版本横向透视矩阵
在教案前必须先呈现**多版本教材对比分析表**：
| 比较维度 | 版本 A (如浙教/苏教) | 版本 B (如人教) | 版本 C (如粤教) | 版本 D (如沪科/地质) | 二次创生取舍与融合建议 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **引入情境** | ... | ... | ... | ... | ... |
| **概念建构** | ... | ... | ... | ... | ... |
| **实践案例** | ... | ... | ... | ... | ... |
| **课后拓展** | ... | ... | ... | ... | ... |

### Step 4: 教学设计二次创生
按照标准教学设计架构输出可直接落地的高质量教案：
1. **课题基本信息与学情诊断**（已有经验、认知盲区、学习支架）
2. **教学目标与核心素养落实点**（ABCD 规范表达）
3. **驱动性问题链与教学实施过程**（创设情境 $\to$ 探究建构 $\to$ 实践应用 $\to$ 成果展评）
   - 明确标注每个环节借鉴了哪一版本教材的特色亮点。
4. **分层任务单**（基础达标、进阶探究、高阶创新挑战）
5. **表现性评价量规（Rubrics）**
6. **板书设计与数字化教学资源指引**

### Step 5: 一键保存至 IMA 笔记（可选）
当教师需要将教案保存到个人 IMA 笔记本时，运行：
```bash
node skills/information-technology/multi-version-teaching-designer/scripts/save_lesson_plan.cjs \
  --title "《<课题名称>》教学设计" \
  --file "/path/to/lesson_plan.md"
```
*(注：若在技能独立目录执行，可使用 `node scripts/save_lesson_plan.cjs`)*

---

## 💡 教师交互示例

- 用户：“请帮我针对‘二叉树的遍历’做一个基于多版本教材对比的教学设计。”
- Skill 行为：
  1. 识别为高中信息技术《选择性必修1 数据与数据结构》核心内容。
  2. 检索【信息科技教学】库中 6 个版本的二叉树章节。
  3. 输出多版本对比分析（浙教的表达式求值树 vs 粤教的文件系统目录树 vs 沪科的决策树案例）。
  4. 生成融合式 45 分钟探究教案（含问题链、Python 遍历模拟实验与量规）。
  5. 提供一键归档至 IMA 笔记的选项。
