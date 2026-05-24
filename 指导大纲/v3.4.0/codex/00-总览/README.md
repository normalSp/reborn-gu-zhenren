# v3.4.0 总览

日期：2026-05-24
状态：completed locally
主线：最小 `transient proposal-only` runtime first cut

## 定位

v3.4 承接 v3.3 的 `F-300 reopen 决策包`。v3.3 已证明可以讨论最小 runtime agent 第一刀，但没有自动授权实现。

启动会先把三条路线写清楚：

1. 继续 report-only hardening。
2. 单独重开最小 `transient proposal-only` runtime first cut 授权包。
3. 继续 defer 到 v3.5+。

用户已批准路线 2：只打开一个窄口，L2/L3 小区域、transient AgentProposal、WorldCore post-check、expression-only、不写事实、不写存档、不调用 live DeepSeek。

## 既定路线回放

长期路线 `v3.0-v4.0-RuntimeAgent到高阶世界总体大纲.md` 的设定是：

- v3.1：继续加固 runtime agent 门禁。
- v3.2：做 offline / report-only runtime rehearsal。
- v3.3：给出 F-300 reopen 决策包。
- v3.4-v3.6：如果未来获批，分阶段做最小 L2/L3 小区域试点；v3.4 已获批并完成最小 transient first cut。
- v3.7-v3.8：多 NPC、小势力、同开局差异、长期记忆污染和漂移复核。
- v3.9：v4.0 前安全收束。
- v4.0：高阶战斗 + 天道/宿命双预备，不承诺完整蛊仙开放。

因此，v3.4 不是“必须继续 report-only”，也不是“默认实装 runtime agent”。它是第一处可以让你决定是否打开最小窄口的位置。

## 已完成内容

v3.4 已完成：

- D-340-001 至 D-340-012 全部 approved。
- F-340-001 仅限 transient proposal-only narrow gate limited open。
- F-340-002 至 F-340-012 全部继续 `future_gate_required`。
- 新增 `src/engine/v340-transient-agent-proposal.ts`。
- 新增 `RuntimeAgentProposalPanel` 和世界面板 `意图` tab。
- 新增 v3.4 unit/post-check/rejection/old-save/deterministic 测试。
- 新增 v3.4 Playwright e2e。
- 完成 10 轮 Player Advocate 和 30 轮 deterministic 漂移检查。

## 硬边界

v3.4 不授权：

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake，不吸收真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不做 backend/BFF/service/job queue/eval archive/cloud save。
- 不引入 external framework PoC/dependency/read-only scan/subagent/patch artifact。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不做 public wording、release、EdgeOne 或法律/版权边界变化。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.4.0-专家团启动会纪要.md` | 专家团路线判断、收益风险与推荐 |
| `v3.4.0-启动审查与范围冻结.md` | v3.3 证据复核与 v3.4 startup 范围 |
| `v3.4.0-总体开发大纲.md` | v3.4 候选阶段设计 |
| `v3.4.0-小版本执行路线图.md` | route 1 / route 2 / route 3 的执行拆分 |
| `v3.4.0-前置授权包.md` | D-340 / F-340 授权包与最终状态 |
| `v3.4.0-例外停机清单.md` | 后续 `/goal` 自动推进硬停条件 |
| `v3.4.0-需求决策池.md` | v3.4 决策状态入口 |
| `v3.4.0-测试矩阵.md` | startup 自检和未来 route 2 验收档位 |
| `v3.4.0-真相源索引.md` | v3.4 证据优先级 |
| `v3.4.0-MiroFish资料需求与交付协议.md` | 当前 MiroFish need level 与 blocking 触发器 |
| `v3.4.0-Git提交与推送计划.md` | 分支、提交、推送与 CI 计划 |
| `v3.4.0-startup-Skill同步审计记录.md` | startup skill sync audit |
| `v3.4.0-D340-Route2授权记录.md` | D-340 / F-340 用户授权落地 |
| `v3.4.0-a0-F340窄口授权确认.md` | F-340-001 limited-open 范围确认 |
| `v3.4.0-a1-transient-AgentProposal-runtime-contract设计门禁.md` | AgentProposal contract 门禁 |
| `v3.4.0-a2-candidate-vs-fact-ui文案门禁.md` | candidate vs fact UI/copy 门禁 |
| `v3.4.0-b1-最小transient-runtime-first-cut第一刀.md` | runtime first cut 实现记录 |
| `v3.4.0-b2-rejection-rollback-oldsave-no-save-write证据.md` | rejection/rollback/old-save 证据 |
| `v3.4.0-b3-Player-Advocate-10轮走查记录.md` | 10 轮 Player Advocate |
| `v3.4.0-b3-30轮deterministic漂移检查记录.md` | 30 轮 deterministic 漂移检查 |
| `v3.4.0-process-1-前置审批制度第十轮复核.md` | 前置审批制度复核 |
| `v3.4.0-process-2-长线漂移与知识边界复核.md` | 漂移和知识边界复核 |
| `v3.4.0-rc-Skill同步审计记录.md` | rc skill sync audit |
| `v3.4.0-rc-质量收束记录.md` | v3.4 quality closure |

## 当前结论

v3.4 已按路线 2 完成最小 runtime first cut。它证明 `AgentProposal -> WorldCore post-check -> 玩家可见候选表达` 这条链可以进入 runtime，但仍没有开放完整 runtime agent、持久 agent 记忆、live DeepSeek agent、后端、外部框架、MiroFish 或正式世界事实。
