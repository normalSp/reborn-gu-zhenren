# 2026-05-19 v1.0.0-rc 质量收束上下文交接

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v1.0.0-rc`
- 状态：本地质量门与远端 CI 通过
- MiroFish：不需要新包
- 存档版本：`SAVE_FORMAT_VERSION = 22`，未变更
- DeepSeek：`deepseek-v4-flash`，未扩权

## 本轮新增

- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-rc-Player-Advocate-150轮走查记录.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-rc-质量收束记录.md`

## 本轮同步

- `README.md`
- `v1.0.0-总体开发大纲.md`
- `v1.0.0-小版本执行路线图.md`
- `v1.0.0-测试矩阵.md`
- `v1.0.0-Git提交与推送计划.md`
- `v1.0.0-真相源索引.md`
- `指导大纲/项目仪表盘.md`

## 验证

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：138 files，763 tests passed。
- `npm run build`：通过。
- `npm run check:runtime-assets`：173 files，zero-byte=0。
- `npm run check:qingmao-assets`：23 entries checked。
- `npm run check:player-visible-copy`：268 files scanned。
- `npm run check:v019-content-governance`：通过。
- `npm run check:player-advocate-gate -- 指导大纲/v1.0.0/codex/00-总览/v1.0.0-rc-Player-Advocate-150轮走查记录.md 150`：通过，150 轮，理解率 100.0%。
- `npm run test:e2e`：87 passed。
- `npm run test:e2e:long`：29 passed。
- `npm run check:production-preview`：通过。
- Git：commit `53bdf98 chore: 完成v1.0 rc质量收束`，已推送。
- GitHub Actions：run `26098733549` 通过。

## 禁写边界

本轮未新增 save field、未 bump `SAVE_FORMAT_VERSION`、未扩大 DeepSeek 权限、未写正式 route/location/faction/reward/NPC-life、未实现正式经济库存/市场、未接入 BFF/backend、未自动部署 EdgeOne、未形成公开发布承诺。

## 下一步

1. 更新 PROJECT-STATE、AGENTS、相关 skill。
2. 停下来向用户汇报 v1.0 实际可玩功能，并讨论后续大方向。
