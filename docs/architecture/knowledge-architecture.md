# Knowledge 架构 (Knowledge Architecture)

Knowledge 模块负责管理 Teaching Skills Framework 的**外部教学知识库**。本文档阐述 Knowledge 的分层分类、格式规范与检索对接方式。

---

## 1. 为什么必须将 Knowledge 与 Skill 分离？

1. **课标与教材是动态演进的**：国家课程标准每数年修订一次，各省市教材版本各异（人教版、粤教版、苏科版等）。若直接硬编码进 Skill，将导致庞大臃肿且难以维护。
2. **学科概念具备权威性与复用性**：如布鲁姆教育目标分类（Bloom）、加涅九步教学法、信息科技学科核心素养、技术与工程设计过程等，可被多个 Skill 共同复用。
3. **保持 Skill 的纯粹性**：Skill 专心处理“教学设计思维链与生成逻辑”，Knowledge 专心提供“专业知识支撑与标准依据”。

---

## 2. 知识库目录拓扑

```text
knowledge/
├── common/                               # 通用教育教学知识
│   ├── pedagogy/                         # 教育心理学与通用教学法 (Bloom, Gagne)
│   ├── curriculum/                       # 核心素养通用框架
│   └── assessment/                       # 表现性评价/形成性评价模型
│
├── information-technology/               # 信息科技学科知识库
│   ├── curriculum/                       # 2022义务教育课标 / 2017高中课标
│   ├── discipline/                       # 计算思维四要素、算法复杂度等学科本体知识
│   └── pedagogy/                         # PRIMM 模型、Parson 问题等编程教学法
│
├── technology-engineering/               # 技术与工程学科知识库
│   ├── curriculum/                       # 普通高中通用技术课标与技术素养
│   ├── discipline/                       # 结构与设计、控制与系统、工程材料与力学
│   └── pedagogy/                         # 工程设计循环、技术试验法、安全操作规程
│
└── [future-subjects]/                    # 未来扩展 (math, physics, chemistry...)
```

---

## 3. Knowledge 文件标准结构

知识库文件优先采用**结构化 Markdown (带有明确标题与列表)**，必要时附带 YAML/JSON 数据结构：

```markdown
# 知识模块名称

## 1. 核心定义与内涵
- 权威来源：如《普通高中信息技术课程标准（2017年版2020年修订）》
- 核心概念定义与核心要素

## 2. 教学转化与认知阶梯
- 对应学段的认知发展特征
- 教学中的转化路径与阶梯建议

## 3. 常见学生错误与认知障碍 (Misconceptions)
- 典型错因 1 及对策
- 典型错因 2 及对策

## 4. 评价要点与观察指标
- 过程性观察维度
- 水平分级标准
```

---

## 4. 知识检索与调用规范

Skill 通过 YAML Front Matter 的 `requires.knowledge` 字段声明所依赖的知识模块：

```yaml
requires:
  knowledge:
    - information-technology.curriculum
    - common.pedagogy.bloom-taxonomy
```

AI Agent 或 Runtime 将根据此依赖标识，自动加载对应路径下的 Markdown 内容并注入上下文。
