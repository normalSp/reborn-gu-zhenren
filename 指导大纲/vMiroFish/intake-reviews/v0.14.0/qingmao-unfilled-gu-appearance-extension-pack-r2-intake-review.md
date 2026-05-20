# qingmao_unfilled_gu_appearance_extension_pack_r2 intake review

日期：2026-05-18
包名：`qingmao_unfilled_gu_appearance_extension_pack_r2_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao_unfilled_gu_appearance_extension_pack_r2_export_ready.json`
关联请求：`指导大纲/vMiroFish/美术/2026-05-18-d4r2-d6r2-gu-appearance-extension-pack.md`
关联前次包：`qingmao_unfilled_gu_appearance_pack`（v0.14.0 R1）
目标阶段：v0.15 D4/D6 美术收口（4 只 atlas-pending Qingmao Gu 外观依据扩展）
结论：`accepted_for_art_candidate_pool_with_one_name_alignment`，**4 只 body 全部未确认；本包不解锁任何标本本体生图，仅可作 effect/scene-side prompt seed**

> 注：本文件最初由 MiroFish 自动生成 1.8KB 占位 review；2026-05-18 由 RebornG 端覆盖为正式 Cursor 端机械复核结论。MiroFish 占位的关键发现已并入下方「Key Findings」。

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| `summary.totalItems` | 4 / 4 |
| `summary.coveredRows` | 4 |
| `summary.directAppearanceOrPartialRows` | 4 |
| `summary.rowsWithRequestedExactNameHits` | 1（仅扬眉吐气蛊） |
| `summary.rowsWithAliasOrEffectHits` | 4 |
| `summary.sourcePointers` | 16 |
| `summary.forbiddenFieldKeyCount` | 0 |
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
| `coverageMatrix.completionGate.status` | `conditional_complete_candidate` |
| `coverageMatrix.completionGate.passesRequestThreshold` | `true`（alias/effect 口径） |
| `coverageMatrix.completionGate.strictExactNamePass` | `false`（仅扬眉吐气蛊精确命中） |

未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段；`sourcePointers` 仅含 chapterId / paragraphId / startOffset / endOffset / summary，符合 quote-redacted 协议。未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地等高阶事实泄漏。未发现隐藏事实进入本包。

## 窗口分布

`pointerWindowTierCounts.vol1_late = 18`，`vol1_late_chapters_380_400` 与 `vol2_early_chapters_401_600` 命中数为 0。R2 的窗口扩展实质命中点全部集中在 `vol1_late_chapters_130_200`（含 ch_0132 / ch_0142 / ch_0168 / ch_0192 / ch_0193 / ch_0194）。第二卷 401-600 扫描没有给这 4 行新增任何可采用的源名/虫体外观锚。

## 4 只蛊 evidence 与 RebornG 处置

| # | 请求名 | 命中关键 | 类型 | RebornG 处置 |
|---|---|---|---|---|
| 1 | 漩涡蛊 | `旋踵蛊` x2 + `狂风蛊` x2 + `白色风暴` x3，全部 ch_0168 单段 | alias compound（"白凝冰组合招式效果"，不是漩涡蛊本体） | **保留 `atlas-pending/no-png`，不接受 alias 对齐** —— "旋踵"是脚踵概念，与"漩涡"语义差异明显；`白色风暴` 是组合招式效果显化，不是任一只蛊的本体；不构成命名对齐证据 |
| 2 | 烈风蛊 | `狂风蛊` x2 + `狂风` 通用词 + `白色风暴` x3 | alias single weak | **保留 `atlas-pending/no-png`，不接受 alias 对齐** —— `狂风` 是通用词，未必特指本蛊；`狂风蛊` 命中只有 2 次且均在组合招式上下文，证据强度不足以做命名对齐 |
| 3 | 雷眼蛊 | `电眼蛊` **9 次**（vol1_late）vs `雷眼蛊` 0 次；功能锚一致（侦察/破隐/借雷霆之力），confidence=high | alias single strong | **RebornG 决策：命名对齐，雷眼蛊 → 电眼蛊**（与 v0.14 R1 6 项命名硬约束同模式：`镇魔铁链蛊→镇魔铁索蛊` 9:0、`猪铁蛊→生铁蛊` 等）；本轮**不动 atlas/image-maps**，仅在本 review 与项目级 ledger 中登记别名硬约束，等待用户单点确认；body 仍未确认，命名对齐成立也不解锁标本本体生图 |
| 4 | 扬眉吐气蛊 | `扬眉吐气蛊` 精确命中 7 次，但全为 `元气`/`白色光圈`/`桥梁`/`双眼催动` 等气场或施法手势线索；ch_0192-0194 的 `双眼催动` 是「施术者的眼」不是虫的眉/眼 | concept/effect-only | **保留 `atlas-pending/no-png` 且明确为 concept-only**；扩展窗口仍未给出虫体本体；不强行生图，与 R1 包结论一致 |

**关键结论：本包 4 只蛊全部 `body_missing`；命名对齐是否接受不影响标本本体生图——4 只都不解锁 D4/D6 美术批次。**

## 人工复核：雷眼蛊 → 电眼蛊 命名对齐（待用户单点确认）

继承 v0.14 R1 6 项命名硬约束的处理方式，本轮新增 1 项命名对齐建议：

