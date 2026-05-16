# 2026-05-16 v0.12.0-b1 route/supply/pursuit 上下文

## 当前状态

- `v0.12.0-a1/a2/b1` 第一刀已完成。
- 本轮完成了 MiroFish 第一次完整对接流程固化，并完成 b1 route/supply/pursuit 保守接入。
- 下一步建议：先做 b1 轻量复盘，或进入 b2 前置审查；b2 前已写好 `qingmao_faction_pressure_pack` 请求，等待用户转交。

## 本轮新增/修改

### MiroFish 流程固化

- 全局 skill：`C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
  - version: `0.1.51`
  - 强化 `MiroFish Intake Gate` 与 `MiroFish Proactive Loop`
- 仓库协议：
  - `指导大纲/v0.12.0/codex/00-总览/v0.12.0-MiroFish资料需求与交付协议.md`
  - `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`
  - `指导大纲/vMiroFish/README.md`
  - `指导大纲/vMiroFish/requests/README.md`
  - `指导大纲/vMiroFish/intake-reviews/README.md`

### b1 runtime first cut

- `src/canon/qingmao-route-supply-pursuit-pack.json`
- `src/canon/qingmao-route-supply-pursuit-pack.test.ts`
- `src/engine/v012-qingmao-route-supply-pursuit.ts`
- `src/engine/v012-qingmao-route-supply-pursuit.test.ts`
- `src/engine/v011-qingmao-escape-route-prep.ts`
- `src/engine/v011-qingmao-escape-route-prep.test.ts`
- `src/store/slices/livingWorldSlice.ts`
- `src/store/slices/livingWorldSlice.test.ts`

### 文档同步

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-b1-route-supply-pursuit第一刀.md`

## b1 行为

逃离青茅山准备链现在会输出：

- 3 条路线候选。
- 4 项补给缺口。
- 3 个追击触发。

写入仍只走现有 v22 字段：

- `knownFacts`
- `factionPressure`
- `playerGoals`
- `actionConsequences`
- `worldClock.lastActionId`
- `sceneSessionState.localActionLedger`
- `flags.lastWorldActionReturnContext`

## 严格未做

- 不新增存档字段。
- 不提升 `SAVE_FORMAT_VERSION`。
- 不开放逃离成功。
- 不开放新地点/新地域。
- 不发奖励、材料、元石、蛊虫或蛊方。
- 不改变阵营身份。
- 不结算 NPC 生死或追击成败。
- 不暴露 hidden fact。
- 不扩张 DeepSeek 权限。
- 不吸收 deferred MiroFish factionPressure / hiddenFactRef。

## 验证

已通过：

- `npx vitest run src/canon/qingmao-route-supply-pursuit-pack.test.ts src/engine/v012-qingmao-route-supply-pursuit.test.ts src/engine/v011-qingmao-escape-route-prep.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot`：4 个 test file、19 个测试通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：113 个 test file、659 个测试通过。
- `npm run build`：通过，无 500KB+ chunk warning。
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`：4 个测试通过。

## 下一步提醒

- b1 轻量复盘可检查是否需要把 route/supply/pursuit 做成更可见的 UI 报告。
- 进入 b2 reaction bridge 前，需要用户转交请求 `指导大纲/vMiroFish/requests/2026-05-16-qingmao-faction-pressure-pack.md`，让 MiroFish 产 `qingmao_faction_pressure_pack`。当前 Codex 线程不能直接联系 MiroFish，会话链接仍是 `019e207b-c55d-7e23-b450-efa7a054a165`。
- 如果 b2 要吸收本次 deferred 的 factionPressure，必须重新走 request/intake review 或至少写 b2 专项 intake 复核，不能直接把 b1 review 当 b2 权威。

## Git

- 本阶段未提交/未推送。
- 工作区存在历史脏项；提交前必须只 stage 本阶段相关文件。
