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

## 已同步入口

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
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
