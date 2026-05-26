# RebornG 技能演化入口

日期：2026-05-26  
状态：pre-v4.3 治理专项入口；首轮只覆盖 `reborn-expert-council`。

## 定位

本目录用于保存 RebornG skill 演化的上下文、挑战题、rubric、回放和候选审查。它不是 skill 本体目录，也不自动修改任何 `SKILL.md`。

当前制度来源：

- `指导大纲/流程制度/Context-to-Skill技能演化评测制度.md`

## 当前硬边界

- 不自动改 skill。
- 不跑 LLM Judge。
- 不新增脚本、runner、CI gate。
- 不改 runtime/source/UI/store/prompt/save/canon。
- 不开放 DeepSeek、MiroFish、backend、外部框架、subagents 或正式世界事实。

## 当前目标

首轮只做 `reborn-expert-council`：

- 检查专家团 skill 是否能稳定吸收当前项目上下文。
- 把挑战题和 rubrics 工程化。
- 为未来真实 skill 更新提供证据链。
- 等制度稳定后，再决定是否扩展到 `game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`。

## 目录

- `reborn-expert-council/README.md`：首轮覆盖范围、挑战题族、skill sync 状态和后续计划。

## 后续目录约定

```text
指导大纲/技能演化/<skill-name>/<yyyy-mm-dd-topic>/
  context-intake.md
  challenger-tasks.md
  rubrics.md
  current-skill-review.md
  cross-time-replay-report.md
  skill-candidate-review.md
```

## 论文与 Agent Lab 参考

外部论文和 Agent Lab 参考池不直接进入 skill。它们先进入：

- `指导大纲/长期路线/Agent-Lab论文参考池与吸收计划.md`

只有当某篇论文被转译成 RebornG-owned 挑战题、rubric、测试样本、版本门禁或设计约束后，才可以影响 skill 演化。
