# MiroFish Request: v016_high_tier_scene_gating_boundary_pack

requestId: `mirofish-request-2026-05-18-v016-high-tier-scene-gating-boundary-pack`
targetPhase: `v0.16.0-b3 高阶/调试入口场景化`
blockingLevel: `preferred`
suggestedOutputName: `v016_high_tier_scene_gating_boundary_pack_export_ready.json`

## Purpose

为 RebornG `v0.16.0-b3` 提供高阶入口和场景化入口的边界候选材料，重点服务 `传承 / 宿命 / 终局 / 商会` 这些旧入口从常驻底栏迁出后的显示规则。

本包用于避免 UI 误导玩家：一转刚开窍不应因为看到某个按钮，就以为能直接获得传承、改写宿命、进入终局、接触高阶商会或打开宝黄天级交易。

本包只作为候选材料，不是 canon 真相源，不是运行时权力来源，不授予 DeepSeek 任何新权限。

## Scope

请优先抽取或归纳与下列内容相关的 quote-redacted 候选项：

- `传承` 类入口：低阶玩家可见的传闻、线索、考验、遗留痕迹，与不可直接开放的正式传承、隐藏洞府、高阶遗产边界。
- `宿命` 类入口：低阶玩家可感知的压力、命运感、风险提示，与不可玩家可控的宿命、天意、高阶因果、尊者级棋局边界。
- `终局` 类入口：低阶玩家可看到的阶段目标、逃离/生存/成长目标，与不可提前展示的结局、最终命运、正史核心结果边界。
- `商会 / 市场 / 商队` 类入口：低阶可见的商队、坊市、交易窗口、递话机会，与不可直接开放的宝黄天、仙材、仙蛊、高阶跨域交易边界。
- `青茅 / 凡战 / 群像 / 大阵` 等演示/调试入口：哪些可作为开发抽屉或回顾入口，哪些不应出现在正式玩家底栏。
- UI 显示状态建议：`hidden`、`locked`、`rumor_only`、`scene_only`、`dev_only`、`review_only`、`available_candidate`。
- 可转为测试矩阵的误导样本：玩家看到入口后误以为已解锁地点、奖励、阵营、NPC 生死、隐藏事实或高阶事实。

## Suggested Item Types

- `scene_gated_entry_boundary`
- `inheritance_entry_boundary`
- `fate_entry_boundary`
- `ending_entry_boundary`
- `market_entry_boundary`
- `debug_demo_entry_boundary`
- `high_rank_forbidden_implication`
- `low_rank_safe_ui_copy`
- `player_misread_test_sample`

## Required Fields

每项至少包含：

- `id`：稳定 ASCII id。
- `entryKey`：`inheritance` / `fate` / `ending` / `market` / `qingmao_demo` / `battle_demo` / `crowd_demo` / `formation_demo` / `other`。
- `category`：使用上方建议 item type 或等价分类。
- `summary`：RebornG 可读摘要，不含原文。
- `lowRankVisibility`：`hidden` / `locked` / `rumor_only` / `scene_only` / `dev_only` / `review_only` / `available_candidate`。
- `allowedUiCopy`：短句数组，说明 UI 可以怎么表达。
- `forbiddenImplications`：短句数组，说明 UI 不能暗示什么。
- `hardStopConditions`：需要 RebornG 停下来让用户决策或后续版本处理的条件。
- `playerMisreadRisk`：`low` / `medium` / `high`。
- `sourcePointers`：章节或段落指针，不含原文。
- `confidence`。
- `reviewStatus`。
- `reborngGate`：
  - `runtimeAuthority: "candidate_only"`。
  - `allowedUse`: `candidate_pool`、`ui_boundary_draft`、`rule_draft`、`test_sample`、`deferred` 之一或多个。
  - `notGrantableByAI: true`。
  - `deepSeekVisible: false`，除非该项明确为 `public` 且 RebornG intake review 另行批准。
- 如果涉及隐藏事实：
  - `hiddenRefOnly: true`。
  - `runtimeVisible: false`。
  - `deepSeekVisible: false`。
  - `requiresHumanCanonReview: true`。

## Forbidden Content

不得包含：

- 原著正文 quote。
- `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。
- 长段原文复述。
- 正式传承位置、隐藏洞府正文、关键人物隐藏身份正文、方源私密因果正文。
- 春秋蝉、重生、前世、回溯等隐藏事实正文。
- 仙蛊、仙材、福地、宝黄天、尊者、十转、永生作为低阶可用入口。
- 正式地点解锁、阵营转移、任务奖励、NPC 生死、终局结论。
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
  - `传承` 入口边界。
  - `宿命` 入口边界。
  - `终局` 入口边界。
  - `商会 / 市场 / 商队` 入口边界。
  - `青茅 / 凡战 / 群像 / 大阵` 开发/演示入口边界。
  - 至少 12 条 player misread test samples。
  - 至少 10 条 forbidden implication samples。

## Handoff Message For MiroFish

```text
请产出 `v016_high_tier_scene_gating_boundary_pack_export_ready.json`，用于 RebornG v0.16-b3 高阶/调试入口场景化。

目标：给 `传承 / 宿命 / 终局 / 商会` 以及 `青茅 / 凡战 / 群像 / 大阵` 等旧入口迁出正式底栏提供 quote-redacted 边界候选，避免低阶玩家看到按钮后误以为已获得传承、能改宿命、进入终局、打开高阶商会/宝黄天交易或正式解锁地点/奖励/阵营/NPC 生死。

请覆盖：传承入口边界、宿命入口边界、终局入口边界、商会/市场/商队入口边界、开发/演示入口边界、player misread test samples、forbidden implication samples。

字段建议：id/entryKey/category/summary/lowRankVisibility/allowedUiCopy/forbiddenImplications/hardStopConditions/playerMisreadRisk/sourcePointers/confidence/reviewStatus/reborngGate。

禁止：原文 quote、originalText、excerpt、verbatim、rawText；正式传承位置、隐藏洞府正文、关键人物隐藏身份正文、方源私密因果正文；春秋蝉/重生/前世/回溯正文；仙蛊仙材、福地、宝黄天、尊者、十转、永生作为低阶可用入口；正式地点/阵营/奖励/NPC 生死/终局结论。

所有 item 的 runtimeAuthority 必须是 candidate_only。hidden boundary 只能 hiddenRefOnly，runtimeVisible=false，deepSeekVisible=false，requiresHumanCanonReview=true。
```
