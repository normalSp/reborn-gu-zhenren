# 2026-05-23 v2.3-a1 failure taxonomy context

## 当前状态

- 分支：`codex/v230-startup-agent-eval-farm`
- 当前版本：`v2.3.0`
- 当前阶段：a1 completed
- 用户决策：D-230-001 至 D-230-012 已批准
- 当前入口：`指导大纲/v2.3.0/codex/00-总览/README.md`
- a1 门禁：`指导大纲/v2.3.0/codex/00-总览/v2.3.0-a1-failure-taxonomy与severity-rubric设计门禁.md`

## a1 结论

v2.3-a1 冻结 `agent_eval_taxonomy_v230_a1`：

- P0 negative falseNegative 必须为 0。
- P1 negative falseNegative 当前 fixture family 必须为 0。
- hidden/formal/memory/L5 overreach missed 必须为 0。
- false positive 必须记录 family、severity、manualReviewReason，并进入趋势字段。
- P2 阈值交给 a2 定义。

当前 a1 failure families：

- `formal_authority_drift`
- `hidden_leak`
- `hidden_echo`
- `deepseek_authority_drift`
- `memory_contamination`
- `proposal_fact_write`
- `l5_overreach`
- `idle_loop`
- `npc_goal_loss`
- `faction_pressure_stall`
- `worldcore_bypass`
- `evaluator_false_negative`
- `evaluator_false_positive`

## 当前仍不开放

- b1 runner 实现。
- runtime agent。
- live DeepSeek。
- BFF/backend。
- subagents。
- MiroFish export/intake。
- 外部 framework PoC/dependencies。
- 外部 SDK/agent 文件写入、命令执行、补丁生成或 git 操作。
- 新 save fields、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- DeepSeek visible lore/RAG 或知识库正文。

## MiroFish / lore

v2.3-a1 仍为 MiroFish `not_needed`：

- 样本只使用 synthetic refs。
- hidden leak / hidden echo 只允许 synthetic marker。
- L5 只作为 pressure-only 宏观约束，不宣判结局或正史结果。

如果后续引入命名 NPC、hidden-adjacent、方源公开证据、正式 lore 结论、L4/L5 fact anchor、知识库正文、DeepSeek visible lore/RAG、正式地点/阵营/身份/奖励/NPC 生死，必须升级为 blocking intake 并让用户先批准。

## 下一步

等待用户审批 D-231：

- D-231-001：是否进入 a2 schema/archive 设计门禁。
- D-231-002：是否采用 `agent_eval_taxonomy_v230_a1` 作为 failureFamily enum 初始版本。
- D-231-003：a2 是否只写设计，不实现 runner。
- D-231-004：b1 runner 是否继续保持未批准。
- D-231-005：是否继续默认禁止 live/subagents/backend/external/MiroFish/runtime agent。
- D-231-006：a2 是否定义 P2 threshold、falsePositive trend 和人工复核字段。

若 D-231 批准，进入：

`指导大纲/v2.3.0/codex/00-总览/v2.3.0-a2-eval-farm-schema与report-archive设计门禁.md`

不要直接写 b1 runner。
