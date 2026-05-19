# MiroFish request: v019_public_canon_boundary_pack

请求日期：2026-05-19
RebornG 版本：v0.19.0
优先级：preferred
用途：v1.0 前公开文案、FAQ、版本说明、player-visible-copy 的原著/隐藏事实边界。

## 目标

请基于已审样本，输出一个 quote-redacted JSON 包，帮助 RebornG 判断公开文案中哪些说法安全、哪些会暗示隐藏事实或未开放高阶事实。

## 需要覆盖

- 青茅山公开事实边界。
- 青茅后续南疆早期路线公开表达边界。
- 商队、散修、商家城外缘的公开口径。
- 方源相关公开旁证可说与不可说。
- 白凝冰、三寨、灵泉、古月一代等高风险事实的公开/隐藏分类。
- 禁止公开承诺的高阶内容：仙蛊、宝黄天正式交易、尊者、永生、宿命大战、完整商家城等。

## 输出格式要求

- JSON 主包 + report + 简短说明。
- 每项包含：`id`、`category`、`safePublicSummary`、`forbiddenImplication`、`visibility`、`sourcePointers`、`reviewStatus`、`recommendedUse`。
- 不要输出 quote、originalText、excerpt、verbatim、rawText、sourceText。
- hidden 内容只能以 hidden_ref 或 redline 描述，不要写隐藏正文。

## RebornG 吸收规则

此包不是 canon truth、不是 runtime authority、不是 DeepSeek authority。RebornG 只会将其作为 `copy_boundary`、`test_sample` 或 `deferred`。
