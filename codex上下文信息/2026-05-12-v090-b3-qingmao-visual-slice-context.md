# 2026-05-12 v0.9.0-b3 青茅山凡战视觉竖切上下文

## 当前分支

`codex/v090-b1-world-action-protocol`

## 阶段结论

`v0.9.0-b3` 第一刀已完成。当前只完成青茅山凡战视觉竖切最小样板，不代表完整美术资产管线或全局 UI 重皮完成。

## 落地内容

- `src/engine/v080-battlefield-ui-model.ts`
  - 新增 `createQingmaoMortalBattlefieldState()`。
  - 新增 `isQingmaoMortalBattlefield()` 与 `buildQingmaoBattlefieldCues()`。
  - b3 样板绑定月光蛊、白玉蛊、酒虫；酒虫因 `scene_gated` 不进入普通行动卡。
- `src/store/slices/combatSlice.ts`
  - 新增 `initQingmaoMortalBattlefieldDemo()`。
  - b3 battlefield 仍为非持久运行时状态，不提升 `SAVE_FORMAT_VERSION`。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - b3 状态下显示 `v0.9.0-b3 青茅山凡战竖切`。
  - 显示月光蛊、白玉蛊、酒虫和 C-020 美术边界提示。
  - UI 只消费 action card、validation、battlefield state 和 `BattleResolutionStep`。
- `src/components/game/GameScreen.tsx`
  - Debug/演武入口新增“青茅”按钮。
- `src/e2e/installE2eHarness.ts`
  - 新增 `startQingmaoMortalBattlefieldDemo()`。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 覆盖桌面 b3 样板、月光蛊执行、酒虫不作为攻击按钮、移动端 reduced motion。

## 文档同步

- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b3-启动审查与范围冻结.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b3-第一刀验收审查.md`
- `指导大纲/v0.9.0/codex/00-总览/README.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-开发阶段跟踪.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-小版本执行路线图.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-真相源索引.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/README.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/07-视觉研发方向.md`
- `doc/art/s0-qingmao-art-roadmap.md`

## 世界观与美术边界

- 月光蛊：作为直线月刃攻击，遮蔽、命中、消耗和伤害只认本地 battlefield 引擎。
- 白玉蛊：作为自我护体表现，不暗示仙体、永生或十转力量。
- 酒虫：只作为场景门槛/战前真元支持提示，不作为普通攻击按钮。
- 美术不暗示仙蛊、十转、永生、宿命蛊归属或宝黄天正式交易。
- 生图“完整成片感”提示已记录为后续资产阶段实验，不在本刀生成新图。

## 验证

- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/engine/v080-combat-expression-data.test.ts`：通过，2 files / 16 tests。
- `npm run build`：通过，仅保留既有 500KB+ `combat-squad` chunk warning。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，2 tests。
- `npm test`：通过，87 files / 538 tests。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。

## 下一步

专家团候选需求已写入 `v0.9.0-需求决策池.md`：

- C-022 月刃连斩/白玉护体强演出 storyboard。
- C-023 现有青茅山资产接入清单。
- C-024 b3 截图验收台账。
- C-025 战斗行动卡信息密度整理。

建议下轮优先处理 C-022、C-023、C-024；C-025 可小范围处理或延期。