| # | MiroFish 请求名（候选，不入硬 canon） | 原著锚定名（RebornG 建议采用） | 第一卷锚 | 证据 |
|---|---|---|---|---|
| 1 | 雷眼蛊 | **电眼蛊** | ch_0132（白凝冰能力首次出现）+ ch_0168（组合招式段） | 别名命中 9 次 vs 请求名 0 次；`电芒`/`雷霆之威` 功能锚同步，confidence=high |

下游硬性约束（与 v0.14 R1 同口径，等用户确认后生效）：

- `doc/art/s0-qingmao-gu-atlas.md` 第 103 行 `B8 雷眼蛊` 应在下次 atlas 整理时把主中文名改为 `电眼蛊`，请求名作「曾用候选名」列；本轮先不改 atlas，避免与历史台账冲突。
- `src/data/image-maps.ts` 当前**没有** `雷眼蛊` 也**没有** `电眼蛊` key，所以无映射改动需求；未来生图时只能新增 `电眼蛊`，不得新增 `雷眼蛊`。
- `src/canon/qingmao-visual-assets.json` 不接受 `雷眼蛊` 任何条目。
- DeepSeek 上下文与玩家可见 UI 不接受 `雷眼蛊` 候选名，只接受 `电眼蛊`。

## 其余 3 只蛊处置

- 漩涡蛊：保留 `atlas-pending/no-png`；候选名 `漩涡蛊` 仍是 RebornG 旧 atlas 占位词，**不锚定原著任何蛊**；后续若需要更强证据可再发 R3 请求扩展到第三卷或更后窗口；当前不动。
- 烈风蛊：同漩涡蛊，保留 `atlas-pending/no-png`；候选名是 RebornG 旧 atlas 占位；不动。
- 扬眉吐气蛊：精确名命中但 body 未描述；**保留 `atlas-pending/concept-only`**；如未来美术专项需要"概念蛊气场卡"格式（不画虫体只画气场效果），需用户单独决策是否破例（默认拒绝）。

## QA 结论

2026-05-18 RebornG 机械复核：

- JSON 可解析，4 个 item 均为 `export_ready`。
- `reborngGate.runtimeAuthority` 全部为 `candidate_only`；`runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true` 全部成立。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 未发现高阶事实泄漏；ch_0192 / ch_0193 关于天鹤上人的上下文已被 MiroFish 收敛为"附近气场"摘要，未包含天鹤上人具体身份/能力/胜负细节，符合保守口径。
- 未发现隐藏事实进入本包。
- 1 项命名对齐建议（雷眼蛊→电眼蛊），其余 3 项保留 atlas-pending；不产生隔离项。

## 可吸收方式

允许进入：

- `candidate_pool`
- `art_prompt_seed`（仅作"效果/气场参考"，不作"虫体本体参考"）

不可直接进入：

- runtime truth
- DeepSeek authority
- player-visible hidden fact body
- 正式蛊师能力/伤害/掉落数值结论
- 正式蛊方公开发放
- `GU_IMAGE_MAP` 任何新增映射（4 只 body 未确认，全部 `atlas-pending`）
- `qingmao-visual-assets.json` 任何 entries 新增
- `s0-qingmao-gu-atlas.md` 第 101-103 / 123 行的「视觉 prompt seed」列改写（保留旧占位描述，待 R3 或本卷之后再决定）

## 下一步

1. 用户对 `雷眼蛊 → 电眼蛊` 命名对齐做单点确认（建议接受，证据强）；接受后，atlas 与 image-maps 的实际改动延期到 atlas 整理批次。
2. 4 只蛊均保留 `atlas-pending/no-png`；R2 不解锁本批次任何美术 PNG。
3. v0.15 D4/D6 实际收口数为：D4 仅旋风蛊已入库，4 只 atlas-pending；D6 已入库 3 只（御鹤蛊/至亲血虫/存息玉葬蛊），扬眉吐气蛊保持 atlas-pending。
4. 本轮**不发起 R3 包**——R2 已用过 vol1_late 与 vol2_early 两窗口都未取得 body 锚；R3 应等到 RebornG 美术专项确认是否真要给这 3 只蛊（漩涡/烈风/扬眉吐气）做 concept-only 气场卡；如果不做，永久保留 atlas-pending；如果做，下一轮请求应改请求方向（不再问"虫体外观"，改问"effect-only 气场卡构图建议"）。
5. 后续美术批次继续推进 v0.16 战斗场景与 v1.0 hero（不被本包阻塞）。

## 风险与硬边界

- 本包不进入 v0.14/v0.15 运行时；本轮不开放任何美术 PNG 入库，只允许进入候选与 effect-only prompt seed pool。
- 美术生成必须遵守 `doc/art/v014-to-v100-art-roadmap.md` 的硬边界：不得暗示 Immortal Gu、十转、永生、宿命蛊归属、凡人宝黄天交易；不得添加可读文字/水印/logo。
- `雷眼蛊` 候选名在用户确认 `电眼蛊` 命名对齐前不进入硬 canon；用户确认后则同步 v0.14 R1 6 项命名硬约束的处理方式，转写为「曾用候选名」并停用。
- ch_0192-0194 涉及天鹤上人的施法上下文，本包仅引用气场/姿态侧写，不得反向推断天鹤上人的身份/能力/胜负细节进入运行时或 DeepSeek 上下文。
