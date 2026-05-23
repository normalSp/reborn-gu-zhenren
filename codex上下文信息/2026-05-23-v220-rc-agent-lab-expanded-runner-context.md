# 2026-05-23 v2.2-rc Agent Lab 扩展离线模拟交接

## 当前状态

- 分支：`codex/v220-b1-to-rc-agent-lab-expanded-runner`
- 基线：`9a77a62b docs: 完成v2.2 a2 memory与postcheck门禁`
- 当前阶段：`v2.2.0` completed locally；等待提交、推送和 CI。
- 本批性质：自有 zero-dependency / dry-run / report-only offline runner、合成样本、artifact、文档/入口/skill sync。

## 用户决策

- D-220-001 至 D-220-012：用户已全部批准。
- D-221-001 至 D-221-007：用户已批准。
- D-221-008：暂记为未来待批。
- D-221-009 至 D-221-010：用户已批准。
- D-222-001 至 D-222-010：用户已全部批准。

## 本批完成

- 新增 `scripts/run-v220-agent-lab-expanded-offline-runner.mjs`。
- 新增 `tests/evals/v220-agent-lab/samples.json`。
- 新增 npm script：`check:v220-agent-lab-expanded-offline`。
- 新增 report-only artifact：
  - `artifacts/v2.2.0/agent-lab-expanded-offline-runner/2026-05-23T06-20-49-546Z/report.json`
  - `artifacts/v2.2.0/agent-lab-expanded-offline-runner/2026-05-23T06-20-49-546Z/summary.md`
- 新增 v2.2 b1/b2/b3/rc 文档和 rc Skill 同步审计记录。
- 更新 v2.2 README、总体大纲、路线图、需求池、测试矩阵、MiroFish 协议、Git 计划、真相源索引。
- 更新 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`、`指导大纲/historical-index.md`。
- 同步外部 skills：
  - `reborn-expert-council` -> `0.1.139`
  - `game-dev-text` -> `2.4.07`
  - `reverend-insanity-lore` -> `0.3.94`

## runner 证据

命令：

```powershell
npm run check:v220-agent-lab-expanded-offline
```

结果：

- samples：21。
- schemaValidCount：21/21。
- acceptedForGate：21/21。
- acceptedCandidateCount：21。
- needsUserDecisionCount：0。
- rejectedViolationCount：0。
- npcAgentCount：20。
- factionCount：3。
- l5AgentCount：1。
- roundCount：10。
- P0/P1/P2：0/0/0。
- hiddenLeakCount：0。
- formalAuthorityDriftCount：0。
- memoryContaminationCount：0。
- rescoreStable：true。
- passed：true。

## 未授权边界

v2.2 完成没有授权：

- runtime agent。
- live DeepSeek。
- Player Advocate。
- subagents。
- 外部 SDK/framework PoC 或依赖。
- BFF/backend。
- MiroFish export。
- save-format bump 或新增持久字段。
- `runFingerprint`。
- 正式地点、阵营、奖励、NPC 生死或 canon promotion。
- DeepSeek visible lore/RAG。
- EdgeOne 自动部署。

## 收束前自检

建议提交前执行：

- `git diff --check`
- `npm run check:v220-agent-lab-expanded-offline`
- `npx tsc --noEmit --pretty false`
- `npm test`
- `npm run build`
- `rg -n "v2.2.0|D-222|V22-B1|V22-B2|V22-B3|agent-lab-expanded-offline-runner|check:v220-agent-lab-expanded-offline" 指导大纲/v2.2.0 指导大纲/项目仪表盘.md AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md package.json codex上下文信息/2026-05-23-v220-rc-agent-lab-expanded-runner-context.md`
- `rg -n "runtime agent|SAVE_FORMAT_VERSION|DeepSeek visible|BFF|subagents|NPC 生死|正式地点|正式奖励|canon promotion|MiroFish export|runFingerprint" 指导大纲/v2.2.0/codex/00-总览 AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md codex上下文信息/2026-05-23-v220-rc-agent-lab-expanded-runner-context.md`

## 下一步

提交、推送、等待 CI 通过后，v2.2 完整收束。下一步先开 v2.3 专家团启动会，评估 agent eval farm / invalid negative sample runner / failure taxonomy hardening，不直接接 runtime agent。
