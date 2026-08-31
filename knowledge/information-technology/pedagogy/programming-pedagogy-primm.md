# PRIMM 编程教学法与认知支架 (PRIMM Model & Cognitive Scaffolding)

## 1. PRIMM 教学模型概述
PRIMM 教学法由 Sue Sentance 教授等提出，旨在解决初学者从零编写代码时面临的高认知负荷（Cognitive Overload）问题：

```
Predict (预测) ➔ Read (研读) ➔ Investigate (探究) ➔ Modify (修改) ➔ Make (创造)
```

1. **Predict (预测)**：学生在不运行程序的前提下，先通读代码，预测其控制流与控制台输出。
2. **Read (研读)**：在教师引导下逐行研读代码，标记变量、函数调用与关键算法逻辑。
3. **Investigate (探究)**：运行代码验证预测，加入 `print()` 追踪内部状态，解答针对代码设计的探究问题。
4. **Modify (修改)**：在已有半成品代码上做增量修改，增加新功能分支或调整算法参数。
5. **Make (创造)**：脱离脚手架，根据新的真实问题情境独立设计并编写完整程序。

---

## 2. 编程教学经典认知支架

- **Parson 拼题法 (Parson's Problems)**：将正确的代码打乱顺序或混入干扰代码行，让学生通过拖拽重排构建正确程序，规避语法拼写细节带来的挫败感。
- **错误诊断支架 (Debugging Scaffolding)**：
  - `SyntaxError`: 语法结构错误（少冒号、中英文标点混淆、括号不闭合）。
  - `IndentationError`: Python 缩进与代码块层级错误。
  - `NameError`: 变量/函数名未定义或拼写错误。
  - `TypeError`: 数据类型不匹配（如将字符串与整数直接相加）。
  - `IndexError`: 列表或序列索引越界。
  - 逻辑错误 (Logic Error): 语法完全正确但计算结果偏差，使用断点或打印追踪排查。
