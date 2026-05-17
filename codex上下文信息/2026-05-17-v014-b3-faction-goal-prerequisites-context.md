# 2026-05-17 v0.14.0-b3 阵营目标前置条件展示上下文

## 当前阶段

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v0.14.0-b3 阵营目标前置条件展示`
- 状态：本地质量门已通过，待提交、推送和远端 CI
- MiroFish：`not_needed`
- SAVE_FORMAT_VERSION：`22`，本阶段未新增持久字段
- DeepSeek：`deepseek-v4-flash`，本阶段未改 prompt/schema/model/context-builder

## 实现内容

新增：

- `src/engine/v014-qingmao-faction-goal-prerequisites.ts`
- `src/engine/v014-qingmao-faction-goal-prerequisites.test.ts`
- `tests/e2e/v014-faction-goal-prerequisites.spec.ts`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-b3-阵营目标前置条件展示.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-b3-Player-Advocate-20轮走查记录.md`

修改：

- `src/components/game/FreeGoalPanel.tsx`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- `指导大纲/v0.14.0/codex/00-总览/README.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-总体开发大纲.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-小版本执行路线图.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-需求决策池.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-真相源索引.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-Git提交与推送计划.md`

## 行为边界

`buildQingmaoFactionGoalPrerequisites()` 只读输出阵营/身份目标前置卡：

- `白家接触前置`
- `商队接触前置`
- `商家城公开入口前置`
- `散修身份过渡前置`

它不会：

- 写 store
- bump save format
- 改阵营
- 写声望/通缉/招揽/任务/奖励
- 开放商家城或新地点
- 判定 NPC 生死、追捕、抓捕
- 暴露 hidden fact
- 扩张 DeepSeek 权限

## 验证

已通过：

```powershell
npm test -- src/engine/v014-qingmao-faction-goal-prerequisites.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v014-faction-goal-prerequisites.spec.ts
npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-b3-Player-Advocate-20轮走查记录.md" 20
npm test -- --reporter=dot
npm run build
npm run check:player-visible-copy
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果：

- focused unit：1 个 test file，4 个测试通过。
- TypeScript：通过。
- Playwright：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，1 个困惑轮次，通过。
- full unit：125 个 test file，707 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- player-visible-copy：243 个文件扫描通过。
- runtime assets：131 个文件，0 zero-byte。
- Qingmao assets：10 entries，active=4。
- production-preview smoke：通过。

## 待收束

明确 stage 范围，提交：

```text
feat: 展示v0.14阵营目标前置条件
```

推送后等待 GitHub Actions 通过，并将 run id 回填到：

- `v0.14.0-Git提交与推送计划.md`
- `v0.11.0-项目仪表盘.md`
- `PROJECT-STATE.md`
- `AGENTS.md`
- 本上下文文件或新增远端验证上下文

## 已知历史脏项

不要 stage：

- `doc/art/s0-qingmao-art-roadmap.md`
- `.cursor/`
- `RebornG_codebuddy.zip`
- `artifacts/`
- `bgm/`
- `doc/art/style-lock/`
- `doc/art/v014-to-v100-art-roadmap.md`
- `指导大纲/vMiroFish/requests/v0.14.0/2026-05-17-qingmao-unfilled-gu-appearance-pack.md`
- `指导大纲/大方向/`

## 下一步

若 b3 全量质量门和远端 CI 通过，进入：

`v0.14.0-b4 路线承接 UI 与摘要优先级`

如果下一步要开放正式阵营转移、商队加入、商家城入口、声望/通缉/招揽/任务网络、NPC 生死、奖励、route state 或新存档字段，必须停下来让用户决策。
