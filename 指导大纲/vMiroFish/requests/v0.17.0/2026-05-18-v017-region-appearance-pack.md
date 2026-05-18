# MiroFish Request: v017_region_appearance_pack

日期：2026-05-18
请求方：RebornG 美术专项（原 v0.17 多区域正史锚点网络草稿；当前改为 v0.18/art deferred）
关联 roadmap：`doc/art/v014-to-v100-art-roadmap.md` §v0.17
优先级：`deferred/art`
状态：暂不作为 v0.17 战斗主线阻塞包；等待 v0.18 南疆路线或独立美术专项再转交。

## 目标

为后续南疆路线、多区域大景与商家城城景提供 quote-redacted 外观依据：地形、气候、建筑、人流、危险等级、可识别区域元素，避免生成通用古风幻想城景。

本包只服务美术候选与 canon anchor 草稿，不开放正式地点、阵营、奖励、任务、商家城系统或 DeepSeek 新权限。

## 范围

| # | 中文名 | 类型 | 关键问题 |
|---|---|---|---|
| 1 | 南疆主区域大景 | 区域大景 | 地形、瘴气/丛林/河谷、危险等级、人迹密度 |
| 2 | 商家城大景 | 区域大景 | 城墙规模、城市形态、防御层、商业属性、人流密度 |
| 3 | 三王山 | 区域大景 | 山地特征、遗迹/建筑是否有公开外观锚 |
| 4 | 义天山 | 区域大景 | 地形特征、气候、可识别轮廓 |
| 5 | 南疆山口 | 区域过渡景 | 关口形态、过渡氛围、危险标志 |
| 6 | 南疆河谷 | 区域大景 | 水系形态、植被、瘴气、潜伏危险 |
| 7 | 商家城坊市 | 城景 | 摊位形态、人流、商品类型、与青茅坊市的差异 |
| 8 | 商家城拍卖行 | 城景 | 凡级蛊师拍卖行的空间形态、人流分层、建筑特征 |
| 9 | 商家城城门 | 城景 | 城门形态、守卫、查验流程、出入人流 |

## 章节窗口

- 第二卷早期 chapters 401-600：主窗口。
- 第二卷中期 chapters 601-800：补充窗口。
- 第一卷晚期 chapters 300-400：如有南疆/商家城/三王山/义天山伏笔可收入。

严格剔除第三卷及之后涉及仙蛊、福地、天庭、十转、永生等高阶事实的章节。

## 输出字段建议

```json
{
  "id": "region_appearance_<slug>",
  "regionId": "<slug>",
  "category": "region_or_city_appearance_evidence",
  "summary": "RebornG-owned 区域/场景外观短摘要，不含原文正文",
  "terrain_hints": ["terrain_type", "elevation", "water_system", "vegetation", "weather_atmosphere"],
  "architecture_hints": ["building_type", "scale", "material", "defensive_layer"],
  "population_hints": ["density", "social_layer", "presence_of_specific_factions"],
  "danger_level_hints": ["wild_beast", "bandit", "rival_faction", "mortal_safety_score"],
  "distinctive_anchors": ["最能辨识本区域、避免被画成通用古风的特征"],
  "naming_hints": {
    "zh_name_confidence": "high | medium | low",
    "en_name_candidates": ["..."],
    "needs_human_check": false
  },
  "visibility": "public",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "windowTier": "vol1_late | vol2_early | vol2_mid",
  "evidenceStatus": "direct_appearance | direct_appearance_partial | concept_only",
  "suggestedUse": ["candidate_pool", "art_prompt_seed", "canon_anchor_draft"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "player_hidden_fact_body", "faction_transfer_authority"],
  "riskTags": ["appearance_inference", "high_rank_leak_window", "treasure_yellow_heaven_overlap"]
}
```

商家城拍卖行必须标记 `treasure_yellow_heaven_overlap`，但内容只能抽取凡级蛊师拍卖场景，不得把宝黄天交易或蛊仙交易视觉带入。

## 输出限制

- 不要原文正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 不要泄漏春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地、十转、天庭、永生等高阶事实。
- 所有 item 标 `runtimeAuthority = candidate_only`、`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true`。

## RebornG 使用边界

允许进入：

- `candidate_pool`
- `art_prompt_seed`
- `canon_anchor_draft`（仍需 RebornG lore 评审才能升级）

不得直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式区域/地点解锁
- 正式势力归属、站位、身份转换
- 正式商家城/三王山/义天山进入凭据
- 正式拍卖行交易接口

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| `summary.quoteLikeKeys` | 0 |
| 高阶事实泄漏 | 0；如有必须隔离 |
| 9 个区域/场景覆盖率 | ≥7 进入 `direct_appearance` 或 `direct_appearance_partial`；剩余 ≤2 可 `concept_only` |
| 每个 item sourcePointers | ≥1，含 windowTier |
| `distinctive_anchors` | 非空 |
| 商家城拍卖行 `riskTags` | 必须含 `treasure_yellow_heaven_overlap` |
| 所有 item `requiresHumanCanonReview` | true |

## handoffMessageForMiroFish

```text
RebornG 美术专项请求 v0.17 多区域+城景外观依据包，包名 v017_region_appearance_pack。

目标：为 v0.17 多区域正史锚点网络的 9 张 PNG（南疆 / 商家城 / 三王山 / 义天山 主区域大景 + 南疆山口 + 南疆河谷 + 商家城坊市 + 拍卖行 + 城门）提供原著外观依据，让美术 candidate 能避免通用古风。

窗口：vol1_late 300-400 + vol2_early 401-600 + vol2_mid 601-800；严格剔除第三卷及之后高阶事实章节。

字段：每 item 含 regionId / terrain_hints / architecture_hints / population_hints / danger_level_hints / distinctive_anchors / naming_hints / sourcePointers / windowTier / evidenceStatus；保持 quote-redacted、no high-rank leak、no hidden fact、runtimeAuthority=candidate_only、deepSeekVisible=false、requiresHumanCanonReview=true。

特殊处理：商家城拍卖行只抽取 mortal-tier 拍卖场景，剔除宝黄天高阶交易细节，riskTags 必须含 treasure_yellow_heaven_overlap。

完成判定：9 个区域/场景覆盖率 ≥7 direct_appearance(_partial)，剩余 ≤2 concept_only；distinctive_anchors 非空；JSON 可解析；summary.quoteLikeKeys=0；高阶事实泄漏=0；隐藏事实=0。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.17.0/。RebornG 收到后再写 intake review，通过前不动任何美术 atlas / image-maps / visual-assets / 区域 canon。
```
