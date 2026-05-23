# RebornG v2.6.0 Codex 当前入口

日期：2026-05-24
状态：completed
分支：`codex/v260-startup-private-canon-eval-archive-prep`

## 当前定位

v2.6 建议主线：

`private canon / eval archive / job queue / replay archive 工程预备`

这不是后端实现版本，也不是 runtime agent 版本。v2.6 已把 v2.4 的基础设施边界、v2.5 的 knowledge visibility schema、v2.3 的 eval farm、v2.0 的 T3 证据，收束成一套可以进入 v2.7-v2.9 Agent Lab 扩展和 v3.0 runtime agent 准入的工程预备门禁。

## 已读取输入

- `指导大纲/v2.5.0/codex/00-总览/README.md`
- `指导大纲/v2.5.0/codex/00-总览/v2.5.0-rc-质量收束记录.md`
- `指导大纲/v2.5.0/codex/00-总览/v2.5.0-b3-v2.6-private-canon-eval-archive准入清单.md`
- `指导大纲/流程制度/前置批量审批与例外停机制度.md`
- `指导大纲/长期路线/v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md`
- `指导大纲/长期路线/Agent-Framework-Landscape-2026吸收矩阵.md`

## 当前输出

- `v2.6.0-专家团启动会纪要.md`
- `v2.6.0-前置授权包.md`
- `v2.6.0-启动审查与范围冻结.md`
- `v2.6.0-总体开发大纲.md`
- `v2.6.0-小版本执行路线图.md`
- `v2.6.0-需求决策池.md`
- `v2.6.0-测试矩阵.md`
- `v2.6.0-真相源索引.md`
- `v2.6.0-Git提交与推送计划.md`
- `v2.6.0-MiroFish资料需求与交付协议.md`
- `v2.6.0-startup-Skill同步审计记录.md`
- `v2.6.0-a1-job-replay-archive-boundary-model门禁.md`
- `v2.6.0-a2-private-canon-classifier-interface门禁.md`
- `v2.6.0-b1-report-only-schema-checker第一刀.md`
- `v2.6.0-b2-negative-fixtures与manual-review-queue.md`
- `v2.6.0-b3-v2.7-v3.0-agent-infra准入清单.md`
- `v2.6.0-process-1-前置审批制度第二轮复核.md`
- `v2.6.0-rc-Skill同步审计记录.md`
- `v2.6.0-rc-质量收束记录.md`

## 本启动包的核心建议

用户已审批 D-260-001 至 D-260-012，并确认 F-260-001 至 F-260-012 保持 `future_gate_required`。v2.6 已在授权范围内完成。

v2.6 已实现一项有限工程动作：自有、零依赖、dry-run、report-only 的 schema checker / archive-boundary checker。它只读取 synthetic fixture 和 redacted envelope，输出本地报告，不读取真实 hidden/private body，不写 runtime/store/save/canon，不接 DeepSeek，不接外部框架。

这个 checker 是 v2.6 的关键收益：它把 v2.5 的可见性制度变成可反复检查的工程门，而不是继续只写文档。

## Checker 结果

| 项 | 结果 |
|---|---|
| 命令 | `npm run check:v260-private-canon-archive-boundary` |
| report | `artifacts/v2.6.0/private-canon-archive-boundary/2026-05-23T17-48-33-560Z/report.json` |
| acceptedForGate | true |
| schema valid | 18/18 |
| P0/P1 false negative | 0/0 |
| body leak flags | all false |

## 当前硬边界

除非用户另行批准 future gate，当前不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save fields、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- backend/BFF/private canon service/eval archive service/job queue service/cloud save。
- live DeepSeek、DeepSeek prompt/context/model/authority 变更、DeepSeek visible lore/RAG。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents、外部 agent 文件/命令/git 权限。
- MiroFish export/intake。
- 知识库正文、runtime canon、真实 hidden/private body、原著正文、MiroFish raw output。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- public wording、EdgeOne 自动部署。

## 下一步

建议开 v2.7 专家团启动会。v2.7 候选主线：低阶多 NPC / 小势力 Agent Lab 样板扩展，默认仍 report-only/offline。
