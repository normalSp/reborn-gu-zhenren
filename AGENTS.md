# RebornG Project

RebornG is an AI-driven browser text RPG set in a Reverend Insanity-inspired Gu world. The current stack is TypeScript, React 18, Zustand 5, Tailwind, GSAP, Framer Motion, Zod, Vite, Playwright, and DeepSeek runtime narrative APIs.

## Quick Commands

- Dev server: `npm run dev`
- Production build: `npm run build`
- Unit tests: `npm test`
- Type check: `npx tsc --noEmit --pretty false`
- E2E: `npm run test:e2e`
- Long E2E: `npm run test:e2e:long`
- Runtime asset scan: `npm run check:runtime-assets`
- Qingmao asset scan: `npm run check:qingmao-assets`
- Player Advocate gate check: `npm run check:player-advocate-gate -- <record.md> <10|50>`
- Production preview smoke: `npm run check:production-preview`

## Current State

- Package baseline: `0.9.0`.
- Save format: `SAVE_FORMAT_VERSION = 22`; `v0.11.0-a2` runtime added persistent `livingWorldState` with migration/defaults/tests in the same change.
- Runtime DeepSeek model: `deepseek-v4-flash`.
- `v0.9.0` is locked and should not receive new gameplay, visual assets, model switching, or save fields unless fixing a critical release/config/documentation issue.
- `v0.10.0` is complete as a local development milestone: full tests, type check, build, asset scans, key Qingmao e2e, long e2e, production-preview smoke, and Qingmao battlefield readability regressions pass.
- `v0.11.0` mainline is complete as a local development milestone: `活世界地基与自由意图闸门`.
- `v0.11.0-a0` and `v0.11.0-a1` are complete. `v0.11.0-a2` design first cut, runtime skeleton first round, controlled patch API second cut, and Qingmao mountain-patrol action-backflow sample are complete. `v0.11.0-a3` free-intent local adjudication first cut is complete. `v0.11.0-a3-2` free-goal panel first cut is complete: confirmed player-input goal drafts write only to `livingWorldState.playerGoals` through `living_world_engine` patch. `v0.11.0-b1` original-fact extraction pilot first cut is complete: 8 Qingmao fact cards store summaries/source pointers only. `v0.11.0-b1-2` fact-card read helper and adjudication reference bridge are complete: hidden fact cards are local refs only and must not enter `deepSeekContract.visibleFactIds`. `v0.11.0` testing-engineering gate and a3 ruling sample matrix are established.
- `v0.11.0-process-1` development-process evolution first version is complete. User input is now classified as direction, boundary, priority, feel, tradeoff, or release input; Codex must stop for user decisions before scope expansion, canon/IF boundary changes, persistence changes, new DeepSeek authority, external runtime dependencies, writable subagents, or public commitments.
- `v0.11.0-process-1b` project dashboard and Git policy are established. From 2026-05-18 onward the current dashboard entry is `指导大纲/项目仪表盘.md`; every phase completion must update it. The old `v0.11.0-项目仪表盘.md` is historical. Every handoff must record commit/push status according to `v0.11.0-Git提交与推送制度.md` or the current version Git plan.
- `v0.11.0-b2` first slice through b2-6 is complete: investigating Bai clan can write visible `knownFacts/actionConsequences/factionPressure` as a contact opportunity; investigating Fang Yuan writes hidden ref plus public failure `actionConsequences/npcMemories` without leaking hidden causality; investigating spirit spring remains hidden-fact protected; Bai follow-up hints can become a formal contact-window action; confirmed escape goals can execute the first Qingmao route-preparation action. A/B are done and C Fang Yuan public-evidence inquiry is deferred.
- `v0.11.0-rc` quality closure is complete: full unit tests, type check, build, runtime/Qingmao asset scans, production-preview smoke, FreeGoalPanel e2e, long e2e, and key Qingmao region/battlefield e2e pass.
- `v0.12.0` is complete as a local development milestone: a1/a2/b1/b2/b3/process-1 and rc quality closure pass. `v0.12` starts from Qingmao original fact cards and canon anchors, then Qingmao low-rank IF matrix, route/supply/pursuit, lightweight NPC/faction reaction, Fang Yuan public-evidence inquiry after more public facts, and GitHub/CI as a process sidecar. Next step is `v0.13.0` startup review and scope freeze.
- `v0.12.0-process-1` GitHub/CI engineering gate is established: `.github/workflows/ci.yml` runs the deterministic quality gate, PR/issue templates require phase scope, user decision, MiroFish need, save-format impact, DeepSeek/hidden-fact boundaries, dashboard/handoff updates, and verification evidence. Playwright smoke is manual via `workflow_dispatch run_e2e=true` unless later promoted by user decision.
- `v0.12.0-rc` quality closure passed: `npm test -- --reporter=dot`, `npx tsc --noEmit --pretty false`, `npm run build`, runtime/Qingmao/player-visible-copy scans, production-preview smoke, FreeGoalPanel e2e, Qingmao region/battlefield e2e, and long e2e all pass.
- `v0.13.0` is complete as a local development milestone. Mainline was `NPC 与势力反应系统`: `v0.13.0-a1` social-memory protocol/field table/test matrix, `v0.13.0-a2` read-only NPC memory projection, `v0.13.0-b1` read-only faction stance/pressure projection, `v0.13.0-b2` read-only prompt-safe public event chronicle, `v0.13.0-b3` candidate-only social followups, `v0.13.0-b4` FreeGoalPanel social-impact foldout, `v0.13.0-process-1` remote Actions gate, `v0.13.0-process-2` Git baseline sync, and `v0.13.0-rc` quality closure are complete. GitHub Actions runs `25965710557`, `25965994252`, `25969597344`, and `25969665606` passed after syncing the baseline, moving CI Node to `22.12.0`, and hardening the Player Advocate gate. Retrospective `v0.13.0-rc` Player Advocate 50-round gate passed on 2026-05-17 with 94% next-step understanding and zero P0/P1 player blockers.
- `v0.14.0` was developed as `青茅后续路线承接`. `v0.14.0-a1` design gate is complete, and `v0.14.0-a2` route-condition read-only first cut is complete: `src/canon/qingmao-route-continuation-rules.json`, `src/engine/v014-qingmao-route-continuation.ts`, and focused tests produce route condition previews from `livingWorldState` and player intent without writing store, adding save fields, unlocking locations, transferring factions, granting rewards, deciding NPC life/capture, or expanding DeepSeek authority. The v0.14 MiroFish three-pack intake passed with one quarantined item `v014exit_30146f740a69`; it must not enter player-visible route rules, UI, or DeepSeek context. `v0.14.0-b1` 候选后续到正式前置行动桥 is complete: `遮掩逃离痕迹` upgrades one social follow-up into a formal preparation action, writes only existing v22 fields and local ledger, passes focused tests, tsc, e2e, full tests, build, scans, production-preview smoke, 20-round Player Advocate gate, and GitHub Actions run `25987158730`; implementation commit is `77a98e1`. `v0.14.0-b2` 青茅离开路线第一刀 is complete: `山路逃离路线` is now a candidate route-continuation action through `src/engine/v014-qingmao-mountain-pass-route-continuation.ts`, store/UI bridge, and `tests/e2e/v014-mountain-pass-route-continuation.spec.ts`; it writes only existing v22 fields and local ledger, passes focused tests, tsc, e2e, full tests, build, scans, production-preview smoke, 20-round Player Advocate gate, GitHub Actions run `25988584563`, and docs verification run `25991591354`; implementation commit is `9bdde59`, evidence commit is `6962e75`. `v0.14.0-b3` 阵营目标前置条件展示 has passed the local quality gate: `src/engine/v014-qingmao-faction-goal-prerequisites.ts`, focused tests, FreeGoalPanel bridge, and `tests/e2e/v014-faction-goal-prerequisites.spec.ts` display read-only prerequisites for joining Bai clan, joining a caravan, Shang clan city public entry, or rogue/identity transition. It writes no store state, adds no save fields, transfers no faction, creates no formal task, grants no reward, unlocks no city/location, reveals no hidden facts, and gives DeepSeek no new authority. Focused tests, tsc, b3 e2e, 20-round Player Advocate gate, full tests, build, scans, and production-preview smoke pass; next step is commit/push/CI. Stop before any formal route state, location change, save-format bump, complete Southern Border, full Shang clan city, faction transfer, formal standing/warrant/recruitment/tasks/rewards, NPC death/capture, BFF/backend, EdgeOne auto-deploy, or DeepSeek authority expansion without user decision.
- `v0.14.0-b3` remote evidence update: implementation commit `540e196 feat: 展示v0.14阵营目标前置条件` has been pushed and GitHub Actions run `25992213170` passed. This supersedes any earlier pending wording for b3.
- `v0.14.0` is complete as a local development milestone. `v0.14.0-a1` design gate, `a2` route-condition read-only preview, `b1` cover-escape-tracks preparation action, `b2` mountain-pass candidate route continuation, `b3` faction/identity prerequisite display, `b4` FreeGoalPanel priority summary, and `rc` quality closure are complete. `v0.14.0-rc` passed `npx tsc --noEmit --pretty false`, full unit tests, `npm run build`, player-visible-copy/runtime/Qingmao scans, production-preview smoke, route-related e2e, long e2e, the 60-round Player Advocate gate, and GitHub Actions run `25993465843`; rc commit is `6370115`. rc adds no save fields, route state, locations, faction transfer, rewards, NPC life/capture results, hidden-fact reveal, BFF/backend, EdgeOne auto-deploy, live DeepSeek probe, or DeepSeek authority expansion. Historical next step before v0.15 was the v0.15 startup review; v0.15 is now complete. Stop before formal route state, location change, save-format bump, complete Southern Border, full Shang clan city, faction transfer, formal standing/warrant/recruitment/tasks/rewards, NPC death/capture, BFF/backend, EdgeOne auto-deploy, or DeepSeek authority expansion without user decision.
- `v0.15.0` is complete as a local development milestone: `低阶蛊师经济、补给、炼养用深循环`. `v0.15.0-a1/a2`, `v0.15-art-audit-1`, `b1` supply/feeding, `b2` refinement boundary, `b3` caravan/market window, `b4` gray-trade/commission boundary, and `rc` quality closure are complete. Key commits and runs: `69e78bb` run `26015132014`, `8ec823c` run `26019950577`, `03a2f88` run `26022209682`, `a3dedde` run `26025266822`, `9872c28` run `26027822854`, and `1c15ecb` run `26028779369`. `v0.15.0-rc` passed `tsc`, full tests, build, runtime/Qingmao/player-visible-copy scans, v0.15 e2e, long e2e, production-preview smoke, and 60-round Player Advocate gate. v0.15 adds no save fields, no formal material/inventory/currency writes, no price table, no shop inventory, no formal market/black-market/commission system, no commission profit, no identity wash, no formal faction pressure, no route_entered/location/faction/NPC-life result, no reward, no live DeepSeek probe, and no DeepSeek authority expansion. Stop before formal materials/inventory consumption, recipe unlock/refinement success, market/black-market/commission systems, save-format changes, location/faction/NPC-life results, or DeepSeek authority expansion without user decision.
- `v0.16.0` is complete as a local development milestone: `系统收束、UI 减法与权威归并`. It reduces the player bottom navigation to `地图 / 行动 / 角色 / 蛊道 / 世界 / 记录`; `行动` now contains current actions plus free goals, `蛊道` contains Gu/kill moves/refinement/materials, `世界` contains read-only or scene-gated high-tier panels plus the dev/demo drawer, and `记录` contains the event log. `src/engine/v016-authority-map.ts` and focused tests record old-entry resolution and authority boundaries. `v0.16.0-rc` passed `tsc`, full unit tests, build, runtime/Qingmao/player-visible-copy scans, full e2e, long e2e, production-preview smoke, b1/b2/b3 20-round Player Advocate gates, rc 60-round Player Advocate gate, and GitHub Actions run `26041195458`; commit `800021c` is pushed. It adds no save fields, no DeepSeek authority, no formal rewards/locations/factions/NPC life, no MiroFish runtime absorption, no backend/BFF, no automatic deployment, and no public commitment.
- `v0.17.0` is complete as a local development milestone: `战斗、杀招、小队与阵法深化`. MiroFish v0.17 low-rank combat, killer-move counter, and squad/formation packages passed intake review and were absorbed only as RebornG-owned candidate rules/tests/UI prompts. Runtime adds `src/canon/v017-combat-deepening-rules.json`, `src/engine/v017-combat-deepening.ts`, `V017CombatBoundaryPanel`, ActionPanel/GuDaoPanel/NarrativeCombatPanel bridges, and `registerV017CombatCandidateAction`, all using existing v22 fields and the existing combat-candidate queue. `v0.17.0-rc` passed focused tests, `tsc`, v0.17 e2e, full tests, build, runtime/Qingmao/player-visible-copy scans, full e2e, long e2e, production-preview smoke, b1/b2/b3/b4 20-round Player Advocate gates, rc 60-round Player Advocate gate, and GitHub Actions runs `26046493464` / `26046685585`; implementation commit is `005c1da`, evidence commit is `9c77935`. It adds no save fields, no DeepSeek authority, no formal rewards/drops/materials/Gu/locations/factions/NPC life, no `enemySpecIds`, no backend/BFF, no automatic deployment, and no public commitment.
- `v0.18.0` is complete as a local development milestone: `南疆路线与多区域承接`. User approved D-001 through D-008 on 2026-05-19. `v0.18.0-a1/a2`, MiroFish three-pack intake, `b1` route-entry threshold sample, `b2` candidate continuation, `b3` Southern Border low-rank public facts panel, `b4` previous-ledger supply/pursuit/identity pressure backflow, `b5` caravan/rogue/Shang outer-entry boundaries, and `rc` local quality closure are complete. Runtime adds `src/canon/v018-route-multi-region-rules.json`, `src/engine/v018-qingmao-route-multi-region.ts`, focused tests, store/UI bridge in `FreeGoalPanel`, and `tests/e2e/v018-route-multi-region.spec.ts`, using only existing v22 fields plus local action ledger and return context. Runtime+rc commit is `56bb9dd feat: 完成v0.18路线多区域承接`; GitHub Actions run `26070709256` and evidence run `26070869295` passed deterministic quality gate. It adds no save fields, no `route_entered/currentRoute/currentRegion`, no formal location/faction/reward/NPC-life result, no complete Southern Border, no full Shang clan city, no BFF/backend, no automatic deployment, and no DeepSeek authority expansion.
- `v0.19.0` startup review and scope-freeze draft is established under `指导大纲/v0.19.0/codex/00-总览/`; commit `00c7615 docs: 建立v0.19发布准备启动审查` is pushed and GitHub Actions run `26078064150` passed. Recommended mainline is `内容生产、长测与 v1.0 发布工具`; it is a v1.0 readiness/tooling phase, not new gameplay expansion. Current user decisions pending: D-001 through D-008 in `v0.19.0-需求决策池.md`. Three preferred MiroFish requests are drafted under `指导大纲/vMiroFish/requests/v0.19.0/`: public canon boundary, representative playthrough anchors, and release art/caption boundary. They do not block a1 docs/schema, but should be forwarded and reviewed before b2/b3/b4. Stop again before route/location persistent fields, `SAVE_FORMAT_VERSION = 23`, formal route/location entry, region/faction/reward/NPC-life outcomes, complete Southern Border, full Shang clan city, BFF/backend, automatic deployment, public commitments, large new image generation, or DeepSeek authority expansion.
- Test matrix evolution is now a project-level process. From `v0.14.0` onward, any new extreme player intent, bug scenario, Player Advocate finding, MiroFish intake candidate, DeepSeek eval drift, or expert-review boundary sample must be triaged into `current_matrix`, `future_sample_pool`, or `discarded` according to `指导大纲/流程制度/测试矩阵演进规则.md`; untriaged samples block phase completion.
- Player Advocate playtest gate is now a project-level process. From `v0.14.0` onward, player-facing/runtime small versions need a 10-round player-view walkthrough, and rc needs a 50-round walkthrough. v0.14 upgrades high-risk player-facing phases that touch route continuation, location entry, faction prerequisites, hidden facts, or old saves to 20 rounds, and upgrades v0.14 rc to 60 rounds. Records live under the current version docs and must pass `check:player-advocate-gate` before claiming the phase is complete unless the phase is pure docs/CI/internal and the exemption is recorded. The gate script rejects placeholder or empty records and enforces filled round rows, yes/no understanding, and next-step understanding thresholds.
- MiroFish handoff is now part of the phase gate for canon/IF/NPC/faction/route/hidden-fact work. Current v0.18 packages under `指导大纲/vMiroFish/intake-reviews/v0.18.0/` passed intake review and were absorbed only as RebornG-owned candidate/rule/test material. v0.19 preferred request files are drafted under `指导大纲/vMiroFish/requests/v0.19.0/`; MiroFish output remains candidate material only, not canon, not runtime authority, and not DeepSeek authority.
- v0.13 MiroFish packages `qingmao_npc_memory_motive_pack`, `qingmao_faction_reputation_pressure_pack`, and `qingmao_public_event_chronicle_pack` are delivered under `指导大纲/vMiroFish/intake-reviews/v0.13.0/` and passed intake review. They may feed only candidate/rule drafts and tests; no additional MiroFish package is needed before a1/a2 unless a later subject allowlist, escalation precondition, or narrower public-event subset proves necessary.
- Before any living-world, free-intent, NPC memory, canon/IF adjudication, or Qingmao living-loop runtime work, read `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-设计门禁输出.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-活世界状态协议字段表.md`, and `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-测试矩阵.md`; World Intent Engine is an entry adjudicator/router, not a replacement for existing action/combat/resource/refine/story/canon/store authority.

