# v3.2.0 总览

日期：2026-05-24
状态：completed locally；D-320 approved/executed；F-320 `future_gate_required`
主线：offline / report-only runtime rehearsal

## 定位

v3.2 承接 v3.1 的 `v32RehearsalAdmissible=true` 结论，但不把 agent 放进正式 runtime。

本版本要模拟一条“看起来像 runtime”的完整链路：

`synthetic world snapshot -> L2/L3 proposal batch -> WorldCore post-check rehearsal -> approved expression sample / rejection / manual review / future gate report`

核心目标不是实现 runtime agent，而是证明后续如果要重新讨论 F-300，项目已经有足够清楚的证据链、拒绝链、人工复核链和回滚边界。

## 硬边界

- 不改 runtime/source/UI/store/prompt/save。
- 不实现 runtime agent implementation。
- 不写玩家存档，不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 DeepSeek prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不建 backend/BFF/service/job queue/eval archive/cloud save。
- 不做 MiroFish export/intake，不吸收真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不写知识库正文，不 promotion runtime canon，不归档 hidden/private body。
- 不引入 external framework PoC/dependency/read-only scan/vendored subset/patch artifact/subagents。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不发布公开口径，不部署 EdgeOne。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.2.0-专家团启动会纪要.md` | v3.2 专家团意见与版本基调 |
| `v3.2.0-D320决策记录.md` | D-320 批准与执行记录 |
| `v3.2.0-启动审查与范围冻结.md` | v3.1 准入复核与 v3.2 范围冻结 |
| `v3.2.0-总体开发大纲.md` | v3.2 总体阶段设计 |
| `v3.2.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc 执行顺序 |
| `v3.2.0-前置授权包.md` | D-320 建议批准项与 F-320 future gate |
| `v3.2.0-例外停机清单.md` | `/goal` 自动推进时必须停机的条件 |
| `v3.2.0-需求决策池.md` | D-320/F-320 决策记录入口 |
| `v3.2.0-测试矩阵.md` | v3.2 文档、报告、checker、边界样本计划 |
| `v3.2.0-真相源索引.md` | v3.2 的证据优先级 |
| `v3.2.0-MiroFish资料需求与交付协议.md` | 当前 MiroFish need level 与升级条件 |
| `v3.2.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 |
| `v3.2.0-startup-Skill同步审计记录.md` | startup skill sync audit |
| `v3.2.0-a0-v3.1准入复核与rehearsal范围冻结.md` | a0 范围冻结 |
| `v3.2.0-a1-synthetic-world-snapshot与rehearsal-envelope-schema门禁.md` | a1 schema 门禁 |
| `v3.2.0-a2-proposal-batch-postcheck-expression-chain门禁.md` | a2 chain 门禁 |
| `v3.2.0-b1-report-only-runtime-rehearsal-checker第一刀.md` | b1 checker 第一刀 |
| `v3.2.0-b2-rejection-manual-future-gate趋势与rescore稳定.md` | b2 hardening |
| `v3.2.0-b3-v3.3-F300-reopen决策包草案.md` | b3 v3.3 决策包草案 |
| `v3.2.0-process-1-前置审批制度第八轮复核.md` | process-1 |
| `v3.2.0-process-2-长线漂移与知识边界复核.md` | process-2 |
| `v3.2.0-rc-Skill同步审计记录.md` | rc skill audit |
| `v3.2.0-rc-质量收束记录.md` | rc 质量收束 |

## 当前结论

v3.2 已完成 report-only runtime rehearsal。`check:v320-runtime-rehearsal` 通过，报告为 `artifacts/v3.2.0/runtime-rehearsal/2026-05-24T13-17-44-101Z/report.json`。

完成结论：

- D-320-001 至 D-320-012：已批准并执行。
- F-320-001 至 F-320-012：全部保持 `future_gate_required`。
- checker：26/26 schema valid；decisions `rehearsal_ok=5`、`manual_review_required=2`、`future_gate_required=7`、`rejected_violation=12`。
- P0/P1 falseNegative：0/0。
- resultMismatch：0。
- missingRequiredFamilies：0。
- `v33DecisionPackageReady=true`。
- `runtimeImplementationApproved=false`。
