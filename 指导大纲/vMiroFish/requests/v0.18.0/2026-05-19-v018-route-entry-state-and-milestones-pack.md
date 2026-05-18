# MiroFish Request: v018_route_entry_state_and_milestones_pack

日期：2026-05-19
请求方：RebornG 专家团
用途：v0.18.0 南疆路线与多区域承接
优先级：如果 RebornG 要写正式 route/location state，则为 blocking；否则为 preferred

## handoffMessageForMiroFish

请为 RebornG 生成 `v018_route_entry_state_and_milestones_pack`。

目标：抽取/整理青茅之后低阶路线进入的候选材料，用于 RebornG 评估“从青茅路线候选进入下一阶段”的公开里程碑、路线阶段、失败/回退/追索边界。它不是 canon truth，不是 runtime authority，不是 DeepSeek authority。

请严格遵守：

1. JSON 为主，另附 report 和简短说明。
2. 不包含原文正文，不包含 quote、originalText、excerpt、verbatim、rawText 等字段。
3. 只能使用 source pointer，例如 chapter/sample pointer。
4. 所有 item 标记 `runtimeAuthority: candidate_only`。
5. 所有 item 默认 `runtimeVisible: false`、`deepSeekVisible: false`，除非明确是公开事实候选，仍只能作为 RebornG intake 后的候选。
6. 必须标注 `requiresHumanCanonReview: true`。
7. 如果出现春秋蝉、重生、方源私密因果、蛊仙、仙蛊、仙材、福地/洞天、宝黄天、天庭、尊者、高阶命运线，必须隔离到 `quarantined`，不得混入主包。

建议 item 类型：

- `route_entry_prerequisite`
- `route_milestone_public`
- `route_stage_candidate`
- `route_failure_or_return`
- `pursuit_boundary`
- `supply_boundary`
- `identity_boundary`
- `hidden_ref_only`

建议字段：

```json
{
  "id": "v018_route_item_id",
  "packageId": "v018_route_entry_state_and_milestones_pack",
  "category": "route_entry_prerequisite | route_milestone_public | route_stage_candidate | route_failure_or_return | pursuit_boundary | supply_boundary | identity_boundary | hidden_ref_only",
  "summary": "RebornG-owned short summary, no original prose",
  "visibility": "public | player_visible | hidden_ref_only",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "suggestedUse": ["candidate_pool", "rule_draft", "test_sample"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "formal_reward", "formal_location_unlock", "npc_life_result"],
  "riskTags": ["route_entry", "route_escape", "pursuit_pressure", "supply_gap", "identity_pressure"],
  "runtimeAuthority": "candidate_only",
  "runtimeVisible": false,
  "deepSeekVisible": false,
  "requiresHumanCanonReview": true
}
```

重点覆盖：

- 离开青茅后的低阶路线公开阶段。
- 商队/山路/散修/客栈或坊市/商家城外缘相关公开里程碑。
- 前期补给不足、遮掩不足、追索压力高时的失败/回退/风险。
- 不得直接生成正式地点解锁、阵营转移、奖励或 NPC 生死。

交付到：

`指导大纲/vMiroFish/intake-reviews/v0.18.0/`
