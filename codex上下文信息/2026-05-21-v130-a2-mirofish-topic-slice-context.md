# 2026-05-21 v1.3.0-a2 MiroFish NPC/势力关系 topic-slice intake 交接

## 当前状态

- 当前分支：`codex/v130-a2-mirofish-social-topic-slice`。
- 基线分支：已推送的 `codex/v130-a1-social-save-format-gate`。
- 本轮性质：纯文档/资料门禁；未改 runtime，未 bump save，未新增 DeepSeek 权限，未部署 EdgeOne。
- 当前 `SAVE_FORMAT_VERSION = 24`。

## 用户已批准

D-131-001 至 D-131-007 已全部批准：

- b1 不 bump `SAVE_FORMAT_VERSION = 25`。
- b1 不新增 `socialRelationState`。
- b1 采用 projection-only。
- a2 MiroFish 为 preferred；正式 NPC allowlist、通缉/招揽/封锁、隐藏事实邻近、NPC 生死或 canon 晋升才 blocking。
- 势力封锁/通缉/招揽 b1 只做前置压力与可读提示。
- b1 Player Advocate 30 轮 + T0-lite；有持久字段阶段 40 轮；rc 100/120。
- rc live probe 规模 rc 前再确认；临时通过线 P0=0、P1=0、P2<=2、accepted>=90%。

## 已落地文件

- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-a2-MiroFish-NPC势力关系topic-slice-intake.md`
- `指导大纲/v1.3.0/codex/00-总览/README.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-小版本执行路线图.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-需求决策池.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-测试矩阵.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-Git提交与推送计划.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-真相源索引.md`
- `指导大纲/v1.3.0/codex/00-总览/v1.3.0-总体开发大纲.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## a2 结论

- v0.13 三包继续作为 v1.3 b1 candidate/rule/test 后勤：
  - `qingmao_npc_memory_motive_pack`：1564 items，NPC 记忆/动机/怀疑 projection。
  - `qingmao_faction_reputation_pressure_pack`：885 items，势力压力/机会/封锁风险/招揽试探降级。
  - `qingmao_public_event_chronicle_pack`：1153 items，公开事件证据和可见性边界。
- 全书基础包只作为 archive/source-pointer inventory 和 coverage gap；1-200 范围中的 hiddenFacts 全部 quarantine。
- b1 前不需要新增 MiroFish request，不需要 live extraction。
- b1 可进入 projection-only 第一刀。

## 测试矩阵新增

- `V13-MIRO-003`
- `V13-MIRO-004`
- `V13-SOCIAL-004`
- `V13-FACTION-002`
- `V13-PUBLIC-001`
- `V13-HIDDEN-002`

## Skill sync audit

- `reborn-expert-council`：updated，已同步 D-131 approved、a2 completed、b1 next。
- `game-dev-text`：updated，已同步 b1 runtime 输入契约、30 轮 Player Advocate + T0-lite。
- `reverend-insanity-lore`：updated，已同步 hidden quarantine 与 formal social blocking。
- `mirofish-reborng-export`：updated，已同步 a2 复用 v0.13 三包和全书基础包 coverage，b1 前不需新 export。
- `reborn-combat-motion`：no_update_needed，本轮不触碰战斗/动效/视觉 runtime。

## 下一步

建议进入：

`指导大纲/v1.3.0/codex/00-总览/v1.3.0-b1-关系证据与社会压力projection-only第一刀.md`

b1 runtime 只能读取现有 `livingWorldState.npcMemories`、`factionPressure`、`actionConsequences` 与本地可见性判断，输出只读、可重算 projection view model；不得读取 MiroFish JSON、全书基础包或旧社会字段作为权威。
