# 2026-05-26 pre-v4.3 Context-to-Skill context

分支：`codex/pre-v43-context-to-skill-evolution`

## 当前目标

用户批准在 v4.3 前新增 `Context-to-Skill 技能演化评测制度专项`：

- 首轮只覆盖 `reborn-expert-council`。
- 不自动改 skill。
- 不跑 LLM Judge。
- 不新增脚本、runner 或 CI gate。
- 等制度稳定后，再决定是否扩展到 `game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`。

## 已完成

- 新增项目级制度：`指导大纲/流程制度/Context-to-Skill技能演化评测制度.md`。
- 新增技能演化入口：`指导大纲/技能演化/README.md`。
- 新增 `reborn-expert-council` 首轮入口：`指导大纲/技能演化/reborn-expert-council/README.md`。
- 新增 Agent Lab 论文参考池计划：`指导大纲/长期路线/Agent-Lab论文参考池与吸收计划.md`。
- 同步入口：
  - `指导大纲/流程制度/README.md`
  - `指导大纲/长期路线/README.md`
  - `指导大纲/项目仪表盘.md`
  - `指导大纲/v4.2.0/codex/00-总览/README.md`
  - `指导大纲/v4.2.0/codex/00-总览/v4.2.0-小版本执行路线图.md`
  - `指导大纲/v4.2.0/codex/00-总览/v4.2.0-测试矩阵.md`
  - `AGENTS.md`
  - `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

## Skill sync 状态

- `reborn-expert-council`：`deferred_with_reason`。原因：用户批准制度专项，但明确要求不自动改 skill；未来真实 skill edit 需单独审批。
- `game-dev-text`：`no_update_needed`。
- `reverend-insanity-lore`：`no_update_needed`。
- `reborn-combat-motion`：`no_update_needed`。
- `mirofish-reborng-export`：`no_update_needed`。

## 论文参考池

已纳入 `指导大纲/长期路线/Agent-Lab论文参考池与吸收计划.md`：

- Ctx2Skill
- ReAct
- Reflexion
- Self-Refine
- Toolformer
- Constitutional AI
- DSPy
- Generative Agents
- Voyager
- Concordia
- AI Town
- TextWorld
- SOTOPIA
- CICERO

它们只作为 RebornG-owned 制度、rubric、Agent Lab、eval 和长期路线输入，不授权 runtime、DeepSeek、MiroFish、backend、外部依赖或 skill 自动修改。

## 仍未授权

本专项不授权：

- 修改任何 `SKILL.md`。
- LLM Judge 自动裁判。
- 新增 npm script、runner、CI gate。
- runtime/source/UI/store/prompt/save/canon/knowledge-index body 变更。
- live DeepSeek、DeepSeek authority、MiroFish export/intake、backend/BFF、external framework PoC/dependency/subagents。
- formal location/faction/identity/reward/NPC life-death/canon promotion。
- public/legal/EdgeOne 或 main auto-merge。

## 与 v4.2 的关系

v4.2 startup 仍保持：

- D-420 pending user decision。
- F-420 recommended future_gate_required。
- v4.2 仍未进入 implementation。

本专项不改变 v4.2 授权包。完成后，项目产品线下一步仍是用户审批 D-420/F-420。
