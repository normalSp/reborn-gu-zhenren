# MiroFish Request: v016_gu_dao_low_rank_ui_boundary_pack

requestId: `mirofish-request-2026-05-18-v016-gu-dao-low-rank-ui-boundary-pack`
targetPhase: `v0.16.0-b2 蛊道工作台第一刀`
blockingLevel: `preferred`
suggestedOutputName: `v016_gu_dao_low_rank_ui_boundary_pack_export_ready.json`

## Purpose

为 RebornG `v0.16.0-b2` 提供“蛊道工作台”的低阶术语、UI 分组、玩家可见边界和禁止暗示边界候选材料。

本包用于帮助 RebornG 把 `蛊虫 / 杀招 / 炼蛊 / 蛊材` 合并成 `蛊道` 工作台时，不把候选、传闻、残方、食料、材料、杀招、正式蛊方和高阶事实混成一团。

本包只作为候选材料，不是 canon 真相源，不是运行时权力来源，不授予 DeepSeek 任何新权限。

## Scope

请优先抽取或归纳与下列内容相关的 quote-redacted 候选项：

- 低阶蛊师阶段，一转至三转玩家能公开理解的 `蛊虫 / 杀招 / 炼蛊 / 蛊材 / 食料 / 残方 / 蛊方 / 元石 / 材料` 概念边界。
- 哪些内容适合在 UI 中作为 `已拥有`、`可观察`、`候选线索`、`残方线索`、`缺口`、`传闻`、`未开放` 展示。
- 低阶杀招与普通用蛊之间的 UI 区分：避免把任意蛊虫动作都包装成正式杀招。
- 炼蛊与残方边界：什么能作为低阶公开线索，什么必须保持 `review_required` 或 `hidden_ref_only`。
- 蛊材和食料边界：哪些是低阶公开资源类型，哪些只应作为候选或缺口，不应直接授予。
- 低阶玩家不应看到或不应误以为可获取的高阶术语、仙材、仙蛊、宝黄天、福地、尊者、十转、永生等边界。
- UI 文案允许表达的安全说法，例如“候选”“缺口”“线索”“未具备条件”“需本地裁决”，以及不应表达的说法，例如“已获得”“可购买”“可炼成”“正式解锁”。

## Suggested Item Types

- `gu_dao_ui_category_boundary`
- `low_rank_gu_visibility_rule`
- `killer_move_ui_boundary`
- `refinement_ui_boundary`
- `material_feeding_ui_boundary`
- `recipe_fragment_boundary`
- `high_rank_forbidden_implication`
- `ui_copy_safety_hint`
- `test_sample`

## Required Fields

每项至少包含：

- `id`：稳定 ASCII id。
- `category`：使用上方建议 item type 或等价分类。
- `summary`：RebornG 可读摘要，不含原文。
- `rankBand`：`rank_1` / `rank_2` / `rank_3` / `low_rank` / `high_rank_blocked` / `unknown`。
- `playerVisibility`：`public` / `limited_public` / `candidate_only` / `hidden_ref_only` / `review_required`。
- `recommendedUiGroup`：`owned_gu` / `killer_move` / `refinement` / `material` / `feeding` / `rumor` / `gap` / `locked` / `dev_only`。
- `allowedUiCopy`：短句数组，说明 UI 可以怎么表达。
- `forbiddenImplications`：短句数组，说明 UI 不能暗示什么。
- `sourcePointers`：章节或段落指针，不含原文。
- `confidence`。
- `reviewStatus`。
- `reborngGate`：
  - `runtimeAuthority: "candidate_only"`。
  - `allowedUse`: `candidate_pool`、`ui_boundary_draft`、`rule_draft`、`test_sample`、`deferred` 之一或多个。
  - `notGrantableByAI: true`。
  - `deepSeekVisible: false`，除非该项明确为 `public` 且 RebornG intake review 另行批准。
- 如果是 hidden boundary：
  - `hiddenRefOnly: true`。
  - `runtimeVisible: false`。
  - `deepSeekVisible: false`。
  - `requiresHumanCanonReview: true`。

## Forbidden Content

不得包含：

- 原著正文 quote。
- `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 长段原文复述。
- 正式运行时价格、奖励、材料发放、蛊虫发放、蛊方发放。
- 仙材、仙蛊、宝黄天交易、福地、尊者线索、十转、永生等作为低阶 UI 可用事实。
- 方源私密因果、春秋蝉、重生、前世、回溯等隐藏事实正文。
- DeepSeek 或 MiroFish 的 runtime authority。
- 隐藏事实正文出现在 player-visible 字段。

## Acceptance Criteria

- JSON 可解析。
- quote-like keys = 0。
- 每项都有 source pointers。
- 每项都有 review status。
- 每项都有 `reborngGate.runtimeAuthority = candidate_only`。
- hidden facts 全部 `hidden_ref_only`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 至少覆盖：
  - `蛊虫` UI 边界。
  - `杀招` UI 边界。
  - `炼蛊 / 残方 / 蛊方` UI 边界。
  - `蛊材 / 食料 / 材料` UI 边界。
  - 至少 8 条高阶/隐藏事实禁止暗示样本。
  - 至少 10 条可转为 RebornG 测试矩阵的 UI 误导样本。

## Handoff Message For MiroFish

```text
请产出 `v016_gu_dao_low_rank_ui_boundary_pack_export_ready.json`，用于 RebornG v0.16-b2 蛊道工作台第一刀。

目标：给 `蛊虫 / 杀招 / 炼蛊 / 蛊材` 合并为 `蛊道` 工作台提供低阶术语、UI 分组、玩家可见边界和禁止暗示边界。它只做 quote-redacted 候选材料，不是 canon，不是运行时权力来源。

请覆盖：低阶蛊虫、杀招 UI 边界、炼蛊/残方/蛊方边界、蛊材/食料/材料边界、高阶/隐藏事实禁止暗示、可转为测试矩阵的 UI 误导样本。

字段建议：id/category/summary/rankBand/playerVisibility/recommendedUiGroup/allowedUiCopy/forbiddenImplications/sourcePointers/confidence/reviewStatus/reborngGate。

禁止：原文 quote、originalText、excerpt、verbatim、rawText；正式价格/奖励/材料/蛊虫/蛊方发放；仙材仙蛊、宝黄天、福地、尊者、十转、永生作为低阶 UI 可用事实；春秋蝉/重生/方源私密因果等隐藏事实正文。

所有 item 的 runtimeAuthority 必须是 candidate_only。hidden boundary 只能 hiddenRefOnly，runtimeVisible=false，deepSeekVisible=false，requiresHumanCanonReview=true。
```
