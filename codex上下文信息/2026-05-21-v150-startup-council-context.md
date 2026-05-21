# 2026-05-21 v1.5.0 专家团启动会交接稿

## 状态

`v1.5.0` 已开启专家团启动会，当前为 active draft。

当前分支：`codex/v150-startup-council`

## 建议主题

`冲突、追杀、杀招与小队后果深化`

## 核心口径

v1.5 建议承接 v1.1-v1.4，把冲突从单次战斗 UI 推进为活世界后果解释层：

- 冲突来源。
- 追杀/截杀风险。
- 杀招反制与失败代价前置。
- 小队/阵法协同前置。
- 战斗后果对路线、生存、社会和区域压力的投影。

## 当前不开放

- 不新增 `SAVE_FORMAT_VERSION = 25`。
- 不新增冲突/追杀/战斗后果持久字段。
- 不开放正式掉落池、稀有蛊、仙蛊、完整杀招传承。
- 不开放 NPC 生死、捕获、背叛、永久伤势。
- 不开放正式通缉/追杀/阵营敌对结论。
- 不扩大 DeepSeek authority。
- 不自动部署 EdgeOne。

## 待用户决策

见 `指导大纲/v1.5.0/codex/00-总览/v1.5.0-需求决策池.md`：

- D-150-001 至 D-150-010 待批准。

若全部批准，下一步进入：

`v1.5.0-a1-冲突追杀杀招小队save-format设计门禁.md`

## Skill 同步

本次启动会触发 skill sync audit：

- `reborn-expert-council`：updated。
- `game-dev-text`：updated。
- `reverend-insanity-lore`：updated。
- `reborn-combat-motion`：updated，修正原 current override 停在 v1.0 的问题。
- `mirofish-reborng-export`：no_update_needed，a0 未请求新包。

## 验证

a0 为文档/治理启动包，不运行 runtime 测试。完成前需要检查：

- `git status --short --branch`
- `git diff --check`
- v1.5 文档入口齐全

## 下一步

等待用户批准 D-150。不得直接进入 runtime。
