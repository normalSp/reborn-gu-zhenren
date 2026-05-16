# 2026-05-15 v0.11.0-b1-2 事实卡读取与裁决引用桥交接

## 当前结论

`v0.11.0-b1-2` 已完成。

本阶段把 b1 的青茅原著事实卡接成只读 helper，并让 `WorldIntentEngine` 输出 visible/hidden fact refs。隐藏事实仍是本地保护引用，不会进入 `deepSeekContract.visibleFactIds`。

## 代码变更

- `src/engine/v011-qingmao-fact-cards.ts`
  - 新增事实卡只读 helper。
  - 支持 visible/hidden 分类读取。
  - 支持安全 prompt context。
  - 支持把可见事实卡转成 `PlayerKnownFact` 草案。
  - 支持把隐藏事实卡转成 `HiddenFactRefState` 草案。
  - 支持从自由意图目标/文本映射到 visible/hidden fact refs。
- `src/engine/v011-world-intent-engine.ts`
  - `WorldIntentAdjudication` 新增 `factCardRefs`。
  - `deepSeekContract.visibleFactIds` 合并玩家已知事实和可见事实卡 ID。
  - 隐藏事实卡 ID 不进入 `deepSeekContract.visibleFactIds`。
- `src/engine/v011-qingmao-fact-cards.test.ts`
  - 新增 helper、红线化、映射和 living-world 草案测试。
- `src/engine/v011-world-intent-engine.test.ts`
  - 新增白家可见事实卡引用断言。
  - 新增方源隐藏事实卡不进入 DeepSeek 可见事实列表断言。

## 文档同步

- 新增 `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b1-2-事实卡读取与裁决引用桥.md`。
- 更新 v0.11 README、路线图、真相源索引、需求决策池。
- 更新 `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`。
- 更新根目录 `AGENTS.md`。
- 更新本地 skill：
  - `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
  - `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
  - `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 验证

已通过：

```powershell
npm test -- src/engine/v011-qingmao-fact-cards.test.ts src/engine/v011-world-intent-engine.test.ts
npx tsc --noEmit --pretty false
npm test
npm run build
```

全量单测结果：

- 103 个 test file 通过。
- 613 个测试通过。

构建结果：

- `npm run build` 通过。
- 无 500KB+ chunk warning。
- 仅有 Rolldown `PLUGIN_TIMINGS` 性能提示，非本阶段阻断。

## 当前边界

- 没有写 `livingWorldState`。
- 没有新增存档字段。
- `SAVE_FORMAT_VERSION` 仍为 `22`。
- 没有新增 DeepSeek 权限。
- 没有把事实卡变成奖励、地点、NPC 生死或剧情成功条件。
- 没有复制原著正文。

## 下一步建议

进入 `v0.11.0-b2` 前先做启动审查。

需要决策或至少明确的 b2 样本候选：

1. 白家接触/投靠尝试。
2. 可见范围调查。
3. 跟踪方源但隐藏事实保护。
4. 逃离青茅山路线准备。

若 b2 需要把事实卡写入 `knownFacts/hiddenFactRefs`，必须走 `applyLivingWorldPatch()`，并扩展 `v0.11.0-a3-裁决样本矩阵.md`。
