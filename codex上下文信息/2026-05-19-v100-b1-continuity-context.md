# 2026-05-19 v1.0.0-b1 青茅南疆连续体验交接

## 当前状态

`v1.0.0-b1` 已完成本地实现与质量门，等待 Git 提交、推送和远端 CI 补录。

## 本阶段做了什么

1. 完成 v1.0 三包 MiroFish intake review，同步用户已批准 D-001 至 D-010。
2. 完成 a0/a1/a2 文档门禁。
3. 新增 v1.0 连续体验规则与引擎：
   - `src/canon/v100-qingmao-southern-border-continuity-rules.json`
   - `src/engine/v100-qingmao-southern-border-continuity.ts`
4. 接入 store/UI：
   - `src/store/slices/livingWorldSlice.ts`
   - `src/components/game/FreeGoalPanel.tsx`
5. 新增 focused unit 与 e2e：
   - `src/engine/v100-qingmao-southern-border-continuity.test.ts`
   - `tests/e2e/v100-qingmao-southern-border-continuity.spec.ts`
6. 新增 b1 文档和 Player Advocate 30 轮记录。

## 权威边界

b1 写入现有 v22 living-world 字段：

- `knownFacts`
- `factionPressure`
- `npcMemories`
- `playerGoals`
- `actionConsequences`
- local action ledger
- narrative return context

b1 不写：

- `route_entered`
- `currentRoute`
- `currentRegion`
- 正式地点/区域开放
- 阵营转移
- 奖励/材料/蛊/蛊方
- NPC 生死/抓捕
- hidden fact body
- DeepSeek 新权限
- `SAVE_FORMAT_VERSION = 23`
- BFF/backend

## 本地验证

- `npm test -- src/engine/v100-qingmao-southern-border-continuity.test.ts --reporter=dot`：1 file，2 tests passed。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run test:e2e -- tests/e2e/v100-qingmao-southern-border-continuity.spec.ts`：1 passed。
- `npm run check:player-advocate-gate -- 指导大纲/v1.0.0/codex/00-总览/v1.0.0-b1-Player-Advocate-30轮走查记录.md 30`：30 rounds，100% understanding。
- `npm test -- --reporter=dot`：136 files，756 tests passed。
- `npm run build`：通过。
- `npm run check:runtime-assets`：通过。
- `npm run check:qingmao-assets`：通过。
- `npm run check:player-visible-copy`：通过。
- `npm run check:v019-content-governance`：通过。
- `npm run check:production-preview`：通过。

## Git 状态

- 本轮待提交路径必须显式 stage。
- 不使用 `git add -A`。
- 历史脏文件继续忽略：美术候选、`doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`bgm/` 等与本阶段无关文件。
- 本轮 commit/push/CI 待补录。

## 下一步

1. 提交并推送 b1。
2. 等待 GitHub Actions 通过。
3. 补录 run id。
4. 若 b1 远端通过，进入 b2：低阶蛊师 life loop 释出版闭环。

## 仍需停手事项

遇到以下内容必须停下来问用户：

- `SAVE_FORMAT_VERSION = 23`
- route/location/currentRegion 持久字段
- 正式地点、阵营、奖励、NPC 生死/抓捕
- DeepSeek 权限扩大
- BFF/backend
- live DeepSeek probe 的具体样本执行
- 对外发布承诺
- 大规模新图生成
