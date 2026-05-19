# 2026-05-19 v0.19.0 rc closure context

## Current State

- `v0.19.0` 本地开发里程碑已完成，主题为 `内容生产、长测与 v1.0 发布工具`。
- 当前分支：`codex/v013-npc-faction-reaction`。
- 包版本仍为 `0.9.0`，存档版本仍为 `SAVE_FORMAT_VERSION = 22`。
- DeepSeek runtime model 仍为 `deepseek-v4-flash`。
- 本阶段未新增 save fields、正式 route/location/faction/reward/NPC-life、BFF/backend、自动部署、公开承诺、大规模新图生成或 DeepSeek 权限。

## Delivered

- MiroFish v0.19 三包 intake review：
  - `v019_public_canon_boundary_pack`
  - `v019_representative_playthrough_anchor_pack`
  - `v019_release_art_caption_boundary_pack`
- 内容治理规则、引擎、测试和脚本：
  - `src/canon/v019-content-governance-rules.json`
  - `src/engine/v019-content-governance.ts`
  - `src/engine/v019-content-governance.test.ts`
  - `scripts/check-v019-content-governance.mjs`
  - `npm run check:v019-content-governance`
- v0.19 a1/a2/b1/b2/b3/b4/process-1/rc 文档已更新。
- Player Advocate：
  - b2 30 轮：93.3% next-step understanding，2 confused。
  - rc 100 轮：95.0% next-step understanding，5 confused。

## Verification

- `npx tsc --noEmit --pretty false`：passed。
- `npm test -- --reporter=dot`：135 files，754 tests passed。
- `npm run build`：passed。
- `npm run check:runtime-assets`：173 files，zero-byte=0。
- `npm run check:qingmao-assets`：23 entries checked。
- `npm run check:player-visible-copy`：262 files scanned，passed。
- `npm run check:v019-content-governance`：passed。
- `npm run check:player-advocate-gate -- 指导大纲/v0.19.0/codex/00-总览/v0.19.0-b2-Player-Advocate-30轮走查记录.md 30`：passed。
- `npm run check:player-advocate-gate -- 指导大纲/v0.19.0/codex/00-总览/v0.19.0-rc-Player-Advocate-100轮走查记录.md 100`：passed。
- `npm run test:e2e`：84 passed。
- `npm run test:e2e:long`：29 passed。
- `npm run check:production-preview`：passed，preview rendered，console only had achievement load log。

## Git Status

- 主体 commit：`fe6f468 feat: 完成v0.19发布准备工具层`
- push：已推送到 `codex/v013-npc-faction-reaction`
- 远端验证：GitHub Actions run `26082464543` 通过 deterministic quality gate
- staging 范围：只包含 v0.19 code/docs、项目状态文档、仪表盘、handoff 和明确相关的 MiroFish intake 文件。
- 未纳入：历史美术脏文件、`.cursor/`、`RebornG_codebuddy.zip`、`artifacts/`、`bgm/`、`指导大纲/大方向/`。

## Next Step

1. 补录 `fe6f468` / `26082464543` 到 Git 计划、仪表盘、PROJECT-STATE、AGENTS 和本 handoff。
2. 提交 evidence commit。
3. push 当前分支并等待 evidence commit 的 GitHub Actions。
4. 若远端验证通过，下一阶段进入 `v1.0` 启动审查与范围冻结讨论。

## Must Stop For User

- `SAVE_FORMAT_VERSION = 23`。
- route/location persistent fields。
- formal route/location/faction/reward/NPC-life。
- complete Southern Border / full Shang clan city。
- BFF/backend / cloud save / account。
- EdgeOne automatic deployment。
- public release copy or announcement commitment。
- large new image generation or hero replacement。
- live DeepSeek probe as release/canon authority。
