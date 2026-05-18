# MiroFish Request: v017_killer_move_counter_boundary_pack

日期：2026-05-18
请求方：RebornG v0.17.0
优先级：preferred
状态：待用户转交 MiroFish

## 目标

为 v0.17 杀招/蛊虫反制与风险显示提供 quote-redacted 边界材料：低阶蛊虫与凡级杀招的使用条件、反制方式、风险、场景限制和不可越界项。

本包不授予 RebornG 任何新蛊虫、杀招、蛊方、材料或奖励。

## 范围

- 第一卷青茅山低阶蛊虫、凡级杀招、族学/野外战斗中的公开战斗用法。
- 只收低阶凡级可见阶段。
- 高阶杀招、仙蛊、福地、宝黄天、尊者线全部剔除。

## 输出字段建议

```json
{
  "id": "v017_counter_<slug>",
  "category": "killer_move_or_gu_counter_boundary",
  "summary": "RebornG-owned 摘要，不含原文正文",
  "guOrMoveHints": ["moonlight_gu", "white_jade_gu", "liquor_worm"],
  "usableWhen": ["range_line", "self_defense", "pre_battle_support"],
  "counterHints": ["cover", "evasion", "resource_pressure", "terrain"],
  "riskHints": ["primeval_essence_cost", "cooldown", "backlash", "exposure"],
  "blockedImplications": ["immortal_gu", "instant_kill", "gu_grant", "recipe_unlock", "canon_rewrite"],
  "sourcePointers": ["chapter_or_sample_pointer"],
  "visibility": "public_or_public_adjacent",
  "reviewStatus": "export_ready",
  "reborngGate": {
    "runtimeAuthority": "candidate_only",
    "deepSeekVisible": false,
    "requiresHumanCanonReview": true
  },
  "riskTags": ["counter_inference", "high_rank_leak_guard"]
}
```

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| quote-like keys | 0 |
| 高阶事实泄漏 | 0 |
| 候选数量 | 8-16 条 |
| counterHints/riskHints | 每条至少一项非空 |
| blockedImplications | 每条非空 |

## handoffMessageForMiroFish

```text
RebornG 请求 v0.17 杀招/蛊虫反制边界包，包名 v017_killer_move_counter_boundary_pack。

目标：为低阶蛊虫/凡级杀招在战斗准备和战斗 trace 中的可用、不可用、反制、风险显示提供 quote-redacted 候选材料。

输出：8-16 条 JSON item，每条含 guOrMoveHints、usableWhen、counterHints、riskHints、blockedImplications、sourcePointers、reborngGate。

边界：不得有 quote/originalText/excerpt/verbatim/rawText；不得泄漏高阶事实、仙蛊、宝黄天、福地、春秋蝉、重生、方源私密因果；不得授予蛊虫、杀招、蛊方、材料、奖励。runtimeAuthority=candidate_only，deepSeekVisible=false，requiresHumanCanonReview=true。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.17.0/。RebornG 收到后先做 intake review，通过前不进入 runtime。
```
