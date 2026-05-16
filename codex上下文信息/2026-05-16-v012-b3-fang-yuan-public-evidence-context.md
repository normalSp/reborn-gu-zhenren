# 2026-05-16 v0.12.0-b3 Fang Yuan public evidence context

## Current state

`v0.12.0-b3` 第一刀已完成。
主题：让玩家可以从第三者视角询问方源公开旁证，同时保护隐藏事实和正史锚点。

## MiroFish

已审查并吸收：

- 请求：`指导大纲/vMiroFish/requests/2026-05-16-fang-yuan-public-evidence-pack.md`
- 主包：`指导大纲/vMiroFish/v0.12.0/fang_yuan_public_evidence_pack_export_ready.json`
- intake review：`指导大纲/vMiroFish/intake-reviews/2026-05-16-fang-yuan-public-evidence-pack-intake-review.md`

审查结论：`accepted_for_candidate_pool`，可转为 `fact_card_draft`、`rule_draft` 与 `test_sample`；hidden boundary refs 保持 `hidden_ref_only`。
MiroFish 输出仍不是 canon、不是 runtime authority、不是 DeepSeek authority。

## Runtime files

新增：

- `src/canon/qingmao-fang-yuan-public-evidence.json`
- `src/canon/qingmao-fang-yuan-public-evidence.test.ts`
- `src/engine/v012-qingmao-fang-yuan-public-evidence.ts`
- `src/engine/v012-qingmao-fang-yuan-public-evidence.test.ts`

更新：

- `src/store/slices/livingWorldSlice.ts`
- `src/store/slices/livingWorldSlice.test.ts`
- `src/components/game/FreeGoalPanel.tsx`
- `tests/e2e/v011-free-goal-panel.spec.ts`

## Behavior

FreeGoalPanel 新增“旁证询问”入口。该按钮仅在当前预览裁决目标为 `npc:fang_yuan` 且调查被允许时启用。

执行后写入：

- `knownFacts`：只含玩家可通过公开渠道得到的表象。
- `hiddenFactRefs`：只作本地保护引用。
- `npcMemories`：记录有人打听方源公开痕迹。
- `factionPressure`：记录山寨内部警觉。
- `actionConsequences`
- `worldClock.lastActionId`
- `sceneSessionState.localActionLedger`
- `flags.lastWorldActionReturnContext`

## Explicit non-goals

b3 没有做：

- 新增持久化字段。
- `SAVE_FORMAT_VERSION` bump。
- 正式追踪系统。
- 跟踪成功、抓捕成功或逃脱结果。
- NPC 生死。
- 方源轨迹变化。
- 正史锚点变化。
- 方源隐藏因果展示。
- 春秋蝉、重生、回溯、未来记忆展示。
- 奖励、元石、材料、蛊虫、蛊方。
- 地点解锁。
- DeepSeek 权限扩张。

## Verification

通过：

- `npx vitest run src/canon/qingmao-fang-yuan-public-evidence.test.ts src/engine/v012-qingmao-fang-yuan-public-evidence.test.ts --reporter=dot`
  - 2 个 test file、7 个测试通过。
- `npx vitest run src/canon/qingmao-fang-yuan-public-evidence.test.ts src/engine/v012-qingmao-fang-yuan-public-evidence.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot`
  - 3 个 test file、18 个测试通过。
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`
  - 5 个测试通过。
- `npx tsc --noEmit --pretty false`
  - 通过。
- `npm test -- --reporter=dot`
  - 117 个 test file、674 个测试通过。
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
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-b3-方源公开旁证询问第一刀.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## Git status

未提交，未推送。
当前工作区仍有大量历史脏项，提交前必须只 stage 本阶段相关文件。

## Next step

下一步建议进入 `v0.12.0-process-1 GitHub/CI 工程门禁`。
该阶段不需要 MiroFish 包。

仍需停下来的事项：

- 正式追踪系统。
- 抓捕/逃脱结果。
- 方源轨迹变化。
- hidden fact 展示。
- 新存档字段。
- 奖励、地点、阵营或声望扩权。