For fuller current facts, read `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` first, then `指导大纲/v0.19.0/codex/00-总览/README.md`, then `指导大纲/v0.18.0/codex/00-总览/README.md`.

## Hard Rules

- DeepSeek writes narrative, candidates, clues, rumors, requests, and pressure only. Local canon and engine own numeric facts, rewards, locations, battles, fate, and endings.
- Follow `canon -> types/schema -> engine -> store -> UI -> tests/docs` for runtime work.
- Bump `SAVE_FORMAT_VERSION` only when adding persistent fields, and add migration/defaults/tests in the same change.
- Do not modify `deepseek密钥.txt`, `.env`, `.codex` runtime state, plugin cache, SQLite state/log files, or hibernation files unless the user explicitly asks.
- Do not use subagents unless the user explicitly asks for subagents, delegation, or parallel agent work.
- Do not edit `指导大纲/大方向` directly unless the user approves converting those external recommendations into project-owned docs.
- Do not use `git add -A` in this repository while the worktree contains historical dirty files. Stage explicit paths only, and keep each small-version commit boundary narrow.

## Skill Routing

- RebornG governance, version scope, proactive requirement review: `reborn-expert-council`
- Game systems, Zustand, DeepSeek pipeline, economy, save, tests: `game-dev-text`
- Reverend Insanity lore, Gu, recipes, paths, Treasure Yellow Heaven, canon/IF boundaries: `reverend-insanity-lore`
- Combat presentation, battlefield UI, GSAP/Motion, visual assets, reduced motion: `reborn-combat-motion`

