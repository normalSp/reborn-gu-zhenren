# 2026-05-12 v0.9.0-b1-3 传承/福地桥接上下文

日期：2026-05-12
分支：`codex/v090-b1-world-action-protocol`
前置提交：
- `0b7f4c9 feat: 桥接道场统一行动协议`
- `0d75ddb chore: 清理无用旧报告`

## 本轮目标

把传承/福地接入 `v0.9.0-b1` 统一行动协议：

`线索 -> 出发 -> 本地结算 -> 行动账本 -> 回流文本`

## 落地内容

- `src/engine/v080-inheritance-land-engine.ts`
  - 新增 `buildInheritanceWorldActionBridge`，为出发、试炼、福地认主生成统一行动协议投影。
  - `resolveInheritanceTrialAction` 输出 `WorldActionCandidate`、`WorldActionDeparture`、`WorldActionResolution`、`LocalActionLedgerEntry` 和 `NarrativeReturnContext`。
  - `resolveLandClaimAttempt` 输出福地认主的统一行动协议投影。
  - 洞天边界传闻投影为 blocked / rumor-only，不扣 AP。
- `src/store/slices/inheritanceLandSlice.ts`
  - 出发、试炼、认主都使用统一行动协议写入场景 AP 账本。
  - `startInheritanceTrialAction` 出发扣 AP 后，`resolveInheritanceTrialAction` 复用出发账本，不再二次扣 AP。
  - 直接结算试炼时，试炼自身按统一协议扣一次 AP。
  - 写入 `flags.lastWorldActionReturnContext` 与 `flags.lastInheritanceWorldAction`，供下一轮 DeepSeek 动态上下文承接。
- Skills
  - 已同步更新 `reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion` 的当前阶段事实：b1-3 已完成，下一步是 b1-4 灾劫桥接。

## 世界观与数值边界

- DeepSeek 只能提交传承/福地线索、地灵条件、洞天边界传闻和叙事压力。
- 传承试炼成败、奖励入库、福地认主、资源节点、地灵状态和灾劫压力都由本地引擎决定。
- 洞天仍不开放正式认主、吞并或资源节点收益。
- 福地认主成功只写本地 `heavenlyLand`，后续经营、吞并、地灵成长和灾劫链仍属后续版本。

## 验证

- `npm test -- src/engine/v080-inheritance-land-engine.test.ts src/store/slices/inheritanceLandSlice.test.ts src/engine/v090-world-action-protocol.test.ts src/engine/v080-scene-session-engine.test.ts`：通过。
- `npm test`：86 files / 528 tests 通过。
- `npm run build`：通过；仍保留既有 Vite 500KB+ chunk warning，未发现本轮新增构建阻断。

## 下一步

- 进入 `b1-4`：灾劫桥接。
- 重点把灾劫预兆、待结算场景、本地灾劫结果和回流文本接入统一协议。
- 灾劫后果、资源损益、福地影响和生死结果必须继续由本地引擎决定，DeepSeek 只能承接压力、氛围和候选。
