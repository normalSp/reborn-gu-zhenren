# Agent Lab 论文参考池与吸收计划

日期：2026-05-26  
状态：长期路线参考池；pre-v4.3 治理专项输入；不授权当前 runtime。

## 定位

本文件把 Ctx2Skill 以及相关权威论文纳入 RebornG 的后续制度和 Agent Lab 参考池。它不按“名气”吸收，而按一个问题筛选：

> 这项研究能不能帮助 RebornG 把世界内核、AgentProposal、技能治理、评测和玩家体验做得更稳。

所有外部成果都必须转译成 RebornG-owned 的制度、门禁、rubric、样本、报告或代码。不能直接变成 runtime 权限、DeepSeek authority、MiroFish canon、NPC 生死、奖励、地点、阵营或 save 写入。

## 当前硬边界

本参考池不授权：

- runtime agent implementation。
- Auto-Theater runtime、high-rank combat runtime、theater UI。
- save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- live DeepSeek、DeepSeek prompt/context/model/authority 扩大。
- DeepSeek visible lore/RAG、knowledge-index body、runtime canon。
- MiroFish export/intake 或 hidden/private body 曝露。
- backend/BFF/service/job queue/eval archive service。
- 外部 framework PoC/dependency/vendored subset/subagents/read-only scan/patch artifact。
- formal location/faction/identity/reward/NPC life-death。
- public/legal/EdgeOne 或 main auto-merge。

## 吸收分层

| 层级 | 用途 | 可进入的 RebornG 位置 |
|---|---|---|
| G0 制度治理 | skill 演化、rubric、例外停机、审批包、回放 | `指导大纲/流程制度/`、`指导大纲/技能演化/` |
| G1 Agent Lab | 离线 agent、NPC 记忆、社交智能、失败分类、eval farm | `指导大纲/v2.x-v3.x/codex/00-总览/`、`tests/evals/*` |
| G2 WorldCore / Runtime Gate | AgentProposal、post-check、visibility、rollback、PA/live gate | 当前版本 design gate / checker |
| G3 游戏表现 | Auto-Theater、战斗解释、NPC 情绪、势力压力、经济叙事 | 未来 v4.x/v5.x 设计门禁 |
| G4 远期研究 | 多区域、关键人物、天道/宿命、任意身份、最终形态 | `指导大纲/长期路线/` |

## 参考池矩阵

| 参考 | 链接 | 主要吸收点 | RebornG 用法 | 禁止误用 |
|---|---|---|---|---|
| Ctx2Skill | https://arxiv.org/abs/2604.27660 | 从复杂上下文生成可复用技能；Challenger/Reasoner/Judge；Cross Time Replay | `Context-to-Skill技能演化评测制度`、`reborn-expert-council` 挑战题与回放 | 不让 LLM 自动改 skill；不让 LLM Judge 替代用户/门禁 |
| ReAct | https://arxiv.org/abs/2210.03629 | 推理与行动交替，适合工具调用纪律 | 专家团执行复杂版本时，把“先查证、再动作、再验证”写成挑战题 | 不把自然语言推理当 WorldCore 事实 |
| Reflexion | https://arxiv.org/abs/2303.11366 | 失败后的语言反思与记忆 | PA/CI/长测失败进入 skill candidate review | 反思不能直接改 runtime、canon、save |
| Self-Refine | https://arxiv.org/abs/2303.17651 | 自反馈迭代改写 | 文档草案、授权包、rubric 草案可用其思想 | 没有外部 rubric 时不能自判通过 |
| Toolformer | https://arxiv.org/abs/2302.04761 | 工具使用学习 | 未来 checker/tool 调用题库；规范何时该查文件/跑测试 | 不让模型自学后开放新工具权限 |
| Constitutional AI | https://arxiv.org/abs/2212.08073 | 宪法式原则、批判与修订 | 把 hard rules、future gate、exception stop 写成项目宪法式检查 | 不让抽象原则覆盖用户当前决策 |
| DSPy | https://arxiv.org/abs/2310.03714 | 用 eval 优化 LM pipeline | 未来 report-only skill-evolution runner / AgentProposal eval pipeline 参考 | 当前不新增脚本；不做自动 prompt 优化进 runtime |
| Generative Agents | https://arxiv.org/abs/2304.03442 | NPC 记忆、反思、计划 | v5+ NPC 社会、生活日程、关系变化候选 | NPC 记忆不等于 canon；不能写 NPC 生死/正式关系 |
| Voyager | https://arxiv.org/abs/2305.16291 | 技能库、自验证、长期成长 | Agent Lab 的 skill library / 自验证任务池 | 自学习技能不能自裁决世界事实 |
| Concordia | https://github.com/google-deepmind/concordia | 组件化 agent 与 GM/social simulation | L5 宏观压力、社会模拟、GM-like constraint 参考 | 不让 GM agent 取代 WorldCore |
| AI Town | https://github.com/a16z-infra/ai-town | 可见社会行为、小镇 NPC 互动 | 可视化社会行为和 NPC 生活感参考 | 不照搬成无裁决 NPC 聊天群 |
| TextWorld | https://github.com/microsoft/TextWorld | 文本环境评测 | Agent Lab / world-state action validity eval 参考 | 不把文本冒险规则替代 RebornG 世界规则 |
| SOTOPIA | https://github.com/sotopia-lab/sotopia | 社交智能评估 | NPC 社交、谈判、说服、欺骗的 eval 样本参考 | 社交成功不等于正式阵营/身份变化 |
| CICERO | https://ai.meta.com/research/cicero/ | 战略推理与自然语言协商分离 | 势力博弈、联盟/背叛候选、策略/表达分层 | 不让语言协商裁决战斗/经济/政治事实 |

