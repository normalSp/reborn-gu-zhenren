# v2.0-v4.0 分层 Agent 与世界内核长期路线入口

日期：2026-05-23
状态：长期研究线；已与 `Agent Framework Landscape 2026` 同步；不等同当前 runtime scope。

## 定位

本目录承接用户提出的 v2.0 之后世界级目标：

- 玩家想体验什么身份都可以，但游戏仍能玩下去。
- 每个选择、战斗、小队队友、NPC 关系都能对后续剧情产生切实影响。
- NPC 有自己的思想，但不让模型随口改写世界事实。
- 天道、宿命、宿命蛊破碎前后的宏观大势能被系统表达。
- 战斗从低阶棋盘逐步扩展到蛊仙、仙蛊屋、仙道杀招和环境破坏。
- 长远覆盖五域两天、原著重要角色、路人 NPC、蛊虫、杀招、仙蛊屋、任意时代/身份开局。

当前结论：这个愿景不能靠一个大 prompt、一个 GM agent、或每个 NPC 一个 live DeepSeek 来实现。正确方向是：

`确定性世界内核 + 分层 agent + 薄后端能力 + 主题知识库 + 长测/eval 工厂`

## 第一批文档

- `v2.0-v4.0-分层Agent与世界内核可行性分析.md`
  - 回答能不能做、难度、收益、风险、成本、工作量、是否在造轮子。
- `v2.0-v4.0-外部成果吸收矩阵.md`
  - 说明 Generative Agents、Concordia、AI Town、Voyager、TextWorld、SOTOPIA、CICERO 等如何转化为 RebornG 自有制度；开源 agent framework 的当前覆盖层是 `../Agent-Framework-Landscape-2026吸收矩阵.md`。
- `v2.0-v4.0-世界内核与Agent协作架构草案.md`
  - 设计世界内核、分层 agent、BFF、队列、知识库、eval farm 的高层协作。
- `v2.0-v4.0-开放决策与版本路线草案.md`
  - 拆分 v2.0-v4.0 候选路线和未来需要用户拍板的关键问题。

## 2026 Landscape 同步说明

2026-05-23 已完成文档修正专项：

- Hermes Agent 进入 P0 架构参考 / P1 隔离 PoC 候选。
- Dify、Flowise、AutoGPT、Agno、Browser-use、LlamaIndex 进入 P1/P2 补充矩阵。
- 评分口径改为“能否服务 RebornG 世界内核”，不按 star 排名。
- self-learning 只允许 candidate-only：NPC 记忆候选、技能候选、eval 回流、trajectory 摘要。
- 外部 framework adapter 只能输出 `AgentProposal` / report / candidate patch，不能直接写 runtime、canon、save、prompt、知识库正文或 DeepSeek visible context。
- PoC、dependency、vendored subset、项目读取/写入、命令、patch artifact 和 git 权限仍需未来单独审批。

当前开源 agent framework 判断以 `../Agent-Framework-Landscape-2026吸收矩阵.md` 为准；本目录内旧表保留为长期研究和论文映射，不作为 runtime 授权。

## 当前硬边界

本研究线当前只写文档，不做以下事项：

- 不进入 `v1.9.0-a2`。
- 不改 runtime。
- 不新增后端/BFF。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不修改 DeepSeek prompt/context/model/authority。
- 不启用子代理。
- 不引入外部 agent framework 依赖、PoC、vendored subset、项目文件读写、命令执行、patch artifact 或 git 权限。
- 不让 self-learning 直接修改 canon、runtime、save、prompt、知识库正文或 DeepSeek visible context。
- 不导入全书知识库到 runtime 或 DeepSeek visible context。
- 不开放正式地点、阵营、奖励、NPC 生死、canon promotion。
- 不部署 EdgeOne。

## 与现有路线的关系

- v1.9 仍是 `v2.0 区域活世界预备与门禁收束`。
- v2.0 仍优先做第一个低阶区域活世界，不直接上完整 agent 社会。
- 本目录只作为 v2.0 之后的架构研究线，避免长期想象散落在对话中。
- 任何内容进入 runtime 前，仍必须转成当前版本的启动审查、需求决策池、真相源索引、测试矩阵和用户决策。
