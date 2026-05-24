# v2.9.0 codex 总览

日期：2026-05-24
状态：completed locally；D-290 已批准并执行，F-290 全部保持 `future_gate_required`
分支：`codex/v290-startup-pre-runtime-safety-closure`
主线：`v3.0 前安全收束：权限、prompt、eval、Player Advocate、MiroFish 边界统一复核`

## 一句话结论

v2.9 承接 v2.8 的 runtime admission 结果，但不进入 runtime agent 实现。启动审计结论是：`v2.0-v2.8` 基本按长期路线完成，已批准的代码/脚本/report-only 工具未发现缺口；代码 TODO/placeholder 命中主要是 UI 输入占位、测试 stub、错误分支或历史高阶面板旧注释，未发现 v2.x Agent Lab 路线“文档承诺了但代码没落”的阻塞项。v2.9 的任务是把 v3.0 前最后一道门禁做成可执行、可回滚、可验收的 go/no-go。

## 当前入口

| 文档 | 用途 | 状态 |
|---|---|---|
| `v2.9.0-专家团启动会纪要.md` | 专家团意见、启动结论、风险直说 | completed startup |
| `v2.9.0-长期路线按期实现审计.md` | v2.0-v2.8 长期路线兑现核对 | completed startup audit |
| `v2.9.0-文档代码一致性与TODO审计.md` | 文档/代码差异、TODO/placeholder triage | completed startup audit |
| `v2.9.0-启动审查与范围冻结.md` | 输入、边界、范围冻结 | completed startup |
| `v2.9.0-总体开发大纲.md` | v2.9 主线、产物、禁止项 | draft for approval |
| `v2.9.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc | draft for approval |
| `v2.9.0-D290决策记录.md` | 用户批准记录与执行口径 | completed |
| `v2.9.0-前置授权包.md` | D-290 / F-290 全版本授权边界 | approved/executed |
| `v2.9.0-需求决策池.md` | D-290 / F-290 决策池 | approved/executed |
| `v2.9.0-a0-v2.8复盘与安全收束范围冻结.md` | v2.8 复盘与 v2.9 范围冻结 | completed；`v290_a0_pre_runtime_safety_closure_scope_v1` |
| `v2.9.0-a1-runtime-agent-contract与WorldCore-post-check门禁.md` | v3.0 runtime agent contract / post-check 草案 | completed；`v290_a1_runtime_agent_contract_worldcore_postcheck_v1` |
| `v2.9.0-a2-live-PA-drift-rollback-old-save门禁.md` | v3.0 live / PA / drift / rollback / old-save 草案 | completed；`v290_a2_live_pa_drift_rollback_oldsave_gate_v1` |
| `v2.9.0-b1-report-only-v3-runtime-go-no-go-checker第一刀.md` | report-only go/no-go checker | completed；18/18 accepted |
| `v2.9.0-b2-MiroFish-private-canon-external-self-learning统一复核.md` | 高风险边界统一复核 | completed |
| `v2.9.0-b3-v3.0启动准入清单与用户决策包.md` | v3.0 启动准入清单 | completed；`v290_b3_v30_startup_admission_package_v1` |
| `v2.9.0-process-1-前置审批制度第五轮复核.md` | 前置审批制度第五轮复核 | completed |
| `v2.9.0-rc-质量收束记录.md` | v2.9 质量收束 | completed locally |
| `v2.9.0-测试矩阵.md` | 文档、审计、report-only 检查矩阵 | draft |
| `v2.9.0-真相源索引.md` | 本版本依据和禁止事实源 | completed startup |
| `v2.9.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 | completed startup；`not_needed` |
| `v2.9.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 | completed startup plan |
| `v2.9.0-startup-Skill同步审计记录.md` | startup skill sync audit | completed startup |

## 编号说明

v2.9 使用 `D-290` / `F-290`。它和 v2.8 的 `D-280` / `F-280` 分开，避免跨版本追踪混淆。

## 已批准决策

- D-290-001 至 D-290-012：用户已全部批准，并已在授权范围内执行完毕。
- F-290-001 至 F-290-012：用户已确认全部保持 `future_gate_required`。
- v2.9 `/goal` 自动推进未触发例外停机；所有 F-290 事项仍未开放。

## 启动审计结论

- 长期路线兑现：v2.0-v2.8 与 `v2.0-v3.0 Agent Lab 到 Runtime Agent 总体大纲` 基本一致。
- 代码/工具证据：v2.1/v2.2/v2.3/v2.6/v2.7/v2.8 的 self-owned zero-dependency report-only/offline runner、samples、npm scripts 和 artifacts 均存在。
- 文档/代码差异：未发现已批准 v2.x Agent Lab / runtime admission scope 中“文档写了但代码没实现”的阻塞项。
- TODO/placeholder：代码命中已 triage；少数旧高阶 UI/历史迁移注释不属于 v2.0-v2.8 已批准 scope，不阻塞 v2.9，但保留为未来高阶系统复核输入。

## b1 Checker 结果

`npm run check:v290-pre-runtime-go-no-go` 已通过：

- report：`artifacts/v2.9.0/pre-runtime-go-no-go/2026-05-24T07-12-28-795Z/report.json`
- 18/18 schema valid。
- decisions：`go_for_v3_design_gate=4`，`future_gate_required=5`，`no_go_blocked=9`。
- P0/P1 falseNegative=0/0。
- resultMismatch=0。
- missingRequiredFamilies=0。
- rescoreStable=true。
- boundaryAssertions 全 false。
- `acceptedForGate=true`。
- `goForV3DesignGate=true`。
- `runtimeImplementationApproved=false`。

## 硬边界

v2.9 完成收束不授权：

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

## 下一步

建议开 v3.0 专家团/设计门禁，主题为：

`一个小区域内有限 L2/L3 runtime agent 试点设计门禁`

不得直接进入 v3.0 runtime agent implementation；进入 v3.0 前仍需 D-300/F-300 用户决策。