## 与 Agent Framework Landscape 的关系

本文件关注论文和研究方法；`Agent-Framework-Landscape-2026吸收矩阵.md` 关注开源框架和工程生态。

二者合并使用：

- 论文回答“原则和评测怎么设计”。
- 框架矩阵回答“未来有没有可参考的工程形态”。
- 任何 PoC、dependency、vendored subset、subagents、read-only scan、patch artifact 仍必须单独审批。

## 版本吸收计划

| 阶段 | 吸收目标 | 允许做 | 不允许做 |
|---|---|---|---|
| pre-v4.3 | Ctx2Skill 制度专项 | 建制度、入口、参考池；只覆盖 `reborn-expert-council` | 改 skill、跑 LLM Judge、新增脚本 |
| v4.3-v4.5 | Auto-Theater / 高阶战斗语义门禁 | 用 ReAct/DSPy/Constitutional AI 思路强化 checker、rubric、negative fixtures | 开放高阶 runtime、DeepSeek 战斗裁决 |
| v4.6-v4.9 | HeavenWill/Fate/L5 pressure 与 v5 go/no-go | 用 Generative Agents/Concordia/CICERO 思路设计宏观压力和策略候选评测 | L5 runtime 裁决、方源/原著关键人物 agent |
| v5.x | 第一个高阶世界可玩试点候选 | 引入 TextWorld/SOTOPIA 风格 eval 样本、PA/live/drift 档位 | 任意身份、五域两天全开放、自动 canon |
| v6.x-v7.x | 多区域/Agent Society | 研究 Generative Agents、Voyager、Concordia 的分层吸收 | NPC 自学习写正式事实 |
| v8.x-v12.x | 经济、战争、时代、终局质量 | 把研究成果转成 RebornG-owned 世界内核、eval farm、内容工厂 | 论文/框架直接成为最终游戏权威 |

## 进入版本门禁的规则

任何论文或框架想进入某个版本，必须在该版本文档里写清：

1. 参考来源和链接。
2. 吸收的是思想、schema、rubric、测试样本、工程模式还是代码。
3. 是否涉及 license/SBOM。
4. 是否触发外部依赖、PoC、subagents、read-only scan、patch artifact。
5. 是否触发 DeepSeek、MiroFish、backend、save、runtime、formal lore 或 public/legal/EdgeOne。
6. 通过什么 RebornG-owned 测试或文档门禁验收。

## 当前结论

专家团建议：

1. Ctx2Skill 立即进入 pre-v4.3 制度专项。
2. ReAct、Reflexion、Self-Refine、Constitutional AI、DSPy 作为开发制度和 skill 演化参考池。
3. Generative Agents、Voyager、Concordia、TextWorld、SOTOPIA、CICERO 继续作为 Agent Lab、NPC 社会、社交智能、战略压力和世界评测参考池。
4. 所有参考先转译成 RebornG-owned gate，再考虑代码或 runner。
5. 当前不改变 v4.2 授权包，不开放 v4.3 runtime 权限。
