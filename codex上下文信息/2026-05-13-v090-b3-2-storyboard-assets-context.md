# 2026-05-13 v0.9.0-b3-2 storyboard 与资产桥接上下文

## 阶段状态

`v0.9.0-b3-2` 已完成。b3 第一刀的青茅山凡战最小样板继续保留，本轮补强强演出 storyboard、现有蛊虫图片资产桥接和截图验收台账。

## 关键落地

- `src/engine/v080-battlefield-ui-model.ts`
  - 新增 `BattlefieldVisualAsset`、`BattlefieldStoryboardBeat`。
  - 新增 `buildQingmaoBattlefieldAssets()`：接入月光蛊、白玉蛊、酒虫三张现有资产。
  - 新增 `buildQingmaoBattlefieldStoryboard()`：四段 storyboard 分别覆盖月刃连斩、白玉护体、酒虫支持、禁忌门槛。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 新增青茅资产桥接 UI。
  - 新增青茅 storyboard UI。
  - 新增月刃、白玉、禁忌三个 GSAP 特效节点。
- `src/animations/gsap/battlefieldTimeline.ts`
  - 月刃、白玉、禁忌分支只按 `BattleResolutionStep.sourceName`、`visual.motif`、`tags` 触发。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 覆盖资产桥接、storyboard、图片加载、酒虫非攻击按钮、移动端 reduced motion。

## 边界

- 酒虫仍不作为普通攻击按钮。
- UI 不私算伤害、命中、消耗、状态、胜负或奖励。
- 现有青茅场景图暂不作为 generic 背景，因为它们绑定具体人物战斗，后续使用前要单独做美术和世界观审查。

## 验证

- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/engine/v080-combat-expression-data.test.ts`：通过，2 files / 16 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，2 tests。
- `npm run build`：通过，仅保留既有 500KB+ `combat-squad` chunk warning。
- `npm test`：通过，87 files / 538 tests。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。

## 下一步

专家团建议进入 `v0.9.0-b3-3` 候选审查：

- C-026 战斗行动卡信息密度整理。
- C-027 强演出与棋盘源格/目标格对位增强。
- C-028 青茅视觉资产 manifest 与缺图兜底。
- C-029 正式截图/录屏验收产物沉淀。
