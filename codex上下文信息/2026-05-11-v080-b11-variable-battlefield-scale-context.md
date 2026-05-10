# v0.8.0-b1.1 可变战场规模与 7x5 群像演武上下文

日期：2026-05-11
分支：`codex/v080-b11-variable-battlefield-scale`
基线：`codex/v080-b1-group-combat`
提交目标：`feat: 扩展v0.8群像战斗可变棋盘`

## 目标

b1.1 不把所有群像战默认放大，而是把 v0.8 battlefield 引擎从固定 5x3 抽象为可变战场尺寸，并新增一个 `ambush_7x5` 山谷伏击群像演武。该演武用于验证大空间下的视野、距离、遮蔽、阵位节点、指定护送出口、第三方入场和移动端横向棋盘。

本阶段仍不替换旧 `squadCombatState` / `SquadCombatOverlay`，不接正式剧情写回，不提升 `SAVE_FORMAT_VERSION`。

## 主要实现

- `src/canon/battlefield-combat-rules.json`
  - 新增 `gridPresets.skirmish_5x3` 与 `gridPresets.ambush_7x5`。
  - 7x5 预设包含 35 格：山道、林地遮蔽、阵位节点、危险格、护送出口、第三方入场点，以及前线/中线/后线标签。
  - 新增格子标签：`frontline`、`midline`、`backline`、`escort_exit`、`entry_point`。

- `src/types/index.ts`
  - `BattlefieldCombatState.grid.width/height` 改为动态数字。
  - `BattlefieldCombatState.gridPresetId` 记录当前预设。
  - `BattlefieldCellFlag` 扩展大棋盘战术标签。

- `src/engine/v080-battlefield-combat-engine.ts`
  - `CreateBattlefieldCombatInput` 支持 `gridPresetId` 与 `gridSize`。
  - `createBattlefieldCombatState` 统一通过规则预设或输入尺寸生成棋盘。
  - 边缘判定、护送目标、撤退、观察揭示、射程/遮蔽目标枚举均基于 `state.grid.width/height`。
  - `escort` 可用 `objective.cellId` 指定固定出口；移动行动后会触发本地目标结算。

- `src/engine/v080-battlefield-ui-model.ts`
  - 新增 `createBattlefieldLargeGroupDemoState()`，构建 7x5 山谷伏击群像演武。
  - 演武包含玩家、护阵弟子、斥候、护送目标、敌方头目、阵位副手、隐藏伏兵与铁家第三方巡使。

- `src/store/slices/combatSlice.ts`
  - 新增 `initBattlefieldLargeGroupDemo()`，只写非持久 battlefield UI 字段。

- `src/components/game/GameScreen.tsx`
  - 新增底部入口 `群像战-大阵`。

- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 棋盘列数由 `state.grid.width` 动态设置。
  - 7x5 桌面端使用紧凑格子；移动端棋盘横向滚动。
  - 格子显示护送出口、入场点、前/中/后线、阵位、危险、遮蔽、道痕场等战术标签。

- `src/e2e/installE2eHarness.ts`
  - 新增 `startBattlefieldLargeGroupDemo()`。
  - battlefield 摘要新增 `gridPresetId`、`gridWidth`、`gridHeight`。

## 测试覆盖

- `src/engine/v080-battlefield-group-combat.test.ts`
  - 默认 5x3 不变。
  - `ambush_7x5` 生成 7x5 / 35 格。
  - 越界、重复占位、固定护送出口、7x5 射程枚举、观察揭伏、敌方回合决定性。

- `src/store/slices/v080-battlefield-combat-ui-store.test.ts`
  - 旧 5x3 群像入口不变。
  - 7x5 演武初始化为非持久 battlefield 状态。
  - 观察、阵位行动输出对应 `BattleResolutionStep`。

- `tests/e2e/v080-large-group-battlefield-ui.spec.ts`
  - 桌面 1440x900：35 格、士气、目标、第三方、观察揭伏、阵位争夺和轨迹播放。
  - 移动端 390x844 + reduced motion：7x5 棋盘横向滚动、行动栏可切换、士气/目标信息可读。

## 已验证命令

- `npm test -- src/engine/v080-battlefield-group-combat.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`
- `npm test`：62 个测试文件 / 404 个用例通过。
- `npm run build`
- `npx playwright test tests/e2e/v080-group-battlefield-ui.spec.ts`
- `npx playwright test tests/e2e/v080-large-group-battlefield-ui.spec.ts`
- `npm run test:e2e:long`：18 个长链路用例通过。

## 后续入口

- b1.2 若继续扩深，可以在 7x5 上补“战术视野层”：单位视野、噪声、路径风险和多目标威胁热区。
- 若要保存战斗中断点或战场预设，需要单独设计迁移并提升 `SAVE_FORMAT_VERSION`。
- 正式剧情接入仍只能传战斗意图和场景授权，HP、士气、目标、胜负、第三方介入继续由本地 battlefield 引擎结算。
