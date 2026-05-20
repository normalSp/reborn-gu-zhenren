# qingmao_unfilled_gu_appearance_pack intake review

日期：2026-05-17
包名：`qingmao_unfilled_gu_appearance_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao_unfilled_gu_appearance_pack_export_ready.json`
关联请求：`指导大纲/vMiroFish/requests/v0.14.0/2026-05-17-qingmao-unfilled-gu-appearance-pack.md`
目标阶段：v0.15 蛊师经济/炼蛊/喂养美术准备（D3 / D4 / D5 / D6 蛊 PNG）；不进入 v0.14 任何运行时
结论：`accepted_for_art_candidate_pool_with_name_alignment_required`

本包是为 17 只青茅低阶蛊准备的 **外观依据 quote-redacted 候选包**，由 RebornG 美术专项发起，归口到 `doc/art/v014-to-v100-art-roadmap.md` 的第 6 步（D3+D4+D5+D6 蛊 PNG）。该包不为 v0.14 现行运行时供货，也不为 DeepSeek 提供任何新事实。

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| `summary.totalItems` | 17 / 17 |
| `summary.coveredRows` | 17 |
| `summary.rowsWithOriginalTextPointer` | 14 |
| `summary.rowsWithAtlasPriorOnly` | 3（`swirl_gu`、`fierce_wind_gu`、`lightning_eye_gu`） |
| `summary.sourcePointers` | 62 |
| `summary.quoteLikeKeys` | 0 |
| `summary.highRankLeakTerms` | 0 |
| `summary.hiddenFactItems` | 0 |
| `summary.skipped` | 0 |
| `licenseBoundary.mirofishCode` | `AGPL-3.0 remains outside RebornG runtime` |
| `canonBoundary.runtimeAuthority` | `none` |
| `canonBoundary.canonAuthority` | `human_review_required` |
| `canonBoundary.deepSeekAuthority` | `none` |
| `canonBoundary.artAuthority` | `candidate_seed_only` |
| `review.status` 全 item | `export_ready` |
| `reborngGate.runtimeAuthority` 全 item | `candidate_only` |
| `reborngGate.runtimeVisible` 全 item | `false` |
| `reborngGate.deepSeekVisible` 全 item | `false` |
| `reborngGate.requiresHumanCanonReview` 全 item | `true` |
| completionGate | `complete_candidate_with_known_gaps` |

未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段；`summary.quoteLikeKeys` 只是统计字段。未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地等高阶事实泄漏。未发现隐藏事实进入本包。

## 分组覆盖

| 请求组 | 行数 |
|---|---:|
| G1 方源/金道/坐骑 | 3 |
| G2 白凝冰冰道辅助/风道 | 4 |
| G3 铁血冷路线 | 6 |
| G4 天鹤上人路线 | 4 |

## evidenceStatus 分布

| 状态 | 数量 | 含义 |
|---|---:|---|
| `direct_name_and_function` | 1 | 名称与功能均直接命中（千里地狼蛛） |
| `direct_pair_visual` | 1 | 成对蛊视觉描写（阴阳转身蛊一行覆盖阳/阴蛊） |
| `direct_name_function_only` | 3 | 名称与功能命中、未给外观（旋风蛊、正气蛊、扬眉吐气蛊） |
| `direct_name_manifestation` | 2 | 能力效果显化命中（铁手擒拿蛊、油龙蛊） |
| `direct_name_strong_manifestation` | 1 | 能力效果强显化（火龙蛊） |
| `direct_body_appearance_with_name_mismatch` | 3 | 本体外观命中但请求名 ≠ 原著名（猪铁蛊、巨山傀儡蛊、血亲蛊） |
| `direct_name_manifestation_with_name_mismatch` | 1 | 能力显化命中且请求名 ≠ 原著名（镇魔铁链蛊） |
| `direct_alias_effect_appearance` | 1 | 别名命中、外观以能力效果出现（玉葬续命蛊） |
| `direct_alias_function_only` | 1 | 别名命中、仅有功能（驭鹤蛊） |
| `atlas_prior_only` | 3 | 第一卷无精确命中，仅 RebornG 旧 atlas 占位（漩涡蛊、烈风蛊、雷眼蛊） |

## 人工复核：请求名 vs 原著锚定名

**RebornG 决策：以下 6 行的请求名属于翻译/转写偏差，原著锚定名为权威；本包之后的 atlas / image-maps / 美术 prompt seed 一律采用原著锚定名，请求名只作历史别名记录，不进入硬 canon。**

| # | 请求名（候选，不采用为正式中文名） | 原著锚定名（RebornG 采用） | 第一卷锚 | 原文证据类型 |
|---|---|---|---|---|
| 1 | 猪铁蛊 | **生铁蛊** | ch_0177（交易线）+ ch_0178（本体形态） | 同条交易线给出本体煤球状外观，请求名未在前 400 章命中 |
| 2 | 巨山傀儡蛊 | **山丘巨傀蛊** | ch_0186 / ch_0191 / ch_0204 | 本体如青铜面罩；山泥巨傀只是能力显化 |
| 3 | 镇魔铁链蛊 | **镇魔铁索蛊** | ch_0170+ | 能力显化为铁索捆缚；请求"链"字与原文"索"字偏差 |
| 4 | 驭鹤蛊 | **御鹤蛊** | ch_0190+ | 别名命中、仅功能层面（控鹤），请求"驭"字与原文"御"字偏差 |
| 5 | 血亲蛊 | **至亲血虫** | ch_0190+ | 本体红玛瑙透明蝉形发光；请求名误把"虫"写成"蛊" |
| 6 | 玉葬续命蛊 | **存息玉葬蛊** | ch_0190+ | 别名命中；玉棺/玉茧是能力效果，不是本体直证 |

