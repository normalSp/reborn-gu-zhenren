# 2026-05-16 v0.12.0-b2 NPC/faction reaction bridge context

## Current state

`v0.12.0-b2` 第一刀已完成。
主题：把已公开行动痕迹转成青茅轻量势力/NPC 反应，只写压力、公开记忆和行动后果。

## MiroFish

已审查并吸收：

- 请求：`指导大纲/vMiroFish/requests/2026-05-16-qingmao-faction-pressure-pack.md`
- 主包：`指导大纲/vMiroFish/v0.12.0/qingmao_faction_pressure_pack_export_ready.json`
- intake review：`指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-faction-pressure-pack-intake-review.md`

审查结论：`accepted_for_candidate_pool`，可转为 `accepted_for_rule_draft` 与 `test_sample`。
MiroFish 输出仍不是 canon、不是 runtime authority、不是 DeepSeek authority。

下一步 b3 需要：

- 请求：`指导大纲/vMiroFish/requests/2026-05-16-fang-yuan-public-evidence-pack.md`
- 阻塞等级：`blocking`
- 原因：方源公开旁证最容易泄露第三者玩家不可见的隐藏因果；必须等包到达并通过 intake review 后再进入 b3 runtime 吸收。

## Runtime files

新增：

- `src/canon/qingmao-faction-reaction-bridge.json`
- `src/canon/qingmao-faction-reaction-bridge.test.ts`
- `src/engine/v012-qingmao-faction-reaction-bridge.ts`
- `src/engine/v012-qingmao-faction-reaction-bridge.test.ts`

更新：

- `src/store/slices/livingWorldSlice.ts`
- `src/store/slices/livingWorldSlice.test.ts`
- `src/components/game/FreeGoalPanel.tsx`
- `tests/e2e/v011-free-goal-panel.spec.ts`

## Behavior

FreeGoalPanel 新增“局势反应 / 推演”入口。

当 livingWorldState 已有公开痕迹，例如：

- `knownFacts`
- `actionConsequences`
- `factionPressure`
- `playerGoals`
- `worldClock.lastActionId`

反应桥会匹配本地 rule draft，并写入：

- `factionPressure`
- `npcMemories`
- `actionConsequences`
- `worldClock.lastActionId`
- `sceneSessionState.localActionLedger`
- `flags.lastWorldActionReturnContext`

## Explicit non-goals

b2 没有做：

- 新增持久化字段。
- `SAVE_FORMAT_VERSION` bump。
- 正式声望系统。
- 阵营身份变化。
- 投靠白家/熊家。
- NPC 生死、抓捕、追击成败。
- 奖励、元石、酒、材料、蛊虫、蛊方。
- 新地点或路线成功解锁。
- 正史锚点变化。
- hidden fact 显示。
- DeepSeek 权限扩张。

## Verification

通过：

- `npx vitest run src/canon/qingmao-faction-reaction-bridge.test.ts src/engine/v012-qingmao-faction-reaction-bridge.test.ts --reporter=dot`
  - 2 个 test file、6 个测试通过。
- `npx vitest run src/canon/qingmao-faction-reaction-bridge.test.ts src/engine/v012-qingmao-faction-reaction-bridge.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot`
  - 3 个 test file、16 个测试通过。
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`
  - 4 个测试通过。
- `npx tsc --noEmit --pretty false`
  - 通过。
- `npm test -- --reporter=dot`
  - 115 个 test file、666 个测试通过。
- `npm run build`
  - 通过，无 500KB+ chunk warning。

## Docs updated

- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-b1-route-supply-pursuit第一刀.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-b2-NPC-faction-reaction-bridge第一刀.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## Git status

未提交，未推送。
当前工作区仍有大量历史脏项，提交前必须只 stage 本阶段相关文件。

## Next stop

下一步是 `v0.12.0-b3 方源公开旁证询问`。
不要继续 b3 runtime 开发，直到用户把 `fang_yuan_public_evidence_pack` 请求转交 MiroFish 会话并把交付包放回 `指导大纲/vMiroFish/v0.12.0/`，然后先做 intake review。
