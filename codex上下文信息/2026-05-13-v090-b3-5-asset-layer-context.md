# 2026-05-13 v0.9.0-b3-5 第一刀资产分层上下文

## 阶段状态

`v0.9.0-b3-5` 第一刀已完成：C-034 视觉资产 manifest 分层。

本轮没有生成新图、没有改战斗规则、没有全局重皮。

## 关键落地

- `src/canon/qingmao-visual-assets.json`
  - `_meta.version` 更新为 `v0.9.0-b3-5`。
  - active：月光蛊、白玉蛊、酒虫。
  - review-only：方源对白凝冰二战、青书对白凝冰林战。
  - blocked：春秋蝉。
  - 新增 `runtimeLayer`、`runtimeScope`、`sceneBinding`、`admission` 字段。
- `src/engine/v080-battlefield-ui-model.ts`
  - `BattlefieldVisualAsset.status` 支持 `review-only`。
  - 运行时资产筛选改为 `active + generic + runtime_active`。
- `scripts/check-qingmao-visual-assets.mjs`
  - 校验 status/role/admission。
  - 防止 scene-specific 资产误标 candidate。
  - 防止 scene_reference 进入 active。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - status 文案支持 `review-only`。
- `src/store/slices/v080-battlefield-combat-ui-store.test.ts`
  - 测试运行时只接入 generic active 资产。
  - 测试 scene-specific 资产均为 review-only。

## 验证

- `npm run check:qingmao-assets`：通过，active=3，review-only=2，blocked=1。
- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，7 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm run build`：通过，只有既有 chunk warning / plugin timings warning。
- `npm test`：通过，87 files / 538 tests。

## 下一步

建议进入 C-035：青茅凡战泛用场景底图样板。

先写 `Composition Contract`，再决定是否生成 1 张候选图。候选图必须是 generic 青茅山凡战氛围，不能绑定方源、白凝冰、青书等具体原著战斗身份。
