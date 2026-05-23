# RebornG 长期路线入口

日期：2026-05-23
状态：项目-owned 长期方向；不直接等同当前版本范围；v2.3 已完成，v2.4-a1 已完成，v2.0-v4.0 分层 Agent 与世界内核研究线、v2.0-v3.0 Agent Lab 到 Runtime Agent 总纲、v2.4 前置 Agent Framework Landscape 2026 吸收矩阵已落地并同步。

## 目录定位

本目录用于收纳 RebornG 的长期目标、跨版本路线和远期扩展池。

它解决一个问题：我们最终想做的是“活着的蛊真人世界”，但不能把全部愿望直接塞进当前版本。当前开发必须先把蛊师低阶、区域状态、NPC 反应、自由意图裁决和存档稳定做扎实，再逐步扩展到蛊仙、五域、尊者时代和远古时代开局。

## 当前长期目标

RebornG 的最终体验目标：

> 玩家像穿越到蛊真人世界，选择一个原创身份，在原著世界观和因果压力下开启另一段人生。玩家能表达自己的目标，世界能记住、判断、拒绝、反馈，并让长期后果沉淀到存档。

关键边界：

- DeepSeek 负责理解、叙事和候选，不拥有最终裁决权。
- 本地 canon/engine/store 拥有事实、数值、奖励、战斗、地点、NPC 生死、正史锚点和存档权。
- 原著事实必须从原文或项目 lore/canon 抽取，不能靠记忆或模型即兴补全。
- 自由不是玩家想什么都成功，而是玩家可以尝试、失败、被骗、被记录、被世界反应。

## 文档索引

- `RebornG-活世界长期路线图-v0.11至v1.0.md`：从 v0.11 到 v1.0 的大版本路线，定义完整大世界需要多少阶段。
- `RebornG-v1.1至v2.0长期路线重整草案.md`：v1.0 完成后的长期路线重整，定义 v1.1 到 v2.0 如何从路线/地点地基走向第一个区域活世界。
- `RebornG-外部活世界参考映射.md`：Generative Agents、Voyager、Concordia、AI Town、Reflexion、ReAct、AutoGen、MetaGPT 等外部参考如何转化为 RebornG-owned 文档、测试、门禁和未来系统。
- `RebornG-v0.6到v0.15系统回顾与减法审查.md`：回顾 v0.6 到 v0.15 的系统落地、闭环、重复、玩家体验和 UI 减法机会。
- `RebornG-v0.16至v1.0减法专项与路线调整草案.md`：根据减法审查重新评估 v0.16 到 v1.0 的版本路线和美术资产时机；路线已获用户批准。
- `世界意图裁决引擎-设计总纲.md`：自由意图如何从玩家输入进入 DeepSeek、引擎、canon、store 和 UI。
- `RebornG-长线叙事防崩坏与青茅IF矩阵落位.md`：长线剧情不崩坏所需的正史锚点、低阶 IF 矩阵、事件编年史、NPC/势力记忆和测试路线。
- `RebornG-长期架构演进路线图-纯前端到薄后端.md`：纯前端、TypeScript core、薄后端/BFF、隐藏事实保护和公开测试架构的长期路线。
- `v2.0-v4.0-分层Agent与世界内核/`：v2.0 之后分层 agent、世界内核、薄后端、Agent Lab、高阶战斗和宿命/天道宏观系统的可行性与架构草案。当前只作研究线，不授权 runtime。
- `v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md`：细化 v2.0 到 v3.0 的小版本路线，从已完成第一个区域活世界，到 Agent Lab、薄 BFF 边界、runtime agent 准入，最后进入有限 L2/L3 runtime agent 试点。当前只作规划基线，不授权 runtime agent。
- `Agent-Framework-Landscape-2026吸收矩阵.md`：v2.4 前置正式专项；Hermes Agent 作为 P0 架构参考/P1 隔离 PoC 候选，Dify/Flowise/AutoGPT/Agno/Browser-use/LlamaIndex 等按“能否服务游戏世界内核”重新评分。当前只授权 license/SBOM/架构适配评估，不授权 PoC、依赖、runtime 或外部 agent 权限。
- `大时代开局远期扩展池.md`：盗天魔尊时期、尊者时代、远古/上古/中古等开局的远期想法池。

## 与版本目录关系

- 当前可执行版本范围写在对应 `指导大纲/vX.Y.Z/codex/00-总览/`。
- 当前用户可读仪表盘入口是 `指导大纲/项目仪表盘.md`。
- 长期路线只提供方向、阶段边界和不要抢跑的提醒。
- 任何长期目标进入运行时前，都必须转化为对应版本的启动审查、需求决策池、真相源索引和验收计划。
- 架构路线不等同当前版本范围；后端/BFF 只有在触发门禁时才进入版本专项。

## 当前阶段提醒

`v2.0.0` 已完成第一个区域活世界本地里程碑，`v2.1.0` 至 `v2.3.0` 已完成 Agent Lab report-only/offline 地基、扩展模拟和 eval farm。`v2.4.0` startup/a0 已开并完成，D-240 已获用户批准，a1 薄 BFF / private canon / eval archive 边界设计门禁已完成；当前等待用户审批 D-241。继续 v2.4 前，先阅读 `Agent-Framework-Landscape-2026吸收矩阵.md` 和 `指导大纲/v2.4.0/codex/00-总览/README.md`，确认 Hermes/self-learning/外部框架只作为架构吸收与后续评估输入，不直接进入 runtime。

当前建议顺序：

1. 先审阅 `指导大纲/v2.4.0/codex/00-总览/`，确认 v2.4-a1 已完成和 D-241 待批范围。
2. 再审阅 `Agent-Framework-Landscape-2026吸收矩阵.md`，确认 v2.4 前置外部框架吸收边界。
3. 再审阅 `v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md`，确认 v2.1-v2.9 到 v3.0 的路线节奏。
4. 再审阅 `v2.0-v4.0-分层Agent与世界内核/`，作为更远期的分层 agent、WorldCore、BFF、高阶战斗和宿命/天道研究线。
5. 必要时回查 `指导大纲/v2.3.0/codex/00-总览/`，确认 v2.3 eval farm 已完成。
6. 研究线可以讨论任意身份、五域两天、NPC 思想、天道/宿命和蛊仙战斗，但不能自动变成 runtime 批准。
7. 当前不把外部 AI 人生/跑团项目的“0 岁到多年人生模拟”作为近期可交付目标。RebornG 近期要解决的是 Agent Lab、权限边界、eval farm、BFF 边界和 v3.0 有限 runtime agent 准入。

## 当前架构提醒

当前不做大规模后端重构。RebornG v1.0 前以纯前端、本地确定性 TypeScript 引擎、静态 canon、Zustand 存档和 DeepSeek API 为主。

但从 v0.12 起，事实卡、锚点表、IF 规则和 engine helper 必须按 `backend-ready` 方式设计：

- public fact 和 hidden/private fact 概念分离。
- hidden fact body 不应成为公开前端长期必需数据。
- engine/canon helper 保持纯 TypeScript、无 DOM、无浏览器 API 强依赖。
- 后端只在 API key、隐藏事实、云存档、成本观测、线上评估成为硬需求时，以薄 BFF/边缘服务方式逐步引入。