## Project Memory

- Completed milestone docs: `指导大纲/v0.10.0/codex/00-总览/`, `指导大纲/v0.11.0/codex/00-总览/`
- Current active draft docs: `指导大纲/v0.19.0/codex/00-总览/`
- Current completed draft docs: `指导大纲/v0.18.0/codex/00-总览/`
- Previous completed docs: `指导大纲/v0.17.0/codex/00-总览/`
- Previous completed draft docs: `指导大纲/v0.16.0/codex/00-总览/`, `指导大纲/v0.15.0/codex/00-总览/`, `指导大纲/v0.14.0/codex/00-总览/`, `指导大纲/v0.13.0/codex/00-总览/`, `指导大纲/v0.12.0/codex/00-总览/`
- World intent hard gate: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`
- a2 design first cut: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-设计门禁输出.md`
- a2 field table: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-活世界状态协议字段表.md`
- a2 test matrix: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-测试矩阵.md`
- a2 runtime skeleton: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-runtime-skeleton.md`
- a2 controlled patch API: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-controlled-patch-api.md`
- a2 Qingmao action backflow: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-qingmao-action-backflow.md`
- a3 local intent adjudication: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-第一刀-自由意图本地裁决引擎.md`
- a3-2 free-goal panel: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-2-自由目标面板与playerGoals写入.md`
- b1 original fact pilot: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b1-原著事实抽取试点.md`
- b1-2 fact-card helper bridge: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b1-2-事实卡读取与裁决引用桥.md`
- b2 visible investigation first cut: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-可见范围调查第一刀.md`
- b2-2 Bai contact pressure sample: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-2-白家接触压力样本.md`
- b2-3 Fang Yuan hidden-protection failure sample: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-3-方源隐藏保护失败样本.md`
- b2-4 investigation follow-up hints: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-4-调查结果后续提示候选.md`
- b2 lightweight review and upgrade decision: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-轻量复盘与升级决策.md`
- b2-5 Bai contact-window formal action: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-5-白家接触窗口正式行动.md`
- b2-6 Qingmao escape-route preparation: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-6-逃离青茅山路线准备链.md`
- v0.11 rc closure: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-rc-质量收束记录.md`
- Testing engineering gate: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-测试工程化总纲.md`
- a3 ruling sample matrix: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-裁决样本矩阵.md`
- Process evolution: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-开发流程进化专项.md`
- User input protocol: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-用户输入协议.md`
- Expert phase gates: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-专家团阶段门禁.md`
- Process templates: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-模板集.md`
- External-mode mapping: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-外部模式借鉴映射.md`
- Project dashboard: `指导大纲/项目仪表盘.md`
- Historical dashboard source: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- Git commit/push policy: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-Git提交与推送制度.md`
- b2 visible investigation startup: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-启动检查-可见范围调查.md`
- v0.12 formal draft and carryover: `指导大纲/v0.12.0/codex/00-总览/`
- MiroFish protocol: `指导大纲/v0.12.0/codex/00-总览/v0.12.0-MiroFish资料需求与交付协议.md`
- v0.12 process gate: `指导大纲/v0.12.0/codex/00-总览/v0.12.0-process-1-GitHub-CI工程门禁.md`
- v0.12 rc closure: `指导大纲/v0.12.0/codex/00-总览/v0.12.0-rc-质量收束记录.md`
- v0.13 draft entry: `指导大纲/v0.13.0/codex/00-总览/README.md`
- v0.13 expert startup meeting: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-专家团启动会纪要.md`
- v0.13 MiroFish protocol: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-MiroFish资料需求与交付协议.md`
- v0.13 Git plan: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-Git提交与推送计划.md`
- v0.13 Git safety process: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-process-0-Git安全收束.md`
- v0.13 a1 social-memory protocol: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-a1-社会记忆协议.md`
- v0.13 a1 field/write gate: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-a1-字段表与写入权限.md`
- v0.13 a1 test matrix: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-a1-测试矩阵.md`
- v0.13 a2 NPC memory projection: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-a2-NPC记忆投影引擎第一刀.md`
- v0.13 b1 faction stance projection: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-b1-势力态度压力投影第一刀.md`
- v0.13 b2 public event chronicle: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-b2-事件编年史与公开摘要第一刀.md`
- v0.13 b3 social followups: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-b3-后续行动候选第一刀.md`
- v0.13 b4 Player Advocate UI: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-b4-Player-Advocate可读性UI第一刀.md`
- v0.13 rc Player Advocate 50-round record: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-rc-Player-Advocate-50轮走查记录.md`
- v0.13 process-1 GitHub/CI gate: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-process-1-GitHub-Actions远端门禁复核.md`
- v0.13 process-2 Git baseline sync: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-process-2-Git基线同步专项.md`
- v0.13 rc closure: `指导大纲/v0.13.0/codex/00-总览/v0.13.0-rc-质量收束记录.md`
- v0.14 draft entry: `指导大纲/v0.14.0/codex/00-总览/README.md`
- v0.14 route-continuation rules: `指导大纲/v0.14.0/codex/00-总览/v0.14.0-路线承接规则总纲.md`
- v0.14 Player Advocate upgrade rule: `指导大纲/v0.14.0/codex/00-总览/v0.14.0-Player-Advocate轮次升级规则.md`
- v0.14 a1 route gate: `指导大纲/v0.14.0/codex/00-总览/v0.14.0-a1-路线承接设计门禁.md`
- v0.14 MiroFish protocol and requests: `指导大纲/v0.14.0/codex/00-总览/v0.14.0-MiroFish资料需求与交付协议.md`, `指导大纲/vMiroFish/requests/v0.14.0/`
- v0.16 completion docs: `指导大纲/v0.16.0/codex/00-总览/README.md`, `v0.16.0-a2-仪表盘与流程入口收束.md`, `v0.16.0-b1-行动与自由目标工作台第一刀.md`, `v0.16.0-b2-蛊道工作台第一刀.md`, `v0.16.0-b3-高阶与演武入口场景化.md`, `v0.16.0-b4-权威归并验证.md`, `v0.16.0-rc-质量收束记录.md`, and `v0.16.0-rc-Player-Advocate-60轮走查记录.md`
- v0.17 completion docs: `指导大纲/v0.17.0/codex/00-总览/README.md`, `v0.17.0-启动审查与范围冻结.md`, `v0.17.0-小版本执行路线图.md`, `v0.17.0-MiroFish资料需求与交付协议.md`, `v0.17.0-测试矩阵.md`, and `v0.17.0-rc-质量收束记录.md`
- v0.18 completion docs: `指导大纲/v0.18.0/codex/00-总览/README.md`, `v0.18.0-总体开发大纲.md`, `v0.18.0-启动审查与范围冻结.md`, `v0.18.0-小版本执行路线图.md`, `v0.18.0-MiroFish资料需求与交付协议.md`, `v0.18.0-测试矩阵.md`, `v0.18.0-真相源索引.md`, `v0.18.0-需求决策池.md`, `v0.18.0-Git提交与推送计划.md`, `v0.18.0-b1-青茅离开正式门槛样板.md`, `v0.18.0-b2-路线候选承接第一刀.md`, `v0.18.0-b3-南疆低阶区域事实与路线面板.md`, `v0.18.0-b4-前期账本压力回流.md`, `v0.18.0-b5-商队散修商家城外缘入口边界.md`, `v0.18.0-b1-b5-Player-Advocate-100轮走查记录.md`, `v0.18.0-rc-Player-Advocate-60轮走查记录.md`, and `v0.18.0-rc-质量收束记录.md`
- v0.18 a1/a2 gate docs: `指导大纲/v0.18.0/codex/00-总览/v0.18.0-a1-路线地点存档BFF设计门禁.md`, `指导大纲/v0.18.0/codex/00-总览/v0.18.0-a2-MiroFish-intake与字段表.md`, and `指导大纲/vMiroFish/intake-reviews/v0.18.0/2026-05-19-v018-three-pack-intake-review-summary.md`
- v0.19 startup review docs: `指导大纲/v0.19.0/codex/00-总览/README.md`, `v0.19.0-总体开发大纲.md`, `v0.19.0-启动审查与范围冻结.md`, `v0.19.0-小版本执行路线图.md`, `v0.19.0-MiroFish资料需求与交付协议.md`, `v0.19.0-测试矩阵.md`, `v0.19.0-真相源索引.md`, `v0.19.0-需求决策池.md`, and `v0.19.0-Git提交与推送计划.md`
- v0.19 MiroFish request docs: `指导大纲/vMiroFish/requests/v0.19.0/2026-05-19-v019-public-canon-boundary-pack.md`, `2026-05-19-v019-representative-playthrough-anchor-pack.md`, and `2026-05-19-v019-release-art-caption-boundary-pack.md`
- MiroFish handoff area: `指导大纲/vMiroFish/`
- MiroFish first handshake review: `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`
- MiroFish latest completed intake: `指导大纲/vMiroFish/intake-reviews/v0.13.0/2026-05-16-v013-three-pack-intake-review-summary.md`
- MiroFish v0.13 package area: `指导大纲/vMiroFish/intake-reviews/v0.13.0/`
- Long-route docs: `指导大纲/长期路线/`
- Long architecture route: `指导大纲/长期路线/RebornG-长期架构演进路线图-纯前端到薄后端.md`
- Long narrative anti-collapse and Qingmao IF placement: `指导大纲/长期路线/RebornG-长线叙事防崩坏与青茅IF矩阵落位.md`
- Latest handoff notes: newest files in `codex上下文信息/`
- Design learnings: `.learnings/LEARNINGS.md`
- Historical bugs: `.learnings/ERRORS.md`
- Project-level process docs: `指导大纲/流程制度/`
- Player Advocate playtest gate: `指导大纲/流程制度/Player-Advocate走查制度.md`
- Player Advocate walkthrough template: `指导大纲/流程制度/Player-Advocate走查记录模板.md`
- Test matrix evolution rule: `指导大纲/流程制度/测试矩阵演进规则.md`
- External Claude Code Game Studio analysis: `指导大纲/大方向/` is reference only, not an authority source.

## Phase Gate

Before entering a new version phase:

1. Reconcile `PROJECT-STATE.md`, the current version README, roadmap, truth-source index, and latest handoff.
2. Identify which expert roles are triggered by the change.
3. Check `v0.11.0-process-1-用户输入协议.md`: classify any needed user input as direction, boundary, priority, feel, tradeoff, or release input.
4. Stop for user decision before scope expansion, canon/IF boundary changes, persistence changes, new DeepSeek authority, external runtime dependencies, writable subagents, or public commitments.
5. If the change touches living-world state, free intent, NPC memory, canon/IF adjudication, or Qingmao living-loop work, pass the world-intent hard gate before runtime code.
6. If the change touches canon facts, IF, NPC/faction reaction, route/supply/pursuit, Fang Yuan public evidence, or hidden facts, classify the MiroFish need as `blocking`, `preferred`, `optional`, or `not_needed`; if needed, say so in the user-facing answer and write/read the request and intake review under `指导大纲/vMiroFish/`.
7. If the change touches free-intent/UI/store/DeepSeek/canon-IF behavior, update or confirm the testing-engineering matrix before implementation.
8. If a new extreme player intent, bug scenario, Player Advocate finding, MiroFish intake candidate, DeepSeek eval drift, or expert-review boundary sample appears, triage it into `current_matrix`, `future_sample_pool`, or `discarded`; untriaged samples block phase completion.
9. If the change touches player-facing/runtime experience, apply the Player Advocate gate: small-version completion needs 10 walkthrough rounds, rc needs 50 rounds, and the record must be checked with `npm run check:player-advocate-gate -- <record.md> <10|50>`. Pure docs/CI/internal phases may be exempt only if documented.
10. Produce 3-5 candidate requirements only when scope is not already approved.
11. Run relevant checks and update docs/context at phase completion.
12. Update the root project dashboard `指导大纲/项目仪表盘.md` and record commit/push status in the handoff.
13. For v0.13 and later, check the current version Git plan before committing or pushing; do not push EdgeOne deployment changes automatically.

Lightweight expert roles:

- Project Lead: scope, priority, phase entry/exit.
- Lore & World Designer: world rules, canon/IF, Gu terminology, original-boundary stability.
- Systems Architect: economy, combat, save format, rewards, exploit risk.
- AI Pipeline Architect: prompt budget, DeepSeek cache/JSON/retry telemetry, validation gates.
- Player Advocate: onboarding, readable choices, pacing, meaningful consequences, and 10/50-round player-view walkthrough gates.
- Frontend & Motion Lead: UI readability, motion, asset manifest, mobile/reduced-motion.
- QA/Test Engineering Guardian: tests, sample matrices, quantitative gates, build, save compatibility, release notes.
- Git/rollback Steward: commit boundary, push cadence, branch suitability, explicit stage scope, dirty-worktree isolation, and recovery points.
- Content Designer: encounters, plot arcs, IF branches, content-pack diversity.
- Dev Environment Steward: Codex/CodeBuddy stability, disk/plugin/cache safety, context handoff.
