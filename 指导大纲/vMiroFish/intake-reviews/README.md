# MiroFish Intake Review 目录

当 MiroFish 交付包放入 `指导大纲/vMiroFish/` 后，RebornG 必须先在本目录写审查结论，再决定是否吸收。

## 审查文件必须包含

- 主包路径。
- 报告/ledger/说明文件路径。
- 总项数、分类统计、source pointer 数。
- quote/excerpt/originalText/verbatim 字段检查结果。
- hidden facts 是否全部 `hidden_ref_only`。
- `runtimeAuthority` / `deepSeekAuthority` / `requiresHumanCanonReview` 检查结果。
- 重复 ID、主体归一、source pointer 格式、隐藏事实泄露风险。
- 可吸收项。
- 延期项。
- 阻断项。
- 当前阶段影响。
- 是否需要用户决策。

## 吸收规则

- `accepted_for_candidate_pool`：可进入候选池，但不能直接 runtime。
- `accepted_for_fact_card_draft`：可转写为 fact card 草案。
- `accepted_for_rule_draft`：可转写为 anchor / IF / reaction rule 草案。
- `blocked`：不得吸收。
- `deferred`：等待更多包或用户决策。

任何吸收都必须经过 RebornG 本地测试或文档门禁，不得把 MiroFish 输出直接作为 canon 真相。

## 审查后吸收要求

通过审查后，Codex 只能把材料转写为 RebornG 本地候选或规则：

- `candidate_pool`
- `fact_card_draft`
- `rule_draft`
- `test_sample`
- `deferred`

吸收时必须更新当前版本阶段记录、项目仪表盘、`PROJECT-STATE.md` 和最新上下文交接。涉及 runtime 的吸收必须补 focused tests；涉及 UI 或玩家动作时应补 e2e 或写明延期原因。
