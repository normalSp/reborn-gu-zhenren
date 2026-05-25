# 2026-05-25 v3.8 complete context

## 当前状态

- 分支：`codex/v380-startup-proposal-graph-stability`
- 版本：`v3.8.0`
- 主线：`transient proposal graph 长期稳定性与多小势力压力复核`
- 状态：完成，completion commit `196b46b4` / GitHub Actions `26395818611` passed。

## 用户授权

- `D-380-001` 至 `D-380-012`：全部批准。
- `F-380-001` 至 `F-380-012`：全部继续 `future_gate_required`。

## 本轮实现

新增：

- `src/engine/v380-transient-agent-proposal-graph-stability.ts`
- `src/engine/v380-transient-agent-proposal-graph-stability.test.ts`
- `tests/e2e/v380-runtime-agent-proposal-graph-stability.spec.ts`
- `npm run check:v380-transient-agent-proposal-graph-stability`

更新：

- `src/components/game/RuntimeAgentProposalPanel.tsx`
- `src/components/game/WorldHubPanel.tsx`
- `package.json`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- v3.8 docs and local skill overrides。

## 验证

- `npm run check:v380-transient-agent-proposal-graph-stability`：通过，4/4。
- `npm run check:v370-transient-agent-proposal-graph`：通过，5/5。
- `npx tsc --noEmit --pretty false`：通过。
- focused v360/v370/v380 e2e：通过，3/3。
- `npm run check:player-advocate-gate -- 指导大纲/v3.8.0/codex/00-总览/v3.8.0-b3-Player-Advocate-50轮记录.md 50`：通过，50/50。
- `npm test`：通过，157 files / 836 tests。
- `npm run build`：通过。
- `npm run check:runtime-assets`：通过。
- `npm run check:qingmao-assets`：通过。
- `npm run check:player-visible-copy`：通过。
- `npm run check:stale-entrypoints`：通过，P0/P1/P2/Info=0。
- `npm run test:e2e`：通过，74/74；首轮曾失败一次，已修复继承 deterministic evidence 显示 0/0 的问题。
- `npm run test:e2e:long`：通过，18/18。
- `npm run check:production-preview`：通过。
- `git diff --check`：通过。

## 重要边界

v3.8 没有新增：

- persistent agent state。
- save field、migration、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- live DeepSeek 或 DeepSeek prompt/context/model/authority 变更。
- DeepSeek visible lore/RAG。
- MiroFish export/intake。
- backend/BFF/service/job queue/eval archive service/cloud save。
- external framework PoC/dependency/vendored subset/read-only scan/patch artifact/subagents。
- L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 agent。
- formal location/faction/identity/reward/NPC life-death/warrant/recruitment/blockade。
- knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- public/legal/release wording、EdgeOne、main auto-merge。

## 下一步

1. 给用户最终交接。
2. 后续可开 v3.9 专家团启动会，或按主线合并制度讨论是否合并 `main`。
3. 是否合并 `main` 需另行审批。
