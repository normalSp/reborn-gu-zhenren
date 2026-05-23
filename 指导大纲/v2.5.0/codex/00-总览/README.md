# RebornG v2.5.0 Codex 当前入口

状态：v2.5 已完成；D-250-001 至 D-250-012 已获用户批准并执行，F-250-001 至 F-250-010 保持 `future_gate_required`。

## 当前定位

v2.5 主线按 v2.4 rc go/no-go 执行：`private canon / knowledge visibility 试验设计`。v2.5-a0 已先落地项目级流程补丁：

`指导大纲/流程制度/前置批量审批与例外停机制度.md`

startup 已按该制度输出完整前置授权包。用户批准 D-250 后，后续 a1/a2/b1/b2/b3/process-1/rc 已在授权范围内完成，例外停机触发次数为 0。

## 已批准输入

- D-270-001：开 v2.5 专家团启动会。
- D-270-002：v2.5 主线暂定为 `private canon / knowledge visibility 试验设计`。
- D-270-003：v2.5 startup/a0/a1 继续 docs/report-only/design-first，不实现 private canon service、backend、RAG 或 runtime。
- D-270-004：v2.5 初始 MiroFish need level 为 `not_needed`，触及真实原著事实、命名 NPC、hidden-adjacent 或正式 lore 结论再升级 blocking。
- D-270-005：v2.5 继续禁止 external framework PoC、dependency、read-only scan、patch artifact、subagents 和外部 agent 权限，除非另批。
- D-270-006：v2.5 先产出 a0 范围冻结与 a1 visibility/schema 门禁，再决定任何 runner/service/backend/runtime。

## 当前 a0 输出

- `v2.5.0-a0-前置批量审批与例外停机治理补丁.md`
- `v2.5.0-a0-Skill同步审计记录.md`

## 当前 startup 输出

- `v2.5.0-专家团启动会纪要.md`
- `v2.5.0-前置授权包.md`
- `v2.5.0-启动审查与范围冻结.md`
- `v2.5.0-总体开发大纲.md`
- `v2.5.0-小版本执行路线图.md`
- `v2.5.0-需求决策池.md`
- `v2.5.0-测试矩阵.md`
- `v2.5.0-真相源索引.md`
- `v2.5.0-Git提交与推送计划.md`
- `v2.5.0-MiroFish资料需求与交付协议.md`
- `v2.5.0-startup-Skill同步审计记录.md`

## 当前完成输出

- `v2.5.0-a1-private-canon-knowledge-visibility-schema门禁.md`
- `v2.5.0-a1-Skill同步审计记录.md`
- `v2.5.0-a2-source-pointer-redaction-promotion-chain门禁.md`
- `v2.5.0-a2-Skill同步审计记录.md`
- `v2.5.0-b1-report-only-visibility-boundary-report第一刀.md`
- `v2.5.0-b1-Skill同步审计记录.md`
- `v2.5.0-b2-hidden-leak-memory-contamination-AgentProposal风险模型.md`
- `v2.5.0-b2-Skill同步审计记录.md`
- `v2.5.0-b3-v2.6-private-canon-eval-archive准入清单.md`
- `v2.5.0-b3-Skill同步审计记录.md`
- `v2.5.0-process-1-前置审批制度试运行复核.md`
- `v2.5.0-rc-质量收束记录.md`
- `v2.5.0-rc-Skill同步审计记录.md`

## 当前硬边界

本版本不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save fields、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- private canon service、backend/BFF、eval archive service、runner、artifact、job queue、cloud save。
- live DeepSeek、DeepSeek prompt/context/model/authority 变更、DeepSeek visible lore/RAG。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents、外部 agent 文件/命令/git 权限。
- MiroFish export/intake。
- 知识库正文、runtime canon、真实 hidden/private body、原著正文、MiroFish raw output。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- EdgeOne 自动部署。

## 下一步

下一步建议开 `v2.6` 专家团启动会，先复盘 v2.5 visibility schema 和前置审批制度，再决定是否进入 private canon / eval archive / job queue / replay archive 工程预备。

仍需保持的默认边界：

- 不直接实现 backend/service/runner/runtime agent。
- 不启用 DeepSeek visible lore/RAG。
- 不请求 MiroFish export，除非触发真实事实、命名 NPC、hidden-adjacent 或正式 lore 结论。
- 不启用外部 framework PoC/dependency/subagents，除非另批。
