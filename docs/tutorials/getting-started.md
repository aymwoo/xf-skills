# 快速上手教程 (Getting Started Tutorial)

本教程通过一个具体案例，演示如何利用 Teaching Skills Framework 为高中信息科技课程设计一节高质量的《二分查找算法》课。

---

## 1. 业务场景

- **学科**：高中信息科技 (必修1《数据与计算》)
- **课题**：二分查找算法 (Binary Search)
- **学情**：学生已掌握顺序查找和 Python 列表基础，但缺乏对“折半缩减搜索空间”与“时间复杂度从 $O(n)$ 到 $O(\log n)$”的直观认知。
- **课时**：1 课时 (45 分钟)

---

## 2. 传统 Prompt 的问题

直接问 ChatGPT：“请帮我写一节高中二分查找教学设计。”  
往往得到：
- 堆砌代码实现，缺乏猜数字游戏等体验式情境引入。
- 缺少对“前提必须有序”这一关键边界条件的探究设计。
- 缺乏基于任务驱动的学习活动和评价量规。

---

## 3. 使用 Skill Framework 的标准化流程

### 第一步：选择技能包与能力单元
在 `packs/information-technology/high-school/pack.yaml` 中，组合以下能力：
- `core.lesson-design` (提供底层教学设计结构)
- `it.algorithm` (提供算法探究与生活化情境模型)
- `core.activity-design` (提供猜数探究活动链)
- `core.assessment-design` (提供过程性观察点)

### 第二步：挂载知识库
- 知识库引用：`knowledge/information-technology/discipline/computational-thinking-dimensions.md` (抽象、建模与算法效率分析)。

### 第三步：生成标准交付物
输出将严格符合：
- `templates/lesson-plan/lesson-plan.md`
- `templates/task-sheet/task-sheet.md`

最终生成的教学方案将包含：
1. **情境引入**：从“1-100 猜商品价格”游戏引出“折半”策略。
2. **算法抽象**：抽象出左右指针 `left`, `right` 与中点 `mid` 的更新规则。
3. **编程实践**：提供 PRIMM 模式的分层代码脚手架。
4. **思维升华**：对比百万级数据下顺序查找与二分查找的耗时差距，建立对算法效率的敬畏感。
