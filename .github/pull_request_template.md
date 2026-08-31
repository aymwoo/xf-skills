## 变更描述 (Pull Request Summary)

请简要描述本次 PR 带来的主要变更（如新增 Skill、优化知识库、更新测试用例等）。

---

## 变更类型 (Type of Change)
- [ ] 🎯 新增/更新 Skill (`skills/`)
- [ ] 📚 新增/更新 Knowledge (`knowledge/`)
- [ ] 📝 新增/更新 Template (`templates/`)
- [ ] 📦 新增/更新 Pack (`packs/`)
- [ ] 🛠️ 校验器与工具脚本优化 (`scripts/`)
- [ ] 🧪 单元测试与 Fixtures (`tests/`)
- [ ] 📖 文档更新 (`docs/`)

---

## 合规检查清单 (Checklist)
- [ ] 所有涉及的 `SKILL.md` 均包含完整有效的 YAML Front Matter
- [ ] Skill ID 唯一且符合 `<scope>.<skill-name>` 命名规则
- [ ] 没有将课标与学科知识硬编码在 Skill 流程中
- [ ] 本地运行 `npm run validate` 检查通过
- [ ] 本地运行 `npm test` 测试集全部通过
- [ ] 包含至少一个标准示例 (`examples/`)
