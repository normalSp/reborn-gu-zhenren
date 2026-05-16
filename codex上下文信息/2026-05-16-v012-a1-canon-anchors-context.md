# 2026-05-16 v0.12.0-a1 原著事实卡与正史锚点表上下文

## 当前状态

- `v0.12.0-a1` 第一刀已完成。
- 目标：把青茅山原著事实卡、正史锚点、玩家可见/隐藏/IF 分类和 DeepSeek 权限边界落到本地 canon/test。
- 未新增存档字段，`SAVE_FORMAT_VERSION` 保持 `22`。
- 未开放逃离成功、新地域、阵营身份变化、NPC 生死、奖励、路线结论或 DeepSeek 正史写入权。

## 关键改动

- `src/canon/qingmao-canon-fact-cards.json`
  - 从 v0.11 的 8 张试点事实卡扩展为 v0.12 青茅基础事实包。
  - 新增 `v012Category`、`anchorRefs`、`ifAxes` 等字段。
  - 覆盖古月开窍/族学/资质、本命蛊、元石、月兰花、商队、狼潮、三寨战功、花酒传闻、白凝冰公开压力与隐藏风险、古月一代隐藏真相等。
- `src/canon/qingmao-canon-anchors.json`
  - 新增 10 个青茅正史锚点。
  - 每个锚点记录可见 fact、hidden refs、IF deviation points、低阶 IF 轴、允许玩家杠杆、保护结果、DeepSeek allowed/forbidden。
- `src/engine/v012-qingmao-canon-anchors.ts`
  - 新增只读锚点 helper。
  - 可按 anchor id 或 fact card id 生成 prompt-safe anchor context。
  - hidden guard 只输出 id/guard/protected outcomes/forbidden，不输出 hidden summary/body/source pointers。
- `src/engine/v011-qingmao-fact-cards.ts`
  - 扩展自由输入到 fact-card refs 的映射。
  - 覆盖商队逃离、狼潮/三寨战功、元石/月兰花/月光蛊、花酒传闻、白凝冰重大请求、古月一代/灵泉隐藏保护等。

## 测试

已通过：

```powershell
npx vitest run src/canon/qingmao-canon-fact-cards.test.ts src/canon/qingmao-canon-anchors.test.ts src/engine/v011-qingmao-fact-cards.test.ts src/engine/v012-qingmao-canon-anchors.test.ts --reporter=dot
```

结果：

- 4 个 test file 通过。
- 19 个 focused tests 通过。

全局回归：

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：109 个 test file、642 个测试通过。

## 后续方向

下一步建议进入 `v0.12.0-a2`：

- 青茅低阶 IF 矩阵。
- 偏离等级：`blocked`、`rumor_only`、`precondition_required`、`minor_deviation`、`major_deviation_candidate`。
- 代价模板：资源、时间、身份风险、势力压力、NPC 记忆、追击风险、隐藏事实 probe 风险。
- 必须新增测试样本，覆盖“逃离青茅山”“杀白凝冰”“查花酒传承”“揭露古月一代”“拿高阶蛊/大量元石”等极端输入。

## 停点

a2 可直接继续，但如果出现以下情况需要用户决策：

- 是否允许某类 IF 从 `precondition_required` 升为 `minor_deviation`。
- 是否允许 route 准备链开始写入新的持久化字段。
- 是否允许正式阵营身份变化、NPC 生死、路线成功或隐藏事实公开。
- 是否允许 DeepSeek 获得新的 runtime 权限。
