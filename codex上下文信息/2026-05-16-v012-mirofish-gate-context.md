# 2026-05-16 v0.12 MiroFish 资料门禁上下文

## 当前状态

- 用户要求把 MiroFish 产包流程制度化。
- `v0.12.0-b1` MiroFish 资料门禁已通过 intake review，可进入保守 runtime first cut。
- 当前 Codex 线程不能直接联系 MiroFish 会话 `019e207b-c55d-7e23-b450-efa7a054a165`；需要用户转交请求文件。

## 已落地文件

- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-MiroFish资料需求与交付协议.md`
- `指导大纲/vMiroFish/README.md`
- `指导大纲/vMiroFish/requests/README.md`
- `指导大纲/vMiroFish/intake-reviews/README.md`
- `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`
- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-route-supply-pursuit-pack.md`
- `指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-route-supply-pursuit-pack-intake-review.md`

## Skill 更新

全局 skill 已更新：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- version: `0.1.51`
- 新增并强化 `MiroFish Intake Gate` 与 `MiroFish Proactive Loop`

门禁规则：

- 进入 canon facts、story anchors、IF branches、NPC motives、faction pressures、route/supply/pursuit、Fang Yuan public evidence、hidden facts 前，先判断 MiroFish 需求。
- 需求等级：`blocking`、`preferred`、`optional`、`not_needed`。
- 需要时在 `指导大纲/vMiroFish/requests/` 写请求文件。
- 需要时必须在用户可见回复中明确提出，让用户转交 MiroFish 会话。
- 产物进入 RebornG 前必须在 `指导大纲/vMiroFish/intake-reviews/` 写审查。
- MiroFish 输出不是 canon，不是 runtime authority，不得泄露 hidden fact body。
- 交付包通过 review 后，也只能进入候选池、fact-card draft、rule draft、test sample 或 deferred，不得直接进入 runtime truth。

## 当前 b1 请求

请求文件：

- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-route-supply-pursuit-pack.md`

目标：

- 为 `v0.12.0-b1 route / supply / pursuit 第一刀` 提供青茅山路线、补给、身份遮掩、追击压力、怀疑触发候选材料。

阻塞等级：

- `preferred`
- 如果要做原著具体路线/追击细节，升级为 `blocking`。

## 下一步

MiroFish 已交付 `qingmao_route_supply_pursuit_pack_export_ready.json`，intake review 已完成。

第一次完整对接流程已固化到 `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`。

review 结论：

- 17 项，35 source pointers，0 forbidden quote/originalText/excerpt/verbatim keys。
- routeCandidate / supplyRequirement / pursuitTrigger 可服务 b1 rule draft。
- factionPressure 延期到 b2 reaction bridge。
- hiddenFactRef 延期到 hidden fact gate 或 b3 方源公开旁证。

下一步可进入 b1 保守第一刀，但仍禁止新增持久化 route state、逃离成功、新地点解锁、奖励、阵营变化、NPC 生死或 DeepSeek 权限扩张。

## 后续主动提醒

- 进入 b2 reaction bridge 前，主动判断是否请求 `qingmao_faction_pressure_pack`。
- 进入 b3 方源公开旁证前，主动判断是否请求 `fang_yuan_public_evidence_pack`。
- 后续任何 canon/IF/NPC/faction/route/hidden-fact 阶段，必须在回复里明确 MiroFish 需求等级；需要包时由用户转交请求给会话 `019e207b-c55d-7e23-b450-efa7a054a165`。
