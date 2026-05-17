# 2026-05-17 v0.14.0-rc quality closure context

## Current state

- Branch: `codex/v013-npc-faction-reaction`
- Version line: `v0.14.0 青茅后续路线承接`
- Phase: `v0.14.0-rc`
- Local status: rc quality gate passed; commit/push/remote CI evidence pending at the time this handoff was first written.
- MiroFish: `not_needed` for rc; no new canon/IF/route/NPC/faction/hidden-fact content was added.
- DeepSeek: no live narrative probe in rc; no prompt, schema, model, context-builder, story-backflow, or DeepSeek authority change.
- Save format: unchanged, `SAVE_FORMAT_VERSION = 22`.

## What rc closed

- `v0.14.0-a1` route-continuation design gate.
- `v0.14.0-a2` read-only route condition preview.
- `v0.14.0-b1` `遮掩逃离痕迹` preparation action bridge.
- `v0.14.0-b2` `山路逃离路线` candidate route-continuation action.
- `v0.14.0-b3` faction/identity prerequisite display.
- `v0.14.0-b4` FreeGoalPanel `优先摘要`.
- rc 60-round Player Advocate walkthrough.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm test -- --reporter=dot`: passed, 125 files, 707 tests.
- `npm run build`: passed, no 500KB+ chunk warning; only Rolldown plugin timing warning.
- `npm run check:player-visible-copy`: passed, 243 files.
- `npm run check:runtime-assets`: passed, 131 files, zero-byte=0.
- `npm run check:qingmao-assets`: passed, 10 entries, active=4.
- `npm run check:production-preview`: passed.
- `npm run test:e2e -- tests/e2e/v014-cover-tracks-action.spec.ts tests/e2e/v014-mountain-pass-route-continuation.spec.ts tests/e2e/v014-faction-goal-prerequisites.spec.ts tests/e2e/v014-free-goal-summary-priority.spec.ts tests/e2e/v013-social-impact-panel.spec.ts tests/e2e/v011-free-goal-panel.spec.ts tests/e2e/v010-qingmao-region-actions.spec.ts tests/e2e/v090-b3-qingmao-battlefield.spec.ts`: passed, 17 tests.
- `npm run test:e2e:long`: passed, 29 tests.
- `npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-rc-Player-Advocate-60轮走查记录.md" 60`: passed, 60 rounds, 96.7% next-step understanding, confused=2.

## Test-process learning

The first attempt to run v0.14 route e2e and long e2e in parallel produced `ERR_CONNECTION_REFUSED` / `__REBORN_E2E__` wait timeouts in the long suite after several tests had passed. This was a Playwright web-server/process conflict, not a runtime regression. Long e2e must run alone during rc closure. The防坑 is recorded in `.learnings/ERRORS.md`.

## Boundaries preserved

- No formal route state.
- No location change or full Southern Border unlock.
- No Shang clan city system.
- No faction transfer.
- No standing/warrant/recruitment/task/reward system.
- No rewards.
- No NPC death, capture, pursuit success, or pursuit failure result.
- No hidden-fact body reveal.
- No save-format bump.
- No backend/BFF.
- No EdgeOne auto-deploy.

## Next gate

After rc commit/push/CI evidence is recorded, stop for user decision before `v0.15.0` startup review.

Suggested v0.15 decision candidates:

1. 商队递话正式行动样板。
2. 补给准备正式行动样板。
3. 路线候选是否升级为正式进入前最后门禁。
4. live narrative probe 是否作为 v0.15 process 小刀。
5. 移动端推荐下一步按钮排序。

