# Agent Framework Landscape 2026 吸收矩阵

日期：2026-05-23
状态：v2.4 前置正式专项；用户已批准；长期路线输入；不授权当前 runtime。
当前分支：`codex/v240-pre-agent-framework-landscape`

## 定位

本文件把 v2.1-a1 的开源 Agent 框架尽调升级为 2026 横向吸收矩阵。

本次评估不按 star 排名，而按一个问题打分：

> 它能不能服务 RebornG 的游戏世界内核？

这里的“服务”只允许理解为：

- 帮助 WorldCore 更好地裁决。
- 帮助 AgentProposal 更稳定地产生候选。
- 帮助 visibility / private canon / memory / eval / replay archive 更可审计。
- 帮助 NPC、势力、经济、战斗、剧情表达更像活世界，但不越权写事实。

## 用户已批准事项

| ID | 决策 | 结果 |
|---|---|---|
| PRE24-FW-001 | v2.4 启动前新增 `Agent Framework Landscape 2026 吸收矩阵` 正式专项 | 已批准 |
| PRE24-FW-002 | Hermes Agent 定位为 `P0 架构参考` 与 `P1 隔离 PoC 候选` | 已批准 |
| PRE24-FW-003 | 当前不批准 Hermes PoC，只批准 license / SBOM / 架构适配评估 | 已批准 |
| PRE24-FW-004 | 明确禁止自学习直接改 canon / runtime / save | 已批准 |
| PRE24-FW-005 | 把 self-learning 作为 v2.5/v2.6 正式研究方向：NPC 记忆/技能候选自进化，但不自裁决 | 已批准 |

## 硬边界

本专项不授权：

- runtime agent。
- live DeepSeek。
- DeepSeek prompt / context / model / authority 变更。
- BFF/backend。
- subagents。
- 外部 framework PoC。
- 外部 SDK/agent 读写 RebornG 项目文件。
- 外部 SDK/agent 执行 shell、package、project 命令。
- 外部 SDK/agent 生成 patch 或操作 git。
- 第三方 dependency / vendored subset。
- MiroFish export。
- 知识库正文、runtime canon、DeepSeek visible lore/RAG。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- 新 save fields、`SAVE_FORMAT_VERSION` bump 或 `runFingerprint`。
- EdgeOne 自动部署。

## 评分口径

总分不是 popularity 分数。高 star 只说明生态热度，不代表适合游戏世界内核。

| 维度 | 权重 | 问题 |
|---|---:|---|
| WorldCore 兼容度 | 5 | 是否天然支持“agent 只提候选，世界内核裁决事实” |
| visibility / hidden 安全 | 5 | 是否能帮助隔离 hidden/private/canon/source pointer |
| memory / self-learning 可控性 | 5 | 是否能让记忆和技能演化保持 candidate-only |
| eval / replay / audit | 5 | 是否能帮助长期回放、失败分类、趋势归档 |
| workflow / job / queue | 4 | 是否能支持离线批处理、长测、定时复评 |
| TS/browser 适配 | 4 | 是否贴近 RebornG 当前 TypeScript/browser 栈 |
| license / SBOM 风险 | 4 | 是否便于合规复用、裁剪、隔离 PoC |
| 游戏系统收益 | 5 | 是否能改善剧情、NPC 情绪、势力、经济、战斗或知识治理 |

评级：

- P0：必须持续跟踪，可直接影响 RebornG 架构路线。
- P1：值得专项评估，可作为隔离 PoC / subset 候选。
- P2：可吸收思想，不宜近期接入。
- P3：只作为历史/生态参考。

## 2026 快照矩阵

GitHub 指标是 2026-05-23 快照，用于判断生态活跃度，不作为核心评分依据。

