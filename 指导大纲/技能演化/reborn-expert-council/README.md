# reborn-expert-council 技能演化首轮计划

日期：2026-05-26  
状态：pre-v4.3 首轮专项；只建制度与计划，不改 skill。

## 覆盖范围

本首轮只覆盖 `reborn-expert-council`。目标是把它从“读当前上下文后尽量记住”升级为“有挑战题、有 rubrics、有回放、有晋升链”的治理 skill。

当前不覆盖：

- `game-dev-text`
- `reverend-insanity-lore`
- `reborn-combat-motion`
- `mirofish-reborng-export`

这些 skill 是否进入 Context-to-Skill 评测，等首轮制度稳定后再单独决策。

## 首轮挑战题族

| 题族 | 样例检查点 |
---|---|
| current-state | 当前版本、分支、D/F 状态、下一步、禁止项 |
| exception-stop | save/DeepSeek/MiroFish/backend/external framework/NPC 生死/public deploy 是否停机 |
| planning-vs-runtime | 长期路线、design gate、report-only、runtime implementation 是否混淆 |
| skill-sync | 何时 `updated`、`no_update_needed`、`deferred_with_reason`、`blocked` |
| Agent Lab / WorldCore | AgentProposal 是否保持 candidate-only，WorldCore 是否仍有最终裁决权 |
| Auto-Theater | v4.0-v4.2 的 design/checker/Lite 映射是否被误当 runtime 批准 |
| Git/process | 是否切语义分支、显式 stage、记录主线合并结论、不自动 merge main |
| research-reference | 外部论文是否被转译成 RebornG-owned gate，而非照搬 |

## 首轮产物计划

首轮只创建入口与制度，不写完整题库。后续若用户批准进入首轮评测，再创建：

```text
指导大纲/技能演化/reborn-expert-council/<yyyy-mm-dd-topic>/
  context-intake.md
  challenger-tasks.md
  rubrics.md
  current-skill-review.md
  cross-time-replay-report.md
  skill-candidate-review.md
```

## Skill 同步审计

| skill | 状态 | 原因 |
|---|---|---|
| `reborn-expert-council` | `deferred_with_reason` | 用户明确批准新增 Context-to-Skill 制度专项，但要求不自动改 skill；当前只把制度入口同步到项目文档，未来真实 skill edit 需单独审批 |
| `game-dev-text` | `no_update_needed` | 首轮不覆盖该 skill，不改工程实现、测试脚本或 runtime 交付方式 |
| `reverend-insanity-lore` | `no_update_needed` | 首轮不新增 lore、MiroFish、hidden/private、canon promotion 或 DeepSeek visible lore |
| `reborn-combat-motion` | `no_update_needed` | 首轮不改战斗表现、UI、动效、素材或 Auto-Theater runtime |
| `mirofish-reborng-export` | `no_update_needed` | 首轮不新增 MiroFish request/export/intake |

## 后续准入建议

专家团建议：

1. v4.3 前先把制度、入口和参考池稳定下来。
2. v4.3 startup 若触发 `reborn-expert-council` 更新，再用本制度做第一轮文档回放。
3. 若第一轮证明有收益，再考虑扩展到 `game-dev-text` 和 `reverend-insanity-lore`。
4. 只有当人工/确定性回放稳定后，才讨论 report-only runner 或 LLM Judge 辅助。
