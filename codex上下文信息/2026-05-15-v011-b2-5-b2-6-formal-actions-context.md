# 2026-05-15 v0.11.0-b2-5/b2-6 正式行动与路线准备交接

## 当前阶段

`v0.11.0-b2-5` 和 `v0.11.0-b2-6` 已完成。

用户已同意专家团建议的 A -> B -> rc：

1. A：白家接触窗口正式行动。
2. B：逃离青茅山路线准备链。
3. 下一步进入 `v0.11.0-rc` 收束。

## 本轮源码变更

新增：

- `src/engine/v011-qingmao-bai-contact-window.ts`
- `src/engine/v011-qingmao-bai-contact-window.test.ts`
- `src/engine/v011-qingmao-escape-route-prep.ts`
- `src/engine/v011-qingmao-escape-route-prep.test.ts`

更新：

- `src/engine/v011-qingmao-investigation-followups.ts`
- `src/store/slices/livingWorldSlice.ts`
- `src/components/game/FreeGoalPanel.tsx`
- `src/store/slices/livingWorldSlice.test.ts`
- `tests/e2e/v011-free-goal-panel.spec.ts`

## 行为变化

### b2-5 白家接触窗口

白家后续提示从只读提示升级为可执行试探：

- UI 显示 `可执行试探`。
- 按钮为 `试探接触`。
- 引擎为 `resolveQingmaoBaiContactWindowAction()`。
- 走统一行动协议，`rewardPolicy = none`。
- 写入 `factionPressure/actionConsequences/localActionLedger/lastWorldActionReturnContext`。

明确不做：

- 不改 `currentFaction`。
- 不加声望。
- 不发奖励。
- 不开放地点。
- 不触发白凝冰重大 IF。

### b2-6 逃离青茅山路线准备

自由目标 `region:outside_qingmao` 目标卡出现 `准备路线` 按钮：

- 引擎为 `resolveQingmaoEscapeRoutePreparationAction()`。
- 需要先确认逃离青茅山目标。
- 走统一行动协议，`rewardPolicy = none`。
- 写入 `knownFacts/factionPressure/playerGoals/actionConsequences/localActionLedger/lastWorldActionReturnContext`。

明确不做：

- 不离开青茅山。
- 不开放青茅山外新地域。
- 不传送。
- 不判定逃离成功。
- 不发奖励。

## 文档同步

新增：

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-5-白家接触窗口正式行动.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-6-逃离青茅山路线准备链.md`

更新：

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-裁决样本矩阵.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 验证

已通过：

```powershell
npm test -- src/engine/v011-qingmao-bai-contact-window.test.ts src/engine/v011-qingmao-escape-route-prep.test.ts src/engine/v011-qingmao-investigation-followups.test.ts src/store/slices/livingWorldSlice.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts
```

结果：

- focused unit：4 个 test file，19 个测试通过。
- TypeScript：通过。
- Playwright：4 个测试通过。

待 rc 统一复跑：

- `npm test`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:production-preview`
- 必要时 `npm run test:e2e:long`

## Git 状态

- 本阶段未 commit。
- 本阶段未 push。
- 原因：当前工作区存在大量历史脏项与未跟踪文件，分支名仍是旧阶段 `codex/v090-b1-world-action-protocol`。
- 下一次提交建议只 stage v0.11 当前源码、测试、文档、PROJECT-STATE、skills 和本交接文件，避免混入历史无关改动。

## 下一步

进入 `v0.11.0-rc` 收束。

rc 不应继续新增玩法。若出现以下事项，必须停下来让用户决策：

- 势力归属变化。
- 地点正式开放或离开青茅山成功。
- NPC 生死或正史锚点变化。
- 新增持久化字段。
- DeepSeek 新权限。
- 方源旁证调查正式化。
