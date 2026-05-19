# MiroFish request: v019_representative_playthrough_anchor_pack

请求日期：2026-05-19
RebornG 版本：v0.19.0
优先级：preferred
用途：v1.0 代表性玩家路径、长测矩阵和 Player Advocate 大走查。

## 目标

请输出 quote-redacted JSON 包，帮助 RebornG 设计 v1.0 前的代表性游玩路径锚点。重点不是补剧情正文，而是标出公开锚点、压力点、可见事实、隐藏事实边界和 IF 风险。

## 建议路径

- 古月/青茅低阶开局，走族学、巡山、补给、战斗、路线准备。
- 原创角色尝试逃离青茅山，寻找商队或散修路线。
- 玩家试图调查方源，只能得到公开旁证或失败后果。
- 玩家试图投靠白家或接近白凝冰，只能得到前置与风险。
- 玩家试图进入商家城外缘，但不开放完整城市。
- 极端目标：九转蛊、盗天传承、宝黄天交易、杀关键 NPC。

## 输出格式要求

- 每项包含：`id`、`pathLabel`、`publicAnchorSummary`、`pressurePoint`、`hiddenBoundaryRef`、`ifRisk`、`sourcePointers`、`recommendedTestUse`、`reviewStatus`。
- 不要输出 quote、originalText、excerpt、verbatim、rawText、sourceText。
- 不要给正式剧情结论、奖励、地点解锁、NPC 生死。

## RebornG 吸收规则

此包只用于 `test_sample`、`playthrough_anchor_draft`、`Player Advocate scenario`。不得直接变成 runtime canon 或 DeepSeek 上下文。
