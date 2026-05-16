# 2026-05-13 v0.10.0 专家团大纲上下文

## 当前状态

- `v0.9.0` 已正式收口，版本标识为 `0.9.0` / `v0.9.0`。
- EdgeOne Pages 仓库配置已落地，`edgeone.json` 已存在。
- DeepSeek 运行时默认模型冻结为 `deepseek-v4-flash`，用户已要求不要继续评估其他模型。
- 本次制定 `v0.10.0` 大纲和用户决策池，记录用户范围决策，并完成 `v0.10.0-a1` 第一刀。

## v0.10.0 专家团建议主题

`青茅山三寨区域主线可玩化`

理由：`v0.9.0` 已统一“线索 -> 出发 -> 本地结算 -> 行动账本 -> 回流文本”协议，`v0.10.0` 应优先把一个区域做成连续可玩章节，而不是继续铺更多孤立系统。

## 新增文档

- `指导大纲/v0.10.0/codex/00-总览/README.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-总体开发大纲.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-小版本执行路线图.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-需求决策池.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-启动审查与范围冻结.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-真相源索引.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-决策记录.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-a1-范围冻结与真相源建模.md`

## a1 第一刀

- 新增静态真相源：`src/canon/qingmao-region-board.json`。
- 新增验证测试：`src/canon/qingmao-region-board.test.ts`。
- `SAVE_FORMAT_VERSION` 维持 `21`，a1 不提升。
- 原因：a1 只新增静态 canon JSON 和测试，未新增持久化 `qingmaoRegionState`、`regionPressureLedger` 或区域线索账本。
- 验证：`npm test -- src/canon/qingmao-region-board.test.ts` 通过，4 tests passed。

## 用户决策结果

- D-001：批准。`v0.10.0` 主线锁定为 `青茅山三寨区域主线可玩化`。
- D-002：批准。采用“小内容包高质量”策略：12-18 个凡蛊/表现条目、3-5 个遭遇模板、4-6 类战斗行为模板。
- D-003：批准。采用 `canon-near + IF 支线` 世界观口径。
- D-004：批准。继续青茅山视觉深化，先做 2-3 个场景变体、截图构图规范和 V-003 短录屏脚本。
- D-005：批准。v0.10 不评估其他模型，只优化 `deepseek-v4-flash` 的缓存、JSON、retry 成本和世界观闸门。
- D-006：不用。本轮不把 EdgeOne smoke、公开测试存档、发布说明和公开反馈池作为 v0.10 rc 必选范围。
- D-007：批准原则。只有新增持久化字段才提升 `SAVE_FORMAT_VERSION`，具体是否提升在 `v0.10.0-a1` 决定。

## 开发前提醒

