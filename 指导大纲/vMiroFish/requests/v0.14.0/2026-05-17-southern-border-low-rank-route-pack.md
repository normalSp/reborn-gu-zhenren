# MiroFish Request: southern_border_low_rank_route_pack

日期：2026-05-17
请求方：RebornG v0.14.0
优先级：preferred

## 目标

请产出 quote-redacted JSON 包，供 RebornG 评估青茅之后的南疆低阶路线候选。重点是低阶蛊师能接触到的商队、山路、散修、坊市、初级落脚点，不要展开完整高阶世界。

## 需要覆盖

- 南疆低阶蛊师离开本地山寨后的合理落脚方向。
- 商队随行、递话、交易窗口、路引/担保/代价。
- 山路逃离、补给、野外风险、追击压力。
- 散修过渡、临时坊市、低阶资源机会。
- 与低阶蛊师身份、资源、关系有关的路线限制。

## 输出限制

- 不要原文正文。
- 不要 quote、originalText、excerpt、verbatim 字段。
- 不要开放商家城完整系统。
- 不要开放蛊仙、高阶宝黄天、仙材、仙蛊等内容。

## 建议 item 类型

- `route_candidate`
- `public_entry`
- `supply_requirement`
- `social_cover_requirement`
- `low_rank_market_hint`
- `risk_factor`

## RebornG 使用边界

该包只可进入候选池、规则草案和测试样本。RebornG 本地 canon/engine/tests 决定是否吸收。
