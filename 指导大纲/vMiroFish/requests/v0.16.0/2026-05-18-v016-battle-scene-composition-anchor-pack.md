# MiroFish Request: v016_battle_scene_composition_anchor_pack

日期：2026-05-18
请求方：RebornG 美术专项（v0.16 战斗场景构图锚点收口）
关联 roadmap：`doc/art/v014-to-v100-art-roadmap.md` §v0.16
优先级：`preferred`
状态：待转交 MiroFish；用户 2026-05-18 已接受本轮三张重生候选（A），本包用于降低后续战斗场景返工率，不阻塞当前候选验收。

## 目标

为 v0.16 战斗场景批次预先抽取 quote-redacted 的结构化构图锚点，覆盖：

- viewpoint / camera height / camera distance / foreground subject
- primary characters / posture / active Gu or weapon / setting color
- beasts or enemies / terrain anchors / atmosphere
- clash beat options
- hard avoid anchors

本包只为 `Composition Contract` 和美术 prompt seed 服务，不进入运行时 truth，不授予 DeepSeek 新权限。

## 范围

| # | 战斗场景 | RebornG slug | 当前状态 | 本包需要回答 |
|---|---|---|---|---|
| 1 | 熊力小组对白凝冰 | `xiong-li-squad-vs-bai-ning-bing` | candidate-03 已被用户接受为候选维护方向 | 验证方源远观 POV、大磨盘狼群、熊力/熊姜/白凝冰三焦点是否完整 |
| 2 | 方源猴王洞窟 | `fang-yuan-monkey-king-cavern-fight` | candidate-02 已被用户接受为候选维护方向 | 验证无金属刀、上衣罗网、锯齿金蜈、玉眼石猴王三倍大与血红眼 |
| 3 | 血湖五转战 | `first-gen-vs-tie-xue-leng-blood-lake` | candidate-04 已被用户接受为候选维护方向 | 验证山丘巨傀水及腰、青铜面具、双手铁钳抓血河蟒、双龙合焰炙烤 |
| 4 | 雷冠狼村战 | `thunder-crown-wolf-village-battle` | candidate-01 通过 QDW，未做完整 MiroFish 构图核验 | 雷冠狼、村寨防线、月光蛊、雷光克制度 |
| 5 | 一代古月对铁血冷鹤乱 | `first-gen-vs-tie-xue-leng-crane-chaos` | candidate-01 通过 QDW，未做完整 MiroFish 构图核验 | 天鹤上人/鹤群介入方式、铁链、血蝠、同框边界 |
| 6 | 方源二战白凝冰 | `fang-yuan-vs-bai-ning-bing-second-battle` | 历史入库，需核验 | 电锯金蜈/天蓬蛊/血月蛊/月芒蛊与白凝冰冰系表现是否同框合规 |
| 7 | 青书对白凝冰林斗 | `qing-shu-vs-bai-ning-bing-forest-duel` | 历史入库，需核验 | 青书木魅蛊/青藤与白凝冰冰刃/冰系表现是否同段合规 |
| 8 | 千里地狼蛛三族大比武 | `earthwolf-spider-third-battle` | 历史入库，需核验 | 地狼蛛冲锋、方源位置、白凝冰反击、残阳冰霜是否同段合规 |

## 章节窗口

- 主窗口：第一卷 0001-0400 strict/reviewable base。
- 第二卷早期 401-600 只作历史核验补充，不主动引入高阶事实。

## 输出字段建议

