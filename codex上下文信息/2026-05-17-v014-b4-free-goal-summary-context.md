# 2026-05-17 v0.14.0-b4 路线承接 UI 摘要优先级交接

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v0.14.0-b4 路线承接 UI 与摘要优先级`
- 状态：实现、验证、提交、推送和远端 CI 已完成。
- MiroFish：`not_needed`，本阶段只做现有 RebornG UI 摘要排序。
- 存档：未新增字段，`SAVE_FORMAT_VERSION` 保持 `22`。
- DeepSeek：未改 prompt、schema、model、context-builder 或权限，运行模型仍为 `deepseek-v4-flash`。

## 变更摘要

`src/components/game/FreeGoalPanel.tsx` 新增 `优先摘要`：

- `free-goal-next-step-summary`
- `free-goal-summary-goal`
- `free-goal-summary-route`
- `free-goal-summary-faction`
- `free-goal-summary-social`

摘要会把当前目标、路线承接、阵营/身份前置和社会影响放到详细面板前方，帮助玩家先读懂下一步。

固定边界文案：

`摘要只排序信息，不写状态、不转阵营、不发奖励、不进地点。`

## 新增测试

- `tests/e2e/v014-free-goal-summary-priority.spec.ts`

覆盖：

- 移动端 390x844。
- 逃离青茅山 -> 记录目标 -> 准备路线 -> 局势反应 -> 遮掩痕迹。
- 摘要中显示山路逃离路线和社会影响。
- 输入 `我要投靠白家` 后摘要显示白家接触前置和跨阵营前置。
- 不出现春秋蝉、重生、奖励已发放、投靠成功。
- 不写 `route_entered` 或 `faction_transfer_granted`。

## 文档

新增：

- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-b4-路线承接UI摘要优先级.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-b4-Player-Advocate-20轮走查记录.md`

已同步：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/v0.14.0/codex/00-总览/README.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-总体开发大纲.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-小版本执行路线图.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-需求决策池.md`
- `指导大纲/v0.14.0/codex/00-总览/v0.14.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`

## 验证

已通过：

```powershell
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v014-free-goal-summary-priority.spec.ts
npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-b4-Player-Advocate-20轮走查记录.md" 20
npm test -- --reporter=dot
npm run build
npm run check:player-visible-copy
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果：

- TypeScript：通过。
- Playwright b4 移动端 e2e：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，1 个困惑轮次。
- full unit：125 个 test file，707 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- player-visible-copy：243 个文件扫描通过。
- runtime assets：131 个文件，0 zero-byte。
- Qingmao assets：10 entries，active=4。
- production-preview smoke：通过。

## Git / 脏工作树

- 实现提交：`d5ee422 feat: 优化v0.14路线承接摘要`。
- 推送：已推送到 `origin/codex/v013-npc-faction-reaction`。
- 远端 CI：GitHub Actions run `25992906897` deterministic quality gate 通过。

仍存在历史或外部未跟踪项，本阶段不要纳入：

- `doc/art/s0-qingmao-art-roadmap.md`
- `.cursor/`
- `RebornG_codebuddy.zip`
- `artifacts/`
- `bgm/`
- `doc/art/style-lock/`
- `doc/art/v014-to-v100-art-roadmap.md`
- `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao-unfilled-gu-appearance-pack-intake-review.md`
- `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao_unfilled_gu_appearance_pack_export_ready.json`
- `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao_unfilled_gu_appearance_pack_report.json`
- `指导大纲/vMiroFish/requests/v0.14.0/2026-05-17-qingmao-unfilled-gu-appearance-pack.md`
- `指导大纲/大方向/`

## 下一步

1. 补一条证据文档提交，记录 b4 commit、push、CI。
2. 进入 `v0.14.0-rc` 质量收束。

停止门：

- 正式 route state。
- 地点变化。
- 新增持久化字段或 save format bump。
- 完整南疆或完整商家城。
- 正式阵营转移、声望、通缉、招揽、任务和奖励。
- NPC 生死、抓捕、追杀成功/失败。
- BFF/backend。
- EdgeOne 自动部署。
- DeepSeek 权限扩张。
