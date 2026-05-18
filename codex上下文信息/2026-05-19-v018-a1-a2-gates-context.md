# 2026-05-19 v0.18.0 a1/a2 门禁交接

## 当前状态

- 用户已批准 v0.18 D-001 至 D-008。
- v0.18 主线确定为 `南疆路线与多区域承接`。
- v0.18 小版本切分确定为 `a1/a2/b1/b2/b3/b4/b5/rc`。
- v0.18 MiroFish 三包已交付并通过 intake review。
- 本轮没有改运行时代码，没有新增存档字段，没有扩大 DeepSeek 权限，没有新增 BFF/backend，没有开放正式路线、地点、阵营、奖励或 NPC 生死结果。

## 本轮新增/更新

- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-a1-路线地点存档BFF设计门禁.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-a2-MiroFish-intake与字段表.md`
- `指导大纲/vMiroFish/intake-reviews/v0.18.0/2026-05-19-v018-three-pack-intake-review-summary.md`
- 更新 `v0.18.0` README、启动审查、需求决策池、MiroFish 协议、测试矩阵、真相源索引、小版本路线图、Git 计划。
- 更新根仪表盘、AGENTS、PROJECT-STATE 和外部 `reborn-expert-council` skill。

## MiroFish intake 结论

三包均合格：

- `v018_route_entry_state_and_milestones_pack`：8 items，10 source pointers，可用于 b1/b2 rule draft 和 test sample。
- `v018_southern_border_low_rank_region_fact_cards_pack`：8 items，14 source pointers，可用于 b3/b5 fact-card draft 和 test sample。
- `v018_post_qingmao_pressure_reaction_pack`：8 items，13 source pointers，可用于 b4 rule draft 和 test sample；其中 `v018_hidden_982eba1c3730` 只能 deferred/human_review_only。

共同边界：

- 不进入 runtime truth。
- 不进入 DeepSeek authority。
- 不直接成为 canon anchor。
- 不直接展示隐藏事实。
- 不直接赋予奖励、地点、阵营、任务、NPC 生死。

## a1 结论

路线状态分层：

- `candidate`
- `commitment`
- `route_entered`
- `region_arrived`
- `hidden_route_pressure`

b1 可以复用 existing v22 字段：

- `playerGoals`
- `knownFacts`
- `hiddenFactRefs`
- `actionConsequences`
- `factionPressure`
- `npcMemories`
- `localActionLedger`
- `lastWorldActionReturnContext`
- `worldClock.lastActionId`

b2 若要写正式 `routeState/locationState`，必须停下来让用户批准 `SAVE_FORMAT_VERSION = 23`、迁移、默认值、旧档测试和 e2e。

## a2 结论

MiroFish 字段只能经过 RebornG 重写后进入：

- `RouteEntryCandidate`
- `RegionFactDraft`
- `RoutePressureDraft`

原始 MiroFish item 不得进入 runtime、UI、DeepSeek prompt。hidden/quarantined item 只能作为本地人工审查 locator。

## 下一步

可以进入：

`v0.18.0-b1 青茅离开路线正式门槛样板`

b1 限定：

- 使用 existing v22 字段。
- 通过统一行动协议写入。
- 不写正式 `route_entered`。
- 不新增 persistent route/location 字段。
- 不开放新地域、阵营、奖励、NPC 生死或 DeepSeek 权限。

## Git 状态

- 本轮应提交 a1/a2 文档、v0.18 MiroFish 交付包、intake review、仪表盘/AGENTS/PROJECT-STATE/handoff。
- 不 stage 当前历史脏文件：美术候选、zip、artifacts、bgm、`.cursor`、`指导大纲/大方向`。
