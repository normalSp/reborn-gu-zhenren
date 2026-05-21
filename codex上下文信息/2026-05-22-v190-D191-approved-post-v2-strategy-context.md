# 2026-05-22 v1.9-a1 D-191 批准与 v2.0 后大方向讨论交接

## 当前状态

- 分支：`codex/v190-a1-v2-readiness-save-gate`
- 用户已批准：D-191-001 至 D-191-012。
- 用户明确要求：暂不急着进入 `v1.9.0-a2-MiroFish-v2区域活世界预备topic-slice-intake.md`，先讨论 v2.0 之后大方向。

## D-191 已批准口径

- v1.9 b1 继续保持 `SAVE_FORMAT_VERSION = 24`。
- 暂不新增 `regionalEventLedger`。
- 暂不新增 `runFingerprint`。
- 暂不新增 `regionalLifeState` / `areaLivingState`。
- 暂不新增 `identityRouteState` / `professionState`。
- v2.0 第一核心区域候选锁为 `南疆早期低阶外缘小区域`，仅用于 a2 request/test/rule。
- a2 MiroFish topic-slice 升级为 `blocking`，topic 为 `southern_border_low_rank_region_life_v2_prelude_slice`。
- b1 先做 `v2 readiness projection/report 第一刀`，默认不新增 UI tab/store action/save field。
- process-1 收束 v1.8 P2 正式道具词/英文术语 hardening。
- v1.9 Player Advocate / live probe 强度按风险分层执行。
- v2.0 前建立 T3 300+ 区域活世界 mixed/live/replay 长测硬门。
- 继续禁止 DeepSeek RAG/BFF/public/EdgeOne/子代理/正式地点阵营奖励 NPC 生死。

## 本次只做记录

- 不进入 a2。
- 不改 runtime。
- 不新增 save 字段。
- 不做 MiroFish export/intake。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不开放正式地点、阵营、奖励、NPC 生死或 canon promotion。
- 不部署 EdgeOne。

## v2.0-v4.0 长期研究线已落地

本次按用户批准的研究计划，新建 standalone 文档分支：

- 分支：`codex/v2-v4-agent-worldcore-research`
- 目录：`指导大纲/长期路线/v2.0-v4.0-分层Agent与世界内核/`
- 性质：长期研究线第一批；不等同当前 v1.9 / v2.0 runtime scope。

首批产物：

- `README.md`
- `v2.0-v4.0-分层Agent与世界内核可行性分析.md`
- `v2.0-v4.0-外部成果吸收矩阵.md`
- `v2.0-v4.0-世界内核与Agent协作架构草案.md`
- `v2.0-v4.0-开放决策与版本路线草案.md`

核心结论：

- 世界内核拥有最终裁决权；agent 只能观察、建议、表达和生成候选。
- L0-L5 分层默认成立：规则实体、环境行为、批处理人格、当前关键 NPC、原著关键人物/大势力、天道/宿命宏观导演。
- 薄 BFF 只作为 API key、私有事实下发、agent job queue、成本观测、eval archive 和云存档的未来基础设施，不接管世界裁决权。
- v2.0 仍优先第一个区域活世界和 T3 300+ 长测，不上完整 agent 社会；v2.1-v2.3 再评估 Agent Simulation Lab；v2.4-v2.6 再评估薄后端；v3.0 后才考虑有限 L2/L3 runtime 接入；v4.0 预备高阶战斗、蛊仙、仙蛊屋和宿命大势。

新增研究线仍保持硬边界：

- 不改 runtime。
- 不新增后端/BFF。
- 不新增 DeepSeek prompt/context/model/authority。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不执行 MiroFish export/intake。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不开放正式地点、阵营、奖励、NPC 生死、全书 RAG 或 canon promotion。

## Skill 同步审计

- `reborn-expert-council`：updated；同步 v2.0-v4.0 分层 Agent 与世界内核研究线入口和硬边界。
- `game-dev-text`：updated；同步 Agent Lab / 薄 BFF / WorldCore-first 的工程边界。
- `reverend-insanity-lore`：updated；同步任意时代、全角色、全蛊虫、宿命/天道和 L4/L5 只属于长期研究线，不能当作近期 runtime 批准。
- `reborn-combat-motion`：updated；同步高阶战斗、theater combat、仙蛊屋和宿命大势只作 v4.0 前研究，不授权当前动效/runtime。

## 已同步入口

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/长期路线/README.md`
- `指导大纲/长期路线/v2.0-v4.0-分层Agent与世界内核/`
- `指导大纲/v1.9.0/codex/00-总览/README.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-需求决策池.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a1-v2区域活世界save-format与事件账本设计门禁.md`
- v1.9 路线图、总体大纲、真相源、测试矩阵、MiroFish 协议、Git 计划、readiness 草案
- 本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`

## 下一步讨论主题

用户要讨论的是 v2.0 之后的世界级目标，不是当前 v1.9 runtime scope：

- 任意身份/任意时间节点/任意人物或虚构角色开局的可行性。
- 游戏性、爽点、平衡性、蛊真人世界观约束之间的关系。
- 每个选择、战斗、小队队友对后续剧情产生切实影响的系统方案。
- NPC 是否能有自己的思想：DeepSeek、分层 NPC cognition、后台 job、子线程/子代理的可行性、成本和风险。
- 天道、宿命、宿命蛊破碎前后的宏观剧情系统。
- 战斗棋盘是否足够，以及凡人、蛊仙、仙蛊屋、仙道杀招、环境破坏的未来表现手法。
- 是否需要后端、RAG、知识图谱、事件溯源、仿真系统、多系统架构。
- 市面项目、GitHub 项目、论文和研究是否有可借鉴部分；哪些是造轮子，哪些是没人走完的路。

## 硬停边界

讨论可以很远，但不能自动变成批准：

- DeepSeek visible full-book RAG / hidden summary。
- BFF/backend rewrite。
- 子代理，尤其 writable subagents。
- 正式地点、阵营、奖励、NPC 生死。
- 全书知识库进入 runtime 或 DeepSeek。
- `SAVE_FORMAT_VERSION` bump。
- EdgeOne/public wording。