下游 atlas / image-maps / 美术 prompt seed 写入硬性要求：

- `doc/art/s0-qingmao-gu-atlas.md` 与 `doc/art/v014-to-v100-art-roadmap.md` 必须用原著锚定名作为主中文名，请求名只能出现在「请求别名」或「曾用译名」列。
- `public/rebrng/gu/s0-qingmao/<slug>.png` 的 slug 仍按已有英译约定取（如 `living-steel-gu.png` 而不是 `pig-iron-gu.png`、`hill-giant-puppet-gu.png` 而不是 `giant-mountain-puppet-gu.png`），避免文件名暗示候选名。
- 若 `生铁蛊` 已在 atlas 中作为独立行（详见 `s0-qingmao-gu-atlas.md` 第 36 行），不可在 `GU_IMAGE_MAP` 中再为 `猪铁蛊` 新建一条独立映射；同理处理其余 5 项。
- DeepSeek 上下文与玩家可见 UI 不接受这 6 个候选名，只接受原著锚定名。

## 高风险项：能力显化 ≠ 本体确认

下列 item 的视觉证据是「能力显化」（铁拳、油龙、火龙、铁索捆缚、青铜面罩驱动巨傀），不是「虫体本身的形态确认」。生图时必须画 **虫体形态为主体 + 能力效果作为氛围光/小幅环境元素**，不得直接画大龙、巨人、铁索墙：

- `铁手擒拿蛊`（拳形是擒拿效果）
- `油龙蛊`（黑油龙是能力显化）
- `火龙蛊`（火龙翻腾是能力显化）
- `镇魔铁索蛊`（铁索墙是封印效果）
- `山丘巨傀蛊`（山形巨傀是显化，本体更像青铜面罩）
- `存息玉葬蛊`（玉棺/玉茧是效果，本体未明示）

在美术 prompt seed 中必须显式标注 `effect_only`、不能写成 `body_confirmed`。

## 强制保留 atlas-pending/no-png

下列 3 个 item 在第一卷无任何外观锚点（`atlas_prior_only`），本轮不进入 D4 生图批次，仍保留 `atlas-pending/no-png`：

- 漩涡蛊
- 烈风蛊
- 雷眼蛊

后续如需补强，请走 MiroFish 第二轮请求，指定第 130-150 章窗口或扩展到第二卷早期窗口。

## 强外观锚（可优先入 prompt seed）

下列 item 的外观锚最强，建议在 D3+D4+D5+D6 批次内优先排队：

- 生铁蛊（黑色多孔煤球、铁气、可缩放）
- 千里地狼蛛（蜘蛛体格 + 狼形纹 + 掘地通道为坐骑/移动线索）
- 阳蛊 / 阴蛊（阴阳转身蛊配对：两虫、黑白冷暖、太极光球；可拆作阴/阳两张冷暖对照图）
- 至亲血虫（红玛瑙透明、似蝉、发光指向，是本包最强的标本锚之一）

## RebornG 复核口径

2026-05-17 RebornG 机械复核结论：

- JSON 可解析，17 个 item 均为 `export_ready`。
- `reborngGate.runtimeAuthority` 全部为 `candidate_only`；`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true` 全部成立。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 未发现高阶事实泄漏，未发现隐藏事实进入本包。
- 6 行请求名/原著名偏差按上表统一处理；不产生隔离项，但产生 6 条硬性命名对齐约束。
- 3 行 `atlas_prior_only` 不视为隔离项，归为「保留 atlas-pending」类。

## 可吸收方式

允许进入：

- `candidate_pool`
- `art_prompt_seed`（新 art roadmap 的「外观依据」字段；`atlas_update` 时同步更新 `doc/art/s0-qingmao-gu-atlas.md` 的「视觉 prompt seed」列）
- `atlas_update`（仅在更新主中文名为原著锚定名的前提下）

不可直接进入：

- runtime truth
- DeepSeek authority
- player-visible hidden fact body
- 正式蛊师能力/伤害/掉落数值结论
- 正式蛊方公开发放
- `GU_IMAGE_MAP` 在未完成原著名对齐前的新增映射

## 下一步

1. 用本对齐表更新 `doc/art/v014-to-v100-art-roadmap.md` 的 D3 / D5 / D6 段，把 6 项候选名替换为原著锚定名，并标注请求名为「曾用候选名」。
2. 后续 atlas 整理阶段，再回头更新 `doc/art/s0-qingmao-gu-atlas.md` 的相应行（本轮先不动 atlas，避免与历史台账冲突）。
3. 第 6 步 D3+D4+D5+D6 17 张配额按本对齐表执行；其中 `atlas_prior_only` 3 项剔除出本批，剩余 14 项进入 art prompt seed pool。
4. 在生图前，每张图的 Composition Contract 必须显式写出「`effect_only` 元素只作环境/小幅光效，主体是虫体」，避免把能力显化误画成本体确认。
5. 任何 6 行的运行时归一（`GU_IMAGE_MAP` 增加新键、`qingmao-visual-assets.json` 白名单加入新 PNG）必须等待美术 PNG 入库后一起做。

## 风险与硬边界

- 本包不进入 v0.14 运行时；本轮也不开放任何美术 PNG 入库，只允许进入候选与 prompt seed。
- 美术生成必须遵守 `doc/art/v014-to-v100-art-roadmap.md` 的硬边界：不得暗示 Immortal Gu、十转、永生、宿命蛊归属、凡人宝黄天交易；不得添加可读文字/水印/logo。
- 6 行候选名不得作为硬 canon 出现在任何 RebornG 文档、UI、DeepSeek 上下文、tests、handoff；引用时必须使用原著锚定名。
