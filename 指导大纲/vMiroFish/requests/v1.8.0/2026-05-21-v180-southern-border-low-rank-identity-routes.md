# MiroFish request：v1.8 southern_border_low_rank_identity_routes_outer_edge_slice

日期：2026-05-21
请求方：RebornG Codex
目标版本：v1.8.0-a2
状态：requested_for_export
topicId：`southern_border_low_rank_identity_routes_outer_edge_slice`

## 请求背景

用户已批准 D-181-001 至 D-181-010。v1.8 主线为“低阶身份路线与同开局差异度地基”，且五类身份只作为候选标签/测试样本，不作为正式身份。

本 request 用于在进入 b1 runtime 前完成 blocking topic-slice：

- RebornG request。
- MiroFish quote-redacted export。
- RebornG intake review。
- RebornG 规则草案与测试矩阵引用。

## 需要的材料

请从全书基础包中导出低阶外缘身份路线相关 source-pointer 切片，优先复用已验证的南疆外缘生活压力 source pointers，覆盖以下方向：

- 商队学徒 / 临时帮工候选：货物、短工、中介、许可链、低身份杂务。
- 散修短工候选：临时落脚、人情债、拒绝后仍可继续找活。
- 低阶护卫 / 护送候选：路障、规矩、通行压力、站岗/护送风险。
- 采集跑腿候选：补给缺口、山路资源压力、货物让步。
- 情报跑腿 / 传话人候选：外缘盘问、公开观察、传话、避祸。
- 同开局差异度：同一稳定事实下可抽取不同公开压力牌组和表达槽位。
- 正式道具词风险：木牌、令牌、登记、成员身份、报到、负责人点头等词只能作为临时凭据/前置条件风险，不得自动授予正式身份。

## 输出要求

- 输出 quote-redacted JSON。
- 每个 item 必须带 source pointer。
- 不输出原文、长摘录、quote、excerpt、verbatim、rawText、sourceText。
- 不输出 hidden/private body。
- 不把任何 item 标记为 runtime canon、DeepSeek visible、player-visible hidden fact 或正式规则。
- item 级 promotion 只能是 `candidate_pool`、`rule_draft`、`test_sample`、`deferred`、`quarantined`、`rejected`。

## 禁止方向

- 不批准正式职业/身份系统。
- 不批准正式商队成员、散修势力、护卫组织身份。
- 不批准正式工资、价格、库存、交易、任务奖励。
- 不批准正式地点、阵营、商家城入口、NPC 生死。
- 不批准方源私密因果、hidden/private 可见化。
- 不批准 DeepSeek RAG、可见全书摘要或新 authority。
- 不批准新增 RebornG runtime、save field、canon 或 prompt context。

## 预期交付路径

- blueprint：`指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-blueprint.json`
- export：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_report.json`
- handoff：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_handoff.md`
- RebornG intake review：`指导大纲/vMiroFish/intake-reviews/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-intake-review.md`
