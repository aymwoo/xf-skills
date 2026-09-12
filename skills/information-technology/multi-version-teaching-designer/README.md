# it.multi-version-teaching-designer: 多版本教材教学设计副驾驶

## 1. 技能定位与核心价值

`it.multi-version-teaching-designer` 面向高中信息技术（信息科技）与通用技术（技术与工程）骨干教师及公开课备课团队。
其核心使命是**打破单一版本教材的视野局限**，通过联动检索云端多版本教材知识库（48 本信息技术 + 59 本通用技术教材），自动提炼各版本在引入情境、概念建构、实践案例和课后探究上的特色与差异，为教师提供多维度对比矩阵，并以此为支架完成兼具科学性、探究性与创新性的教案二次创生。

---

## 2. 覆盖教材版本与知识库支撑

| 学科领域 | 覆盖教材版本 | 知识库资源 | 环境变量配置 |
| :--- | :--- | :--- | :--- |
| **高中信息技术** | 人教中图版、华东师大版、教科版、沪科教版、浙教版、粤教版（全套 48 册） | `72iYesay6_NLFYUHRxi9lJXDGu36pBH60gn259_PmyQ=` | `TEXTBOOK_IT_KB_ID`<br>`TEXTBOOK_IT_LOCAL_DIR` |
| **高中通用技术** | 人教版、地质社版、粤教粤科版、苏教版、豫科版（全套 59 册） | `aBIURnoKHvpe9zw092V88KWkftpOGhEe14ItcK34tv0=` | `TEXTBOOK_GT_KB_ID`<br>`TEXTBOOK_GT_LOCAL_DIR` |

---

## 3. 五步工作流 (Workflow)

1. **输入解析与素养定位 (Input & Context)**：判断知识点所属领域（IT、GT 或跨学科工程融合），映射课标核心素养。
2. **多版本跨库检索 (Search & Extraction)**：调用 `cross_textbook_search.cjs` 批量提取各版本情境案例、代码或图纸。
3. **横向透视矩阵 (Planning & Matrix)**：输出多版本横向对比表（引入情境、概念建构、实践案例、课后拓展）。
4. **教案二次创生 (Generation & Validation)**：基于选定优势特征，生成高质量 45 分钟探究教案与分层任务单。
5. **归档与笔记联动 (Output & Save)**：输出标准化 markdown 教案，可选调用 `save_lesson_plan.cjs` 保存至 IMA 笔记本。

---

## 4. 常用运行指令

```bash
# 检索特定知识点的多版本教材论述
node skills/information-technology/multi-version-teaching-designer/scripts/cross_textbook_search.cjs \
  --query "二叉树遍历" \
  --subject it

# 保存生成教案至 IMA 笔记
node skills/information-technology/multi-version-teaching-designer/scripts/save_lesson_plan.cjs \
  --title "《二叉树的遍历》多版本融合教学设计" \
  --file "path/to/lesson_plan.md"
```
