# v0.9.0-a3 荒兽/荒植/守护者敌库与棋盘适配上下文

日期：2026-05-12  
分支：`codex/v090-a3-beast-guardian-battlefield`

## 执行目标

- 补齐 v0.9 文档三件套：总体开发大纲、阶段跟踪、小版本执行路线图。
- 新增 a3 设计文档。
- 结构化荒兽/荒植/守护者敌库。
- 让 a2 阻断的 `hunt` 道场进入 7x5 battlefield。
- 保持 `SAVE_FORMAT_VERSION = 21`，不新增顶层持久状态。

## 已知前置

- a1 已建立 `CombatRoutePolicy`。
- a2 已建立 `trainingGroundState` 和道场线索账本。
- 当前 `wild-beasts.json` 主要是 lore 说明，不是运行时敌库。
- 当前 `tg_white_heaven`、`tg_black_heaven` 是 hunt 道场，但 a2 中被阻断。

## 实施边界

- DeepSeek 不做默认 live 测试。
- 荒兽不作为蛊师，不持有普通蛊虫列表。
- 荒兽寄生蛊不稳定，不直接作为掉落入背包。
- 太古荒兽只作为高压传闻或后续入口，不做 a3 常规战斗对象。

## 验证命令

- `npm test -- src/engine/v090-beast-enemy-registry.test.ts src/engine/v090-training-ground-clue-engine.test.ts src/engine/v080-narrative-combat-orchestration.test.ts`
- `npm test`
- `npm run build`
- `npx playwright test tests/e2e/v090-beast-hunt-battlefield.spec.ts`
- `npm run test:e2e:long`

## 后续入口

- `v0.9.0-b1`：统一出发协议。
- `v0.9.0-b2`：旧 duel/squad 正式入口清理。
