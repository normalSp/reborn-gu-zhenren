# MiroFish Request: Qingmao Route / Supply / Pursuit Pack

requestId: `mirofish-request-2026-05-16-qingmao-route-supply-pursuit-pack`
targetPhase: `v0.12.0-b1 route / supply / pursuit 第一刀`
blockingLevel: `preferred`
suggestedOutputName: `qingmao_route_supply_pursuit_pack_export_ready.json`

## Purpose

为 RebornG `v0.12.0-b1` 提供青茅山低阶“离山路线、补给、身份遮掩、追击压力、怀疑触发”的原著候选材料。

本包只作为 RebornG 候选材料，不是 canon 真相源，不是运行时权力来源。

## Scope

请优先抽取与下列内容相关的公开事实、候选压力和隐藏事实引用：

- 商队进入、停留、离开、路线、交易窗口。
- 青茅山山道、密林、临时藏身点、村寨之间移动风险。
- 离开青茅山可能需要的补给：元石、食物、蛊虫食料、低阶蛊材、酒/药/伪装资源。
- 族内或小组对低阶蛊师异常行动的怀疑、盘问、监视、追击。
- 商队、古月山寨、白家寨、熊家寨、角三小组、病蛇小组、家老等可能产生的公开压力。
- 玩家第三者视角能看到的路线/补给/追击条件。
- 如果涉及隐藏事实，只能输出 hidden ref，不输出隐藏事实正文给玩家可见字段。

## Required Fields

每项至少包含：

- stable id。
- category：建议为 `publicFact`、`routeCandidate`、`supplyRequirement`、`pursuitTrigger`、`factionPressure`、`hiddenFactRef` 之一。
- summary。
- visibility / playerVisibility。
- confidence。
- sourcePointers。
- review status。
- reborngGate。
- 如果是 route：需包含 `routeType`、`entryCondition`、`risk`、`blockedOutcome`。
- 如果是 supply：需包含 `resourceType`、`neededFor`、`scarcityOrCost`。
- 如果是 pursuit：需包含 `trigger`、`observer`、`likelyReaction`、`severity`。
- 如果是 factionPressure：需包含 `subject`、`pressureAxis`、`likelyReactions`。
- 如果是 hiddenFactRef：需包含 `hiddenRefOnly: true`、`runtimeVisible: false`、`deepSeekVisible: false`、`requiresHumanCanonReview: true`。

## Forbidden Content

不得包含：

- 原著正文 quote。
- `originalText`。
- `excerpt`。
- 长段原文复述。
- 逃离成功结论。
- 新地域正式解锁。
- 阵营身份变化。
- NPC 生死结论。
- 正式奖励、蛊虫、元石、材料、蛊方发放。
- DeepSeek 或 MiroFish 的 runtime authority。
- 隐藏事实正文出现在 player-visible 字段。

## Acceptance Criteria

- 主包 quote-like keys = 0。
- 每项都有 source pointers。
- 每项都有 review status。
- hidden facts 全部 `hidden_ref_only`。
- `runtimeAuthority` 必须是 `none` 或 `candidate_only`。
- `deepSeekVisible` 对 hidden facts 必须是 `false`。
- 至少覆盖：
  - 商队路线/窗口。
  - 山道或密林移动风险。
  - 补给需求。
  - 身份遮掩或异常行动怀疑。
  - 追击/盘查/监视触发。
  - 至少 2 个 faction/group pressure 主体。

## Handoff Message For MiroFish

请产出 `qingmao_route_supply_pursuit_pack_export_ready.json`，用于 RebornG v0.12-b1 的 route/supply/pursuit 第一刀评估。
它只做 quote-redacted 候选材料，不是 canon，不是运行时权力来源。
请不要输出原文 quote、逃离成功、新地图解锁、阵营变化、NPC 生死、奖励结论。
隐藏事实只能 hiddenRefOnly，并且 runtimeVisible/deepSeekVisible 都必须为 false。
