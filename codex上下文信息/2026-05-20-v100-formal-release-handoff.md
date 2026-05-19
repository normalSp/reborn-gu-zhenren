# 2026-05-20 v1.0 正式发布标识与素材绑定交接

## 当前任务

用户批准 D-PUB-001 至 D-PUB-007 后，本轮执行 v1.0 正式发布收束：

- 版本标识改为 `v1.0.0`。
- 公告标题采用 `RebornG v1.0《青茅之后，活世界初成》`。
- 公告正文口径、hero 三件套、截图/短录屏方向和“正式发布”称谓已批准。
- EdgeOne 发布仍由用户 / CodeBuddy 手动执行，Codex 不自动部署。

## 已改范围

- `package.json`、`package-lock.json`
- `index.html`
- `src/components/title/TitleScreen.tsx`
- `src/components/game/GameScreen.tsx`
- `doc/art/v1-hero-selection-manifest.json`
- `src/canon/v019-content-governance-rules.json`
- `src/engine/v019-content-governance.ts`
- `src/engine/v019-content-governance.test.ts`
- `scripts/check-v019-content-governance.mjs`
- `tests/e2e/v100-public-release-shell.spec.ts`
- `README.md`
- `public/test-saves/README.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/v1.0.0/codex/00-总览/README.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-public-release-prep-启动检查.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-public-release-prep-用户审批清单.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-b4-公开素材与文案边界.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-真相源索引.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-转交另一个窗口交接稿.md`

## 已通过的针对性验证

- `npm test -- src/engine/v019-content-governance.test.ts --reporter=dot`
- `npm run check:v019-content-governance`
- `npm run test:e2e -- tests/e2e/v100-public-release-shell.spec.ts`

## 完整发布门

- `npm test -- src/engine/v019-content-governance.test.ts --reporter=dot`：passed，1 file / 6 tests。
- `npm run check:v019-content-governance`：passed。
- `npm run test:e2e -- tests/e2e/v100-public-release-shell.spec.ts`：passed，1 test。
- `npx tsc --noEmit --pretty false`：passed。
- `npm run check:runtime-assets`：passed，173 files，zero-byte=0。
- `npm run check:qingmao-assets`：passed，23 entries。
- `npm run check:player-visible-copy`：passed，268 files。
- `npm test -- --reporter=dot`：passed，140 files / 768 tests。
- `npm run build`：passed，无 500KB+ chunk warning，仅 Rolldown plugin timings warning。
- `npm run test:e2e -- tests/e2e/v090-beast-hunt-battlefield.spec.ts tests/e2e/v090-product-route-closure.spec.ts tests/e2e/v090-training-ground-clue-entry.spec.ts`：passed，6 tests；用于修正旧 v0.9 版本戳断言后复验。
- `npm run test:e2e`：passed，90 tests。
- `npm run test:e2e:long`：passed，29 tests。
- `npm run check:production-preview`：passed；首屏显示 v1.0 标题和 `v1.0.0`，console 仅有成就加载普通日志。

## 必守边界

本轮只做发布标识、首屏/OG presentation 和文档交接：

- 不自动部署 EdgeOne。
- 不新增 save fields，不 bump `SAVE_FORMAT_VERSION`。
- 不新增正式 route/location/currentRegion。
- 不新增正式地点、阵营、奖励、NPC 生死。
- 不扩大 DeepSeek 权限。
- 不让 hero 图成为 gameplay/canon authority。
- 不引入 BFF/backend、Sentry runtime、自动部署或外部运行时依赖。

## 下个窗口接手

先读：

1. `AGENTS.md`
2. `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
3. `指导大纲/项目仪表盘.md`
4. `指导大纲/v1.0.0/codex/00-总览/v1.0.0-转交另一个窗口交接稿.md`

发布后若用户给 EdgeOne 预览 URL，按 `v1.0.0-process-1-预览回滚与观测清单.md` 做验收。发布验收之后再进入 v1.1 a1 设计门禁，不要直接写 route/location runtime。
