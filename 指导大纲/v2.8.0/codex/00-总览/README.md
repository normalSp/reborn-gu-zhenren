# v2.8.0 codex 总览

日期：2026-05-24
状态：completed locally；D-280 已批准，F-280 全部保持 `future_gate_required`
分支：`codex/v280-startup-runtime-admission-precheck`
主线：`Runtime Agent 接入准入门禁`

## 一句话结论

v2.8 已承接 v2.7 的多 NPC / 小势力 Agent Lab 证据，完成 `runtime agent 接入准入门禁`。本版本不是 runtime agent 实现，不接 DeepSeek live，不改 save，不开后端，不做 MiroFish export，不引入外部框架 PoC；它只判断哪些 L2/L3 能力未来有资格进入 v3.0 小区域 runtime 试点，哪些必须继续留在实验室或直接拒绝。

## 当前入口

| 文档 | 用途 | 状态 |
|---|---|---|
| `v2.8.0-专家团启动会纪要.md` | 专家团意见与启动结论 | completed startup |
| `v2.8.0-前置授权包.md` | D-280 / F-280 全版本授权边界 | approved/executed |
| `v2.8.0-D280决策记录.md` | 用户批准记录与执行口径 | completed |
| `v2.8.0-启动审查与范围冻结.md` | v2.7 输入、硬边界、范围冻结 | completed |
| `v2.8.0-总体开发大纲.md` | 主线、产物目标、工程边界 | completed |
| `v2.8.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc | completed |
| `v2.8.0-需求决策池.md` | D-280 / F-280 决策池 | approved/executed |
| `v2.8.0-a0-v2.7复盘与runtime-admission范围冻结.md` | v2.7 复盘与 v2.8 a0 范围冻结 | completed |
| `v2.8.0-a1-runtime-agent-admission-criteria设计门禁.md` | runtime agent 准入条件门禁 | completed；冻结 `v280_a1_runtime_agent_admission_criteria_v1` |
| `v2.8.0-a2-agent-capability-classification-matrix门禁.md` | capability classification matrix | completed；冻结 `v280_a2_agent_capability_classification_matrix_v1` |
| `v2.8.0-b1-report-only-runtime-admission-checker第一刀.md` | report-only admission checker | completed；`check:v280-runtime-admission` 16/16 accepted |
| `v2.8.0-b2-live-Player-Advocate-drift-gate-plan.md` | v3.0 live / PA / drift gate plan | completed |
| `v2.8.0-b3-v2.9-v3.0-go-no-go-checklist.md` | v2.9 / v3.0 go/no-go checklist | completed |
| `v2.8.0-process-1-前置审批制度第四轮复核.md` | 前置审批制度第四轮复核 | completed |
| `v2.8.0-rc-质量收束记录.md` | v2.8 质量收束 | completed locally |
| `v2.8.0-测试矩阵.md` | v2.8 docs/report-only/offline 测试矩阵 | completed |
| `v2.8.0-真相源索引.md` | 本版本依据与禁止事实源 | completed |
| `v2.8.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 | completed；`not_needed` |
| `v2.8.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 | completed plan；commit/push 见最终记录 |
| `v2.8.0-startup-Skill同步审计记录.md` | startup skill sync audit | completed |
| `v2.8.0-rc-Skill同步审计记录.md` | rc skill sync audit | completed locally |

## 编号说明

v2.8 使用 `D-280` / `F-280`。它和 v2.7 的 `D-271` / `F-271` 分开，避免跨版本追踪混淆。

## 已批准决策

- D-280-001 至 D-280-012：用户已全部批准。
- F-280-001 至 F-280-012：用户已确认全部保持 `future_gate_required`。
- v2.8 `/goal` 自动推进未触发例外停机；所有 F-280 事项仍未开放。

## b1 Checker 结果

`npm run check:v280-runtime-admission` 已通过：

- report：`artifacts/v2.8.0/runtime-admission/2026-05-24T06-10-18-280Z/report.json`
- 16/16 schema valid。
- 16/16 acceptedForGate。
- `admissibleCandidate=5`，`labOnly=4`，`rejected=7`。
- `falseNegative=0`，`unexpectedBlocking=0`，`resultMismatch=0`。
- `missingExpectedFamily=0`，`rescoreStable=true`。
- boundaryAssertions 全 false。

## 硬边界

v2.8 completion 不授权：

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

建议开 `v2.9` 专家团启动会，主题为 `v3.0 前安全收束：权限、prompt、eval、Player Advocate、MiroFish 边界统一复核`。不得默认进入 v3.0 runtime agent。
