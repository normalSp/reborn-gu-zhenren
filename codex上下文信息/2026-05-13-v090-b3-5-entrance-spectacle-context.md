# 2026-05-13 v0.9.0-b3-5 C-036 入场关键演出上下文

## 阶段状态

`v0.9.0-b3-5` C-036 已完成：青茅战场入场关键演出。

本轮没有改战斗规则、伤害、命中、AI、AP、奖励、掉落或存档协议；没有引入 Three.js/WebGL；没有改变 DeepSeek 边界。

## 关键落地

- `src/animations/gsap/battlefieldTimeline.ts`
  - 新增 `playQingmaoBattlefieldEntranceTimeline()`。
  - 桌面非 reduced-motion 下播放雾幕、标题、道痕线、空窍环、扫光的短入场节奏。
  - 播放完成后标记 `data-entrance-timeline="complete"`。
- `src/hooks/useBattlefieldAnimationBridge.ts`
  - 新增 `useQingmaoBattlefieldEntranceBridge()`。
  - reduced motion 下直接标记 `data-entrance-timeline="reduced"`，不依赖动画理解战斗。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 新增 `QingmaoEntranceBanner`。
  - 横幅位于 header 与主体之间，是布局内 band，不遮挡棋盘、按钮或战斗轨迹。
  - 文案为 `青茅山凡战 / 月下演武 · 旧石阵线 · 凡人尺度`。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 桌面验收入场横幅、C-035 背景资产绑定和 GSAP complete 标记。
  - 移动端 reduced-motion 验收静态兜底。

## 验证

- `npm run check:qingmao-assets`：通过，7 entries；active=4，review-only=2，blocked=1。
- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，1 file / 7 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm run build`：通过，仅保留既有 chunk warning 与 plugin timings warning。
- `npm test`：通过，87 files / 538 tests。

## 下一步

进入 C-037：月光/白玉/禁忌演出衔接抛光。

建议范围：

- 只细化现有月刃、白玉护体、禁忌门槛的 GSAP 衔接。
- 继续只消费 `BattleResolutionStep`、storyboard 和 effect anchor。
- 不新增伤害、命中、状态、胜负、奖励或额外战斗结算。
- 保持桌面、移动端、reduced motion 可读。
