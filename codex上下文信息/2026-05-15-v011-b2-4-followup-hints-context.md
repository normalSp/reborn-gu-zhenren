# 2026-05-15 v0.11.0-b2-4 调查结果后续提示候选上下文

## 当前阶段

- 当前分支：`codex/v090-b1-world-action-protocol`
- remote：`origin git@github.com:normalSp/reborn-gu-zhenren.git`
- 当前开发线：`v0.11.0`
- 当前阶段：`v0.11.0-b2-4` 已完成
- 存档版本：`SAVE_FORMAT_VERSION = 22`
- DeepSeek 运行模型：`deepseek-v4-flash`

## 本轮目标

用户批准选 A：先做“调查结果推荐下一步行动候选”。

本轮严格限定为本地只读提示：

- 不新增正式行动。
- 不新增 `WorldActionCandidate`。
- 不写 store。
- 不新增存档字段。
- 不扩展 DeepSeek 权限。
- 不开放阵营变化、地点开放、NPC 生死、正史锚点变化或奖励。

## 代码变更

新增：

- `src/engine/v011-qingmao-investigation-followups.ts`
- `src/engine/v011-qingmao-investigation-followups.test.ts`

更新：

- `src/components/game/FreeGoalPanel.tsx`
- `tests/e2e/v011-free-goal-panel.spec.ts`

核心行为：

- `buildQingmaoInvestigationFollowUps()` 从 `livingWorldState` 派生只读提示。
- 白家调查成果可派生 `谨慎核对白家接触窗口`。
- 方源隐藏保护失败可派生 `暂缓深追方源，改走旁证调查`。
- 资源受保护内情可派生 `资源线暂走公开渠道`。
- UI 显示 `提示，不是正式行动`。
- UI 只显示来源数量，不显示隐藏 fact id。

## 文档与 Skill 同步

新增：

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-4-调查结果后续提示候选.md`

更新：

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-裁决样本矩阵.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 验证

已通过：

```powershell
npm test -- src/engine/v011-qingmao-investigation-followups.test.ts src/engine/v011-qingmao-visible-investigation.test.ts src/store/slices/livingWorldSlice.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts
npm run build
```

结果：

- focused unit：3 个 test file，15 个测试通过。
- TypeScript：通过。
- Playwright：3 个测试通过。
- build：通过；无 500KB+ chunk warning，仅有 Rolldown plugin timing 提示。

## Git 状态

本轮未提交、未推送。

原因：

- 当前本地分支名仍为旧阶段：`codex/v090-b1-world-action-protocol`。
- 工作区存在大量历史脏项与未跟踪文件。
- 为避免混入历史改动，本轮只记录 commit/push 状态，不执行 stage/commit/push。

后续如果要提交，建议先创建/切换到符合当前阶段的新分支，再只 stage v0.11.0 b2/b2-4 相关文件。

## 下一步需要用户决策

b2-4 已经完成“提示候选”，但提示仍不是正式行动。

下一步如继续 runtime 扩展，需要用户选择：

1. 升级白家接触窗口为正式行动候选。
2. 升级方源旁证调查为低风险公开调查行动。
3. 升级逃离青茅山为路线准备链。
4. 先做 b2 轻量复盘并进入 rc/后续版本规划。

任何选项只要涉及阵营归属、地点正式开放、NPC 生死、正史锚点、奖励、持久化字段或 DeepSeek 新权限，都必须再次停下来确认。
