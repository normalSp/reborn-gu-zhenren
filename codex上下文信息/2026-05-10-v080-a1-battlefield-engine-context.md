# 2026-05-10 v0.8.0-a1 凡战棋盘引擎上下文

## 分支与目标

- 工作分支：`codex/v080-a1-combat-engine`
- 基线分支：`codex/v080-roadmap`
- 目标：进入 v0.8.0-a1，完成纯本地凡战 5x3 棋盘引擎竖切。
- 边界：不接 UI、不写 store、不提升 `SAVE_FORMAT_VERSION`，不改旧 `combat-engine.ts` / `squad-combat-engine.ts` 行为。

## 本次实现

- 新增 `src/canon/battlefield-combat-rules.json`：
  - 5x3 棋盘默认规则。
  - 地形、遮蔽、阵位、危险格、冷却、蓄势、反噬、撤退参数。
  - 覆盖首批 Gu shape 与 Killer Move shape。
- 扩展 `src/types/index.ts`：
  - `BattlefieldUnit` 增加攻击、防御、命中、闪避、道痕、冷却、杀招名。
  - `BattlefieldCombatState` 增加 seed、activeEffects、pendingActions、result。
  - 新增 `BattlefieldAction`、`BattlefieldActionValidation`、`BattlefieldActionResolution`、`BattlefieldPendingAction`、`BattlefieldCombatResult`。
- 扩展 `src/engine/gu-expression-registry.ts`：
  - 增加普通战斗可用、scene-gated、passive、forbidden 判断。
- 新增 `src/engine/v080-battlefield-combat-engine.ts`：
  - `createBattlefieldCombatState`
  - `listBattlefieldActionTargets`
  - `validateBattlefieldAction`
  - `executeBattlefieldAction`
  - `advanceBattlefieldRound`
  - `interruptPendingBattlefieldAction`
  - 只使用 `combat-formulas.ts` 的 seeded RNG，不直接调用 `Math.random`。

## 测试覆盖

- 新增 `src/engine/v080-battlefield-combat-engine.test.ts`：
  - 5x3 棋盘、越界、重复占位、占用格移动失败。
  - 月光蛊 line 射程、超距、遮蔽、真元扣除、冷却。
  - adjacent、self、zone、dash、teleport_short shape。
  - 地形 favored / hindered。
  - 状态叠加与去重。
  - 杀招未学会、缺核心蛊、缺辅助蛊、蓄势、打断、释放、反噬。
  - 撤退成功/失败。
  - `Math.random` spy 抛错时仍可 deterministic 结算。
- 扩展 `src/engine/v080-combat-expression-data.test.ts`：
  - 所有 Gu / killer move shape 必须被 `battlefield-combat-rules.json` 支持。
  - 所有 direct mortal 蛊必须能被目标枚举器处理。
  - passive / scene-gated 不进入普通战斗按钮候选。

## 当前验证

- `npm test -- src/engine/v080-battlefield-combat-engine.test.ts src/engine/v080-combat-expression-data.test.ts`：通过，2 个文件 / 17 个用例。
- `npm test`：通过，59 个测试文件 / 386 个用例。
- `npm run build`：通过。

## 剩余风险

- a1 的地形亲和只按 terrainId/cell flags 映射为一层数值修正，a2 UI 需要把 favored/hindered/counter 原因展示出来。
- 部分特殊蛊的剧情用途已能被枚举，但真正的剧情选择接入留到 a3。
- 被动蛊和战前蛊目前只通过 registry 排除普通按钮，实际被动结算留到后续小版本。
- 群像战斗、阵法协同、第三方介入仍是 b1 范围。

## a2 UI 入口

- 战斗 UI 读取 validation：
  - 可用目标格：`validTargetCellIds`
  - 影响格：`affectedCellIds`
  - 目标单位：`targetUnitIds`
  - 失败原因：`reason`
  - 消耗与冷却：`resourceCost`、`cooldown`
- 动效播放读取 `BattleResolutionStep[]`：
  - `move`
  - `gu_use`
  - `killer_move`
  - `hit`
  - `miss`
  - `status_apply`
  - `terrain_change`
  - `counter`
  - `resource_spend`
  - `failure`
  - `settlement`
