# MiroFish Request: qingmao_unfilled_gu_appearance_pack

日期：2026-05-17
请求方：RebornG 美术专项（跨 v0.14 → v0.15 准备）
优先级：preferred；本次只面向美术外观依据，不涉及运行时规则
关联 roadmap：`doc/art/v014-to-v100-art-roadmap.md`

## 目标

为 RebornG 第一卷青茅山阶段的 17 只仍未生图的低阶蛊提供 **外观依据 quote-redacted 候选包**，让 RebornG 后续可以在不违反原著边界的前提下生成标本卡片图鉴。

当前缺图的根本障碍不是流程，而是这些蛊在 RebornG 现有 `doc/art/s0-qingmao-gu-atlas.md` 中被标记为 `视觉缺资料` 或 `译名待复核`。希望 MiroFish 在第一卷已有 strict/reviewable base 中抽取每只蛊的形态线索、用途/能力旁证、命名/译名旁证，作为生图前的视觉锚。

## 范围（17 只青茅低阶蛊）

按外观依据强度从弱到强分四组：

### G1. 方源/金道/坐骑（3 只）

| 中文名 | 英译名（暂定） | 第一卷章节锚 | 需要回答的视觉问题 |
|---|---|---:|---|
| 猪铁蛊 | Pig Iron Gu | 180 | 中文名是否准确？身体形态偏铁块/铁兽/活金属？颜色与质感线索？ |
| 千里地狼蛛 | Thousand Li Earthwolf Spider | 188 | 作为蛊坐骑的形态：蜘蛛体格 + 狼形纹？腿数、地纹/狼斑？金属感还是甲壳感？|
| 阳蛊 / 阴蛊 | Yang Gu / Yin Gu | 197/199 | 与阴阳转身蛊的视觉关系：双虫并蒂还是独体？颜色配对（冷暖、明暗）？ |

### G2. 白凝冰冰道辅助/风道（4 只）

| 中文名 | 英译名（暂定） | 第一卷章节锚 | 需要回答的视觉问题 |
|---|---|---:|---|
| 旋风蛊 | Whirlwind Gu | 131+ | 风道辅助蛊的形态线索；翅膀类型、旋纹分布、配色 |
| 漩涡蛊 | Swirl Gu | 131+ | 增加转向/旋转速度的辅助蛊；体形、附肢、是否带触角 |
| 烈风蛊 | Fierce Wind Gu | 131+ | 风道攻击线索；锐利度、风切痕迹 |
| 雷眼蛊 | Lightning Eye Gu | 131+ | 雷道侦察/攻击蛊；是否真有"眼"特征？雷光呈现方式 |

### G3. 铁血冷路线（6 只）

| 中文名 | 英译名（暂定） | 第一卷章节锚 | 需要回答的视觉问题 |
|---|---|---:|---|
| 正气蛊 | Righteous Gu | 170+ | 正道概念蛊的外观线索 |
| 铁手擒拿蛊 | Ironfist Grappling Gu | 170+ | 是否真有"手"形？铁拳/铁钩/铁爪？金属感 |
| 油龙蛊 | Oil Dragon Gu | 170+ | 是否真为龙形？油液质感来源 |
| 火龙蛊 | Fire Dragon Gu | 170+ | 同上；与油龙蛊的视觉差 |
| 巨山傀儡蛊 | Giant Mountain Puppet Gu | 170+ | 傀儡蛊本体形态（不是被驱使的巨傀） |
| 镇魔铁链蛊 | Demon Suppression Iron Chain Gu | 170+ | 链状蛊：节段构造、附肢、锁扣意象 |

### G4. 天鹤上人路线（4 只）

| 中文名 | 英译名（暂定） | 第一卷章节锚 | 需要回答的视觉问题 |
|---|---|---:|---|
| 驭鹤蛊 | Crane Enslavement Gu | 190+ | 奴道蛊外观；是否带羽/触须/控制器意象 |
| 血亲蛊 | Kinship Bloodworm | 190+ | 血缘追踪蛊：虫体细长/血脉纹/枝状分支 |
| 玉葬续命蛊 | Life-Retaining Jade Burial Gu | 190+ | 玉茧/玉棺/封存意象；外壳是否可读为"葬" |
| 扬眉吐气蛊 | Raise Eyebrows & Exhale Gu | 190+ | 概念型蛊，本卷描述是否给过任何外观/气场线索 |

## 需要的字段建议

按 v0.14 已有 MiroFish 协议 `指导大纲/v0.14.0/codex/00-总览/v0.14.0-MiroFish资料需求与交付协议.md` 的字段约定，每个 item 建议：

```json
{
  "id": "gu_appearance_<slug>",
  "guId": "<slug 与 RebornG image-maps 对齐>",
  "category": "gu_appearance_evidence",
  "summary": "RebornG-owned 外观/能力线索短摘要，不含原文正文",
  "shape_hints": ["body_form", "appendages", "texture", "size"],
  "color_hints": ["primary_color", "secondary_color", "accent"],
  "ability_hints": ["path", "use_type"],
  "naming_hints": {
    "zh_name_confidence": "high | medium | low",
    "en_name_candidates": ["..."],
    "needs_human_check": true
  },
  "visibility": "public",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "suggestedUse": ["candidate_pool", "art_prompt_seed", "atlas_update"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "player_hidden_fact_body"],
  "riskTags": ["appearance_inference", "name_uncertain", "concept_only"]
}
```

如果某只蛊在原著第一卷只有概念/能力描述、没有任何外观锚点，请在 `shape_hints`/`color_hints` 留空并设 `riskTags: ["concept_only"]`，RebornG 会把这只蛊保留为 `atlas-pending/no-png` 而不强行生图。

## 输出限制

- 不要原文正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 不要泄漏春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地等高阶事实。
- 隐藏事实只给 `hidden_ref_only`，但本包预期 **不应该出现** 隐藏事实；如果出现请单独隔离并说明原因。
- 所有 item 标 `runtimeAuthority = candidate_only`、`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true`。

## RebornG 使用边界

该包只可进入：

- `candidate_pool`
- `art_prompt_seed`（即新 art roadmap 的"外观依据"字段）
- `atlas_update`（更新 `doc/art/s0-qingmao-gu-atlas.md` 的 `视觉 prompt seed` 列）

不得直接进入：

- runtime truth
- DeepSeek authority
- player-visible hidden fact body
- 正式蛊师能力/伤害/掉落数值结论
- 正式蛊方公开发放

## 完成判定

| 维度 | 通过条件 |
|---|---|
| JSON 可解析 | 是 |
| `summary.quoteLikeKeys` | 0 |
| 高阶事实泄漏 | 0 |
| 隐藏事实进入本包 | 0；若有必须隔离并标注 |
| 17 只蛊覆盖率 | ≥14（剩余给出 `concept_only` 解释也算覆盖） |
| 每只蛊 sourcePointers | ≥1 |
| 所有 item `requiresHumanCanonReview` | true |

## 用户转交流程

Codex/Cursor 当前线程不能直接联系 MiroFish 会话。请将本请求转交给 MiroFish 会话 `019e207b-c55d-7e23-b450-efa7a054a165`。

完成后 MiroFish 把 JSON 包放到 `指导大纲/vMiroFish/intake-reviews/v0.14.0/`，RebornG 进入 intake review 并写一份 `qingmao-unfilled-gu-appearance-pack-intake-review.md`。intake review 通过前，RebornG 不会用本包内任何线索去生美术，也不会更新 `doc/art/s0-qingmao-gu-atlas.md` 或 `qingmao-visual-assets.json`。
