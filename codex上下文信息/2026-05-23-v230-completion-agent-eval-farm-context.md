# 2026-05-23 v2.3 completion agent eval farm context

## 当前状态

- 当前版本：`v2.3.0`
- 当前分支：`codex/v230-startup-agent-eval-farm`
- 用户决策：D-230-001 至 D-230-012、D-231-001 至 D-231-006、D-232-001 至 D-232-006 已批准
- 当前入口：`指导大纲/v2.3.0/codex/00-总览/README.md`
- 当前结论：v2.3 本地完成

## 完成内容

- a1 冻结 `agent_eval_taxonomy_v230_a1`。
- a2 冻结 `agent_eval_farm_report_v230_a2`。
- b1 新增自有 zero-dependency / dry-run only / report-only runner：
  - `scripts/run-v230-agent-eval-farm-runner.mjs`
  - `tests/evals/v230-agent-eval-farm/samples.json`
  - npm script：`check:v230-agent-eval-farm`
- b2 完成 negative fixture、mutation、false-negative gate、rescore。
- b3 完成 report archive、trend comparison、future_sample_pool 回流。
- rc 完成 skill sync、dashboard、PROJECT-STATE、AGENTS、handoff。

## runner 报告

- report：`artifacts/v2.3.0/agent-eval-farm/2026-05-23T09-10-30-682Z/report.json`
- summary：`artifacts/v2.3.0/agent-eval-farm/2026-05-23T09-10-30-682Z/summary.md`
- sampleCount：17
- schemaValidCount：17/17
- positiveAccepted：4/4
- negativeCaught：11/11
- mutationTotalCount：2
- coveredFailureFamilies：13/13
- P0/P1/P2 findings：17/5/2
- p0FalseNegativeCount：0
- p1FalseNegativeCount：0
- hiddenFormalMemoryL5MissedCount：0
- falsePositiveRate：0.0588
- p2WarningRate：0.1176
- manualReviewRate：0.0588
- rescoreStable：true
- acceptedForGate：true
- boundaryAssertions：全 false

## 明确边界

本次没有：

- runtime/source/UI/store/prompt/save 变更。
- save fields 或 `SAVE_FORMAT_VERSION` bump。
- live DeepSeek 调用。
- DeepSeek prompt/context/model/authority 扩张。
- BFF/backend。
- subagents。
- MiroFish export/intake。
- 外部 framework PoC/dependencies。
- 外部 agent 项目写入、命令执行、补丁或 git 权限。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- `runFingerprint`。
- EdgeOne 自动部署。

## Player Advocate / live

Player Advocate：豁免。

原因：v2.3 是 offline/report-only eval tooling，无玩家可见 runtime/UI/prompt 改动。

是否调用 live DeepSeek：否。

若是：不适用；无模型、样本、轮次、成本或 live 报告路径。

## 下一步

建议开 v2.4 专家团启动会。

默认方向：

- 薄 BFF 边界评估。
- private canon / knowledge visibility 试验设计。
- eval archive infrastructure 预备。

不要直接进入 runtime agent。v2.3 的 runner/artifact 只证明 synthetic/offline eval farm gate，不证明 live DeepSeek agent、完整 NPC 社会或 v3.0 runtime agent 可以开放。
