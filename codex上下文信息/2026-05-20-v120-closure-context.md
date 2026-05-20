# 2026-05-20 v1.2.0 收束上下文交接

## 当前状态

- 分支：`codex/v120-closure-economy-boundaries-rc`
- 基线：从已推送的 `codex/v120-b2-survival-ledger-bgm-runtime` 基线切出。
- 阶段：`v1.2.0` 本地开发收束完成；本轮按 D-132 显式提交并推送至当前语义分支。
- 完成口径：低阶生存经济第一阶段，不是完整经济系统。
- 不涉及：EdgeOne 自动部署、公开发布口径、BFF/backend、DeepSeek 经济权限扩大、正式库存/价格/交易、真实消耗、炼蛊成功/失败结算、黑市/委托/稳定套利、地点/阵营/奖励/NPC 生死。

## 用户批准

- D-123：b3 做炼养用准备、缺口、风险、维护周期可读性。
- D-124：b3 不 bump、不加字段，复用 `survivalEconomyState`。
- D-125：b3 不给完整蛊方、不授予蛊虫/材料、不写成功率、不扣真实资源。
- D-126：b4 做询价、担保、身份风险、拒绝理由、候选窗口。
- D-127：b4 不成交、不写价格表、不开放库存、不加入商队、不开放黑市/委托收益。
- D-128：process-1 做经济反刷、旧档兼容、save 回滚、测试矩阵复核。
- D-129：process-2 做 deterministic drift soak，不默认 live probe。
- D-130：rc 使用 80 轮 Player Advocate。
- D-131：v1.2 剩余阶段不新增 blocking MiroFish 包。
- D-132：继续切语义分支、显式 stage、提交推送，不自动部署 EdgeOne。
- D-133：v1.2 只称“低阶生存经济第一阶段”。
- D-134：触发正式字段/真实结算/DeepSeek 权限/公开口径/live probe 时硬停。

## Runtime 变更

- `src/engine/v120-low-rank-survival-economy-projection.ts`：把 b3/b4/process/rc source refs 和可读边界纳入 projection；明确不结算材料、配方、价格、交易或收益。
- `src/engine/v120-survival-economy-state.ts`：同步 ledger source refs，仍只记录压力、来源、证据和 forbidden writes。
- `src/components/game/LowRankSurvivalEconomyPanel.tsx`：在生存经济面板接入炼养用准备与交易窗口边界按钮，按钮只调用既有本地 action protocol，不写正式经济结算。
- `tests/e2e/v120-low-rank-survival-economy.spec.ts`：覆盖 b3/b4 面板、按钮结果和 v24 ledger 不出现材料/价格/交易字段。
- focused engine/state tests 已补充 b3/b4/source-ref 断言。

## 文档与制度同步

- 新增 `v1.2.0-b3-炼养用准备与失败代价第一刀.md`。
- 新增 `v1.2.0-b4-交易窗口边界第一刀.md`。
- 新增 `v1.2.0-process-1-经济反刷save兼容与回滚复核.md`。
- 新增 `v1.2.0-process-2-长线漂移与知识库复核.md`。
- 新增 `v1.2.0-rc-质量收束记录.md`。
- 新增 `v1.2.0-rc-Player-Advocate-80轮走查记录.md`。
- 更新 v1.2 README、路线图、需求池、测试矩阵、真相源索引、Git 计划、项目仪表盘、AGENTS 与 PROJECT-STATE。
- 同步更新本机 `reborn-expert-council` 与 `game-dev-text` skill 的 current sync override。

## 验证

- `npm test -- src/engine/v120-low-rank-survival-economy-projection.test.ts src/engine/v120-survival-economy-state.test.ts src/store/slices/survivalEconomySlice.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot`：4 files，25 tests 通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run test:e2e -- tests/e2e/v120-low-rank-survival-economy.spec.ts`：1 test 通过。
- `npm run check:player-advocate-gate -- 指导大纲/v1.2.0/codex/00-总览/v1.2.0-rc-Player-Advocate-80轮走查记录.md 80`：80 轮通过，理解率 100.0%，confused=0。
- `npm test`：143 files，784 tests 通过。
- `npm run build`：通过；仅 Rolldown plugin timings warning。
- `npm run check:runtime-assets`：163 runtime files，45 audio，117 images，1 json，83 imageMapRefs，71 audioManifestRefs，zero-byte=0。
- `npm run check:qingmao-assets`：23 entries 通过。
- `npm run check:player-visible-copy`：274 files scanned，通过。
- `npm run test:e2e`：63 tests 通过。
- `npm run test:e2e:long`：7 tests 通过。
- `npm run check:production-preview`：通过；生产预览仍显示已批准的 v1.0 public release label。

## 下一步

建议开 `v1.3.0` 专家团启动会。进入 v1.3 前仍需硬停的事项：真实消耗、炼蛊成功/失败、正式库存/价格/交易、黑市/委托/稳定套利、DeepSeek 经济结算权限、live probe、BFF/backend、公开发布口径、EdgeOne 自动部署。
