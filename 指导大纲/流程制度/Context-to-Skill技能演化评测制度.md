# Context-to-Skill 技能演化评测制度

日期：2026-05-26  
状态：pre-v4.3 项目级治理专项；首轮只覆盖 `reborn-expert-council`；不自动改 skill；不跑 LLM Judge；不新增脚本。

## 定位

本制度把 `From Context to Skills: Can Language Models Learn from Context Skillfully?` 的思路转译为 RebornG-owned skill 演化流程。

它解决的问题不是“让 LLM 自己写制度”，而是：

> 当 RebornG 的上下文、门禁、例外停机、长期路线和专家团职责越来越多时，如何证明 `reborn-expert-council` 真的学会了当前上下文，而不是只在对话里短暂记住。

首轮目标是给 `reborn-expert-council` 建立可审计的技能演化门禁。后续是否扩展到 `game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`，必须等首轮制度稳定后再由用户决策。

## 当前硬边界

本专项当前不授权：

- 自动修改任何 `SKILL.md`。
- 运行 LLM Judge 或把 LLM Judge 作为通过/失败裁判。
- 新增 npm script、runner、CI gate 或自动化脚本。
- 修改 runtime、source、UI、store、prompt、save、canon、knowledge-index body。
- 新增 save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- 调用 live DeepSeek 或修改 DeepSeek prompt/context/model/authority。
- 新增 MiroFish export/intake、DeepSeek visible lore/RAG、backend/BFF/service。
- 引入外部 framework PoC/dependency/subagents/read-only scan/patch artifact。
- 开放正式地点、阵营、身份、奖励、NPC 生死、canon promotion、public/legal/EdgeOne。

如果未来要开放 runner、LLM Judge、自动 skill patch、外部框架辅助、子代理或跨 skill 扩展，必须进入新的前置授权包。

## Ctx2Skill 到 RebornG 的映射

| Ctx2Skill 角色/机制 | RebornG 当前转译 | 当前阶段允许程度 |
|---|---|---|
| Challenger | 从 AGENTS、PROJECT-STATE、仪表盘、流程制度、当前版本门禁里生成挑战题和 rubrics | 允许，纯文档 |
| Reasoner | 用当前 `reborn-expert-council` 口径回答挑战题 | 允许，纯人工/文档审查 |
| Judge | 检查答案是否守住硬边界、版本事实和例外停机 | 当前只允许人工/确定性文档审查；不跑 LLM Judge |
| Reasoner Proposer | 诊断专家团 skill 缺失了哪些规则 | 允许写 `skill-candidate-review.md`，不能直接改 skill |
| Challenger Proposer | 诊断哪些题太容易、哪些门禁没有压力 | 允许写样本池和 rubric 改进建议 |
| Generator | 生成 skill patch 候选 | 当前只允许写候选说明；真实 skill edit 另批 |
| Cross Time Replay | 用旧失败题、旧成功题和当前挑战题回放新旧 skill 口径 | 当前只允许人工/文档回放，不新增脚本 |

## 触发时机

以下情况必须考虑是否启动 Context-to-Skill 评测：

1. `reborn-expert-council` 被发现漏掉当前版本事实、硬边界、Skill 同步、Git 制度、MiroFish 边界或长期路线。
2. 新增项目级流程制度，且该制度会改变专家团如何开会、审批、停机、测试或收束。
3. 新增大跨度长期路线，例如 v4.x 到 v5.x、v5.x 到 v12.x。
4. 多次 `/goal` 连续推进后，出现偏离方向、忘记例外停机、把 planning 当 runtime 授权、把 report-only 当 implementation 的风险。
5. 准备在 v4.3 或之后正式改 `reborn-expert-council` 当前同步口径前。

纯版本内小修、拼写修正、普通文档同步、无制度变化的启动会，不强制启动本专项。

## 输入来源

