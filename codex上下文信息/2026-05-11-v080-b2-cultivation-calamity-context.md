# 2026-05-11 v0.8.0-b2 修行与灾劫深化上下文

分支：`codex/v080-b2-cultivation-calamity`  
基线：`codex/v080-b11-variable-battlefield-scale`  
提交目标：`feat: 深化v0.8修行与灾劫系统`

## 范围

b2 进入正式持久化开发，不再是临时 UI 演武。`SAVE_FORMAT_VERSION` 从 `15` 升到 `16`，新增 `cultivationState`，覆盖一至五转修行、大境界突破、五转巅峰升仙和六转福地灾劫。七至九转只保留后续扩展钩子。

## 关键文件

- `src/canon/v080-cultivation-calamity-rules.json`：修行、突破、升仙、灾劫规则源。
- `src/engine/v080-cultivation-calamity-engine.ts`：纯本地结算引擎，seeded RNG，禁止 `Math.random`。
- `src/store/slices/cultivationSlice.ts`：正式 store action，兼容旧 `practiceCultivation` / `attemptBreakthrough`。
- `src/store/initialState.ts`、`src/store/index.ts`：v16 默认值和迁移。
- `src/engine/state-update-applier.ts`：阻断/降级 AI 直接写境界、低阶仙元和升仙/福地越权。
- `src/components/game/ActionPanel.tsx`：修行深化 UI、三气、压力、灾劫预览和本地轨迹。
- `src/e2e/installE2eHarness.ts`：`startCultivationDeepeningDemo()`。
- `tests/e2e/v080-cultivation-calamity.spec.ts`：桌面、移动端、reduced motion 验收。

## 存档

`测试存档/v0.7.0` 全量升级为 `formatVersion = 16`，每个存档补 `state.cultivationState`。

新增专项：

- `39-v0.8-b2-五转巅峰升仙准备.json`
- `40-v0.8-b2-升仙失败压力.json`
- `41-v0.8-b2-六转福地灾劫.json`

## 本地安全原则

- DeepSeek 只可写候选、预兆、传闻和叙事压力。
- 境界、升仙、灾劫、资源损益、福地结果全部由本地 b2 action 结算。
- 六转升仙只生成福地，不生成洞天。
- `CultivationResolutionStep[]` 是 UI 播放事实，不和 `BattleResolutionStep[]` 混写。

## 已验证

- `npm test -- src/engine/v080-cultivation-calamity-engine.test.ts src/store/slices/cultivationSlice.test.ts`
- `npm test -- src/store/test-save-fixtures.test.ts src/engine/v070b-squad-data.test.ts`
- `npm test -- src/engine/v080-cultivation-calamity-engine.test.ts src/store/slices/cultivationSlice.test.ts src/store/test-save-fixtures.test.ts`
- `npm run build`
- `npx playwright test tests/e2e/v080-cultivation-calamity.spec.ts`

最终回归：

- `npm test`：64 个测试文件、415 个测试通过。
- `npm run build`：通过，仅保留既有 `combat-squad` chunk 大小提示。
- `npx playwright test tests/e2e/v080-cultivation-calamity.spec.ts`：2 个测试通过。
- `npm run test:e2e:long`：18 个长链路测试通过。

## 后续入口

- b2 后续可把剧情场景中的“突破预兆/灾劫压力”映射到 `cultivationState` 的只读提示，但正式结算仍走本地 action。
- 若后续保存战斗中断点或灾劫倒计时，需要重新设计迁移，不复用临时 battlefield 状态。
- 洞天、七至九转灾劫、万劫链路、仙蛊屋和大型战争灾劫留到后续版本。
