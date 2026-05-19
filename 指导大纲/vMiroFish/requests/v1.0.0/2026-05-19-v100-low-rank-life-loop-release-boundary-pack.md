# MiroFish Request: v100_low_rank_life_loop_release_boundary_pack

日期：2026-05-19
请求方：RebornG Codex
目标版本：v1.0.0
优先级：preferred before b2/b3 final wording

## 目标

请产出一个 quote-redacted 的候选材料包，用于 RebornG v1.0 的低阶蛊师 life loop 释出版闭环。

RebornG 需要材料帮助校正低阶蛊师的日常压力、修行、补给、炼养用、战斗、交易/委托边界，让玩家觉得自己在蛊世界里活着，而不是只看 AI 文本。

## 需要覆盖

1. 低阶蛊师的修行与资源压力。
2. 蛊虫养用、消耗、补给、短缺与取舍。
3. 低阶战斗、杀招、队伍/阵法使用边界。
4. 交易、委托、灰色交易、商队接触的公开边界。
5. 哪些行为在一转/二转阶段应该被拒绝、降级或转为前置条件。
6. 能变成 Player Advocate 测试样本的玩家意图。

## 输出格式

建议 JSON + report + summary。

每条候选项建议字段：

- `id`
- `category`: `cultivation` / `supply` / `gu_usage` / `combat` / `trade` / `commission` / `social_pressure` / `test_intent`
- `summary`
- `visibility`
- `sourcePointers`
- `confidence`
- `reviewStatus`
- `recommendedUse`: `candidate_pool` / `rule_draft` / `test_sample` / `copy_boundary` / `deferred`
- `releaseBoundary`

## 禁止内容

不得包含：

- 原文 quote/excerpt/verbatim/rawText/sourceText/originalText。
- 未审隐藏事实直接公开。
- 直接给玩家奖励、材料、蛊虫、地点、阵营、NPC 生死结论。
- 直接要求 DeepSeek 写正式事实。

## 交付目录

请交付到：

`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\intake-reviews\v1.0.0\`
