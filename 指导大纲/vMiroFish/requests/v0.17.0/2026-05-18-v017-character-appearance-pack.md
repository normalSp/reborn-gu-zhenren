# MiroFish Request: v017_character_appearance_pack

日期：2026-05-18
请求方：RebornG 美术专项（原 v0.17 关键 NPC 立绘草稿；当前改为 v0.18/art deferred）
关联 roadmap：`doc/art/v014-to-v100-art-roadmap.md` §v0.17
优先级：`deferred/art`
状态：暂不作为 v0.17 战斗主线阻塞包；等待 v0.18 南疆路线、角色出场范围或独立美术专项再转交。最终角色名单仍需后续 scope-freeze 审定。

## 目标

为后续新出场关键原著角色与南疆代表立绘提供 quote-redacted 外观依据：体型、年龄、脸部/发型/服饰、姿态、同伴/护卫、凡级阶段边界，避免生成通用古风脸或后期蛊仙形象。

本包只服务美术候选与 prompt seed，不决定角色命运、身份、阵营归属、成长路径或 DeepSeek 权限。

## 范围（草拟，待 v0.17 scope-freeze 审定）

### 原著角色

| # | 中文名 | 关键问题 |
|---|---|---|
| 1 | 商心慈 | 体型、年龄、服饰、显著标志、性格视觉提示、是否有小蝶等同伴线索 |
| 2 | 张心慈 | 与商心慈/张家身份线的命名与外观关系需复核，避免重复/误名 |
| 3 | 龙公 | 只抽取凡级/早期可见外观；如窗口内无合适低阶外观，必须 `concept_only` 或 `deferred` |
| 4-6 | 商家城关键人物约 3 个 | 名单待 RebornG scope-freeze 审定后补定，可先由 MiroFish 给候选池 |

### 原创/群像代表

| # | 角色类型 | 关键问题 |
|---|---|---|
| 7 | 南疆散修代表 | 南疆服饰、瘴气环境装备、与中原/青茅蛊师的视觉差异 |
| 8 | 三族外姓代表 | 三族体系中外姓/旁支的服饰、辈分、身份视觉差 |
| 9-10 | 其他 RebornG 玩家路线代表 | 如商队护卫、低阶递话人、坊市掮客等，待 RebornG 审定 |

## 章节窗口

- 第二卷早期 chapters 401-600：主窗口。
- 第二卷中期 chapters 601-800：补充窗口。
- 第一卷晚期 chapters 300-400：如有角色伏笔可收入。

严格剔除第三卷及之后涉及这些角色成为蛊仙、获得仙蛊、卷入福地/天庭剧情的高阶成长形象。

## 输出字段建议

```json
{
  "id": "character_appearance_<slug>",
  "characterId": "<slug>",
  "category": "character_appearance_evidence",
  "summary": "RebornG-owned 角色外观短摘要，不含原文正文",
  "body_hints": ["body_type", "height_relative", "age_range", "gender"],
  "face_hints": ["face_shape", "skin_tone", "distinctive_face_marks"],
  "hair_hints": ["color", "length", "style"],
  "clothing_hints": ["robe_type", "color_palette", "material", "accessories"],
  "posture_hints": ["typical_posture", "expression_default"],
  "distinctive_anchors": ["最能辨识本角色、避免画成通用古风脸的特征"],
  "companion_hints": ["典型同伴/丫鬟/护卫描述"],
  "rank_hints": {
    "early_window_rank": "rank_1 | rank_2 | rank_3 | rank_4 | rank_5 | unknown",
    "do_not_render_above_rank": true
  },
  "naming_hints": {
    "zh_name_confidence": "high | medium | low",
    "en_name_candidates": ["..."],
    "needs_human_check": true
  },
  "visibility": "public",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "windowTier": "vol1_late | vol2_early | vol2_mid",
  "evidenceStatus": "direct_appearance | direct_appearance_partial | concept_only | deferred",
  "suggestedUse": ["candidate_pool", "art_prompt_seed"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "player_hidden_fact_body", "character_fate_authority"],
  "riskTags": ["appearance_inference", "high_rank_growth_arc_overlap", "name_disambiguation_required"]
}
```

`rank_hints.do_not_render_above_rank = true` 必须全 item 成立，确保美术只渲染早期凡级阶段或公开低阶阶段的外观。

## 输出限制

- 不要原文正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 严格剔除高阶成长形象、蛊仙形态、仙蛊、福地、天庭、命运结局、隐藏因果。
- 所有 item 标 `runtimeAuthority = candidate_only`、`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true`。
- 对 `张心慈` / `商心慈` 的命名关系必须设置 `name_disambiguation_required`，避免 RebornG 误把同一角色拆成两张正式立绘，或把旧候选名当硬 canon。

## RebornG 使用边界

允许进入：

- `candidate_pool`
- `art_prompt_seed`

不得直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 角色命运/结局决定权
- 正式角色身份、势力归属、成长路径
- 高阶蛊仙形象或仙蛊持有状态

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| `summary.quoteLikeKeys` | 0 |
| 高阶事实泄漏 | 0 |
| 角色覆盖率 | ≥7 个 item 进入 `direct_appearance` 或 `direct_appearance_partial`；剩余可 `concept_only` / `deferred` 但需窗口扫描证据 |
| 每个 item sourcePointers | ≥1，含 windowTier |
| `distinctive_anchors` | 非空；如无直接外观，必须说明为何 `concept_only` |
| `rank_hints.do_not_render_above_rank` | 全部 true |
| 所有 item `requiresHumanCanonReview` | true |

## handoffMessageForMiroFish

```text
RebornG 美术专项请求 v0.17 关键 NPC 立绘外观依据包，包名 v017_character_appearance_pack。

目标：为 v0.17 关键原著角色（商心慈 / 张心慈 / 龙公 / 商家城关键人物约 3 个）+ 南疆散修/三族外姓/商队护卫等代表立绘提供原著外观依据，避免通用古风脸。

窗口：vol1_late 300-400 + vol2_early 401-600 + vol2_mid 601-800；严格剔除第三卷及之后涉及这些角色成长为蛊仙/获得仙蛊/卷入福地天庭的章节，只保留早期凡级或公开低阶阶段外观。

字段：每 item 含 characterId / body_hints / face_hints / hair_hints / clothing_hints / posture_hints / distinctive_anchors / companion_hints / rank_hints（early_window_rank / do_not_render_above_rank=true）/ naming_hints / sourcePointers / windowTier / evidenceStatus；保持 quote-redacted、no high-rank leak、no hidden fact、runtimeAuthority=candidate_only、deepSeekVisible=false、requiresHumanCanonReview=true。

特殊处理：张心慈/商心慈必须做命名关系复核，riskTags 加 name_disambiguation_required；龙公如窗口内无凡级/早期可见外观，宁可 deferred，不要引入后期高阶形象。

完成判定：≥7 个角色 direct_appearance(_partial)，剩余 concept_only/deferred；distinctive_anchors 非空或说明缺证；rank_hints.do_not_render_above_rank 全 true；JSON 可解析；summary.quoteLikeKeys=0；高阶事实泄漏=0；隐藏事实=0。

交付位置：指导大纲/vMiroFish/intake-reviews/v0.17.0/。RebornG 收到后再写 intake review，通过前不动任何美术 atlas / image-maps / visual-assets / 角色 canon。
```