| 项目 | 快照 | 许可 | 主语言 | 评级 | RebornG 结论 |
|---|---:|---|---|---|---|
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | 163k stars / 26k forks | MIT | Python | P0 架构参考；P1 PoC 候选 | self-learning、skills、memory、session search、cron、tool gateway、security、kanban 对 RebornG 很有启发；不直接并入 runtime |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 32k / 5.5k | MIT | Python | P0 | 长运行状态图、durable execution、human-in-loop 贴近 Agent Orchestrator / WorldCore post-check |
| [Mastra](https://github.com/mastra-ai/mastra) | 24k / 2.1k | license mapping required | TypeScript | P0/P1 | TS-first workflow / agent / memory / eval / MCP 很贴近 RebornG；正式接触前必须做 license mapping |
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | 26k / 4k | MIT | Python | P1 | handoff、guardrails、tracing、tools 可转为 AgentProposal/eval 设计 |
| [Google ADK](https://github.com/google/adk-python) | 19k / 3.4k | Apache-2.0 | Python | P1 | workflow runtime、task API、nested workflow 对 Agent Lab 有价值 |
| [AutoGen](https://github.com/microsoft/autogen) | 58k / 8.8k | repo license must be rechecked by package | Python | P1/P2 | 多 agent 消息和分布式 runtime 值得研究；不适合直接变成 NPC 聊天群 |
| [CrewAI](https://github.com/crewAIInc/crewAI) | 52k / 7.2k | MIT | Python | P2 | 角色协作/Flows 可参考；容易诱导“NPC 角色扮演团”越权 |
| [PydanticAI](https://github.com/pydantic/pydantic-ai) | 17k / 2.1k | MIT | Python | P1 | schema、validator、typed output、eval 很适合 AgentProposal gate |
| [Letta](https://github.com/letta-ai/letta) | 22k / 2.4k | Apache-2.0 | Python | P1/P2 | 长期记忆值得研究；记忆自进化污染 canon 的风险最高 |
| [OpenHands](https://github.com/OpenHands/OpenHands) | 74k / 9.4k | license mapping required | Python | P2 | sandbox、agent server、CLI/GUI/RBAC 可参考；偏代码 agent，不适合游戏 runtime |
| [Dify](https://github.com/langgenius/dify) | 142k / 22k | license mapping required | TypeScript | P1/P2 | workflow/app 平台能力强，可参考 BFF/eval archive/ops UI；平台体量过大，不适合作核心内核 |
| [Flowise](https://github.com/FlowiseAI/Flowise) | 53k / 24k | license mapping required | TypeScript | P2 | 可参考可视化 workflow / low-code editor；不适合 WorldCore 裁决 |
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | 184k / 46k | license mapping required | Python | P2 | 自主任务平台生态大；“自主目标执行”与 RebornG 权限边界冲突明显 |
| [Agno](https://github.com/agno-agi/agno) | 40k / 5.4k | Apache-2.0 | Python | P1/P2 | agent platform / infra 可参考；需评估是否比 LangGraph/Mastra 更适配 |
| [Browser-use](https://github.com/browser-use/browser-use) | 95k / 10k | MIT | Python | P2 | 非游戏内核；适合 QA、站点自动化、外部资料收集，不适合 NPC/经济 runtime |
| [LlamaIndex](https://github.com/run-llama/llama_index) | 49k / 7.4k | MIT | Python | P1/P2 | 知识索引、文档 agent、RAG 能力强；RebornG 禁止全书 RAG，适合 private canon/knowledge visibility 研究 |
| [CAMEL](https://github.com/camel-ai/camel) | 17k / 1.9k | Apache-2.0 | Python | P2 | 多 agent 社会/角色协作可参考；需防止变成无裁决聊天社会 |
| [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | 68k / 8.6k | MIT | Python | P2 | 多角色软件公司范式可参考流程，不适合游戏世界事实裁决 |
| [SWE-agent](https://github.com/SWE-agent/SWE-agent) | 19k / 2k | MIT | Python | P2 | 代码任务轨迹和 sandbox 思想可吸收；与游戏 NPC 关系弱 |
| [VoltAgent](https://github.com/VoltAgent/voltagent) | 9k / 928 | MIT | TypeScript | P1/P2 | TS agent 工程平台值得继续观察；生态量级与成熟度仍需后续比较 |

## Hermes Agent 深评

Hermes 是本次新增 P0。它不是因为 star 高，而是因为它的产品形态和 RebornG 未来需求高度重合：

- 自学习循环：复杂任务后生成/改进 skills。
- 记忆：短小常驻 memory、用户画像、会话 FTS5 检索、外部 memory provider。
- skill system：progressive disclosure、skill bundle、skill hub、安全扫描。
- 工具治理：toolsets、tool gateway、provider routing、secret/env passthrough。
- 安全：危险命令审批、hardline blocklist、容器/远程 sandbox、prompt-injection scan。
- 自动化：cron、script pre-check、context_from、no-agent jobs。
- 多工作流：kanban worker lane、orchestrator、review-required convention。
- 轨迹：batch trajectory / compression，可作为 eval archive 与训练资料思路。

### 可直接吸收的思想

| Hermes 能力 | RebornG 转译 |
|---|---|
| Agent-managed skills | `candidate_skill_patch`，只能进入人工/WorldCore/skill-sync 审计 |
| Persistent memory + session search | NPC / player / version replay archive；memory 不等于事实 |
| Progressive skills | MiroFish topic-slice、知识库、专家团 skill 的按需加载 |
| Cron / no-agent jobs | eval farm、long narrative drift、Player Advocate 预检查 |
| Tool gateway / provider routing | v2.4+ 薄 BFF / API proxy / cost observation 参考 |
| Security scanner | prompt/context/knowledge injection gate |
| Kanban worker lanes | 未来只读分析型子代理调度参考；当前不启用 |
| Trajectory compression | long-run report archive 与训练样本候选 |

### 不可直接照搬

Hermes 是通用 agent / coding agent / productivity agent，不是游戏世界内核。

不能直接照搬为：

- NPC 大脑。
- 经济系统。
- 天道/宿命导演。
- 战斗裁决器。
- canon 管理器。
- runtime save writer。

Hermes 的自学习能力如果不加 RebornG 约束，会带来高风险：

- 把玩家谣言写成 NPC 事实。
- 把 DeepSeek 候选写成 canon。
- 把 hidden/private ref 变成 visible body。
- 把经济话术变成真实价格/库存/奖励。
- 把 NPC 情绪演绎变成 NPC 生死/背叛/结盟结论。
- 把“好用的 skill”改成未来所有版本默认行为，污染专家团和 lore 边界。

## 游戏系统吸收评估

| 系统 | Hermes / Landscape 可带来的收益 | 必须保留的 RebornG 裁决 |
|---|---|---|
| 剧情 | 更好的长期记忆、session recall、剧情修复 skill、漂移样本回流 | WorldCore 决定事实、正史锚点、IF 后果 |
| NPC 情感 | L2/L3 可生成事件后反思、情绪候选、关系语气变化 | NPC 生死、忠诚/背叛/结盟、正式关系仍需 WorldCore/用户门禁 |
| 势力 | 多 agent/workflow 可模拟压力源、意见分歧、公开反应 | 正式通缉、招揽、封锁、身份改变不能由 agent 写 |
| 经济 | agent 可表达商贩态度、传闻、供需压力候选 | 价格、库存、交易、奖励、掉落、套利封禁由 engine/canon 控制 |
| 战斗 | agent 可生成战斗旁白、战术意图候选、敌我心理 | 命中、伤害、资源消耗、环境破坏、NPC 生死由战斗引擎/WorldCore 控制 |
| 知识库 | LlamaIndex/Hermes memory 可参考 source pointer / retrieval / archive | 禁止全书 RAG；hidden/private 不进 DeepSeek visible |
| 长测 | cron、trajectory、eval farm 可自动跑 replay/rescore | 测试通过不等于 runtime 权限批准 |
| 开发流程 | kanban、worker lane、skills hub 可参考流水线 | 当前仍禁止外部 agent 写项目/跑命令/git |

## v2.4-v3.0 路线调整

本专项不改变 v2.0-v3.0 总路线，只把外部框架吸收加固为前置基线。

| 版本 | 新增吸收要求 |
|---|---|
| v2.4 | 薄 BFF / private canon / eval archive 评估时，必须引用本矩阵；Hermes、LangGraph、Mastra、Dify、LlamaIndex 作为重点参考 |
| v2.5 | private canon / knowledge visibility 设计时，重点评估 Hermes memory、LlamaIndex retrieval、Letta memory 的污染风险 |
| v2.6 | agent job queue / replay archive 工程预备时，重点评估 Hermes cron、trajectory、kanban、security scanner 的可转译模式 |
| v2.7 | 多 NPC / 小势力扩展时，只吸收 workflow / memory / eval 模式，不接外部 runtime |
| v2.8 | runtime agent 准入门禁必须加入 `self-learning cannot self-adjudicate` |
| v2.9 | v3.0 前安全收束必须复核外部框架 license/SBOM/PoC 状态 |
| v3.0 | 只允许 L2/L3 在一个小区域提供候选和表达；外部框架若参与，也只能在 RebornG-owned adapter 后面输出 AgentProposal |

## 未来 PoC 准入门

当前只批准 license / SBOM / 架构适配评估，不批准 PoC。

未来若申请 Hermes 或其他框架 PoC，必须先列出：

1. PoC 仓库/目录，必须与 RebornG runtime 隔离。
2. 许可证和依赖 SBOM。
3. 是否安装依赖；若安装，安装到哪里。
4. 是否调用模型；若调用，模型、样本、成本、日志位置。
5. 是否读取 RebornG 文件；默认不允许。
6. 是否写入 RebornG 文件；禁止。
7. 是否运行 RebornG 命令；禁止。
8. 是否操作 git；禁止。
9. 输出格式必须是 report-only。
10. PoC 结束后的删除/归档计划。

## Skill 同步审计

| skill | 状态 | 说明 |
|---|---|---|
| `reborn-expert-council` | no_update_needed | 本专项已同步到 AGENTS / PROJECT-STATE / 长期路线 / 仪表盘；后续 v2.4 startup 再更新 Current Sync Override |
| `game-dev-text` | no_update_needed | 不改 runtime、测试脚本、工程栈或版本实现 |
| `reverend-insanity-lore` | no_update_needed | 不新增 lore、MiroFish、hidden/private、canon promotion 或 DeepSeek visible lore |
| `reborn-combat-motion` | no_update_needed | 不改战斗表现、UI、动效或资产 |
| `mirofish-reborng-export` | no_update_needed | 不新增 MiroFish request/export/intake |

## 当前结论

专家团建议：

1. v2.4 启动前把本文件作为正式输入。
2. Hermes 进入 P0 架构参考，尤其是 self-learning、memory、skills、cron、security、kanban。
3. Hermes 不作为 runtime agent 基座，不直接改造进游戏。
4. Dify/Flowise/AutoGPT/Agno/Browser-use/LlamaIndex 已进入补充矩阵，但近期只吸收模式。
5. v2.5/v2.6 应正式研究 `NPC 记忆/技能候选自进化，但不自裁决`。
6. RebornG 的核心路线仍是：`WorldCore 权威 -> AgentProposal 候选 -> visibility gate -> eval farm -> runtime 准入`。
