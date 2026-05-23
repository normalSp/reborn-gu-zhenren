# 2026-05-23 v2.2-a2 memory / visibility / post-check 门禁交接

## 当前状态

- 分支：`codex/v220-a2-memory-visibility-postcheck`
- 基线：`39237aa4 docs: 完成v2.2 a1 Agent Lab场景门禁`
- 当前阶段：`v2.2.0-a2` completed；等待用户审批 D-222。
- 本批性质：纯文档 / 设计门禁 / 项目入口同步 / skill sync。

## 用户决策

- D-220-001 至 D-220-012：用户已全部批准。
- D-221-001 至 D-221-007：用户已批准。
- D-221-008：暂记为未来待批。
- D-221-009 至 D-221-010：用户已批准。
- D-222-001 至 D-222-010：已在 `v2.2.0-需求决策池.md` 中列出，等待用户审批。

## 本批完成

- 新增 `v2.2.0-a2-memory-visibility-postcheck扩展门禁.md`。
- 新增 `v2.2.0-a2-Skill同步审计记录.md`。
- 更新 v2.2 README、总体大纲、路线图、需求池、测试矩阵、MiroFish 协议、Git 计划、真相源索引。
- 更新 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`、`指导大纲/historical-index.md`。
- 同步外部 skills：
  - `reborn-expert-council` -> `0.1.138`
  - `game-dev-text` -> `2.4.06`
  - `reverend-insanity-lore` -> `0.3.93`

## a2 设计结论

- memory 只分为 report-only candidate，不是 save、canon、runtime、DeepSeek visible 或知识库正文。
- `agent_private_candidate` 只表示 agent 实验室内的私有候选记忆，不等于 RebornG hidden/private lore。
- visibility 分为 `public_pressure`、`agent_private_candidate`、`ref_only`、`gated`、`rejected_hidden_body`、`rejected_formal_authority`。
- WorldCore post-check 必拒 hidden/private body、正式地点/阵营/奖励/NPC 生死、L5 结局宣判、memory contamination、DeepSeek visible / runtime / save / canon 写入尝试。
- a2 样本族已进入 future_sample_pool：V22-A2-MEM-*、V22-A2-VIS-*、V22-A2-WC-*。

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

待提交前执行：

- `git diff --check`
- `rg -n "v2\.2\.0|D-221|D-222|V22-A2|memory|visibility|WorldCore post-check" 指导大纲/v2.2.0 指导大纲/项目仪表盘.md AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md codex上下文信息/2026-05-23-v220-a2-memory-visibility-postcheck-context.md`
- `rg -n "runtime|SAVE_FORMAT_VERSION|DeepSeek visible|BFF|subagents|NPC 生死|正式地点|正式奖励|canon promotion|MiroFish export|runner 扩展|artifact|tests/evals/v220-agent-lab" 指导大纲/v2.2.0/codex/00-总览 AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md codex上下文信息/2026-05-23-v220-a2-memory-visibility-postcheck-context.md`

## 下一步

等待用户审批 D-222。若批准，进入 b1 自有 offline runner 扩展第一刀；在 D-222 前不得写 runner、样本 JSON、artifact 或任何 runtime/source/UI/store/prompt/save 变更。
