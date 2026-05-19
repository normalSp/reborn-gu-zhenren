# RebornG 外部活世界参考映射

日期：2026-05-19
状态：项目-owned 长期参考；只吸收设计思想，不引入运行时依赖

## 定位

本文件整理用户提出的“活着的蛊世界”外部参考，并把它们映射到 RebornG 的具体制度、文档、测试和未来版本。

这些参考不是 RebornG 的技术选型清单，也不是要照搬的框架。RebornG 的核心仍然是：

- 本地 deterministic TypeScript core 拥有世界事实、奖励、地点、战斗、NPC 生死和存档权威。
- DeepSeek 只写叙事、候选、线索、传闻和压力。
- MiroFish 只提供 quote-redacted 候选材料，必须经过 intake review。
- 玩家自由意图必须经过本地裁决和行动协议。

## 使用原则

1. 借鉴思想，不复制架构。
2. 先把思想转成 RebornG-owned 文档、字段、测试、门禁，再进入 runtime。
3. 不因为外部项目存在多代理、社会模拟或长记忆，就急着引入可写子代理。
4. 不把外部 demo 的自由聊天感误认为 RebornG 的活世界核心。
5. 每个参考必须对应一个 RebornG 可执行落点：文档、测试矩阵、engine 设计、Player Advocate gate、MiroFish intake 或专家团流程。

## 映射总表

| 外部参考 | 可借鉴思想 | RebornG 落点 | 适合版本 | 不能照搬 |
|---|---|---|---|---|
| Generative Agents | 观察、记忆、反思、计划，NPC 日常行为 | NPC/势力长期关系、事件编年史、Player Advocate 玩家可见行为 | v1.3+ | 不让 LLM 自由记忆；NPC 记忆必须结构化、可审计、可回滚 |
| Voyager | 技能库、自我课程、环境反馈、自我验证 | 专家团候选需求池、测试矩阵演进、`.learnings`、长测样本增长 | v1.6+，流程长期使用 | 不做自动探索式乱改代码或 runtime 内容 |
| Concordia | 可组合社会模拟、GM/组件化仿真 | 势力/NPC 仿真设计、关系证据、社会压力组件 | v1.3-v2.0 | 不把 RebornG 改成 Python 实验框架 |
| AI Town | 多 NPC 可见行为、公开演示节奏 | 活世界 UI 可见性、NPC 行为摘要、公开 demo 可读性 | v1.3+，发布体验 | 不做通用小镇聊天 demo |
| Reflexion | 失败经验转成下一次策略 | `.learnings/ERRORS.md`、测试矩阵、Player Advocate finding 回流 | 已经使用，v1.x 持续强化 | 不写空泛经验；必须绑定测试或门禁 |
| ReAct | 推理与行动结合 | 自由意图 -> 本地裁决 -> 行动协议 -> 账本回流 | v1.1 起持续使用 | 不让模型直接执行世界写入 |
| AutoGen | 多代理对话、角色分工、审查 | 只读审查代理、专家团角色分工、未来审计流程 | v1.6+ 之后试点 | 不急着上可写多代理 |
| MetaGPT | SOP、角色、产物链路 | 专家团阶段门禁、ADR-lite、需求池、交付模板 | 已经部分使用，v1.x 持续完善 | 不复刻“大型 AI 公司”层级 |

## 分项说明

### Generative Agents

参考来源：

- Paper: `https://arxiv.org/abs/2304.03442`
- Repo: `https://github.com/joonspk-research/generative_agents`

可借鉴：

- NPC 不只是反应器，还应有观察、记忆、反思和计划。
- 玩家应能看见 NPC/社会的行为痕迹，而不是只看到系统判定。
- 事件编年史可以作为长期叙事稳定层。

RebornG 用法：

- v1.3 后的 NPC 关系第二层可引入 `observation -> memory evidence -> reflection summary -> planned response` 的结构。
- `npcMemories` 不应只是文本日志，要能区分证据、印象、怀疑、利益和可见反应。
- DeepSeek 可写 NPC 语气和叙事，但不能拥有 NPC 记忆写入权。

### Voyager

参考来源：

- Paper: `https://arxiv.org/abs/2305.16291`
- Repo: `https://github.com/MineDojo/Voyager`

可借鉴：

