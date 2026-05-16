# 2026-05-13 v0.9.0-b3-3 行动卡、演出锚点与资产 manifest 上下文

## 阶段状态

`v0.9.0-b3-3` 已完成。b3 青茅山凡战竖切继续保持小范围验证路线，本轮补强行动卡信息密度、强演出源格/目标格对位和青茅视觉资产 manifest。

## 关键落地

- `src/canon/qingmao-visual-assets.json`
  - active：月光蛊、白玉蛊、酒虫。
  - candidate：现有青茅场景图，只作为具体剧情节点候选。
  - blocked：春秋蝉，不进入 b3 凡战竖切。
- `src/engine/v080-battlefield-ui-model.ts`
  - `BattlefieldActionCard` 增加 `rangeText/targetText/counterText/utilityText`。
  - 新增 `buildQingmaoAssetManifest()`。
  - `buildQingmaoBattlefieldAssets()` 改为只返回 manifest 中的 active 资产。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 行动卡显示紧凑三列元信息，减少长文本挤压。
  - 新增 `syncBattlefieldEffectAnchors()`，把 step 的 actor/target/affected cell 映射到 effect layer。
- `src/animations/gsap/battlefieldTimeline.ts`
  - 月刃、护体、禁忌效果读取 `--battlefield-effect-*` CSS 变量，实现源格/目标格对位。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 覆盖行动卡元信息、月光蛊执行后 `data-effect-from-cell=c0_1` 与 `data-effect-target-cell=c3_1`。

## 边界

- 酒虫仍不作为普通攻击按钮。
- UI 不私算伤害、命中、消耗、状态、胜负或奖励。
- 春秋蝉资产只可作为 blocked 记录，不得进入当前凡战 UI。
- 现有青茅场景图暂不作为 generic 背景。

## 验证

- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/engine/v080-combat-expression-data.test.ts`：通过，2 files / 16 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，2 tests。
- `npm run build`：通过，仅保留既有 500KB+ `combat-squad` chunk warning；另有 Vite plugin timings 提示。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。
- `npm test`：通过，87 files / 538 tests。

## 下一步

专家团建议进入 `v0.9.0-b3-4` 候选审查：

- C-030 白玉护体与禁忌门槛专项演出验收。
- C-031 青茅资产 manifest 完整性扫描脚本。
- C-032 b3 竖切收束审查与正式截图/录屏产物。
