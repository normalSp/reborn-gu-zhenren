# 2026-05-11 v0.8.0-c1.1 承诺效果清账与场景时间协议上下文交接

分支：`codex/v080-c11-promise-scene-closure`

## 目标

c1.1 是 c2 全局重皮前的系统清账版本，不提升 `SAVE_FORMAT_VERSION`。本阶段把 v0.7 遗留的 `待系统 / 需降级` 从 UI 标签债务升级为可测试的承诺覆盖真相源，并补上 `SceneTimeContext`、资源生态闸门和 AI 材料写入拦截。

## 已实现

- 新增 `src/canon/v080-promise-effect-coverage.json`：登记 `runtime_active`、`creation_only`、`narrative_only`、`planned_needs_system`，发布态禁止 `needs_downgrade`。
- 新增 `src/engine/v080-promise-effect-coverage.ts`：提供承诺分类与发布校验。
- `modifier-engine` 的展示承诺分类改为读取 c1.1 真相源；创建页“降级”筛选移除，`待系统` 显示 owner/phase/reason/nextStep。
- 新增 `src/canon/v080-scene-time-rules.json`：登记锚点映射、地点策略、场景锁、宝黄天/仙材/核心资源闸门。
- 新增 `src/engine/v080-scene-time-engine.ts`：提供 `SceneTimeContext`、`ActionTimePolicy`、`SceneLockState`、`CombatIntent`、场景行动校验和资源生态校验。
- `context-builder` 注入场景时间协议，提醒 DeepSeek 只能写候选、传闻和压力。
- `state-update-applier` 对 `materials.add` 做本地资源闸门：低境界仙材降级为 `aiRumorDiscoveries`，宝黄天/宿命/永生/十转类越权奖励阻断并写 pipeline log。

## 测试

已通过：

- `npm test -- src/engine/v080-promise-effect-coverage.test.ts src/engine/v080-scene-time-engine.test.ts src/engine/state-update-applier-resource-gate.test.ts src/engine/modifier-engine.test.ts`

新增测试覆盖：

- 发布态 `needs_downgrade = 0`。
- `planned_needs_system` 必须有 owner/phase/reason/nextStep。
- 青茅山、三王山、王庭等锚点映射。
- 对话锁阻断无关伏击跳转。
- 凡人仙材降级为传闻、宝黄天奖励阻断、普通材料正常入库。

## 剩余风险

- c1.1 只做资源生态底线，不做完整黑市、商路、宝黄天经济系统。
- `PathTendencyProfile` 仍未独立建模，若 c2 需要完整流派倾向解释，应放入后续内容收束。
- 出身深线、本命蛊成长和前中期锚点细映射仍是 `planned_needs_system`，归属 c1.2。

## c1.2 入口

从 c1.1 完成点创建 `codex/v080-c12-origin-lifebound-closure`，继续实现：

- `OriginDeepLineProfile`
- `LifeboundGuGrowthProfile`
- 前中期 A1-A4 锚点映射
- 出身、本命蛊、宿命/因果账本进入终局输入

继续排除无关脏项：`.codex/`、`bgm/`、根目录日报、`dead_code_audit_report.md`、`bug汇总/v0.6.0.md` 删除。
