# v0.13.0-b4 社会影响 UI 上下文交接

日期：2026-05-16
分支：`codex/v013-npc-faction-reaction`
状态：b4 第一刀完成；下一步建议进入 `v0.13.0-process-1`，随后进入 `v0.13.0-rc`。

## 本轮目标

用户批准 b4 方案 A：

- 把 v0.13 社会反应展示放进 `FreeGoalPanel`。
- 作为“社会影响 / 局势后续”折叠区。
- 只展示 engine 输出，不写 store、不新增存档字段、不升级 DeepSeek 权限。

## 完成内容

源码：

- `src/components/game/FreeGoalPanel.tsx`
  - 新增 `SocialImpactPanel`。
  - 在自由目标面板内展示：
    - `谁记住了你`
    - `势力态度`
    - `公开行动摘要`
    - `局势后续`
  - 使用当前 `livingWorldState` 和 `sceneSessionState.localActionLedger` 只读计算：
    - `buildQingmaoNpcMemoryProjection()`
    - `buildQingmaoFactionStanceProjection()`
    - `buildQingmaoPublicEventChronicle()`
    - `buildQingmaoSocialFollowups()`

测试：

- `tests/e2e/v013-social-impact-panel.spec.ts`
  - 从自由目标面板记录“逃离青茅山”。
  - 执行路线准备。
  - 执行局势反应桥。
  - 验证社会影响区出现 NPC 记忆、势力态度、公开行动摘要和局势后续。
  - 验证 UI 不泄露隐藏事实或正式奖励/投靠文案。

文档：

- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-b4-Player-Advocate可读性UI第一刀.md`
- 更新 v0.13 README、路线图、需求池、真相源、项目仪表盘。
- 更新 `AGENTS.md` 与 `PROJECT-STATE.md`。
- 更新 root `reborn-expert-council` skill 至 `0.1.58`，记录 b4 已完成。

## 验证

已通过：

- `npx tsc --noEmit --pretty false`
- `npm run test:e2e -- tests/e2e/v013-social-impact-panel.spec.ts`
- `npm test -- --reporter=dot`：121 个 test file、689 个测试通过。
- `npm run build`
- `npm run check:player-visible-copy`：238 个文件扫描通过。

建议 rc 前继续执行：

- `npm run check:production-preview`

## 边界

本轮没有：

- 新增持久化字段。
- 提升 `SAVE_FORMAT_VERSION`。
- 写入新的社会账本。
- 正式声望、通缉、招揽、投靠、任务、奖励。
- 地点解锁、阵营变化、NPC 生死。
- hidden fact id/body 展示。
- 方源隐藏因果、春秋蝉、重生/回溯泄露。
- DeepSeek 新写入权。
- 新增 MiroFish 包需求。

## Git / 推送状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 上游：`origin/codex/v013-npc-faction-reaction`
- 本交接文件将随 b4 提交一起提交。
- 阶段提交完成后需要推送到 origin，形成 b4 回滚点。

## 下一步

建议进入：

1. `v0.13.0-process-1`：GitHub Actions 远端首次运行与门禁复核。
2. `v0.13.0-rc`：质量收束。

需要停下来问用户的事项：

- branch protection。
- 自动部署 EdgeOne。
- PR 默认强制全量 Playwright / long e2e。
- 持久化社会账本。
- 命名 NPC runtime rule。
- 正式声望/通缉/招揽/任务网络。
