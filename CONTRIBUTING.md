# 贡献指南 (Contributing Guide)

欢迎参与 **Teaching Skills Framework**（面向中小学教师的 AI Teaching Skill 开源框架）的共建！

本项目旨在为中小学教师与各类 AI Agent 提供模块化、可组合、学科化、可验证的教学能力与知识库体系。

---

## 目录
- [一、核心原则](#一核心原则)
- [二、目录职责与规范](#二目录职责与规范)
- [三、如何贡献一个新的 Skill](#三如何贡献一个新的-skill)
- [四、Skill 准入质量标准](#四skill-准入质量标准)
- [五、开发与验证工作流](#五开发与验证工作流)
- [六、提交规范 (Commit Convention)](#六提交规范-commit-convention)

---

## 一、核心原则

在贡献任何代码或 Skill 前，请务必遵守以下基本原则：

1. **Skill ≠ Knowledge ≠ Template**：
   - **Skill**：负责“做什么”（工作流、提示链逻辑、输入输出规范）。
   - **Knowledge**：负责“知道什么”（课标、教材、学科原理、认知规律），绝不可硬编码到 Skill 中。
   - **Template**：负责“输出成什么”（标准化 Markdown 结构）。
2. **学科解耦与平滑扩展**：
   - Core 层严禁出现具体学科内容。
   - 学科 Skill 应基于 `depends_on` 继承 Core 层的通用教学能力，避免重复制造轮子。
3. **Agent 友好与人类可读**：
   - 遵循统一的 YAML Front Matter。
   - Markdown 结构清晰，既能被 AI Agent 稳定解析，也能供一线教师直接阅读与修改。
4. **Local-First & Portable**：
   - 不绑定任何特定的 AI Agent 平台或模型厂商（如 OpenAI、Claude、Gemini 等）。
   - 优先贴合中国大陆基础教育课程标准与教师备课习惯。

---

## 二、目录职责与规范

```text
teaching-skills/
├── .github/          # GitHub 工作流、Issue/PR 模板
├── docs/             # 框架架构文档、规范与开发教程
├── skills/           # 技能定义目录 (core, information-technology, technology-engineering, physics)
├── knowledge/        # 学科与通用知识库 (common, information-technology, technology-engineering, physics)
├── templates/        # 标准化教学输出模板
├── packs/            # 学科/学段组合包定义 (information-technology, technology-engineering, physics)
├── examples/         # 真实教学案例与端到端示例
├── tests/            # 自动化测试与验证用例
└── scripts/          # 构建、校验与发布脚本
```

---

## 三、如何贡献一个新的 Skill

每一个 Skill 必须存放在对应的子目录中，例如 `skills/information-technology/python-functions/`，且必须包含以下 4 个组成部分：

```text
skills/<subject>/<skill-name>/
├── SKILL.md          # Skill 主规范文件（包含 YAML Front Matter + 完整 Workflow）
├── README.md         # 供人类教师与开发者快速阅读的中文说明
├── examples/         # 包含至少一个标准输入输出示例
└── tests/            # 包含测试用例数据
```

### 1. `SKILL.md` 模板与元数据要求

```yaml
---
id: <scope>.<skill-name>        # 如 it.python-functions (必须全网唯一)
name: <skill-name>              # 英文名称，短横线命名
display_name: <中文显示名>       # 如 "函数与模块化教学设计"
version: 0.1.0                  # 语义化版本
status: experimental            # experimental | stable | deprecated
type: teaching-skill

subject:
  - information-technology      # 学科代码

education_level:
  - middle-school
  - high-school

language:
  - zh-CN

requires:
  knowledge:
    - information-technology.curriculum
  templates:
    - lesson-plan

depends_on:
  - core.lesson-design
  - core.activity-design

outputs:
  - lesson-plan
  - task-sheet

tags:
  - programming
  - function
  - modularity
---
```

### 2. 标准 Workflow

每个 Skill 的主内容必须包含统一的 7 步闭环工作流：
1. **Input (输入解析)**
2. **Context Analysis (情境与学情分析)**
3. **Knowledge Retrieval (教学知识检索)**
4. **Planning (教学环节规划)**
5. **Generation (内容精准生成)**
6. **Validation (质量校验与对齐)**
7. **Output (标准化结构输出)**

---

## 四、Skill 准入质量标准

在提交 PR 前，请自查以下 10 项标准：
1. [ ] `SKILL.md` 包含完整合法的 YAML Front Matter。
2. [ ] `id` 唯一且命名符合 `<scope>.<skill-name>`。
3. [ ] 明确定义了 **When to use** 与 **When NOT to use**（边界清晰）。
4. [ ] 明确列出依赖的 Knowledge 与 Templates，无未声明的外部隐式依赖。
5. [ ] `depends_on` 引用的 Skill 真实存在且拓扑关系无循环依赖。
6. [ ] 输出严格匹配 `templates/` 中定义的输出格式。
7. [ ] 不包含具体厂商私有 Prompt 语法。
8. [ ] 配备了完整的 `README.md` 与人类可读指南。
9. [ ] 至少包含 1 个完整的真实教学案例 (`examples/`)。
10. [ ] 运行 `npm run validate` 检查通过，无错误和警告。

---

## 五、开发与验证工作流

```bash
# 1. 克隆项目
git clone https://github.com/teaching-skills/teaching-skills.git
cd teaching-skills

# 2. 运行框架静态验证（验证所有 Skill, Knowledge, Template, Pack 语法与依赖）
npm run validate

# 3. 运行自动化测试集
npm test

# 4. 生成统一的能力目录清单
npm run build:catalog
```

---

## 六、提交规范 (Commit Convention)

提交信息请遵循语义化 Commit 规范：

- `feat(skill)`: 新增教学技能，如 `feat(skill): add it.algorithm skill`
- `feat(knowledge)`: 新增知识条目，如 `feat(knowledge): add bloom-taxonomy`
- `feat(pack)`: 新增或更新组合包
- `fix(validator)`: 修复验证器相关问题
- `docs`: 文档完善或架构说明更新
- `test`: 新增测试用例

感谢你为中小学教师 AI 赋能贡献力量！🌱
