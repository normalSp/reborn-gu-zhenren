# 2026-05-11 v0.8.0-c2.3 剧情战斗编排上下文

## Branch

- 当前分支：`codex/v080-c23-narrative-combat-orchestration`
- 基线：`codex/v080-c22-scene-ap-budget`
- 存档协议：不提升，保持 `SAVE_FORMAT_VERSION = 19`

## Scope

- 新增 `CombatEncounterSpec`、`CombatEncounterState`、`CombatEncounterEntryValidation`、`BattleOutcomeSummary`。
- 新增 `v080-narrative-combat-orchestration` 本地编排器：
  - AI 只能提出 `combat_event_candidates`。
  - 本地校验候选是否可进入战斗，不合规则降级为传闻/危险提示。
  - 合法候选映射到 1v1、5x3 凡战、5x3 群像战或 7x5 群像战。
  - 战后生成 `BattleOutcomeSummary`，写入场景 AP 账本。
- `NarrativeCombatPanel` 改为正式剧情战斗候选入口，同时保留旧 `transientCombatConstraint` 策略面板。
- `ChoicePanel` 增加战斗入口标签支持。
- `GameScreen` 底部战斗按钮改为 Debug/演武语义，正式战斗入口交给剧情候选。
- `state-update-applier` 对 `combat_event_candidates` 立即做本地初筛并记录 `entryValidation`。

## Validation

- `npm test -- src/engine/v080-narrative-combat-orchestration.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`
  - 2 files passed, 9 tests passed.
- `npm run build`
  - passed，只有既有 chunk size warning。

## Remaining Risks

- 首期剧情战斗不持久化中途状态；关闭战斗会按放弃/撤退式结果写回账本。
- 正式 1v1 采用 v0.8 battlefield 引擎的叙事决斗棋盘，不再接旧 `duelState` 的随机掉落链，避免旧 `Math.random` 战利品逻辑污染 c2.3。
- 剧情候选的敌人细节目前使用 `enemyHint` 与风险档位映射，后续 c2.5/rc 可从传承、势力、章节锚点生成更细的遭遇模板。

## Next

- 进入 `v0.8.0-c2.4`：修行与灾劫叙事化。
- 重点修复七转/八转开局不应显示五转升仙说明，并将灾劫从按钮结算改为剧情场景规格与后果链。
