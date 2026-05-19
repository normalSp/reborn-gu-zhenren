# 2026-05-19 v1.1 规划启动上下文

## 本轮目标

用户要求先开专家团会讨论 v1.1/长期愿景，并批准：

- v1.1 主线选择 A：正式路线/地点/区域承接地基。
- 允许在设计门禁中严肃评估 `SAVE_FORMAT_VERSION = 23`。
- 先建立正式 `v1.1 至 v2.0 长期路线重整` 文档草案，再落到 v1.1 启动审查与范围冻结。
- 后续用户批准 D-003 至 D-010，要求细看外部参考如何供后续开发使用，且先不做 runtime 开工。

## 已完成文档

- `指导大纲/长期路线/RebornG-v1.1至v2.0长期路线重整草案.md`
- `指导大纲/v1.1.0/codex/00-总览/README.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-总体开发大纲.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-启动审查与范围冻结.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-小版本执行路线图.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-需求决策池.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-真相源索引.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-测试矩阵.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-Git提交与推送计划.md`
- `指导大纲/v1.1.0/codex/00-总览/v1.1.0-专家团启动会纪要.md`
- `指导大纲/长期路线/RebornG-外部活世界参考映射.md`
- `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-19-v110-three-pack-intake-review-summary.md`

## MiroFish request / intake

已写入：

- `指导大纲/vMiroFish/requests/v1.1.0/2026-05-19-v110-route-location-boundary-pack.md`
- `指导大纲/vMiroFish/requests/v1.1.0/2026-05-19-v110-southern-border-outer-edge-public-fact-pack.md`
- `指导大纲/vMiroFish/requests/v1.1.0/2026-05-19-v110-travel-supply-pursuit-identity-pressure-pack.md`

Codex 不能直接联系 MiroFish 线程；用户需要转交给 MiroFish 会话 `019e207b-c55d-7e23-b450-efa7a054a165`。收到包后必须先写 intake review。

当前用户已交付 v1.1 三包，路径：

- `指导大纲/vMiroFish/intake-reviews/v1.1.0/v110_route_location_boundary_pack_export_ready.json`
- `指导大纲/vMiroFish/intake-reviews/v1.1.0/v110_southern_border_outer_edge_public_fact_pack_export_ready.json`
- `指导大纲/vMiroFish/intake-reviews/v1.1.0/v110_travel_supply_pursuit_identity_pressure_pack_export_ready.json`

Intake 第一轮结论：三包 JSON 可解析，每包 8 项，共 24 项；未发现 forbidden quote/originalText/excerpt/verbatim/rawText/sourceText/正文/原文字段；仅可作为 candidate_pool/fact_card_draft/rule_draft/test_sample/deferred，不得直接进入 runtime/canon/DeepSeek。

## 同步文件

- `指导大纲/长期路线/README.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- 全局 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`

## 当前已批准

`v1.1.0-需求决策池.md` 中 D-001 至 D-010 已批准：

- 是否批准先做 a0/a1/a2 文档与设计门禁，再 runtime。
- 是否批准一次性转交 v1.1 三个 MiroFish request。
- 是否批准 v1.1 限制为青茅 -> 南疆早期外缘。
- 是否批准不做 BFF/backend、不扩大 DeepSeek 权限。
- a1 后再决定是否实际 bump `SAVE_FORMAT_VERSION = 23` 和写入正式 route/location 字段。

D-005/D-006 的批准含义是进入 a1 后二次确认具体字段方案，不是现在授权 runtime bump。

## 硬停

不得在用户进一步批准前：

- 实际提升 `SAVE_FORMAT_VERSION`。
- 新增 route/location/currentRegion 持久字段。
- 正式开放地点、阵营、奖励、NPC 生死。
- 扩大 DeepSeek 权限。
- 吸收未通过 intake 的 MiroFish 包。
- 做 BFF/backend、自动部署或公开发布承诺。
