# 2026-05-20 v1.1.0 completion context

## 状态

`v1.1.0` 已完成为本地开发里程碑。

已实施：

- `SAVE_FORMAT_VERSION = 23`。
- 新增唯一持久对象 `routeLocationState`。
- 新增 `src/canon/v110-route-location-state-rules.json`。
- 新增 `src/engine/v110-route-location-state.ts`，含默认、迁移派生、normalization、sync action、T0 deterministic soak。
- Store/save 接入 v22 -> v23 保守迁移。
- 世界面板新增 `路线` tab 和 `RouteLocationPanel`。
- E2E harness 暴露 `routeLocation` 摘要。
- focused tests、v110 e2e、180 轮 Player Advocate gate 已通过。
- D-025 小规模 live DeepSeek drift probe 已由用户单独批准并执行：3 样本 x 4 checkpoint，`deepseek-v4-flash`，手动 live，不进 CI。
- D-025 初次 final run 暴露 1 个 P0 hidden-name echo；C27 后 clean-final 已通过阻塞门：12/12 accepted，P0=0，P1=0，P2=1。
- runtime 已移除 `context-builder` 中受保护隐藏事实硬编码，并新增 L4 `C27 隐藏因果名词保护`，拒绝玩家可见叙事/选项泄漏受保护隐藏因果名词。

未实施/仍需另批：

- 扩大 live probe 的成本、模型、样本、轮次，或把 D-025 小样本结果宣传成大规模长线 live quality 已验证。
- 未自动部署 EdgeOne。
- 未新增奖励、阵营、NPC 生死、完整南疆、商家城核心、BFF/backend 或 DeepSeek 字段写入权限。

## 关键文件

- `src/types/index.ts`
- `src/canon/v110-route-location-state-rules.json`
- `src/engine/v110-route-location-state.ts`
- `src/engine/v110-route-location-state.test.ts`
- `src/store/initialState.ts`
- `src/store/index.ts`
- `src/store/save-normalization.test.ts`
- `src/store/slices/livingWorldSlice.ts`
- `src/store/slices/livingWorldSlice.test.ts`
- `src/components/game/RouteLocationPanel.tsx`
- `src/components/game/WorldHubPanel.tsx`
- `src/e2e/installE2eHarness.ts`
- `tests/e2e/v110-route-location-state.spec.ts`
- `src/engine/context-builder.ts`
- `src/engine/canary-assertions.ts`
- `scripts/run-v110-live-drift-probe.mjs`
- `tests/evals/deepseek-v110-drift/samples.json`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-a2-字段表迁移矩阵与主题切片门禁.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-rc-Player-Advocate-180轮走查记录.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-D025-live-drift-probe记录.md`

## 已跑验证

- `npm test -- src/engine/v110-route-location-state.test.ts src/store/save-normalization.test.ts src/store/slices/livingWorldSlice.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run check:player-visible-copy`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm run test:e2e -- tests/e2e/v110-route-location-state.spec.ts`
- `npm run check:player-advocate-gate -- 指导大纲/v1.1.0/codex/00-总览/v1.1.0-rc-Player-Advocate-180轮走查记录.md 180`
- `npm run test:e2e`
- `npm run test:e2e:long`
- `npm run check:production-preview`
- `node scripts/run-v110-live-drift-probe.mjs --dry-run`
- `node scripts/run-v110-live-drift-probe.mjs --live --confirm-cost --model deepseek-v4-flash --temperature 0.2 --max-tokens 1100 --timeout-ms 45000`：final run 11/12 accepted，P0=1，P1=0，P2=2；报告 `artifacts/deepseek-drift-probe/v1.1.0-D025/2026-05-20T09-43-00-391Z/report.json`
- `node --check scripts/run-v110-live-drift-probe.mjs`
- `node scripts/run-v110-live-drift-probe.mjs --live --confirm-cost --model deepseek-v4-flash --temperature 0.2 --max-tokens 1100 --timeout-ms 45000 --max-retries 2`：clean-final 12/12 accepted，P0=0，P1=0，P2=1；报告 `artifacts/deepseek-drift-probe/v1.1.0-D025/2026-05-20T10-28-35-028Z/report.json`
- `npm test -- src/engine/canary-assertions.test.ts src/engine/context-builder-cache.test.ts src/api/deepseek.test.ts`
- `npx tsc --noEmit --pretty false`

production preview 首屏仍为 v1.0 public release label。这是有意保留：v1.1 公开发布口径尚未由用户批准。

## 下一步建议

1. 用户若要公开发布 v1.1，需要另开 release wording/hero/copy 决策，不自动继承 v1.0 发布口径。
2. 若进入 v1.2，先开专家团启动会，围绕低阶经济正式化，不把 v1.1 的 route scope 扩成完整南疆。
