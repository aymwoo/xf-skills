# 如何验证 Skill (Validate a Skill)

Teaching Skills Framework 提供了静态分析与契约校验工具，用于确保每一个 Skill、Knowledge、Template 和 Pack 符合框架规范。

---

## 1. 验证器校验维度

运行 `npm run validate` 时，验证器将按顺序执行以下 10 项严密检查：

1. **文件存在性**：检查每个 Skill 目录下是否存在 `SKILL.md`。
2. **YAML Front Matter 合法性**：检查 Front Matter 是否被 `---` 包裹且能够正确解析为 YAML/JSON 对象。
3. **必需元数据字段**：检查 `id`, `name`, `display_name`, `version`, `type`, `subject`, `education_level`, `outputs` 是否齐全且类型匹配。
4. **全局 ID 唯一性**：检查所有 Skill ID 与 Pack ID 是否在整个仓库中全局唯一。
5. **依赖存在性**：检查 `depends_on` 声明的依赖 Skill ID 是否真实存在于框架中。
6. **循环依赖检测**：检测 `depends_on` 拓扑图中是否存在有向环。
7. **知识依赖有效性**：检查 `requires.knowledge` 声明的知识引用是否在 `knowledge/` 中有对应文件。
8. **模板输出有效性**：检查 `outputs` 声明的产物模板是否在 `templates/` 中已注册。
9. **工作流完整性**：检查 `SKILL.md` 正文中是否包含标准的 7 步 Workflow 关键词或章节。
10. **Pack 组合包完整性**：检查所有 `pack.yaml` 中声明的 Skills、Knowledge、Templates 是否均有效。

---

## 2. 常用验证命令

```bash
# 1. 完整静态验证（Skill + Pack + Knowledge + Template）
npm run validate

# 2. 仅验证 Skills
npm run validate:skills

# 3. 仅验证 Packs
npm run validate:packs

# 4. 执行自动化测试套件
npm test
```

---

## 3. 常见报错与修复方法

- **`Missing required field: id`**：请检查 `SKILL.md` 最上方是否定义了 `id: <scope>.<name>`。
- **`Duplicate Skill ID: it.programming`**：Skill ID 在全库必须唯一，请修改重复的 ID。
- **`Unknown dependency in depends_on: core.non-existent`**：引用的父 Skill 不存在，请检查拼写或先创建该基础 Skill。
- **`Missing workflow step in SKILL.md`**：请确保正文中包含了完整的 7 步工作流描述。
