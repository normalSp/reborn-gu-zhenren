# 2026-05-19 v0.18.0 启动审查交接

## 当前状态

- `v0.17.0` 已完成并完成远端验证。
- `v0.18.0` 启动审查与范围冻结草案已建立，主题为 `南疆路线与多区域承接`。
- 本轮没有改运行时代码，没有新增存档字段，没有扩大 DeepSeek 权限，没有新增后端/BFF，也没有开放正式路线、地点、阵营、奖励或 NPC 生死结果。

## 本轮新增/更新

- `指导大纲/v0.18.0/codex/00-总览/README.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-总体开发大纲.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-启动审查与范围冻结.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-小版本执行路线图.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-需求决策池.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-测试矩阵.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-真相源索引.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v0.18.0/codex/00-总览/v0.18.0-Git提交与推送计划.md`
- `指导大纲/vMiroFish/requests/v0.18.0/README.md`
- `指导大纲/vMiroFish/requests/v0.18.0/2026-05-19-v018-route-entry-state-and-milestones-pack.md`
- `指导大纲/vMiroFish/requests/v0.18.0/2026-05-19-v018-southern-border-low-rank-region-fact-cards-pack.md`
- `指导大纲/vMiroFish/requests/v0.18.0/2026-05-19-v018-post-qingmao-pressure-reaction-pack.md`
- 已同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` 与外部 `reborn-expert-council` skill。

## 建议主线

`v0.18.0` 建议承接长期路线中的 `南疆路线与多区域承接`，让玩家从青茅后续候选和战斗深化，走向真正的后青茅人生路线。

建议玩家心理模型：

`行动 -> 路线门槛/离开承诺 -> 本地路线裁决 -> 路线账本/区域状态 -> 后续行动与叙事回流`

## 建议小版本

| 小版本 | 建议主题 | 是否可直接做 |
|---|---|---|
| a1 | 路线/地点/存档/BFF 设计门禁 | 待用户审批 |
| a2 | MiroFish intake、字段表、测试矩阵 | 待用户审批与资料交付 |
| b1 | 青茅离开路线正式门槛样板 | 待 a1/a2 |
| b2 | 路线状态第一刀或候选承接 fallback | 需要用户明确是否允许 route/location/save 字段 |
| b3 | 南疆低阶公开事实卡与路线面板 | 需要 MiroFish preferred 包 |
| b4 | 既有行动账本影响补给/追击/身份压力 | 需要 MiroFish preferred 包 |
| b5 | 商队/散修/商家城外围公开入口边界 | 可沿用 v0.14 包，但需边界复核 |
| rc | 质量收束与 Player Advocate | b2 若写正式 route/location state，建议 80 轮；否则 60 轮 |

## 需要用户决策

1. 是否批准 `v0.18.0` 主线为 `南疆路线与多区域承接`。
2. 是否批准 `a1/a2/b1/b2/b3/b4/b5/rc` 的小版本切分。
3. 是否批准把三份 v0.18 MiroFish request 转交 MiroFish 线程 `019e207b-c55d-7e23-b450-efa7a054a165`。
4. 是否批准 a1 先做路线/地点/存档字段/BFF 设计审查，不进入 runtime。
5. 是否批准 `SAVE_FORMAT_VERSION = 23` 只作为 b2 前的候选决策点，而不是 a1/a2 自动执行。
6. 是否确认 v0.18 不做完整南疆地图、完整商家城、正式阵营转移、正式奖励、NPC 生死、后端/BFF、DeepSeek 新权限。
7. 是否批准 Player Advocate 轮次策略：普通玩家可见小版本 20 轮，设计/文档阶段可豁免；如果 b2 写正式 route/location state，rc 升级 80 轮，否则 60 轮。

## MiroFish 需求

本轮已写三份 request：

1. `v018_route_entry_state_and_milestones_pack`
2. `v018_southern_border_low_rank_region_fact_cards_pack`
3. `v018_post_qingmao_pressure_reaction_pack`

沿用资料：

- `v0.14.0` 的 `southern_border_low_rank_route_pack`
- `v0.14.0` 的 `shang_clan_city_public_entry_pack`

硬边界：

- `v014exit_30146f740a69` 仍为隔离项，不得进入玩家可见路线规则、UI 或 DeepSeek 上下文。
- MiroFish 输出仍只是候选材料，不是 canon 真相、runtime 权力来源或 DeepSeek 权力来源。

## Git 状态

- 开始时分支：`codex/v013-npc-faction-reaction`。
- 工作区存在美术资产相关历史脏文件与未跟踪文件，本轮不得 stage。
- 本轮只 stage 了 v0.18 文档、MiroFish v0.18 request、仪表盘、AGENTS、PROJECT-STATE 和本交接文件。
- 启动审查提交：`b8bf4f8 docs: 建立v0.18路线承接启动审查`。
- 已推送到 `origin/codex/v013-npc-faction-reaction`。
- GitHub Actions：`26048159455` 通过 deterministic quality gate。
