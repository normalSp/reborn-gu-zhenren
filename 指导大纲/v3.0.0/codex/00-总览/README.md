# v3.0.0 总览

日期：2026-05-24
状态：completed locally；D-300 已批准，F-300 保持 `future_gate_required`
主线：`有限 L2/L3 runtime agent 试点设计门禁`

## 一句话结论

v3.0 已完成专家团/设计门禁、report-only/offline 准入检查与质量收束，但当前仍未批准 runtime agent implementation。

本版本把“一个小区域内有限 L2/L3 agent 输出候选和表达”拆成可批准、可测试、可回滚的工程门禁。用户已批准 D-300-001 至 D-300-012，并确认 F-300-001 至 F-300-012 全部保持 `future_gate_required`。因此 v3.0 只能完成设计门禁与 report-only/offline 准入检查，不能进入 runtime agent implementation。

## 当前入口

| 文件 | 用途 | 状态 |
|---|---|---|
| `v3.0.0-专家团启动会纪要.md` | 专家团意见与启动结论 | completed draft |
| `v3.0.0-启动审查与范围冻结.md` | v2.9 输入、硬边界、当前允许范围 | completed draft |
| `v3.0.0-总体开发大纲.md` | v3.0 全版本目标与非目标 | completed draft |
| `v3.0.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 切法 | completed draft |
| `v3.0.0-前置授权包.md` | D-300/F-300 一次性审批包 | approved/executed |
| `v3.0.0-需求决策池.md` | 决策池与 future gate 状态 | approved/executed |
| `v3.0.0-测试矩阵.md` | 设计门禁、contract、post-check、live/PA/drift 样本 | draft |
| `v3.0.0-真相源索引.md` | 当前 truth sources | draft |
| `v3.0.0-MiroFish资料需求与交付协议.md` | MiroFish need classification | draft |
| `v3.0.0-Git提交与推送计划.md` | 分支、提交、推送和回滚边界 | draft |
| `v3.0.0-startup-Skill同步审计记录.md` | skill sync audit | completed startup |
| `v3.0.0-rc-Skill同步审计记录.md` | rc skill sync audit | completed |
| `v3.0.0-a0-v2.9复盘与runtime-agent试点范围冻结.md` | a0 试点范围冻结 | completed |
| `v3.0.0-a1-AgentProposal与WorldCore-post-check设计门禁.md` | AgentProposal / post-check contract | completed |
| `v3.0.0-a2-live-PA-drift-rollback-oldsave门禁.md` | live/PA/drift/rollback/old-save 门禁 | completed |
| `v3.0.0-b1-runtime-agent-design-go-no-go-report-only第一刀.md` | report-only go/no-go checker | completed |
| `v3.0.0-b2-report-only-hardening.md` | report-only hardening | completed |
| `v3.0.0-b3-同开局差异NPC意图势力压力复核.md` | same-start/NPC/faction review | completed |
| `v3.0.0-process-1-前置审批制度第六轮复核.md` | frontloaded approval process review | completed |
| `v3.0.0-process-2-长线漂移与知识边界复核.md` | drift / knowledge boundary review | completed |
| `v3.0.0-rc-质量收束记录.md` | rc closure | completed |

## 启动依据

- v2.9 `check:v290-pre-runtime-go-no-go` 通过。
- `goForV3DesignGate=true`。
- `runtimeImplementationApproved=false`。
- v2.9 b3 已冻结 `v290_b3_v30_startup_admission_package_v1`。
- 长期路线要求 v3.0 只做一个小区域内有限 L2/L3 runtime agent 试点。

## 当前硬边界

v3.0 startup 不授权：

- runtime agent implementation。
- WorldCore runtime 接入。
- 新 save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`。
- live DeepSeek 实跑。
- DeepSeek prompt/context/model/authority 扩展。
- DeepSeek visible lore/RAG。
- backend/BFF/service/job queue/eval archive/cloud save。
- MiroFish export/intake。
- 知识库正文、runtime canon、hidden/private body、prompt body archive。
- external framework PoC/dependency/vendored subset/read-only scan/patch artifact/subagents。
- L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 live。
- 正式地点、阵营、身份、奖励、NPC 生死、canon promotion。
- self-learning 直接改 canon/runtime/save/prompt/knowledge-index/DeepSeek visible context。
- public wording、release、EdgeOne、法律/版权边界变化。

## 专家团启动结论

建议 v3.0 的第一阶段不是“立刻接 agent”，而是：

1. 冻结 small-area / L2-L3 / proposal-only 范围。
2. 冻结 AgentProposal -> WorldCore post-check -> expression 的合同。
3. 冻结 live probe / Player Advocate / long drift / rollback / old-save 方案。
4. 冻结是否需要 save field 的判断门。
5. 冻结 MiroFish、外部框架、backend、自学习的停机触发器。

## 当前审批状态

- D-300-001 至 D-300-012：已批准。
- F-300-001 至 F-300-012：全部保持 `future_gate_required`。

## 完成结论

v3.0 已按批准范围完成：设计门禁、report-only checker、文档/入口/skill 审计和 CI。若要进入真正 runtime agent implementation，需要未来单独批准 F-300-001 及其关联 gate。
