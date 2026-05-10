# 2026-05-11 v0.8.0-b1 群像战斗演武竖切上下文

## 分支与目标

- 工作分支：`codex/v080-b1-group-combat`
- 基线分支：`codex/v080-a3-narrative-gu-expression`
- 目标：在 v0.8 battlefield 引擎上扩展群像战演武竖切，覆盖多单位、伏击、阵位、士气、援护、撤退、保护/护送目标和第三方介入。
- 边界：不替换旧 `squadCombatState` / `SquadCombatOverlay`，不接正式剧情结算，不写入正式存档，不提升 `SAVE_FORMAT_VERSION`。DeepSeek 只能提出剧情候选或战斗意图，正式 HP、真元、状态、士气、目标、胜负和撤退仍由本地引擎结算。

## 本次实现

- `src/canon/battlefield-combat-rules.json`
  - 新增 `group` 规则段，覆盖士气、援护、守护、协攻、伏击、观察、阵位控制、第三方入场、目标结算和多人撤退惩罚。
- `src/types/index.ts`
  - `BattlefieldCombatState` 增加 `mode`、`activeUnitId`、`actedUnitIdsThisRound`、`morale`、`objectives`、`ambush`、`thirdParties`。
  - `BattlefieldUnit` 增加 `role`、`morale`、`threat`、`guardTargetId`、`revealed`、`objectiveTags`。
  - `BattlefieldActionType` 增加 `assist`、`guard`、`rally`、`formation`、`observe`。
  - `BattleResolutionStepKind` 增加 `assist`、`guard`、`ambush`、`formation`、`objective`、`third_party`。
- `src/engine/v080-battlefield-combat-engine.ts`
  - 保留 a1/a2 API，并新增 `createBattlefieldGroupCombatState`、`listBattlefieldTurnOrder`、`resolveBattlefieldEnemyTurn`、`resolveBattlefieldAmbushOpening`。
  - 群像战全部使用 seeded RNG，不调用 `Math.random`。
  - `guard` 减免下一次伤害，`assist` 提供下一次行动命中/伤害加成，`rally` 恢复士气，`formation` 建立/争夺阵位，`observe` 揭示伏击、遮蔽单位、危险格和第三方动向。
  - 目标系统支持保护目标、护送目标和击破关键敌人，第三方按本地规则在指定回合入场。
- `src/engine/v080-battlefield-ui-model.ts`
  - 新增 `createBattlefieldGroupDemoState()` 演武状态。
  - 群像模式的“阵法”行动承载守护、援助、振奋、占阵，“观察”行动承载侦察揭示。
  - 普通行动候选仍排除 `passive`、`scene_gated`、`mortal_forbidden`。
- `src/store/slices/combatSlice.ts`
  - 新增 `initBattlefieldGroupDemo` 和 `selectBattlefieldActor`。
  - 群像演武复用非持久 `battlefield*` 字段；多名我方单位可手动切换 active actor。
  - 群像敌方回合走 `resolveBattlefieldEnemyTurn`，store/UI 不私算命中、伤害、状态或胜负。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 支持群像战标题、我方单位切换、士气条、目标卡、中立/第三方单位、隐藏/已揭示状态、阵位行动与群像战轨迹。
  - Motion 继续负责单位切换、行动卡、tooltip、状态条与列表重排；GSAP 只处理伏击、破阵、第三方入场、士气崩落等独立效果层。
- `src/components/game/GameScreen.tsx`
  - 底部新增 `群像战` 入口，旧 `凡战` 演武入口保留。
- `src/e2e/installE2eHarness.ts`
  - 新增 `startBattlefieldGroupDemo()`，E2E 可直接启动 b1 群像演武。

## 测试记录

- `npm test -- src/engine/v080-battlefield-group-combat.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，覆盖群像引擎与 store 桥接。
- `npm test -- src/engine/v080-battlefield-combat-engine.test.ts src/engine/v080-combat-expression-data.test.ts src/engine/v080-battlefield-group-combat.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，确认 a1/a2 规则与 b1 扩展未互相破坏。
- `npm run build`：通过。
- `npm test`、`npx playwright test tests/e2e/v080-group-battlefield-ui.spec.ts`、`npm run test:e2e:long`：本文件创建后继续执行并在最终提交前确认。

## 剩余风险

- b1 是演武竖切，尚未把剧情选择直接转入群像战实例；后续若接剧情，只能传入战斗意图或场景授权，正式结算仍必须由本地 battlefield 引擎输出 `BattleResolutionStep[]`。
- 5x3 棋盘继续沿用 a1/a2 规格；大型战役、战线扩张和多波次兵力调度留到后续版本。
- 仙蛊、仙蛊屋、正式战争存档写回仍不进入 b1。
- 如果后续要保存战斗中断点、active actor、objective 或 third party 状态，必须先设计迁移并提升 `SAVE_FORMAT_VERSION`。

## 后续入口

- b2：可从本地群像战目标系统接入修行、灾劫和空窍/仙窍资源压力，但仍需先判断哪些状态需要持久化。
- a3 后续：剧情蛊虫表现化可生成“发起群像战/伏击/护送/保护”的本地意图，不允许 DeepSeek 直接写正式战斗结果。
- UI 继续强化时，优先打磨群像行动原因、目标风险、第三方立场变化和移动端信息密度。
