# RebornG v0.12.0 Codex 当前入口

日期：2026-05-16
状态：`v0.12.0` 本地开发里程碑已完成，rc 质量收束通过。
用途：承接长期路线中 `v0.12：青茅山正史锚点与 IF 框架`，并把 v0.11 后续行动链纳入可执行小版本。

## 定位

`v0.12.0` 定位草案：`青茅山正史锚点与 IF 框架`。

`v0.11.0` 已完成本地开发里程碑：活世界地基、自由意图闸门、青茅最小活世界闭环和 rc 收束均已通过。
用户已批准本大纲推荐组合。`v0.12.0-a1` 已完成原著事实卡扩展 + 正史锚点表 + IF 分类 schema/test 第一刀；`v0.12.0-a2` 已完成青茅低阶 IF 矩阵第一刀；`v0.12.0-b1` 已完成 route/supply/pursuit 保守第一刀；`v0.12.0-b2` 已完成 NPC / faction reaction bridge 第一刀；`v0.12.0-b3` 已完成方源公开旁证询问第一刀；`v0.12.0-process-1` 已完成 GitHub/CI 工程门禁第一刀；`v0.12.0-rc` 已通过质量收束。

## v0.12 主线

长期路线对 v0.12 的定义是：

- 青茅山不再只是区域样板，而是有原著事实来源、正史压力和 IF 偏离空间。
- 系统能区分“正史硬事实”“玩家可见事实”“隐藏事实”“可 IF 偏离点”。
- 玩家可以侧翼参与青茅局势，但不能随口改写正史核心因果。

本轮采用专家团收束后的落地顺序：

1. 原著事实卡扩展、正史锚点表、可见/隐藏/IF 分类。
2. 青茅低阶 IF 矩阵：`npc_attention`、`faction_pressure`、`resource_control`、`route_escape`、`hidden_fact_probe`、`local_survival`、`canon_anchor_pressure`。
3. 青茅关键压力链第一轮：族学、三寨、资源、路线、狼潮前置压力；全部以原著抽取为准。
4. 青茅逃离路线的 route / supply / pursuit 系统，作为第一条正式行动链。
5. NPC / faction reaction bridge 第一刀，只做青茅局势轻量反应，不替代 v0.13 完整 NPC 系统。
6. 方源公开旁证询问，必须放在更多公开事实卡和隐藏门禁之后。
7. GitHub/CI 工程门禁作为 process 小刀穿插，不抢活世界主线。

## 当前权威文件

- `v0.12.0-总体开发大纲.md`
- `v0.12.0-启动审查与范围冻结.md`
- `v0.12.0-小版本执行路线图.md`
- `v0.12.0-需求决策池.md`
- `v0.12.0-真相源索引.md`
- `v0.12.0-项目仪表盘.md`
- `v0.12.0-候选专项池.md`
- `v0.12.0-MiroFish资料需求与交付协议.md`
- `v0.12.0-a1-原著事实卡与正史锚点表.md`
- `v0.12.0-a2-青茅低阶IF矩阵.md`
- `v0.12.0-b1-route-supply-pursuit第一刀.md`
- `v0.12.0-b2-NPC-faction-reaction-bridge第一刀.md`
- `v0.12.0-b3-方源公开旁证询问第一刀.md`
- `v0.12.0-process-1-GitHub-CI工程门禁.md`
- `v0.12.0-rc-质量收束记录.md`
- `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`

## 不进入 v0.12 的内容

除非用户另行批准，v0.12 不默认做：

- 完整青茅山大结局或全量狼潮主线。
- 直接开放青茅山外完整大地图。
- 白家正式投靠、阵营身份变更或声望体系完整开放。
- 方源隐藏因果、春秋蝉、重生/回溯信息泄露。
- NPC 生死、白凝冰重大 IF、古月一代等核心锚点改写。
- 奖励、蛊虫、蛊方、地点解锁由 DeepSeek 直接决定。
- 大规模可写多代理。
- 批量复制 Claude-Code-Game-Studios 模板。
- 全量 engine 目录重组。
- 全量 `src/types/index.ts` 拆分。
- 大时代开局。
- 蛊仙期大规模扩权。

