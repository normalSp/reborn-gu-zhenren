# MiroFish Request: v100_qingmao_southern_border_continuity_pack

日期：2026-05-19
请求方：RebornG Codex
目标版本：v1.0.0
优先级：blocking before b1 runtime absorption

## 目标

请产出一个 quote-redacted 的候选材料包，用于 RebornG v1.0 的“青茅山到南疆早期路线连续体验”。

RebornG 需要的是原著事实、公开压力、隐藏边界、IF 偏离代价的候选材料，不需要原文摘录，不需要 runtime 代码，不需要直接结论替 RebornG 决策。

## 需要覆盖

1. 青茅山后续离开/逃离/滞留相关的公开可见压力。
2. 南疆早期路线承接的公开锚点和低阶蛊师可见环境。
3. 路线选择可能涉及的补给、身份、追索、势力风险。
4. 玩家侧翼参与时可以看见的事实，和不能看见的隐藏事实。
5. IF 偏离点：哪些可以轻微偏离，哪些需要高代价，哪些 v1.0 不应开放。
6. 极端意图样本：想直接进商家城核心、投靠强势势力、追踪关键人物、绕开青茅后果。

## 输出格式

建议 JSON + report + summary。

每条候选项建议字段：

- `id`
- `category`
- `summary`
- `visibility`: `public` / `player_visible` / `hidden_ref_only` / `deferred`
- `sourcePointers`
- `confidence`
- `reviewStatus`
- `ifBoundary`
- `riskTags`
- `recommendedUse`: `candidate_pool` / `rule_draft` / `test_sample` / `deferred`

## 禁止内容

不得包含：

- `quote`
- `originalText`
- `excerpt`
- `verbatim`
- `rawText`
- `sourceText`
- 原文大段复述
- 直接 runtime 规则
- 直接公开文案
- 直接写成 canon 真相源

## 交付目录

请交付到：

`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\intake-reviews\v1.0.0\`

Codex 会先做 intake review，合格后只吸收为 RebornG-owned candidate/rule/test material。