- 已批准范围：D-001、D-002、D-003、D-004、D-005、D-007；D-006 不纳入本轮。
- `v0.10.0-a2` 第一刀已完成：`src/engine/v010-qingmao-region-engine.ts` 读取 `qingmao-region-board.json`，按身份筛选线索来源，生成 `WorldActionCandidate`，验证 AI 候选中的身份越界和高阶世界观禁区。
- a2 仍不提升 `SAVE_FORMAT_VERSION`，因为没有新增持久化区域状态或线索账本。
- 验证：`npm test -- src/engine/v010-qingmao-region-engine.test.ts src/canon/qingmao-region-board.test.ts` 通过，8 tests passed；`npx tsc --noEmit --pretty false` 通过。
- `v0.10.0-b1` 第一刀已完成：`resolveQingmaoRegionAction` 将 `clan_school_training` 接到本地道场引擎，将 `mountain_patrol` 接到 field-action/world-action bridge，并继续阻断需要持久化区域状态的 `three_clan_commission`。
- `v0.10.0-b1` 第二刀已完成：`src/store/slices/qingmaoRegionSlice.ts` 暴露青茅区域行动列表和执行路由；族学入口委托现有训练场 store action，山道巡查委托现有 field-action store action，三寨委托继续阻断。
- `v0.10.0-b1` 第三刀已完成：`src/components/game/ActionPanel.tsx` 增加青茅山区域行动小节，桌面/移动端通过 `tests/e2e/v010-qingmao-region-actions.spec.ts` 验证。
- b1 最小闭环仍不提升 `SAVE_FORMAT_VERSION`，因为没有新增 `qingmaoRegionState` 或区域线索持久化字段。
- 验证：`npm test -- src/store/slices/qingmaoRegionSlice.test.ts src/engine/v010-qingmao-region-engine.test.ts src/canon/qingmao-region-board.test.ts` 通过，16 tests passed；`npx tsc --noEmit --pretty false` 通过；`npm run build` 通过；`npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts` 通过，2 tests passed。
- `v0.10.0-b2` 第一刀已完成：`src/canon/qingmao-low-rank-content-pack.json` 建立 16 个低阶凡蛊候选、6 个 5x3 行为模板和 4 个青茅遭遇模板；状态是 `candidate_review`，不作为运行时奖励池。
- `v0.10.0-b2` 第二刀已完成：`src/engine/v010-qingmao-combat-pack.ts` 提供只读 readiness，引擎只把族学切磋、前山巡查、狼影压近推进为 `ready_for_local_validation`，并可生成标准 `CombatEventCandidate` 走现有入口校验。
- `v0.10.0-b2` 第三刀已完成：ActionPanel 增加“青茅凡战候选”只读 readiness 展示；不提供出发按钮，不写 `combatEventCandidates`。
- `v0.10.0-b2` 第四刀已完成：`registerQingmaoCombatCandidateAction` 可把 ready 模板登记到现有 `flags.combatEventCandidates`；ActionPanel 增加“登记候选”按钮；candidate-only 模板仍阻断。
- b2 第四刀仍不提升 `SAVE_FORMAT_VERSION`，因为只复用现有 `combatEventCandidates`，不新增字段、不扣 AP、不结算奖励。
- `v0.10.0-b2` 第五刀已完成：青茅候选登记时保持 `engineValidation = pending`，`NarrativeCombatPanel` 显示入口校验、rewardPolicy 和不可直接掉落边界；点击进入后才由现有战斗 slice 标记为 `accepted`。
- b2 第五刀仍不提升 `SAVE_FORMAT_VERSION`，因为只改变现有候选队列的展示和状态语义，不新增持久化字段、不发奖励。
- `v0.10.0-b2` 收束验收已完成：新增 store 测试确认青茅 `local_engine_only` 候选战后回流不触发 `beastLoot`、材料掉落或奖励池激活，scene ledger 只记录战斗摘要与本地结算结果。
- 验证：`npm test -- src/engine/v010-qingmao-combat-pack.test.ts src/store/slices/qingmaoRegionSlice.test.ts src/canon/qingmao-low-rank-content-pack.test.ts src/engine/v010-qingmao-region-engine.test.ts src/canon/qingmao-region-board.test.ts` 通过，27 tests passed；`npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/engine/v010-qingmao-combat-pack.test.ts src/store/slices/qingmaoRegionSlice.test.ts` 通过，19 tests passed；`npx tsc --noEmit --pretty false` 通过；`npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts` 通过，3 tests passed；`npm run build` 通过。
- `v0.10.0-b3` 启动审查文档已建立：`指导大纲/v0.10.0/codex/00-总览/v0.10.0-b3-资源炼蛊喂养启动审查.md`。用户已批准 D-008 至 D-012：第一刀做青茅低阶食料/蛊材小循环，保守复用 `materialBag`/`feedingCredits`/scene ledger，不提升 `SAVE_FORMAT_VERSION`，收益上限为 1-2 份普通/精品以下注册蛊材或 1 个 feeding credit，炼蛊只开放残方/尝试/失败代价，白玉蛊先显示缺口不新增稳定碎玉片来源。
- EdgeOne 预览黑屏已本地修复：根因是生产 Rolldown 拆包下启动期默认状态同步调用 v0.8/v0.9 engine，触发 JSON/rules 绑定未初始化；修复为新增 store 启动默认状态 helper，启动路径不再调用这些 engine 默认函数。远端需重新部署新构建后恢复。
- 新增发布烟测：`npm run check:production-preview` 会构建、启动 `vite preview`、用 Playwright 检查 `#root` 非空且无 `pageerror`。
- 如果 `b1` 或后续阶段需要新增持久化字段，必须先设计默认迁移值，再提升 `SAVE_FORMAT_VERSION`。
- DeepSeek 只允许写候选叙事、线索、传闻和表达草稿；正式奖励、战斗结算、世界观硬事实必须由本地 engine/canon 决定。
- 子代理仍按稳定性策略使用：默认只读；只有明确文件所有权时才允许写；不把当前关键路径交给子代理。
