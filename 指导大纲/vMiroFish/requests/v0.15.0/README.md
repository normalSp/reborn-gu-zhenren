# v0.15.0 MiroFish Requests

日期：2026-05-18
请求方：RebornG v0.15.0 启动审查
主题：低阶蛊师经济、补给、炼养用深循环

## 使用口径

这些 request 交给 MiroFish 线程 `019e207b-c55d-7e23-b450-efa7a054a165`。

MiroFish 输出只作为 RebornG 候选材料，不是 canon 真相源，不是运行时权力来源，不是 DeepSeek 权限来源。

所有交付包必须 quote-redacted：

- 不要原著正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim` 字段。
- 不要长段原文复述。
- 隐藏事实只能 hidden ref，不输出隐藏正文。
- 不输出正式奖励、蛊虫、蛊方、材料发放、阵营转移、地点解锁、NPC 生死或任务成功结论。

## 本批 request

| 文件 | 建议输出名 | 优先级 | 用途 |
|---|---|---|---|
| `2026-05-18-v015-low-rank-economy-refinement-feeding-pack.md` | `v015_low_rank_economy_refinement_feeding_pack_export_ready.json` | blocking | v0.15 a1/a2 经济、炼蛊、喂养设计门禁和 canon/schema |
| `2026-05-18-v015-southern-border-market-caravan-trade-pack.md` | `v015_southern_border_market_caravan_trade_pack_export_ready.json` | preferred | v0.15 b1/b2 补给准备、商队递话、坊市/商队交易窗口 |
| `2026-05-18-v015-low-rank-black-market-commission-boundary-pack.md` | `v015_low_rank_black_market_commission_boundary_pack_export_ready.json` | optional/later | v0.15 后段或 v0.16+ 黑市、委托、灰色交易边界 |

## RebornG 吸收边界

拿到包后，RebornG 必须先写 intake review，才能把内容重写成项目-owned：

- `candidate_pool`
- `rule_draft`
- `fact_card_draft`
- `test_sample`
- `deferred`

不得直接进入：

- runtime truth
- canon authority
- DeepSeek visible authority
- player-visible hidden fact body
- formal reward/task/location/faction/NPC-life conclusion