## 与 v0.11 的关系

v0.11 已回答：

- 玩家自由意图如何被本地裁决。
- 世界如何记住玩家行为。
- 原著事实如何稳定成为真相源。
- 隐藏事实如何不泄露。

v0.12 强化：

- 正史硬事实、玩家可见事实、隐藏事实和可 IF 偏离点的运行时分类。
- 旧 v0.8 剧情锚点/IF 思想的青茅低阶化，不直接复用宿命战级别 IF 轴。
- 玩家长期目标如何拆成路线、补给、掩护、追击风险等可执行准备链。
- NPC 和势力如何对玩家行为产生可解释的公开反应。
- 方源相关调查如何只从公开旁证进入，不泄露隐藏事实。
- GitHub 级工程门禁。
- 更强的复盘和指标。
- 更清晰的决策记录。
- 更低上下文成本的 skill。
- 更稳的外部审查。

## 开工门禁

`v0.12.0-a1` 已完成：原著事实卡扩展 + 正史锚点表 + IF 分类 schema/test。

`v0.12.0-a2` 已完成第一刀：青茅低阶 IF 矩阵和代价，不直接复活 v0.8 宿命战/尊者级矩阵。

`v0.12.0-b1 route / supply / pursuit` 第一刀已完成。若后续继续扩大到新增持久化 route state、正式逃离成功或新地点解锁，必须先停下来让用户决策。

`v0.12.0-b2 NPC / faction reaction bridge` 第一刀已完成。若后续继续扩大到正式声望、阵营身份变化、NPC 生死/抓捕、追击成败、持久化 reaction state、地点解锁或 DeepSeek 权限扩张，必须先停下来让用户决策。

`v0.12.0-b3 方源公开旁证询问` 第一刀已完成。若后续继续扩大到正式追踪系统、抓捕/逃脱结果、方源轨迹变化、完整公开时间线或 hidden fact 展示，必须先停下来让用户决策。

`v0.12.0-process-1 GitHub/CI 工程门禁` 第一刀已完成。若后续继续扩大到 branch protection、自动发布、EdgeOne 自动部署、外部 runtime 依赖或强制 PR Playwright 全量门，必须先停下来让用户决策。

## MiroFish 门禁

进入涉及原著事实、IF、NPC 动机、势力压力、路线/补给/追击或隐藏事实的阶段前，必须先按 `v0.12.0-MiroFish资料需求与交付协议.md` 判断是否需要 MiroFish 候选包。

当前 b1/b2 请求均已完成：

- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-route-supply-pursuit-pack.md`
- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-faction-pressure-pack.md`

当前 b1/b2 主包已经交付并通过 intake review：

- 主包：`指导大纲/vMiroFish/v0.12.0/qingmao_route_supply_pursuit_pack_export_ready.json`
- review：`指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-route-supply-pursuit-pack-intake-review.md`
- 主包：`指导大纲/vMiroFish/v0.12.0/qingmao_faction_pressure_pack_export_ready.json`
- review：`指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-faction-pressure-pack-intake-review.md`

已吸收范围：b1 吸收 `routeCandidate`、`supplyRequirement`、`pursuitTrigger`；b2 吸收 `factionPressure` 与 `npcReactionCandidate` 为本地 rule draft。`hiddenFactRef` 仍延期到 hidden fact gate 或 b3。当前 Codex 线程不能直接联系 MiroFish 会话；后续需要新包时，必须让用户把 `requests/` 文件转交给会话 `019e207b-c55d-7e23-b450-efa7a054a165`。

当前 b3 请求已完成：

- 请求：`指导大纲/vMiroFish/requests/2026-05-16-fang-yuan-public-evidence-pack.md`
- 主包：`指导大纲/vMiroFish/v0.12.0/fang_yuan_public_evidence_pack_export_ready.json`
- review：`指导大纲/vMiroFish/intake-reviews/2026-05-16-fang-yuan-public-evidence-pack-intake-review.md`
- 目标：方源公开旁证询问，不泄露第三者玩家不可见的隐藏因果。
