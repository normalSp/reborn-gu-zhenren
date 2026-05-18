# MiroFish Request: v018_post_qingmao_pressure_reaction_pack

日期：2026-05-19
请求方：RebornG 专家团
用途：v0.18.0 前期账本影响后续补给、追索、身份压力
优先级：preferred，建议 b4 前完成 intake

## handoffMessageForMiroFish

请为 RebornG 生成 `v018_post_qingmao_pressure_reaction_pack`。

目标：整理青茅离开后低阶公开反应、追索、身份压力、商队担保和三寨残余压力的候选材料，用于 v0.18 b4 让前期行动账本影响后续路线。它不是 canon truth，不是 runtime authority，不是 DeepSeek authority。

请严格遵守：

1. JSON 为主，另附 report 和简短说明。
2. 不包含原文正文，不包含 quote、originalText、excerpt、verbatim、rawText 等字段。
3. 使用 source pointer，不使用原文引文。
4. 所有 item 标记 `runtimeAuthority: candidate_only`。
5. 所有 hidden/private motive 只能作为 `hidden_ref_only` 或 `quarantined`，不得写正文。
6. 必须标注 `requiresHumanCanonReview: true`。
7. 涉及方源私密因果、重生、春秋蝉、永生动机等必须隔离，不进入玩家可见候选。

建议 item 类型：

- `post_qingmao_public_pressure`
- `pursuit_reaction`
- `identity_suspicion`
- `caravan_guarantee_requirement`
- `faction_residual_pressure`
- `npc_public_memory_candidate`
- `hidden_ref_only`
- `quarantined`

建议字段：

```json
{
  "id": "v018_pressure_item_id",
  "packageId": "v018_post_qingmao_pressure_reaction_pack",
  "category": "post_qingmao_public_pressure | pursuit_reaction | identity_suspicion | caravan_guarantee_requirement | faction_residual_pressure | npc_public_memory_candidate | hidden_ref_only | quarantined",
  "summary": "RebornG-owned short summary, no original prose",
  "visibility": "public | player_visible | hidden_ref_only | quarantined",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "suggestedUse": ["candidate_pool", "rule_draft", "test_sample"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "formal_warrant", "formal_faction_transfer", "npc_life_result"],
  "riskTags": ["pursuit_pressure", "identity_pressure", "caravan_guarantee", "faction_residual"],
  "runtimeAuthority": "candidate_only",
  "runtimeVisible": false,
  "deepSeekVisible": false,
  "requiresHumanCanonReview": true
}
```

重点覆盖：

- 离开青茅后公开层面的怀疑、追索、遮掩失败风险。
- 商队对身份、担保、补给或可信度的公开前置。
- 三寨残余、古月/白家/熊家相关公开压力。
- 不产生正式通缉、招揽、阵营转移、NPC 生死或奖励。

交付到：

`指导大纲/vMiroFish/intake-reviews/v0.18.0/`
