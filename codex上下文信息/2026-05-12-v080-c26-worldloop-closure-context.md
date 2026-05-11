# v0.8.0-c2.6/c2.7/c2.8 世界闭环补强上下文

日期：2026-05-12
分支：`codex/v080-c26-worldloop-closure`
基线：`codex/v080-c25-inheritance-land-claim`

## 实现范围

- 战斗阶段制：
  - `BattlefieldCombatOverlay` 显示阶段、当前行动者、已行动/剩余我方单位。
  - 群像战“结束我方阶段”会进入敌方阶段，调用本地 `resolveBattlefieldEnemyTurn()`，再结算并回到下一我方阶段。
  - 追加 `enemy_turn_start`、`enemy_turn_end`、`player_turn_start` 轨迹步骤，方便 UI 播放和日志解释。

- 战斗特效可读性：
  - battlefield GSAP effect layer 提升到 `z-[80]`，高于棋盘和单位。
  - 效果层保持 `pointer-events: none`，不挡按钮，不控制 Motion 管辖的棋盘格/单位卡。

- 行动入口清理：
  - `ActionPanel` 不再展示调息/修行/突破/升仙/灾劫主操作，只提示这些入口已经移入空窍/仙窍。
  - 野外行动在场景条件不满足时默认隐藏，并显示原因卡。
  - `AperturePanel` 新增 `aperture-cultivation-actions`，凡人显示调息/修行/突破/升仙，六转以上只显示仙窍/福地/灾劫，不显示五转升仙内容。

- 背包用蛊剧情优先：
  - `GuInventoryPanel` 的用蛊按钮不再调用即时 `useGu`。
  - 点击后消耗场景 AP，写入 `LocalActionLedgerEntry`，准备 `gu_use_intent` 叙事推进意图。
  - 用蛊实际效果仍需剧情选择、场景 AP 和本地校验承接。

- 终局展示收束：
  - `EndingResolverPanel` 默认只显示“结束此局 / 收束因果”和“查看详情”。
  - 证据、候选、压力日志、解析轨迹折叠到详情，不再默认铺满面板。

- 传承线索闭环：
  - `InheritanceLandPanel` 移除样板入口按钮，改为“剧情线索账本”。
  - `startInheritanceTrialAction()` 出发时消耗场景 AP，准备 `inheritance_departure` 叙事推进意图。
  - 试炼、奖励、福地认主、地灵、资源节点仍由本地传承/福地引擎结算；洞天只保留传闻和禁区。

## 验证

- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/store/slices/inheritanceLandSlice.test.ts`：通过。
- `npm test`：79 个测试文件 / 494 条用例通过。
- `npm run build`：通过，仅保留既有 chunk 大小警告。
- `npx playwright test tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-cultivation-calamity.spec.ts tests/e2e/v080-ending-framework.spec.ts tests/e2e/v080-inheritance-land.spec.ts`：9 条通过。
- `npm run test:e2e:long`：18 条通过。

## 剩余风险

- 背包用蛊当前会消耗 1 点场景 AP 登记意图。若后续希望“只表达意图、不扣 AP”，需要调整 `spendSceneActionBudget()` 的 0 成本策略或新增专门的意图账本。

## 后续入口

- `v0.8.0-content-rc`：补精选剧情链，让传承线索、剧情战斗、修行灾劫真正从文本中持续触发。
- `v0.9`：完整原著传承、全部无主福地/洞天、地灵/天灵长期经营、七至九转万劫链和更大规模战争系统。
