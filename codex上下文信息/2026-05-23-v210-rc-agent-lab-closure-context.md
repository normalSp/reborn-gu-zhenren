# 2026-05-23 v2.1 rc Agent Lab closure context

当前分支：`codex/v210-d212-sdk-intake-ci-triage`

## 本轮完成

用户批准 D-213 连续收束授权后，v2.1 已完成为本地里程碑 `Agent Simulation Lab 启动版`。

新增/更新：

- `scripts/run-v210-agent-lab-offline-runner.mjs`
- `tests/evals/v210-agent-lab/samples.json`
- `package.json` script：`check:v210-agent-lab-offline`
- `artifacts/v2.1.0/agent-lab-offline-runner/2026-05-22T17-31-47-312Z/report.json`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-D213连续收束授权记录.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-b1-Agent-Lab-report-only-offline-runner第一刀.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-b2-AgentProposal-eval-matrix与失败分类.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-rc-Agent-Lab第一版质量收束记录.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-rc-Skill同步审计记录.md`

## 关键结果

`npm run check:v210-agent-lab-offline` 通过：

- sampleCount：10
- schemaValidCount：10
- acceptedForGate：10
- acceptedCandidateCount：8
- needsUserDecisionCount：2
- rejectedViolationCount：0
- P0/P1/P2：0/0/0
- p2Rate：0
- passed：true

## 仍未开放

- runtime agent
- live DeepSeek
- external agent framework PoC / dependency / vendored subset / patch artifact / read-only scan
- subagents
- BFF/backend
- MiroFish new export/intake
- DeepSeek visible knowledge / RAG
- formal locations / factions / rewards / NPC life-death / canon promotion
- EdgeOne deployment

## 下一步建议

下一步先开 `v2.2` 专家团启动会，讨论是否将 Agent Lab 扩展到 20 NPC / 3 势力 / 1 L5 宏观导演的离线覆盖，是否需要 D-212-001 license/SBOM/架构适配专项，以及是否继续保持纯离线。
