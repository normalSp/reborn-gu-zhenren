# 2026-05-23 v2.2-a1 Agent Lab 场景模型门禁交接

## 当前状态

- 分支：`codex/v220-a1-agent-lab-scenario-gate`
- 基线：`9773469b docs: 开启v2.2 Agent Lab扩展启动会`
- 当前阶段：`v2.2.0-a1` completed；等待用户审批 D-221。
- 本批性质：纯文档 / 设计门禁 / 项目入口同步 / skill sync。

## 用户决策

- D-220-001 至 D-220-012：用户已全部批准。
- D-221-001 至 D-221-010：已在 `v2.2.0-需求决策池.md` 中列出，等待用户审批。

## 本批完成

- 新增 `v2.2.0-a1-20NPC三势力一L5场景模型设计门禁.md`。
- 新增 `v2.2.0-a1-Skill同步审计记录.md`。
- 更新 v2.2 README、总体大纲、路线图、需求池、测试矩阵、MiroFish 协议、Git 计划、真相源索引。
- 更新 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`、`指导大纲/historical-index.md`。
- 同步外部 skills：
  - `reborn-expert-council` -> `0.1.137`
  - `game-dev-text` -> `2.4.05`
  - `reverend-insanity-lore` -> `0.3.92`

## a1 设计结论

- 场景代号：`outer_edge_agent_lab_synthetic_v1`
- 目标规模：20 NPC / 3 抽象 pressure-only 势力 / 1 L5 `heaven_will_pressure`
- L1：8 个 routine / public pressure source。
- L2：8 个 memory / reflection / intent candidate source。
- L3：4 个 dialogue / negotiation / scene-goal candidate source。
- L4：默认不进入 v2.2 a1/a2。
- L5：只输出 pressure，不能聊天、宣判结局、改写正史锚点、决定 NPC 生死或授予奖励。

## 未授权边界

本批没有授权：

- runtime agent。
- v2.2 runner 扩展。
- 样本 JSON 或 artifact 写入。
- live DeepSeek。
- Player Advocate。
- subagents。
- 外部 SDK/framework PoC 或依赖。
- BFF/backend。
- MiroFish export。
- save-format bump 或新增持久字段。
- 正式地点、阵营、奖励、NPC 生死或 canon promotion。

## 已做自检

- `git diff --check`：通过。
- `rg -n "v2\.2\.0|D-220|D-221|V22-A1|20 NPC|3 势力|L5" 指导大纲/v2.2.0 指导大纲/项目仪表盘.md AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md`：通过，命中同步入口。
- `rg -n "runtime|SAVE_FORMAT_VERSION|DeepSeek visible|BFF|subagents|NPC 生死|正式地点|正式奖励|canon promotion|MiroFish export|runner 扩展|artifact" 指导大纲/v2.2.0/codex/00-总览 AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md`：通过，敏感命中均为禁止、豁免、未来门禁或未授权说明。

## 下一步

等待用户审批 D-221。若批准，进入：

`v2.2.0-a2-memory-visibility-postcheck扩展门禁.md`
