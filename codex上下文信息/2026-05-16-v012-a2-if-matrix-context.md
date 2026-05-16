# 2026-05-16 v0.12.0-a2 青茅低阶 IF 矩阵上下文

## 当前状态

- `v0.12.0-a2` 第一刀已完成。
- 目标：把 a1 的青茅事实卡和正史锚点转成玩家自由输入可裁决的低阶 IF 矩阵。
- 未新增存档字段，`SAVE_FORMAT_VERSION` 保持 `22`。
- 未开放逃离成功、新地域、阵营身份变化、NPC 生死、奖励、路线结论或 DeepSeek 正史写入权。

## 关键改动

- `src/canon/qingmao-low-rank-if-matrix.json`
  - 新增 5 个 IF 等级：`blocked`、`rumor_only`、`precondition_required`、`minor_deviation`、`major_deviation_candidate`。
  - 新增 7 个青茅低阶 IF 轴：`npc_attention`、`faction_pressure`、`resource_control`、`route_escape`、`hidden_fact_probe`、`local_survival`、`canon_anchor_pressure`。
  - 新增 cost types：资源、时间、身份风险、势力压力、NPC 记忆、追击风险、隐藏事实 probe 风险、正史锚点压力。
  - 新增代表性规则：九转/仙道阻断、无限元石阻断、杀白凝冰阻断、古月一代隐藏真相阻断、灵泉隐藏原因阻断、花酒传承位置阻断、跟踪方源公开观察、投靠白家重大 IF 候选、逃离青茅山准备链、山道侦查、花酒公开传闻、资源食料计划、狼潮巡逻。
- `src/engine/v012-qingmao-if-matrix.ts`
  - 新增只读 helper。
  - 可列出 axes/rules。
  - 可按 `rawText`、`targetRef`、`intentType` 匹配规则并按 priority 排序。
  - 可生成 `previewQingmaoLowRankIfAdjudication()` 预览，不写状态。

## 测试

已通过：

```powershell
npx vitest run src/canon/qingmao-low-rank-if-matrix.test.ts src/engine/v012-qingmao-if-matrix.test.ts --reporter=dot
```

结果：

- 2 个 test file 通过。
- 10 个 focused tests 通过。

全局回归：

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：111 个 test file、652 个测试通过。

## 后续方向

下一步建议进入 `v0.12.0-b1 route / supply / pursuit`：

- 使用 `precondition_escape_qingmao_route` 和 `precondition_scout_mountain_path` 作为入口。
- 第一刀只做路线候选、补给缺口、身份遮掩、追击压力。
- 不写逃离成功、新地点解锁、正式阵营变化或路线持久化状态。

## 停点

如果 b1 需要新增持久化 route state、正式解锁地点、逃离成功、阵营身份变化、NPC 生死或 DeepSeek 新权限，必须停下来让用户决策。
