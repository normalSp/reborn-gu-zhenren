# 2026-05-21 v1.3.0-a1 NPC/势力关系 save-format 设计门禁交接

## 当前状态

- 当前分支：`codex/v130-a1-social-save-format-gate`。
- 基线分支：已推送的 `codex/v130-a0-startup-governance-docs`。
- 本轮性质：纯文档/治理门禁；未改 runtime，未 bump save，未新增 DeepSeek 权限，未部署 EdgeOne。
- 当前 `SAVE_FORMAT_VERSION = 24`。

## 已落地文件

- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-a1-NPC势力关系save-format设计门禁.md`
- `指导大纲/v1.3.0/codex/00-总览/README.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-小版本执行路线图.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-需求决策池.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-测试矩阵.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-Git提交与推送计划.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-真相源索引.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## a1 门禁结论

专家团建议：

1. v1.3-b1 采用 projection-only 社会反应层。
2. b1 不 bump `SAVE_FORMAT_VERSION = 25`，继续 v24。
3. b1 不新增 `socialRelationState`，只保留为 b2/b3 备选门禁。
4. `livingWorldState.npcMemories`、`factionPressure`、`actionConsequences` 只能作为可读投影证据，不能变成正式关系权威。
5. `npcRelations`、`standings`、`npcContacts`、`dynamicNPCs` 等旧字段暂不作为 v1.3 权威。
6. v1.3-a2 做 MiroFish preferred topic slice；正式命名 NPC allowlist、通缉/招揽/封锁、隐藏事实邻近、NPC 生死或 canon 晋升才 blocking。
7. rc live probe 已原则批准，模型 `deepseek-v4-flash`；成本、样本、轮次和通过线仍要 rc 前按实际 scope 给用户确认。

## 待用户拍板

D-131-001 至 D-131-007：

- D-131-001：b1 是否实际 bump `SAVE_FORMAT_VERSION = 25`。建议不 bump。
- D-131-002：b1 是否新增 `socialRelationState`。建议不新增。
- D-131-003：b1 是否 projection-only。建议批准。
- D-131-004：MiroFish preferred/blocking 条件。建议 a2 preferred，正式 NPC/通缉/招揽/封锁/隐藏事实邻近/NPC 生死/canon 晋升才 blocking。
- D-131-005：势力封锁/通缉/招揽 b1 是否只做前置压力和可读提示。建议批准。
- D-131-006：Player Advocate 与 drift 强度。建议 b1 30 轮 + T0-lite；有持久字段阶段 40 轮；rc 100/120。
- D-131-007：rc live probe 成本/样本/轮次/通过线。建议 rc 前二次确认；临时通过线 P0=0、P1=0、P2<=2、accepted>=90%。

## Skill sync audit

- `reborn-expert-council`：updated，已同步 v1.3-a1 口径。
- `game-dev-text`：updated，已同步 v25 不默认、projection-only、旧字段不升权。
- `reverend-insanity-lore`：updated，已同步 MiroFish preferred/blocking 与隐藏事实边界。
- `mirofish-reborng-export`：no_update_needed，当前 v1.3 bridge 已足够；本轮未生成新包。
- `reborn-combat-motion`：no_update_needed，本轮纯 save-format/治理门禁，不触发更新。

## 下一步

用户批准 D-131 后，进入：

`指导大纲/v1.3.0/codex/00-总览/v1.3.0-a2-MiroFish-NPC势力关系topic-slice-intake.md`

a2 应只做主题切片，不整包导入全书基础包，不改 runtime。
