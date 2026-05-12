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

## 完成记录

本阶段已完成并验证。

分支：`codex/v090-a3-beast-guardian-battlefield`

主要实现：
- 新增 v0.9 文档三件套和 a3 敌库设计文档，已单独提交为 `docs: 补齐v0.9大纲与a3敌库计划`。
- 扩展 `wild-beasts.json` 为运行时敌库，包含普通野兽、兽王、兽皇、荒兽、上古荒兽、荒植和守护者样板。
- 新增 `v090-beast-enemy-registry`，提供敌库校验、hunt 绑定、7x5 狩猎战场构建和掉落边界结算。
- `hunt` 道场由 a2 的“待 a3”转为可出发战斗候选，默认路由到 `group_7x5`。
- battlefield 敌方阶段支持 `BeastInstinctMove`，荒兽不伪装成蛊师，也不持有普通 `guNames`。
- 战后掉落边界改为材料、线索、传闻或拦截记录；寄生蛊不会稳定直接入背包，仙蛊、十转、永生蛊、宿命蛊归属全部拦截/降级。
- 增加 E2E harness `startBeastHuntDemo()` 和 `tests/e2e/v090-beast-hunt-battlefield.spec.ts`。
- 测试存档仍为 `formatVersion = 21`，仅同步 `trainingGroundState.version = v0.9.0-a3`，无存档协议升级。

测试结果：
- Targeted unit：通过。
- Full unit：`npm test` 通过，84 files / 521 tests。
- Build：`npm run build` 通过，仅既有 chunk size warning。
- Beast hunt E2E：通过，桌面与移动 reduced motion 共 2 tests。
- a1/a2 route/clue E2E：通过，4 tests。
- Long E2E：`npm run test:e2e:long` 通过，18 tests。

下一阶段建议：
- 进入 `v0.9.0-b1`，把传承、福地、道场、灾劫、野外行动统一到同一个剧情出发协议。