# MiroFish Request: shang_clan_city_public_entry_pack

日期：2026-05-17
请求方：RebornG v0.14.0
优先级：optional，可延后

## 目标

请产出 quote-redacted JSON 包，供 RebornG 远期评估商家城公开入口候选。当前只需要入口条件和公开层路线，不需要完整商家城系统。

## 需要覆盖

- 低阶蛊师可能听闻或接触商家城路线的公开途径。
- 商队、担保、交易、身份、路费、风险。
- 进入商家城前可能需要的公开条件。
- 不涉及隐藏事实正文和高阶内幕。

## 输出限制

- 不要原文正文。
- 不要 quote、originalText、excerpt、verbatim 字段。
- 不要输出完整城市系统。
- 不要输出正式任务、奖励、阵营身份变化。

## 建议 item 类型

- `public_entry`
- `route_candidate`
- `entry_requirement`
- `risk_factor`
- `deferred_city_system_note`

## RebornG 使用边界

该包只用于远期 candidate_pool、rule_draft 和 test_sample。v0.14 不默认开放完整商家城。
