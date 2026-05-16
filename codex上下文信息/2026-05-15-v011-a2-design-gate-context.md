# 2026-05-15 v0.11.0-a2 设计门禁与 runtime skeleton 交接

## 当前状态

- `v0.10.0` 已完成并锁定为本地开发里程碑。
- `v0.11.0` 主线为 `活世界地基与自由意图闸门`。
- `v0.11.0-a0` 玩家可见旧债清理已完成。
- `v0.11.0-a1` 架构与存档加固第一轮已完成。
- 用户已批准进入 `v0.11.0-a2` 活世界状态协议。
- 用户已批准 a2 第一刀先做“设计门禁输出文档 + 字段表 + 测试矩阵”。
- 用户已批准：a2 runtime 新增 `livingWorldState` 持久化字段，`SAVE_FORMAT_VERSION` 已从 `21` 升到 `22`，并同步补默认值、迁移、归一化和测试。

## 本轮完成

- 新增 `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-设计门禁输出.md`
  - 冻结 a2 范围。
  - 固定 DeepSeek、本地 engine、action protocol、Qingmao region、combat/resource/refine/story/canon/store/UI 的读写权矩阵。
  - 固定 DeepSeek 输入输出契约。
  - 固定原著/IF 隐藏事实和 UI 泄密规则。
- 新增 `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-活世界状态协议字段表.md`
  - 设定唯一持久化根字段 `livingWorldState`。
  - 冻结 `worldClock`、`regions`、`knownFacts`、`hiddenFactRefs`、`npcMemories`、`factionPressure`、`playerGoals`、`actionConsequences`、`ifDeviations`。
  - 预留 a3 `IntentCandidate` 和 `IntentRuling` 临时类型口径。
- 新增 `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-测试矩阵.md`
  - 覆盖默认值、v21 到 v22 迁移、Zustand merge、DeepSeek 越权、隐藏事实泄密、青茅回归、a3/b1/b2 延伸样本。
- 同步文档：
  - `AGENTS.md`
  - `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
  - `指导大纲/v0.11.0/codex/00-总览/README.md`
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-启动审查与范围冻结.md`
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-总体开发大纲.md`
- 全局 Skills 同步：
  - `reborn-expert-council` -> `0.1.37`
  - `game-dev-text` -> `2.3.34`
  - `reverend-insanity-lore` -> `0.3.28`
- runtime skeleton 已完成：
  - `src/types/index.ts` 新增 `LivingWorldState`、`IntentCandidate`、`IntentRuling` 类型。
  - `src/store/defaultLivingWorldState.ts` 新增默认值和归一化。
  - `src/store/slices/livingWorldSlice.ts` 新增 store 根字段。
  - `src/store/initialState.ts` 将 `SAVE_FORMAT_VERSION` 升为 `22`。
  - `src/store/index.ts` 在迁移、水合、手动读档路径补 `livingWorldState`。
  - 84 个公开/长测测试存档同步到 `formatVersion 22`。
- 受控 patch API 已完成：
  - `src/engine/v011-living-world-patch.ts` 新增 `applyLivingWorldPatch()`。
  - `src/engine/v011-living-world-patch.test.ts` 覆盖 DeepSeek/UI 拒绝、本地 action 写入、隐藏事实正文剥离和账本 upsert。
- 青茅最小回流样本已完成：
  - `src/store/slices/qingmaoRegionSlice.ts` 在 `mountain_patrol` 成功后写入 `knownFacts/actionConsequences`。
  - 族学训练暂不回流，避免没有稳定 `worldActionResolution` 时造假账。
  - 三寨委托仍等待更完整区域状态机。

## 关键边界

- 本轮只写文档，不改运行时代码。
- `SAVE_FORMAT_VERSION` 当前为 `22`。
- `livingWorldState` 已实现为最小持久化骨架；受控 patch API 已存在；青茅山道巡查已有实际 store action 回流；尚无 UI、DeepSeek prompt 注入、NPC/势力真实反应。
- DeepSeek 仍不能写奖励、地点、战斗事实、原著硬事实、隐藏事实正文或存档字段。
- 原著讨论样例仍不是硬锚点；b1 前必须从本地原著文本抽取摘要事实卡。
- 不创建 Sub-Agent TOML，不拆大目录，不重命名版本前缀，不评估其他模型。

## 下一步建议

下一步建议停下让用户确认是否进入 `v0.11.0-a3` 自由意图裁决：

1. 是否接受 a2 到此收束。
2. 是否批准 a3 首批只做 `obtain_item`、`join_faction`、`investigate`、`travel`、`long_term_goal`。
3. 是否继续保持 DeepSeek 只出候选，本地 engine 裁决。
