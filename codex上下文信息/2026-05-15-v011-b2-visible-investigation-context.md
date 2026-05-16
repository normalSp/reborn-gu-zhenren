# 2026-05-15 v0.11.0-b2 可见范围调查第一刀交接

## 状态

`v0.11.0-b2` 第一刀、`v0.11.0-b2-2`、`v0.11.0-b2-3` 已完成，范围为 `可见范围调查 + 白家接触压力样本 + 方源隐藏保护失败样本`。

本刀把链路推进到：

```text
玩家调查意图 -> 本地裁决 -> 青茅事实卡可见/隐藏分流 -> living_world_engine patch -> 活世界账本 -> UI 回显
```

## 代码改动

- 新增 `src/engine/v011-qingmao-visible-investigation.ts`
  - `resolveQingmaoVisibleInvestigation()` 只处理 `investigate`。
  - 可见事实卡转成 `knownFacts`。
  - 隐藏事实卡只转成 `hiddenFactRefs` 或阻断，不输出摘要。
  - 输出 `actionConsequences` 与 `deepSeekVisibleFactIds`。
  - 命中白家公开事实时额外输出 `baijia_zhai` 的 `factionPressure` opportunity。
  - 命中方源隐藏事实时额外输出公开失败 `actionConsequences` 与谨慎 `npcMemories`，但不泄露隐藏因果。
- 更新 `src/store/slices/livingWorldSlice.ts`
  - 新增 `resolveVisibleInvestigationAction()`。
  - 写入只走 `applyLivingWorldPatch({ source: 'living_world_engine' })`。
- 更新 `src/components/game/FreeGoalPanel.tsx`
  - 新增 `执行调查` 按钮。
  - 调查类可行动意图显示 `knownFacts` 写入范围。
  - UI 只显示 visible fact ids，不显示 hidden ids 或 hidden summary。
- 更新 `src/e2e/installE2eHarness.ts`
  - e2e 摘要增加 `knownFactIds`、`hiddenFactRefIds`、`npcMemoryIds`、`factionPressureIds`、`actionConsequenceCount`。

## 测试

已通过：

```powershell
npm test -- src/engine/v011-qingmao-visible-investigation.test.ts src/store/slices/livingWorldSlice.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts
npm run build
```

结果：

- focused unit：2 个 test file，11 tests 通过。
- TypeScript：通过。
- Playwright：3 tests 通过。
- build：通过，无 500KB+ chunk warning。

## 文档同步

已更新：

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-可见范围调查第一刀.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-2-白家接触压力样本.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-3-方源隐藏保护失败样本.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-裁决样本矩阵.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- 本地 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`

## Git 状态

- 当前 remote：`origin git@github.com:normalSp/reborn-gu-zhenren.git`
- 当前分支名仍是历史名：`codex/v090-b1-world-action-protocol`
- 本阶段未 commit、未 push。
- 原因：当前工作区存在大量历史脏项与未跟踪文件，且分支名与 v0.11 阶段不匹配；直接大包提交风险高。
- 下一次提交建议范围：
  - `v0.11.0-process-1b` 仪表盘/Git 制度相关文档。
  - `v0.11.0-b2/b2-2/b2-3` 可见调查、白家 pressure、方源隐藏保护失败 runtime、tests、docs。
  - 不要混入历史清理、素材、旧测试存档或 `.codex` runtime state。

## 下一步建议

进入 `v0.11.0-b2-4`，但若选择涉及正史/IF 边界或新增持久字段，需要停下来让用户决策。

候选：

1. 调查结果推荐下一步行动候选：让 `knownFacts/actionConsequences/factionPressure/npcMemories` 变成可追踪的小行动建议。

必须停下来问用户的情况：

- 改势力归属。
- 开放正式地点/路线。
- 判定 NPC 生死。
- 改正史锚点。
- 新增持久字段。
- 扩大 DeepSeek 权限。
