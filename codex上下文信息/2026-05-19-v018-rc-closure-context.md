# 2026-05-19 v0.18.0 rc closure context

## 状态

`v0.18.0 南疆路线与多区域承接` 已完成为本地开发里程碑。当前等待 commit、push 和 GitHub Actions 远端验证记录。

## 已完成

- `src/canon/v018-route-multi-region-rules.json`：RebornG-owned v0.18 路线/区域/压力/入口规则，包含 quarantined item boundary。
- `src/engine/v018-qingmao-route-multi-region.ts`：本地裁决青茅离开门槛、候选承接、压力回流与入口边界。
- `src/store/slices/livingWorldSlice.ts`：通过现有 v22 字段和 action protocol 写入本地账本与回流上下文。
- `src/components/game/FreeGoalPanel.tsx`：展示 v0.18 路线面板、门槛、南疆低阶事实、压力、入口边界。
- `tests/e2e/v018-route-multi-region.spec.ts` 与 focused unit tests。
- b1-b5 阶段文档、100 轮 Player Advocate、rc 60 轮 Player Advocate、rc 质量收束记录。

## 边界

本轮没有新增 `SAVE_FORMAT_VERSION = 23`，没有写 `route_entered/currentRoute/currentRegion`，没有开放正式地点、阵营、奖励、NPC 生死、完整南疆、完整商家城、BFF/backend、自动部署或 DeepSeek 权限。

MiroFish 三包只作为 candidate/rule/test material，被重写为 RebornG-owned summaries。`v018_hidden_982eba1c3730` 保持 deferred/human_review_only，不得进入 UI、DeepSeek 或 runtime authority。

## 本地验证

- `npm test -- src/engine/v018-qingmao-route-multi-region.test.ts --reporter=dot`：5 tests passed。
- `npx tsc --noEmit --pretty false`：passed。
- `npm run test:e2e -- tests/e2e/v018-route-multi-region.spec.ts`：1 test passed。
- `npm run check:player-advocate-gate -- 指导大纲/v0.18.0/codex/00-总览/v0.18.0-b1-b5-Player-Advocate-100轮走查记录.md 100`：passed，97.0% understanding。
- `npm run check:player-advocate-gate -- 指导大纲/v0.18.0/codex/00-总览/v0.18.0-rc-Player-Advocate-60轮走查记录.md 60`：passed，93.3% understanding。
- `npm test -- --reporter=dot`：134 test files，748 tests passed。
- `npm run build`：passed。
- `npm run check:runtime-assets`：passed，173 files，zero-byte=0。
- `npm run check:qingmao-assets`：passed，23 entries。
- `npm run check:player-visible-copy`：passed，260 files。
- `npm run test:e2e`：84 tests passed。
- `npm run test:e2e:long`：29 tests passed。
- `npm run check:production-preview`：passed。

## 下一步

1. Stage explicit v0.18 paths only; do not use `git add -A`.
2. Commit as `feat: 完成v0.18路线多区域承接`.
3. Push `codex/v013-npc-faction-reaction`.
4. Record GitHub Actions run in `v0.18.0-Git提交与推送计划.md`、`指导大纲/项目仪表盘.md`、`PROJECT-STATE.md` and this handoff if doing a follow-up evidence commit.
5. Stop for user decision before `v0.19.0` startup review.
