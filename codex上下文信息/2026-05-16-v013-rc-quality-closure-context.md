# 2026-05-16 v0.13.0-rc 质量收束交接

## 状态

`v0.13.0-rc` 已完成，本地开发里程碑锁定。

## 本轮完成

- 新增 `v0.13.0-rc-质量收束记录.md`。
- 更新 v0.13 入口 README、小版本路线图、真相源索引、项目仪表盘。
- 更新 `PROJECT-STATE.md`、`AGENTS.md` 和本机 `reborn-expert-council` skill 当前事实。
- 保持 v0.13 边界：不新增存档字段、不开放命名 NPC runtime rule、不开放正式声望/通缉/招揽/任务/奖励、不扩张 DeepSeek 权限。

## 验证

本地：

- `npm test -- --reporter=dot`：121 个 test file、689 个测试通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run build`：通过。
- `npm run check:runtime-assets`：通过，131 files，zero-byte=0。
- `npm run check:qingmao-assets`：通过，10 entries。
- `npm run check:player-visible-copy`：通过，238 files scanned。
- `npm run check:production-preview`：通过，无生产 bundle 黑屏。
- `npm run test:e2e -- tests/e2e/v013-social-impact-panel.spec.ts tests/e2e/v011-free-goal-panel.spec.ts tests/e2e/v010-qingmao-region-actions.spec.ts tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：13 个测试通过。
- `npm run test:e2e:long`：29 个测试通过。

远端：

- GitHub Actions run `25965994252`：通过确定性质量门。

## Git

- 当前分支：`codex/v013-npc-faction-reaction`。
- 已推送到远端的最新提交：`b9b877d docs: 收束v0.13 Git基线同步记录`。
- 本交接与 rc 文档待随收尾提交。

## 后续

下一步不是直接开新功能，而是进入下一版本启动审查，需要用户决策 `v0.14.0` 主线方向。

仍需停下来找用户决策的事项：

- 持久化社会账本。
- 命名 NPC runtime rule。
- 正式声望/通缉/招揽/任务网络。
- NPC 生死 / 抓捕 / 追杀结算。
- DeepSeek 新写入权。
- branch protection、自动部署 EdgeOne、PR 默认强制 full Playwright。

当前不需要新增 MiroFish 包。
