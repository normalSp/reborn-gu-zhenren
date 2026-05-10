# 2026-05-10 v0.8.0-a2 战斗 UI 与动效竖切上下文

## 分支与目标

- 工作分支：`codex/v080-a2-combat-ui-motion`
- 基线分支：`codex/v080-a1-combat-engine`
- 目标：接入 a1 本地凡战引擎，完成可操作的 5x3 凡战棋盘 UI 竖切。
- 边界：不接正式剧情结算，不让 DeepSeek 写入战斗结果，不提升 `SAVE_FORMAT_VERSION`，不重写旧 `CombatOverlay` / `SquadCombatOverlay`。

## 本次实现

- 新增 `src/components/game/BattlefieldCombatOverlay.tsx`：
  - 全屏凡战 overlay。
  - 中央 5x3 棋盘显示地形、遮蔽、阵位、危险、道痕场、单位与目标范围。
  - 左侧我方单位，右侧敌方与战场情报，底部行动栏包含蛊虫、杀招、阵法、身法、观察、撤退。
  - 战斗轨迹按 `BattleResolutionStep[]` 展示 `gu_use`、`hit`、`miss`、`status_apply`、`resource_spend`、`counter`、`failure`、`settlement` 等事实。
- 新增 `src/engine/v080-battlefield-ui-model.ts`：
  - 构建非持久演武战场。
  - 将玩家持有蛊虫或演武测试装配转换为行动卡。
  - 普通按钮候选排除 `passive`、`scene_gated`、`mortal_forbidden`。
  - 统一格式化目标范围、消耗、冷却、失败原因、战斗轨迹摘要。
- 扩展 `src/store/slices/combatSlice.ts`：
  - 新增临时字段 `battlefieldCombatState`、`battlefieldSelectedAction`、`battlefieldValidation`、`battlefieldPlaybackSteps`、`battlefieldTraceCursor` 等。
  - 新增 `initBattlefieldDemo`、`selectBattlefieldAction`、`selectBattlefieldTarget`、`executeSelectedBattlefieldAction`、`advanceBattlefieldRoundAction`、`interruptBattlefieldPendingAction`、`closeBattlefieldCombat` 等动作。
  - 结算只调用 a1 engine API，store/UI 不私算命中、伤害、状态或胜负。
- 更新存档边界：
  - `src/store/initialState.ts` 将 battlefield 临时字段加入 `EXCLUDE_FROM_SAVE`。
  - `src/store/index.ts` 的 partialize 与读档恢复显式排除/重置 battlefield 临时字段。
- 新增动效桥：
  - `src/hooks/useBattlefieldAnimationBridge.ts` 根据当前 step 动态加载 GSAP 时间轴。
  - `src/animations/gsap/battlefieldTimeline.ts` 只控制独立 `.battlefield-gsap-*` effect layer。
  - Motion 负责 UI state、棋盘格、行动卡、轨迹列表和移动端布局；GSAP 只负责独立高强度演出。
- 更新入口与 E2E：
  - `GameScreen` 底部增加 `凡战` 入口。
  - `src/e2e/installE2eHarness.ts` 增加 `startBattlefieldDemo()` 与 battlefield 状态摘要。

## 测试与验收

- `npm test -- src/engine/v080-battlefield-combat-engine.test.ts src/engine/v080-combat-expression-data.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，3 个文件 / 19 个用例。
- `npm test`：通过，60 个测试文件 / 388 个用例。
- `npm run build`：通过。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts`：通过，桌面 1440x900 与移动端 390x844 reduced-motion 共 2 个用例。
- `npm run test:e2e:long`：通过，18 个长链路用例。

## 关键修正

- 移动端 E2E 初次失败是因为 `DebugOverlay` 的 z-index 9999 覆盖了战斗行动卡。`BattlefieldCombatOverlay` 已提升为当前最高层级，确保全屏战斗面板不被调试浮层拦截点击。
- action card 的静态可用性不再只看当前空目标，而是通过任意有效目标探测来判断，避免“尚未选目标”时错误置灰。

## 剩余风险

- a2 仍是演武式竖切，未接入正式剧情选择；剧情选择识别蛊虫和 DeepSeek 候选降级留到 a3。
- 阵法标签在 a2 只展示阵位/不可用原因，完整阵法运行时仍留到后续小版本。
- 群像战斗、第三方介入、伏击链路和士气系统仍属于 b1 范围。
- 若后续需要保存战斗中断点或 pending action，必须先设计迁移并提升 `SAVE_FORMAT_VERSION`。

## a3 入口

- 在剧情 choice 生成前读取玩家 `inventory.gu` 与 `GuExpressionSpec.sceneUtilities`。
- DeepSeek 只提出候选用途和叙事描述；正式资源、状态、胜负、掉落仍由本地引擎结算。
- UI 可以复用 a2 的行动卡、validation 原因、目标范围和 `BattleResolutionStep` 轨迹播放。