```json
{
  "id": "battle_scene_composition_<slug>",
  "battleSceneId": "<slug>",
  "category": "battle_scene_composition_anchor",
  "summary": "RebornG-owned 战斗场景构图锚点短摘要，不含原文正文",
  "viewpoint_hints": {
    "narrator_pov": "fang_yuan | external | bai_ning_bing | other",
    "camera_height": "low | eye_level | high | overhead",
    "camera_distance": "close | mid | far | extreme",
    "foreground_subject": "string"
  },
  "primary_characters": [
    {
      "characterId": "string",
      "posture": "string",
      "weapon_or_gu_active": ["string"],
      "setting_color": {
        "eyes": "string",
        "skin_or_aura": "string",
        "robe": "string"
      },
      "must_not_draw": ["string"]
    }
  ],
  "supporting_environment": {
    "beasts_or_enemies": ["string with count and scale"],
    "terrain_anchors": ["string"],
    "atmosphere": "string"
  },
  "clash_beat_options": [
    {
      "beatLabel": "string",
      "description_summary": "string",
      "visual_tension_score": "low | medium | high",
      "recommended_for_single_frame": true
    }
  ],
  "hard_avoid_anchors": ["string"],
  "visibility": "public",
  "sourcePointers": ["chapter_or_paragraph_pointer"],
  "windowTier": "vol1_mid | vol1_late | vol2_early",
  "evidenceStatus": "direct_anchor | direct_anchor_partial | inferred_anchor",
  "suggestedUse": ["candidate_pool", "art_prompt_seed", "composition_contract_seed"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "player_hidden_fact_body"],
  "riskTags": ["character_face_identification_risk", "high_rank_leak_window", "ai_pose_stereotype_risk"]
}
```

## 输出限制

- 不要原文正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 不要泄漏春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地、十转、天庭、永生等高阶事实。
- 方源猴王洞窟段如涉及春秋蝉本命蛊示警，只抽取可见战斗动作与防御表现，剔除示警机制。
- 古月一代真实身份、白凝冰北冥冰魄体、方源私密因果等只允许保留为隐藏边界，不进入本包正文摘要。
- 所有 item 标 `runtimeAuthority = candidate_only`、`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true`。

## RebornG 使用边界

允许进入：

- `candidate_pool`
- `art_prompt_seed`
- `composition_contract_seed`

不得直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式战斗结果、胜负、伤亡、关键蛊归属
- 玩家可见原著人物身份/命运

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| `summary.quoteLikeKeys` | 0 |
| 高阶事实泄漏 | 0 |
| 隐藏事实进入本包 | 0 |
| 8 张战斗场景覆盖率 | ≥6 进入 `direct_anchor` 或 `direct_anchor_partial`；剩余 ≤2 可 `inferred_anchor` |
| 每张场景 `clash_beat_options` | ≥2 个 beat |
| 每张场景 `hard_avoid_anchors` | ≥3 项 |
| 每张场景 `primary_characters` | 至少包含该场景所有出场具名原著角色 |
| 每张场景 `sourcePointers` | ≥1，含 windowTier 与 paragraphId |
| 所有 item `requiresHumanCanonReview` | true |

## handoffMessageForMiroFish

```text
RebornG 美术专项请求 v0.16 战斗场景构图锚点包，包名 v016_battle_scene_composition_anchor_pack。

目标：为 v0.16 战斗场景批次的 8 张场景（熊力小组对白凝冰 / 方源猴王洞窟 / 血湖五转战 / 雷冠狼村战 / 天鹤上人鹤乱 / 方源二战白凝冰 / 青书对白凝冰林斗 / 千里地狼蛛三族大比武）预先抽取结构化构图锚点（viewpoint / camera / posture / weapon / setting color / clash beat / supporting environment / hard avoid），让 candidate 生成不再依赖单线程手工 grep。

窗口：vol1 0001-0400 strict/reviewable base；第二卷早期仅作历史核验补充。

字段：每 item 含 battleSceneId / viewpoint_hints / primary_characters[] / supporting_environment / clash_beat_options[] / hard_avoid_anchors / sourcePointers / windowTier / evidenceStatus。保持 quote-redacted、no high-rank leak、no hidden fact、runtimeAuthority=candidate_only、deepSeekVisible=false、requiresHumanCanonReview=true。

特殊处理：方源猴王洞窟段只抽取可见战斗动作，剔除春秋蝉示警机制；古月一代真实身份、白凝冰北冥冰魄体、方源私密因果等隐藏因果不得进入摘要。

完成判定：8 张覆盖率 ≥6 direct_anchor(_partial)，每张 clash_beat_options ≥2、hard_avoid_anchors ≥3、primary_characters 含全部出场具名原著角色；JSON 可解析；summary.quoteLikeKeys=0；高阶事实泄漏=0；隐藏事实=0。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.16.0/；如暂未建目录，可临时放 v0.14.0，RebornG 收到后再迁移/写 intake review。通过 intake review 前不动任何美术 atlas / image-maps / visual-assets。
```
