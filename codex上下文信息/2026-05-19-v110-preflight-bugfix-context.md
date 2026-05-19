# 2026-05-19 v1.1 preflight bugfix context

## Scope

Before entering v1.1 runtime work, fixed three user-reported blockers plus one e2e-caught mobile overlay issue:

- New character creation no longer stalls at `等待天命显现...`.
- Rank-five early-stage UI no longer shows ascension; ascension remains rank-five peak only.
- Edited immortal/ascension saves no longer duplicate Gu across mortal inventory and aperture storage.
- DeepSeek runtime prompt cache prefix is more stable by moving volatile store content out of system prompt.
- Mobile DebugOverlay no longer blocks lower/middle UI controls.

## Runtime Boundary

- No save-format bump.
- No new persistent fields.
- No DeepSeek authority expansion.
- No model switch; runtime model remains `deepseek-v4-flash`.
- No formal reward/location/faction/NPC-life result.

## Key Files

- `src/components/game/GameScreen.tsx`
- `src/components/game/AperturePanel.tsx`
- `src/components/game/DebugOverlay.tsx`
- `src/components/game/GuInventoryPanel.tsx`
- `src/store/slices/immortalSlice.ts`
- `src/store/index.ts`
- `src/engine/context-builder.ts`
- `tests/e2e/pre-v110-bugfixes.spec.ts`
- `src/store/slices/immortalSlice.test.ts`
- `src/store/save-normalization.test.ts`
- `src/engine/context-builder-cache.test.ts`
- `src/engine/v080-cultivation-calamity-engine.test.ts`
- `.learnings/ERRORS.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-preflight-bug清理记录.md`
- `指导大纲/项目仪表盘.md`

## Verification

- Focused unit: `npm test -- src/store/slices/immortalSlice.test.ts src/store/save-normalization.test.ts src/engine/context-builder-cache.test.ts src/engine/v080-cultivation-calamity-engine.test.ts --reporter=dot` passed, 4 files / 14 tests.
- Focused e2e: `npm run test:e2e -- tests/e2e/pre-v110-bugfixes.spec.ts` passed, 2 tests.
- Type check: `npx tsc --noEmit --pretty false` passed.
- Full unit: `npm test -- --reporter=dot` passed, 140 files / 768 tests.
- Build: `npm run build` passed.
- Scans: runtime assets, Qingmao assets, player-visible copy, v0.19 content governance all passed.
- Ending panel regression: `npm run test:e2e -- tests/e2e/v080-ending-framework.spec.ts` passed, 2 tests.
- Full e2e: `npm run test:e2e` passed, 89 tests.
- Long e2e: `npm run test:e2e:long` passed, 29 tests.
- Production preview: `npm run check:production-preview` passed.
- DeepSeek live Flash sample: `node scripts/run-deepseek-eval.mjs --live --confirm-cost --models deepseek-v4-flash --sample-limit 3 --max-retries 0 --temperature 0.2 --timeout-ms 30000` passed, 3/3 accepted, cacheHitRatio 0.8157, report at `artifacts/deepseek-eval/2026-05-19T16-14-14-407Z/report.json`.

## Notes

The first attempted live eval through `npm run eval:deepseek:live -- --models ...` timed out because npm argument passing on this Windows setup did not preserve the intended option names, causing a larger-than-intended run. The lingering eval node processes were stopped; existing Vite dev server processes were left alone.

Next recommended step: enter `v1.1.0-a1 route/location/save-format design gate` only after user confirms no more preflight blockers.
