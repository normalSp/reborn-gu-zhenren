# 2026-05-25 v3.7 complete context

## 当前状态

- 分支：`codex/v370-startup-multi-npc-small-faction`
- 当前入口：`指导大纲/v3.7.0/codex/00-总览/README.md`
- 当前阶段：v3.7 complete；implementation commit / push / CI passed
- 主线：`transient multi-NPC / small-faction AgentProposal 复核`

## 本轮完成

- 新增 `src/engine/v370-transient-agent-proposal-graph.ts`。
- 新增 `src/engine/v370-transient-agent-proposal-graph.test.ts`。
- 更新 `src/components/game/RuntimeAgentProposalPanel.tsx`，在既有 `意图` tab 中显示 proposal graph，同时保留 v3.4/v3.5/v3.6 回归文案证据。
- 更新 `src/components/game/WorldHubPanel.tsx` 的世界总览与边界提示。
- 新增 `tests/e2e/v370-runtime-agent-proposal-graph.spec.ts`。
- 更新 `package.json`：新增 `check:v370-transient-agent-proposal-graph`，并把 v370 e2e 纳入 `test:e2e:long`。
- 补齐 a0/a1/a2/b1/b2/b3/process/rc 文档、40 轮 Player Advocate、old-save/no-save/rollback 证据、测试矩阵和需求池同步。

## 验证

- `npm run check:v370-transient-agent-proposal-graph -- --reporter=dot`：passed。
- `npm run check:v360-transient-agent-micro-expansion -- --reporter=dot`：passed。
- `npx tsc --noEmit --pretty false`：passed。
- `npm run test:e2e -- tests/e2e/v340-runtime-agent-proposal.spec.ts tests/e2e/v350-runtime-agent-hardening.spec.ts tests/e2e/v360-runtime-agent-micro-expansion.spec.ts tests/e2e/v370-runtime-agent-proposal-graph.spec.ts`：4 passed。
- `npm run check:player-advocate-gate -- "指导大纲/v3.7.0/codex/00-总览/v3.7.0-b3-Player-Advocate-40轮走查记录.md" 40`：ok，40/40，understandingRate=100%，confused=0。
- `npm test -- --reporter=dot`：156 files，832 tests passed。
- `npm run build`：passed。
- `npm run check:runtime-assets`：checked 163 files，zero-byte=0。
- `npm run check:qingmao-assets`：checked 23 entries。
- `npm run check:player-visible-copy`：294 files scanned，passed。
- `npm run check:stale-entrypoints`：P0/P1/P2/Info=0。
- `npm run test:e2e`：73 passed。
- `npm run test:e2e:long`：17 passed。
- `npm run check:production-preview`：ok。

## 边界

v3.7 没有开放 F-370：不新增 persistent agent state、save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`、live DeepSeek、DeepSeek authority、MiroFish、backend/BFF/service、external framework、subagent、L4/L5 runtime、正式地点/阵营/身份/奖励/NPC 生死/通缉/招揽/封锁、public/legal/EdgeOne。

## 下一步

- implementation commit：`8ef17c5c feat: 完成v3.7多NPC小势力意图图谱`。
- implementation push：`codex/v370-startup-multi-npc-small-faction` 已推送到 origin。
- GitHub Actions：run `26386740563` passed。
- 按制度暂不自动合并 `main`，等待用户批准或 PR 审核。
