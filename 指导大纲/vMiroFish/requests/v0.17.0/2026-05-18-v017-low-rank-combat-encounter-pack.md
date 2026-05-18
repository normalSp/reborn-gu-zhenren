# MiroFish Request: v017_low_rank_combat_encounter_pack

日期：2026-05-18
请求方：RebornG v0.17.0
优先级：preferred
状态：待用户转交 MiroFish

## 目标

为 v0.17 低阶战斗轨迹与后果回流提供 quote-redacted 候选材料：低阶蛊师冲突场景、战斗压力、撤退/追击/失败后果、环境因素和可公开战斗理由。

本包只作为 RebornG `candidate_pool` / `rule_draft` / `test_sample`，不是 canon truth，也不是 runtime authority。

## 范围

- 第一卷青茅山低阶战斗、族学、巡山、三寨摩擦、野外遭遇相关公开材料。
- 重点抽取凡级蛊师能看见、能理解、能参与的战斗因素。
- 可包含公开 NPC/势力压力，但不得决定 NPC 生死、捕获、阵营归属或正史结局。

## 输出字段建议

```json
{
  "id": "v017_combat_<slug>",
  "category": "low_rank_combat_encounter_candidate",
  "summary": "RebornG-owned 摘要，不含原文正文",
  "publicCombatReason": "玩家可见的战斗理由",
  "sceneTags": ["clan_school", "mountain_patrol", "wild_beast", "three_clan_pressure"],
  "participantHints": ["low_rank_gu_master", "beast", "patrol", "student"],
  "terrainHints": ["dense_forest", "mountain_pass", "courtyard", "riverbank"],
  "pressureAxes": ["resource", "reputation", "survival", "route_risk"],
  "allowedOutcomes": ["trace_only", "pressure_update", "route_risk_hint", "public_consequence"],
  "blockedOutcomes": ["reward_grant", "gu_grant", "material_drop", "location_unlock", "npc_death", "faction_transfer"],
  "sourcePointers": ["chapter_or_sample_pointer"],
  "visibility": "public_or_public_adjacent",
  "reviewStatus": "export_ready",
  "reborngGate": {
    "runtimeAuthority": "candidate_only",
    "deepSeekVisible": false,
    "requiresHumanCanonReview": true
  },
  "riskTags": ["combat_inference", "canon_anchor_pressure"]
}
```

## 输出限制

- 不要原文正文。
- 禁止 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText`。
- 不要高阶事实、仙蛊、宝黄天、福地、尊者、春秋蝉、重生、方源私密因果。
- 不要把候选写成正式奖励、正式掉落、正式地点、正式 NPC 生死。

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| quote-like keys | 0 |
| 高阶事实泄漏 | 0 |
| 候选数量 | 10-20 条 |
| sourcePointers | 每条至少 1 个 |
| blockedOutcomes | 每条非空 |
| reborngGate.runtimeAuthority | 全部 `candidate_only` |

## handoffMessageForMiroFish

```text
RebornG 请求 v0.17 低阶战斗候选包，包名 v017_low_rank_combat_encounter_pack。

目标：为 v0.17 战斗轨迹与后果回流提供第一卷青茅山低阶战斗候选材料，聚焦公开战斗理由、场景标签、参与者提示、地形提示、压力轴、允许后果和禁止后果。

输出：10-20 条 quote-redacted JSON item。每条包含 id/category/summary/publicCombatReason/sceneTags/participantHints/terrainHints/pressureAxes/allowedOutcomes/blockedOutcomes/sourcePointers/visibility/reviewStatus/reborngGate/riskTags。

边界：不得有 quote/originalText/excerpt/verbatim/rawText；不得泄漏高阶事实、春秋蝉、重生、方源私密因果；不得输出正式奖励、蛊虫、材料、地点、阵营、NPC 生死或正史结论。runtimeAuthority=candidate_only，deepSeekVisible=false，requiresHumanCanonReview=true。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.17.0/。RebornG 收到后先做 intake review，通过前不进入 runtime。
```
