# v0.16.0 MiroFish Requests

日期：2026-05-18
请求方：RebornG v0.16.0 启动前置
主题：系统收束、UI 减法与权威归并

## 结论

`v0.16.0` 主线不需要 blocking MiroFish 包。

原因：v0.16 的主要工作是 UI 入口合并、面板归并、调试入口迁移、旧系统权威归并和测试门禁，不新增原著事实、隐藏事实、NPC/势力规则、路线事实或 IF 规则。

但为了降低后续返工，建议向 MiroFish 提前请求两个 preferred 包：

| 文件 | 建议输出名 | 优先级 | 用途 |
|---|---|---|---|
| `2026-05-18-v016-gu-dao-low-rank-ui-boundary-pack.md` | `v016_gu_dao_low_rank_ui_boundary_pack_export_ready.json` | preferred | 支持 `v0.16-b2 蛊道工作台` 的术语、分组、低阶可见性和禁止暗示边界 |
| `2026-05-18-v016-high-tier-scene-gating-boundary-pack.md` | `v016_high_tier_scene_gating_boundary_pack_export_ready.json` | preferred | 支持 `v0.16-b3 高阶/调试入口场景化`，避免传承、宿命、终局、商会等入口误导玩家 |
| `2026-05-18-v016-battle-scene-composition-anchor-pack.md` | `v016_battle_scene_composition_anchor_pack_export_ready.json` | optional/art | 美术构图锚点包，不阻塞 v0.16 主线；可服务后续战斗素材/构图 contract |

## 不需要新增的包

本轮暂不新增：

- NPC/势力反应包：优先复用 v0.13 的 NPC/faction/public chronicle packages 和本地 authority map。
- 经济/补给/炼养用包：优先复用 v0.15 的 economy/refinement/market/black-market packages 和本地 authority map。
- route/supply/pursuit 包：v0.16 不开放正式路线，不需要新 route 包。
- Fang Yuan public evidence 包：v0.16 不新增方源旁证规则，不需要新包。

## 使用口径

这些 request 交给 MiroFish 线程 `019e207b-c55d-7e23-b450-efa7a054a165`。

MiroFish 输出只作为 RebornG 候选材料，不是 canon 真相源，不是运行时权力来源，不是 DeepSeek 权限来源。

所有交付包必须 quote-redacted：

- 不要原著正文。
- 不要 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 字段。
- 不要长段原文复述。
- 隐藏事实只能 hidden ref，不输出隐藏正文。
- 不输出正式奖励、蛊虫、蛊方、材料发放、阵营转移、地点解锁、NPC 生死或任务成功结论。

## RebornG 吸收边界

拿到包后，RebornG 必须先写 intake review，才能把内容重写成项目-owned：

- `candidate_pool`
- `rule_draft`
- `ui_boundary_draft`
- `test_sample`
- `deferred`

不得直接进入：

- runtime truth
- canon authority
- DeepSeek visible authority
- player-visible hidden fact body
- formal reward/task/location/faction/NPC-life conclusion
