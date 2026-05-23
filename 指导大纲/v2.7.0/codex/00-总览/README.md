# v2.7.0 codex 总览

日期：2026-05-24
状态：v2.7.0 completed locally；D-271 approved/executed；F-271 kept future_gate_required
分支：`codex/v270-startup-multi-npc-agent-lab`
主线：`低阶多 NPC / 小势力 Agent Lab 样板扩展`

## 一句话结论

v2.7 承接 v2.6 的 agent infra 准入清单，把 Agent Lab 从单一边界 checker 推进到多 NPC、小队记忆、小势力压力、商队/散修/路人聚合反应的离线样板扩展。v2.7 已完成本地开发，仍然是 synthetic / offline / report-only，不批准 runtime agent、后端、live DeepSeek、MiroFish export、真实原著事实或正式游戏事实。

## 当前入口

| 文档 | 用途 | 状态 |
|---|---|---|
| `v2.7.0-专家团启动会纪要.md` | 专家团意见与启动结论 | completed |
| `v2.7.0-前置授权包.md` | D-271 / F-271 全版本授权边界 | approved/executed |
| `v2.7.0-启动审查与范围冻结.md` | v2.6 输入、硬边界、范围冻结 | completed startup |
| `v2.7.0-总体开发大纲.md` | 主线、产物目标、工程边界 | completed |
| `v2.7.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc | completed |
| `v2.7.0-需求决策池.md` | D-271 / F-271 决策池 | approved/executed |
| `v2.7.0-a0-v2.6复盘与多NPC小势力AgentLab范围冻结.md` | v2.6 复盘与 v2.7 a0 范围冻结 | completed |
| `v2.7.0-a1-多NPC小势力AgentLab场景模型设计门禁.md` | 场景模型、L1/L2/L3/L5 边界、WorldCore post-check | completed |
| `v2.7.0-a1-Skill同步审计记录.md` | a1 skill sync audit | completed |
| `v2.7.0-a2-memory-propagation-pressure-handoff门禁.md` | memory/pressure/handoff gate | completed |
| `v2.7.0-a2-Skill同步审计记录.md` | a2 skill sync audit | completed |
| `v2.7.0-b1-report-only-multi-NPC-AgentLab-runner第一刀.md` | 自有 dry-run runner 与 synthetic fixtures | completed |
| `v2.7.0-b2-cross-turn-memory-rescore与negative-cases.md` | rescore、negative cases、P0/P1 false negative gate | completed |
| `v2.7.0-b3-v2.8-runtime-admission-precheck.md` | v2.8 runtime admission 预检查，不授权 runtime | completed |
| `v2.7.0-process-1-前置审批制度第三轮复核.md` | 前置审批与例外停机制度复核 | completed |
| `v2.7.0-rc-多NPC小势力AgentLab质量收束记录.md` | rc 质量收束、测试与边界证明 | completed |
| `v2.7.0-rc-Skill同步审计记录.md` | rc skill sync audit 与健康门 | completed |
| `v2.7.0-测试矩阵.md` | v2.7 report-only / offline 测试矩阵 | completed |
| `v2.7.0-真相源索引.md` | 本版本依据与禁止事实源 | completed |
| `v2.7.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 | completed；not_needed |
| `v2.7.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 | completed locally |
| `v2.7.0-startup-Skill同步审计记录.md` | startup skill sync audit | completed |

## 编号说明

历史文档中 `D-270-001` 至 `D-270-006` 已用于 v2.5 启动前决策。为避免编号冲突，v2.7 前置授权包采用 `D-271` / `F-271`。

## 当前建议

用户已批准：

- D-271-001 至 D-271-012：全部批准并已按授权包执行。
- F-271-001 至 F-271-012：全部保持 `future_gate_required`。

v2.7 后续记录证明前置审批包可支持 `/goal` 连续完成；未触发 F-271 例外停机。

## 硬边界

v2.7 startup 不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`。
- runtime agent、WorldCore runtime 接入、agent 写正式事实。
- live DeepSeek、DeepSeek prompt/context/model/authority 变更、DeepSeek visible lore/RAG。
- backend/BFF/private canon service/eval archive service/job queue service/cloud save。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- MiroFish export/intake、真实原著事实、命名 NPC、hidden-adjacent、方源公开证据、正式 lore 结论。
- 知识库正文、runtime canon、canon promotion、真实 hidden/private body、prompt body archive。
- 正式地点、阵营、身份、奖励、NPC 生死、正式游戏事实。
- public wording、release、EdgeOne 部署、法律/版权边界变化。

## Runner 结果

命令：`npm run check:v270-multi-npc-agent-lab`

报告：`artifacts/v2.7.0/multi-npc-agent-lab/2026-05-23T19-05-35-152Z/report.json`

结果：

- samples：23
- schemaValid：23/23
- acceptedForGate：23/23
- acceptedCandidate：16
- needsUserDecision：1
- rejectedViolation：6
- falseNegative：0
- unexpectedBlocking：0
- resultMismatch：0
- rescoreStable：true
- boundaryAssertions：全部 false

报告中的 P0/P2 数量来自负样本的预期拒绝分类，不是 v2.7 开放 blocker；门禁关注 falseNegative、unexpectedBlocking、mismatch 与 boundaryAssertions。

## 下一步

候选下一步：开 `v2.8` 专家团启动会，围绕 runtime admission precheck 讨论哪些 L2/L3 能力可以进入更严格准入门禁。v2.7 不自动批准 v2.8 runtime agent。
