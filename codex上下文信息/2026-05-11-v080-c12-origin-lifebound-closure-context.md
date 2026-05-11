# v0.8.0-c1.2 出身深线与本命蛊协议清账上下文

日期：2026-05-11
分支：`codex/v080-c12-origin-lifebound-closure`
上游：`codex/v080-c11-promise-scene-closure`

## 本阶段目标

c1.2 是 c2 全局重皮前的第二个补漏版本，目标是清账“出身深线、本命蛊、前中期锚点映射”三类已经在 v0.8 文档中承诺但仍容易显示为“待系统”的内容。

本阶段不提升 `SAVE_FORMAT_VERSION`，不新增正式长期玩家状态，只新增 truth source、运行时校验、上下文注入、叙事降级、背包保护和终局证据。

## 已落地文件

- `src/canon/v080-origin-deep-line-profiles.json`
- `src/canon/v080-front-mid-anchor-map.json`
- `src/canon/v080-lifebound-gu-growth-profiles.json`
- `src/engine/v080-origin-lifebound-closure.ts`
- `src/engine/v080-origin-lifebound-closure.test.ts`

## 接入点

- `context-builder`：注入出身深线、前中期锚点、本命蛊协议和禁止越权规则。
- `narrative-consistency`：按 `OriginDeepLineProfile` 降级跨出身身份错误。
- `guSlice.removeGu`：本命蛊不能被普通移除；出售调用同一路径，因此也不能绕过。
- `GuInventoryPanel`：显示本命蛊成长协议、风险标签和终局权重提示。
- `v080-ending-framework-engine`：终局证据读取出身债务、本命蛊成长协议、风险和权重。
- `v080-promise-effect-coverage.json`：`origin-lifebound-pre-c2` 改为 `runtime_active`。

## 测试结果

已通过专项：

```bash
npm test -- src/engine/v080-origin-lifebound-closure.test.ts src/store/slices/gu-feeding-economy.test.ts src/engine/narrative-consistency.test.ts src/engine/v080-promise-effect-coverage.test.ts
```

结果：4 个测试文件、22 个用例通过。

已通过全量与浏览器回归：

```bash
npm test
npm run build
npx playwright test tests/e2e/v080-origin-lifebound-closure.spec.ts
npm run test:e2e:long
```

结果：72 个单元测试文件、458 个用例通过；构建通过（仅保留既有 `combat-squad` 500KB+ chunk 警告）；c1.2 专项 E2E 2 条通过；v0.7 长链路 E2E 18 条通过。

## 后续入口

c2 应直接消费本阶段事实：

- 出身面板/选择标签展示身份边界、资源入口、锚点参与权和 IF 代价。
- 本命蛊 UI 展示成长阶段、风险、反噬和终局权重。
- 前中期锚点 UI 展示当前所处正史/IF边界，不再把“待系统/需降级”作为不可解释标签。

完整 A1-A4 内容长线、本命蛊七至九转长期成长链、完整黑市/宝黄天经济仍可留到 rc 或后续内容版本。
