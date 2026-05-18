# v015_southern_border_market_caravan_trade_pack intake review

日期：2026-05-18
包名：`v015_southern_border_market_caravan_trade_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.15.0/v015_southern_border_market_caravan_trade_pack_export_ready.json`
目标阶段：`v0.15.0-b1/b2 supply preparation, caravan message, and public trade window`
结论：`accepted_for_v015_b1_b2_rule_draft`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 11 |
| sourcePointers | 10 |
| skipped | 0 |
| reviewStatus | `export_ready: 11` |
| forbidden key | 0 |
| high-rank leak terms | 0 |
| bad runtimeAuthority | 0 |
| bad hidden gate | 0 |
| completionGate | `conditional_complete_candidate` |

## 分类覆盖

`caravan_contact_window: 1`；`faction_attention_trigger: 3`；`market_window: 1`；`price_pressure_hint: 1`；`public_reason_requirement: 1`；`risk_factor: 1`；`social_cover_requirement: 1`；`supply_preparation: 1`；`trade_requirement: 1`

## request 覆盖

`caravan_contact: 9`；`supply_preparation: 3`；`market_window: 5`；`public_reason: 3`；`guarantee_boundary: 2`；`price_pressure_hint: 2`；`risk_factor: 2`；`faction_attention_trigger: 4`

## 可吸收方式

允许进入：`candidate_pool / rule_draft / test_sample / deferred`。

不可直接进入：runtime truth、DeepSeek authority、正式商队加入、完整坊市、商家城正式进入、正式交易价格表、正式奖励、阵营身份变化或 NPC 生死结论。

## caveat

`坊市/路引` 精确词面在 0001-0600 基础包中缺失；当前覆盖使用商队、客栈、店铺、盘问、担保等公开信号。该 caveat 不阻塞候选规则，但说明 v0.15 不应直接开放完整坊市/路引系统。

## v0.15 使用建议

- b1：用于“补给准备、递话、询价、公开理由、风险提示”的 read-only 或候选行动规则。
- b2：用于 Player Advocate 样本，验证玩家能理解为何不能自动加入商队、不能直接进入商家城、不能直接获得稳定市场价格。
- 后续：若要正式坊市/路引/商家城入口，应追加更窄 MiroFish request 或放入 v0.16+。

## 结论

该包是 v0.15 preferred request 的对应交付包，基础质量合格，可作为 v0.15 b1/b2 候选规则和测试样本来源。它不足以授权完整市场、正式商队加入或新地点解锁。
