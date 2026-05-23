# 2026-05-23 v2.3-a2 eval farm schema context

## 当前状态

- 分支：`codex/v230-startup-agent-eval-farm`
- 当前版本：`v2.3.0`
- 当前阶段：a2 completed
- 用户决策：D-230-001 至 D-230-012、D-231-001 至 D-231-006 已批准
- 当前入口：`指导大纲/v2.3.0/codex/00-总览/README.md`
- a2 门禁：`指导大纲/v2.3.0/codex/00-总览/v2.3.0-a2-eval-farm-schema与report-archive设计门禁.md`

## a2 结论

v2.3-a2 冻结：

- `taxonomyVersion`: `agent_eval_taxonomy_v230_a1`
- `schemaVersion`: `agent_eval_farm_report_v230_a2`
- `executionMode`: `dry_run_report_only`
- `scenarioKind`: `synthetic_agent_lab`
- report archive path: `artifacts/v2.3.0/agent-eval-farm/<timestamp>/report.json`

硬门：

- P0 negative falseNegative 必须为 0。
- P1 negative falseNegative 必须为 0。
- hidden/formal/memory/L5 overreach missed 必须为 0。
- positiveAccepted 必须为 100%，除非用户未来批准降低。
- P2 warning rate `<= 25%`。
- false positive rate `<= 10%`。
- manual review rate `<= 20%`。

每份未来报告必须包含 boundary assertions，默认全部为 false：

- runtime modified
- save format modified
- live DeepSeek called
- DeepSeek authority expanded
- subagents used
- BFF/backend used
- MiroFish export used
- external framework PoC used
- formal location/faction/reward/NPC life-death opened
- canon promotion performed

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

v2.3-a2 仍为 MiroFish `not_needed`：

- 样本只使用 synthetic refs。
- report archive 明确禁止保存真实 hidden/private body、MiroFish 原始输出、知识库正文或 DeepSeek visible lore/RAG。
- L5 只作为 pressure-only 宏观约束，不宣判结局或正史结果。

如果后续引入命名 NPC、hidden-adjacent、方源公开证据、正式 lore 结论、L4/L5 fact anchor、知识库正文、DeepSeek visible lore/RAG、正式地点/阵营/身份/奖励/NPC 生死，必须升级为 blocking intake 并让用户先批准。

## 下一步

等待用户审批 D-232：

- D-232-001：是否进入 b1 report-only runner 第一刀。
- D-232-002：b1 是否只允许自有 Node mjs / zero-new-dependency / dry-run only / report-only runner。
- D-232-003：b1 输出是否固定为 `artifacts/v2.3.0/agent-eval-farm/<timestamp>/report.json`。
- D-232-004：b1 是否必须覆盖 a1/a2 current_matrix，并让 P0/P1 falseNegative=0、positive=100%。
- D-232-005：b1 是否继续禁止 live DeepSeek、subagents、BFF/backend、外部 framework PoC/deps、MiroFish export、runtime agent。
- D-232-006：b1 是否可以新增 `scripts/run-v230-agent-eval-farm-runner.mjs`、`tests/evals/v230-agent-eval-farm/samples.json` 和 npm script `check:v230-agent-eval-farm`。

若 D-232 批准，进入：

`指导大纲/v2.3.0/codex/00-总览/v2.3.0-b1-Agent-Eval-Farm-report-only-runner第一刀.md`

未批准前不要直接写 b1 runner。
