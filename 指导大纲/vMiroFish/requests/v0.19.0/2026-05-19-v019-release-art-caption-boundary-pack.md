# MiroFish request: v019_release_art_caption_boundary_pack

请求日期：2026-05-19
RebornG 版本：v0.19.0
优先级：preferred/optional
用途：v1.0 hero 三件套、宣传截图、OG、短录屏、发布页素材的视觉和文案边界。

## 目标

请输出 quote-redacted JSON 包，帮助 RebornG 判断公开素材 caption、画面暗示和视觉主题是否会越界。

## 需要覆盖

- 青茅低阶蛊师阶段适合公开展示的视觉元素。
- 南疆早期路线、商队、散修、山路、外缘市场的安全视觉边界。
- 不应在 v1.0 素材中暗示的内容：仙蛊、宝黄天正式交易、尊者、永生、春秋蝉/重生、完整商家城、正式阵营加入、NPC 生死结论。
- 方源/白凝冰等角色如果出现在素材说明中的风险。
- 厚涂插画/图片感表达时应保留的蛊真人气质和禁止暗示。

## 输出格式要求

- 每项包含：`id`、`assetTheme`、`safeCaptionBoundary`、`forbiddenVisualImplication`、`safeMotifs`、`riskyMotifs`、`sourcePointers`、`recommendedUse`、`reviewStatus`。
- 不要输出 quote、originalText、excerpt、verbatim、rawText、sourceText。
- 不要生成图片，不要写最终发布文案。

## RebornG 吸收规则

此包只用于 `art_caption_boundary`、`release_manifest_check`、`test_sample`。公开文案和最终素材仍需用户批准。
