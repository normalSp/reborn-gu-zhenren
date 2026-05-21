# 2026-05-21 v1.4.0 完成交接稿

## 状态

`v1.4.0` 已完成为本地开发里程碑：`南疆早期低阶区域样板`。

当前分支：`codex/v140-region-sample-closure`

## 用户决策

- D-140-001 至 D-140-010：已批准。
- D-141-001 至 D-141-008：已批准并落地。

## Runtime

新增：

- `src/engine/v140-region-sample-projection.ts`
- `src/components/game/RegionSamplePanel.tsx`
- `tests/e2e/v140-region-sample-projection.spec.ts`
- `src/engine/v140-region-sample-projection.test.ts`

更新：

- `src/components/game/WorldHubPanel.tsx`

## 完成口径

v1.4 只提供 projection-first 区域样板：

- 山路外缘。
- 商队接触窗口。
- 散修落脚提示。
- 商家城外缘门槛。

仍未开放：

- 完整南疆。
- 完整商家城。
- 正式区域状态。
- 正式商队/散修/势力身份。
- 正式交易、价格、库存、奖励。
- NPC 生死、捕获、背叛。
- DeepSeek 区域结论 authority。

## Save / DeepSeek / MiroFish

- `SAVE_FORMAT_VERSION` 仍为 24。
- 无 `regionSampleState` / `regionalSampleState`。
- 无 store action。
- 无 migration/defaults。
- 无 DeepSeek prompt/context/API/model/authority 变化。
- 无新 MiroFish package。
- v0.18 reviewed packs 只作为 source pointer / rule / test material。
- 全书基础包仍为 archive/source-pointer inventory。

## 文档

新增/更新 v1.4 docs under `指导大纲/v1.4.0/codex/00-总览/`：

- a2 MiroFish topic-slice intake。
- b1 runtime 第一刀。
- b1 30 轮 Player Advocate。
- b1 长线漂移检查。
- b2/b3/b4 阶段记录。
- process-1/process-2。
- rc 100 轮 Player Advocate。
- rc live probe 复核。
- rc Skill sync audit。
- rc 质量收束。

同步：

- `指导大纲/项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- 外部 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`mirofish-reborng-export`

## 验证

全部通过：

- `npm test -- src/engine/v140-region-sample-projection.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:e2e -- tests/e2e/v140-region-sample-projection.spec.ts`
- `npm run check:player-advocate-gate -- 指导大纲/v1.4.0/codex/00-总览/v1.4.0-b1-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v1.4.0/codex/00-总览/v1.4.0-rc-Player-Advocate-100轮走查记录.md 100`
- `npm test`：145 files / 790 tests
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run build`
- `npm run test:e2e:long`：8 tests
- `npm run check:production-preview`

## live probe

未执行。原因：v1.4 没有 DeepSeek prompt/context/API/model/authority 变化，所有区域样板由本地 deterministic projection 产生。不得声称 live narrative quality 已验证。

## 下一步

建议开启 `v1.5.0` 专家团启动会，主线候选为长期路线中的 `冲突、追杀、杀招与小队后果深化`。进入 v1.5 前仍需先做 a0/a1/a2 门禁。
