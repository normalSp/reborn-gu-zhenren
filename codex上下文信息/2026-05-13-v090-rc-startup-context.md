# 2026-05-13 v0.9.0-rc 启动与第一刀上下文

## 当前状态

- 工作分支：`codex/v090-b1-world-action-protocol`
- 当前阶段：`v0.9.0-rc` 发布候选收束
- 用户决策：已批准进入 rc；rc 只做长测、测试存档、经济复验、DeepSeek 成本观测复盘、文档冲突清理、版本标识收口和关键 bug 修复，不继续扩玩法或全局视觉重皮。

## 本轮落地

- 新增 `指导大纲/v0.9.0/codex/00-总览/v0.9.0-rc-启动审查与范围冻结.md`。
- `package.json` 版本从 `0.9.0-a3.0` 更新为 `0.9.0-rc.0`。
- `src/components/title/TitleScreen.tsx` 与 `src/components/game/GameScreen.tsx` 显示版本更新为 `v0.9.0-rc`。
- 更新版本标签相关 e2e 断言。
- `public/test-saves/` 从旧 `formatVersion 8` 存档替换为 10 个 `formatVersion 21` 公开导入镜像，来源为 `测试存档/v0.7.0/`。
- `public/test-saves/README.md` 改为 rc 存档说明。
- `src/store/test-save-fixtures.test.ts` 增加公开测试存档镜像检查。
- `tests/e2e/v070-long.spec.ts` 增加 10 个公开测试存档运行时载入和 1 条标题页文件导入公开存档回归。
- `src/engine/response-pipeline.ts` 导出 pipeline telemetry 合并辅助函数，`src/engine/response-pipeline-token-usage.test.ts` 覆盖缓存命中、重试 token、模型名、temperature 和 prompt 前缀 hash 透传。
- 新增 `scripts/check-runtime-assets.mjs` 与 `npm run check:runtime-assets`，检查 `public` 运行时 json/image/audio 资源是否存在 0 字节文件。
- 安装 `@types/react`、`@types/react-dom`、`@types/node`，并在 `tsconfig.json` 启用 `node` 类型；`tsc` 从缺类型声明的大量噪声收敛到真实类型债。
- 更新 README、阶段跟踪、路线图、真相源索引、需求决策池、专家团 README。
- 新增 `v0.9.0-rc-风险池与发布核对表.md`，区分阻断、类型债、模型切换、素材审查和发布核对项。
- 新增 `v0.9.0-rc-手测走查清单.md`，覆盖标题页/API、公开测试存档、青茅凡战、统一行动协议和 DeepSeek 成本观测。
- 新增 `v0.9.0-rc-发布说明草案.md`，整理面向玩家的版本说明与暂不承诺边界。
- 更新四个核心 skill 当前事实与版本：
  - `reborn-expert-council` -> `0.1.1`
  - `game-dev-text` -> `2.3.1`
  - `reverend-insanity-lore` -> `0.3.1`
  - `reborn-combat-motion` -> `0.2.1`

## 验证结果

- `npm test -- src/store/test-save-fixtures.test.ts`：通过，5 tests。
- `npm test -- src/engine/response-pipeline-token-usage.test.ts src/api/deepseek.test.ts`：通过，4 tests。
- `npm test -- src/api/deepseek.test.ts src/engine/economy-simulation.test.ts src/engine/economy-service.test.ts src/engine/faction-economy.test.ts src/engine/auction-economy-loop.test.ts src/engine/auction-engine-v070.test.ts src/store/slices/economy-closure.test.ts src/store/slices/gu-feeding-economy.test.ts src/engine/merchant-material-shelf.test.ts src/engine/material-overload.test.ts`：通过，39 tests。
- `npx playwright test tests/e2e/v090-product-route-closure.spec.ts tests/e2e/v090-training-ground-clue-entry.spec.ts tests/e2e/v090-beast-hunt-battlefield.spec.ts`：通过，6 tests。
- `npm run test:e2e:long`：通过，29 tests；新增 10 个公开测试存档运行时载入和 1 条标题页文件导入公开存档回归。
- `npm run check:qingmao-assets`：通过，active=4、review-only=2、blocked=1。
- `npm run check:runtime-assets`：通过，128 files；audio=45、images=72、json=11、zero-byte=0。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm test`：通过，88 files / 541 tests。
- `npm run build`：通过；仍有既有 `combat-squad` 500KB+ chunk warning，偶发 plugin timing warning。
- `npx tsc --noEmit --pretty false`：失败，但已从缺 React/Node 类型导致的大量噪声收敛到约 277 行真实类型债；主因包括 GSAP 类型导入、旧 store/slice 类型不一致、福地/资源节点类型、battle trace phase、旧测试夹具和若干旧组件隐式类型问题。

## 风险池

- `npx tsc --noEmit` 不能作为当前 rc 第一刀阻断前必须先清的大任务，但需要单独开类型债阶段，否则正式发布前仍会有工程风险。
- 构建仍有 `combat-squad` 500KB+ chunk warning；当前不阻断 rc 第一刀，但发布前可考虑代码分割。
- 正式叙事模型仍不应盲切便宜模型；DeepSeek/模型调优专家需先跑 eval、schema、世界观闸门和成本对比。
- b3 正式短录屏/宣传素材审查仍未完成，已顺延到 rc 素材审查或宣传阶段。

## 下一步

继续 rc 收束：优先检查关键 bug、补必要发布说明；如遇到扩玩法、宣传素材使用、是否专门开类型债阶段或需要牺牲范围的选择，暂停交给用户拍板。正式模型切换已由 C-049 收束，用户已决定不再评估其他模型。
