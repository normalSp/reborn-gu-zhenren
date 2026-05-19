# MiroFish Request: v100_public_release_copy_art_boundary_pack

日期：2026-05-19
请求方：RebornG Codex
目标版本：v1.0.0
优先级：blocking before public copy/art approval

## 目标

请产出一个 quote-redacted 的候选材料包，用于 RebornG v1.0 的公开文案、FAQ、截图/短录屏说明、hero caption 与 release art boundary。

重点不是写营销文案，而是给出“公开时哪些能说、哪些不能说、哪些容易误导玩家”的边界材料。

## 需要覆盖

1. v1.0 公开文案中可以安全描述的低阶蛊师体验。
2. 青茅山、南疆早期、路线承接、自由意图、NPC/势力回流的安全说法。
3. 不应承诺的内容：完整蛊界、完整五域、蛊仙期、尊者线、宝黄天正式交易、任意时代开局等。
4. hero 三件套、截图、短录屏 caption 的风险点。
5. 容易泄露隐藏事实或误导玩家的词汇/说法。
6. 公开 FAQ 的边界建议。

## 输出格式

建议 JSON + report + summary。

每条候选项建议字段：

- `id`
- `category`: `release_copy_boundary` / `faq_boundary` / `art_caption_boundary` / `hidden_fact_risk` / `overpromise_risk` / `safe_wording_candidate`
- `summary`
- `visibility`
- `sourcePointers`
- `confidence`
- `reviewStatus`
- `recommendedUse`: `copy_boundary` / `art_caption_boundary` / `test_sample` / `deferred`
- `riskTags`

## 禁止内容

不得包含：

- 原文 quote/excerpt/verbatim/rawText/sourceText/originalText。
- 直接可发布文案终稿。
- 隐藏事实明示。
- 未开放功能承诺。
- 把 MiroFish 候选结论写成 RebornG 运行时事实。

## 交付目录

请交付到：

`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\intake-reviews\v1.0.0\`
