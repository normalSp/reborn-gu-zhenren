# 2026-05-13 v0.9.0-b3-5 C-035 泛用场景底图上下文

## 阶段状态

`v0.9.0-b3-5` C-035 已完成：青茅凡战泛用场景底图样板。

本轮没有改战斗规则、伤害、命中、奖励、AP 或存档协议；没有批量生成图片；没有把具体人物战斗图当作 generic 背景。

## 关键落地

- `public/rebrng/scenes/s0-qingmao/qingmao-mortal-battlefield-generic-atmosphere.svg`
  - 新增泛用青茅凡战底图样板。
  - 只表达冷雾、竹影、旧演武坪、金色道痕、玉色空窍环和凡人风险边界。
- `src/canon/qingmao-visual-assets.json`
  - 新增 `qingmao-mortal-battlefield-generic-atmosphere`。
  - `role=background`、`runtimeLayer=scene_background`、`sceneBinding=generic`、`admission=runtime_active`。
  - 绑定 `compositionContractId=c035-qingmao-generic-battlefield-atmosphere`。
- `src/engine/v080-battlefield-ui-model.ts`
  - 新增 `buildQingmaoBattlefieldAtmosphereAsset()`。
  - `buildQingmaoBattlefieldAssets()` 保持只返回三张蛊虫 gu_asset：月光蛊、白玉蛊、酒虫。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 新增 `QingmaoAtmosphereLayer`，仅在青茅凡战状态下渲染底层氛围图。
  - overlay 暴露 `data-qingmao-atmosphere-asset` 供 e2e 验收。
- `scripts/check-qingmao-visual-assets.mjs`
  - 增加 `runtimeLayer/runtimeScope/sceneBinding` 校验。
  - active background 必须具备 Composition Contract、位于 `/rebrng/scenes/s0-qingmao/`，且不得包含具体人物场景标记。

## 文档同步

- 新增 `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b3-5-C035-青茅凡战泛用场景底图样板.md`。
- 更新当前入口 README、路线图、阶段跟踪、真相源索引、需求决策池、截图验收台账、视觉研发方向和专家团 README。
- 更新 `doc/art/s0-qingmao-art-roadmap.md`，记录 C-035 Composition Contract 和 SVG 样板。

## 验证

- `npm run check:qingmao-assets`：通过，7 entries；active=4，review-only=2，blocked=1。
- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，1 file / 7 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm run build`：通过，仅保留既有 chunk warning 与 plugin timings warning。
- `npm test`：通过，87 files / 538 tests。

## 下一步

进入 C-036：青茅战场入场关键演出。

建议范围：

- 只做青茅凡战 overlay 入场/开战第一印象，不全局重皮。
- GSAP 管短入场节奏和背景氛围层；Motion 继续管面板、按钮、棋盘状态。
- reduced motion 下直接显示棋盘和按钮，不依赖动画理解战斗。
- 仍只消费 `BattlefieldCombatState`、`BattleResolutionStep` 和 manifest，不计算伤害、命中、状态、胜负或奖励。
