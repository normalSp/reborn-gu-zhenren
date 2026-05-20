# 2026-05-20 v1.1.0 a1 决策同步交接

## 当前结论

- `v1.1.0-a1` route/location/save-format 设计门禁已通过用户拍板。
- 用户批准 D-019 至 D-024。
- 用户暂不批准 D-025：不得在 b1/rc 默认执行 live DeepSeek drift probe。
- 当前仍未进入 b1 runtime 代码实现。

## 已批准但尚未实施

- b1 可将 `SAVE_FORMAT_VERSION` 从 `22` 提升到 `23`。
- b1 可新增单一聚合对象 `routeLocationState`。
- scope 仅限 route/location/region 地基。
- 迁移必须保守，旧档默认不应被误送到新区域。
- b1 测试门包含 focused tests、e2e、copy scan、50 轮 Player Advocate 和 T0 deterministic soak。
- a2 可把 v1.1 三包和全书基础包相关主题切片转为测试样本、规则草稿或 fact-card 草稿。

## 明确禁止

- a2 完成前不得进入 b1 runtime 字段实现。
- 不得新增正式地点、阵营、奖励、NPC 生死或高阶原著事实结果。
- 不得扩大 DeepSeek 权限。
- 不得把 MiroFish 或知识库材料直接作为 runtime canon 或 DeepSeek visible context。
- 不得自动部署 EdgeOne。
- 不得执行 live DeepSeek drift probe；小规模 live probe 需等 b1/b2 稳定后另行请用户批准成本、模型、样本和轮次。

## 下一步

下一步不是直接写 b1 runtime，而是进入 `v1.1.0-a2 MiroFish intake 与字段表`：

1. 将 D-019 至 D-024 落成 `routeLocationState` 字段表。
2. 写清 v22 -> v23 迁移矩阵、defaults、normalization 和旧档样本。
3. 对 v1.1 三包和全书基础包做青茅到南疆早期外缘主题切片。
4. 把切片结果转成测试样本、规则草稿或 fact-card 草稿，不进入 runtime authority。
5. 定义 b1 T0 deterministic soak 输入、checkpoint 和通过标准。

## 本次同步的入口

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/v1.1.0/codex/00-总览/README.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-a1-route-location-save-format设计门禁.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-需求决策池.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-测试矩阵.md`

## 技能同步

- `reborn-expert-council` 更新到 `0.1.84`。
- `game-dev-text` 更新到 `2.3.53`。
- `reverend-insanity-lore` 更新到 `0.3.44`。

## 验证

- 本次只做文档、交接和 skill 口径同步。
- 未修改 runtime 源码、测试脚本、package、CI 或部署配置。
- 已确认当前 b1 runtime 的剩余前置就是 a2；不需要用户再为 D-019 至 D-024 重复拍板。