首轮只允许使用项目-owned、可审计来源：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/流程制度/`
- 当前版本 `指导大纲/vX.Y.Z/codex/00-总览/`
- `指导大纲/长期路线/`
- `指导大纲/historical-index.md`
- 最新 `codex上下文信息/`

不得把未经过 RebornG intake 的 MiroFish 隐藏正文、外部私货、模型记忆或网页摘要直接写成 skill 规则。

## 挑战题族

`reborn-expert-council` 首轮挑战题至少覆盖：

| 题族 | 检查目的 |
|---|---|
| current-state | 是否准确说出当前版本、分支、D/F 状态、下一步和禁止项 |
| exception-stop | 是否在 save、DeepSeek、MiroFish、backend、外部框架、NPC 生死、public/deploy 前停机 |
| planning-vs-runtime | 是否区分长期路线、report-only、design gate、runtime implementation |
| skill-sync | 是否知道什么时候更新 skill、什么时候 `deferred_with_reason` |
| MiroFish/knowledge | 是否守住 source pointer、hidden/private、knowledge-index、runtime canon 晋升链 |
| Agent Lab / WorldCore | 是否坚持 AgentProposal candidate-only 与 WorldCore final authority |
| Git/process | 是否遵守语义分支、显式 stage、主线合并不自动化 |
| player-quality | 是否把 Player Advocate、长线漂移、测试矩阵演进纳入完成标准 |
| research-reference | 是否把外部论文/框架吸收成 RebornG-owned gate，而不是照搬系统 |

## Rubric 原则

每道挑战题必须写明：

- `context_source`：题目来自哪个项目-owned 文件。
- `expected_answer`：合格答案必须包含的事实或边界。
- `must_stop_if_missing`：漏掉哪些项会触发人工复核。
- `forbidden_answer`：哪些回答代表越权或误解。
- `promotion_hint`：如果失败，应该补 skill、补流程、补入口，还是补测试样本。

Rubric 不能只写“回答好不好”。它必须能定位到具体项目门禁。

## Cross Time Replay

首轮采用文档回放，不新增脚本。

回放集合至少包含：

1. `hard_failures`：历史上真实发生过或很容易发生的漏门禁问题。
2. `easy_successes`：当前 skill 已经稳定处理的问题，用来防止新 skill 过度拟合难题后忘掉基础流程。
3. `current_edges`：当前版本和下一版本最容易混淆的 planning/runtime、D/F、future gate、MiroFish、DeepSeek、Git 边界。

一个 skill candidate 只有在 hard failures 改善、easy successes 不退化、current edges 不越权时，才能进入 Skill 同步审计的 `candidate_for_user_review`。

## 晋升链

`reborn-expert-council` 的任何 Context-to-Skill 改动必须走以下链路：

1. 记录触发原因。
2. 写挑战题和 rubrics。
3. 做当前 skill 口径审查。
4. 写 `skill-candidate-review.md`，说明是否需要改 skill。
5. 做 Cross Time Replay 文档回放。
6. 在 Skill 同步审计中记录：
   - `updated`
   - `no_update_needed`
   - `deferred_with_reason`
   - `blocked`
7. 如果要真实改 `SKILL.md`，必须单独列出改动摘要、收益、风险和用户审批项。

本专项首轮已经明确：不自动改 skill，因此当前应记录为 `deferred_with_reason`，并把制度入口同步到项目文档。

## 产物位置

项目级入口：

- `指导大纲/技能演化/README.md`

首轮目标入口：

- `指导大纲/技能演化/reborn-expert-council/README.md`

后续每轮建议目录：

```text
指导大纲/技能演化/reborn-expert-council/<yyyy-mm-dd-topic>/
  context-intake.md
  challenger-tasks.md
  rubrics.md
  current-skill-review.md
  cross-time-replay-report.md
  skill-candidate-review.md
```

## 与现有制度的关系

- 本制度补强 `Skill同步审计制度.md`，但不替代它。
- 本制度生成的是 skill 演化证据，不是版本实现证据。
- 本制度可引用 `前置批量审批与例外停机制度.md` 的 D/F 包和例外停机清单作为挑战题来源。
- 本制度可引用 `系统连续性与孤儿系统审计制度.md` 检查新制度是否被索引。
- 本制度可引用 `测试矩阵演进规则.md`，把新发现的高风险样本分流到 `current_matrix`、`future_sample_pool` 或 `discarded`。

## 当前首轮结论

本专项当前只建立制度和入口，不执行自动评测、不改 skill、不新增脚本。首轮完成标准：

1. 本制度文件已创建。
2. `指导大纲/技能演化/` 入口已创建。
3. `reborn-expert-council` 首轮覆盖范围和 skill sync 状态已记录。
4. 外部权威论文/Agent Lab 参考池计划已写入长期路线。
5. `指导大纲/流程制度/README.md`、`指导大纲/长期路线/README.md`、`指导大纲/项目仪表盘.md`、`PROJECT-STATE.md`、`AGENTS.md` 已同步入口。
6. 文档自检通过。