- 自动课程：系统主动提出下一步学习/挑战。
- 技能库：把验证过的能力沉淀为可复用技能。
- 环境反馈：失败后调整策略，而不是反复犯同样错误。

RebornG 用法：

- 专家团每个大版本给 3-5 条候选需求，本质上是 RebornG 的“自动课程”。
- `.learnings/ERRORS.md`、测试矩阵、Player Advocate gate 是 RebornG 的技能库和反馈层。
- 每次 bug 或玩家困惑必须归类到测试、文档、skill、门禁或后续需求。

### Concordia

参考来源：

- Repo: `https://github.com/google-deepmind/concordia`

可借鉴：

- 社会模拟可以由可组合组件构成。
- 一个环境可以有类似 GM 的调度者，负责给 agent/world 提供上下文和规则。

RebornG 用法：

- v1.3-v2.0 的 NPC/势力系统可以拆成组件：关系证据、势力压力、公开事件、私人记忆、身份风险、区域规则。
- “GM”思想对应 RebornG 的本地 engine 和 canon gate，而不是 DeepSeek。

### AI Town

参考来源：

- Repo: `https://github.com/a16z-infra/ai-town`

可借鉴：

- 多 NPC 行为如果完全藏在后台，玩家不一定感到世界活着。
- 公开 demo 需要让旁观者快速看懂“这些人正在做什么”。

RebornG 用法：

- v1.3 后 UI 可以强化“局势摘要”“公开行动摘要”“NPC/势力最近反应”。
- Player Advocate 要评价玩家是否看懂自己影响了谁、影响了什么。
- 公开展示时不只展示 DeepSeek 文本，还要展示本地账本与世界反应。

### Reflexion

参考来源：

- Paper: `https://arxiv.org/abs/2303.11366`

可借鉴：

- 失败经验要转化为下一次策略。
- 语言反思本身不够，必须进入可执行改进。

RebornG 用法：

- `.learnings/ERRORS.md` 不只是日志，而是回归测试和门禁的入口。
- 每个 P0/P1/P2 bug、Player Advocate 困惑、MiroFish intake 风险都必须进入 `current_matrix`、`future_sample_pool` 或 `discarded`。

### ReAct

参考来源：

- Paper: `https://arxiv.org/abs/2210.03629`

可借鉴：

- 推理和行动应该交替，而不是只输出一段文本。

RebornG 用法：

- 玩家输入不能直接变成剧情事实。
- 标准链路应是：自由意图 -> 本地裁决 -> 前置条件/拒绝/行动候选 -> 统一行动协议 -> 本地结算 -> 账本回流 -> DeepSeek 叙事。

### AutoGen

参考来源：

- Repo: `https://github.com/microsoft/autogen`

可借鉴：

- 多角色审查、多代理协作、对话式任务拆解。

RebornG 用法：

- 先用于只读审查思想：世界观审校、测试审查、发布边界审查。
- 不在 v1.1-v1.3 急着引入可写多代理。
- 若以后试点，也必须限定文件所有权和回滚边界。

### MetaGPT

参考来源：

- Repo: `https://github.com/FoundationAgents/MetaGPT`

可借鉴：

- SOP、角色职责、产物链路。

RebornG 用法：

- 专家团阶段门禁、需求池、ADR-lite、Git 计划和交付模板已经吸收了这类思想。
- 后续可以加强“版本开始 -> 需求池 -> 用户决策 -> 实现 -> 测试 -> 复盘 -> skill 更新”的固定产物链路。

## 放到哪个文档

本文件作为长期路线总入口的子文档存在。

各版本只引用本文件，不重复拷贝全文：

- v1.1：引用 ReAct、Reflexion、Voyager，用于路线/地点设计门禁、测试矩阵和错误回流。
- v1.3：引用 Generative Agents、Concordia、AI Town，用于 NPC/势力社会层。
- v1.6：引用 Voyager、Reflexion、AutoGen、MetaGPT，用于内容生产、测试工厂和只读审查代理。
- v2.0：综合引用所有参考，但仍以 RebornG 本地 canon/engine/store 为权威。

## 当前不做

- 不安装这些项目。
- 不把 RebornG runtime 改成多代理框架。
- 不把 NPC 记忆交给 LLM 自由维护。
- 不为了社会模拟牺牲本地存档、测试和 canon 权威。
- 不在 v1.1 里引入后端或 Python 仿真框架。
