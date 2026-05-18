# MiroFish Request: v017_squad_formation_tactics_pack

日期：2026-05-18
请求方：RebornG v0.17.0
优先级：preferred
状态：待用户转交 MiroFish

## 目标

为 v0.17 小队/阵法/撤退/追击第一层提供 quote-redacted 候选材料：低阶蛊师协作、掩护、追击、撤退、士气、阵点或地形控制的公开表现。

本包只服务 rule_draft / test_sample，不开放正式小队成员死亡、捕获、永久重伤、阵营转移或路线成功。

## 范围

- 第一卷青茅山低阶小队、巡山、三寨摩擦、野外协作、追逃相关公开材料。
- 可包含阵法/阵点/地形控制的低阶表达。
- 不抽取高阶阵法、福地洞天、蛊仙战、尊者战。

## 输出字段建议

```json
{
  "id": "v017_squad_<slug>",
  "category": "squad_formation_tactics_candidate",
  "summary": "RebornG-owned 摘要，不含原文正文",
  "tacticTags": ["guard", "assist", "retreat", "pursuit", "morale", "formation_node"],
  "triggerHints": ["ally_low_hp", "enemy_adjacent", "route_escape", "ambush_pressure"],
  "readableReason": "玩家可见理由",
  "allowedEffects": ["morale_hint", "hit_reason", "retreat_risk", "pressure_update"],
  "blockedEffects": ["npc_death", "permanent_injury", "capture", "location_unlock", "faction_transfer", "reward_grant"],
  "sourcePointers": ["chapter_or_sample_pointer"],
  "visibility": "public_or_public_adjacent",
  "reviewStatus": "export_ready",
  "reborngGate": {
    "runtimeAuthority": "candidate_only",
    "deepSeekVisible": false,
    "requiresHumanCanonReview": true
  },
  "riskTags": ["formation_inference", "npc_life_boundary"]
}
```

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| quote-like keys | 0 |
| 高阶事实泄漏 | 0 |
| 候选数量 | 8-16 条 |
| tacticTags | 每条非空 |
| blockedEffects | 每条非空 |

## handoffMessageForMiroFish

```text
RebornG 请求 v0.17 小队/阵法/撤退/追击候选包，包名 v017_squad_formation_tactics_pack。

目标：为低阶小队协作、阵点/地形控制、撤退、追击、士气和掩护的第一层规则提供 quote-redacted 候选材料。

输出：8-16 条 JSON item，每条含 tacticTags、triggerHints、readableReason、allowedEffects、blockedEffects、sourcePointers、reborngGate。

边界：不得有 quote/originalText/excerpt/verbatim/rawText；不得泄漏高阶阵法、仙蛊、福地、宝黄天、尊者线；不得输出正式 NPC 死亡/捕获/永久重伤、地点解锁、阵营转移或奖励。runtimeAuthority=candidate_only，deepSeekVisible=false，requiresHumanCanonReview=true。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.17.0/。RebornG 收到后先做 intake review，通过前不进入 runtime。
```
