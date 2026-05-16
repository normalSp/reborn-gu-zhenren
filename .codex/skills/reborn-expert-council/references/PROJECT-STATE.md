# RebornG Project State

Last updated: 2026-05-16

## Version

- Package baseline: `0.9.0`.
- Public release baseline: `v0.9.0` locked.
- Previous completed development milestone: `v0.11.0`.
- Current completed development milestone: `v0.12.0`.
- `v0.11.0` mainline: `活世界地基与自由意图闸门`.
- `v0.11.0-a0` player-visible old-debt cleanup is complete.
- `v0.11.0-a1` architecture/save hardening first round is complete: save normalization, response-pipeline observability, storage-key unification, and expert-gate checklist.
- `v0.11.0-a2` living-world state protocol design first cut, runtime skeleton first round, controlled patch API second cut, and Qingmao mountain-patrol action-backflow sample are complete.
- `v0.11.0-a3` free-intent adjudication first cut is complete: `v011-world-intent-rules.json`, `v011-world-intent-engine.ts`, and focused tests cover the approved five intent types plus extreme samples.
- `v0.11.0-a3-2` free-goal panel first cut is complete: `previewWorldIntentAction()` previews without state writes, `confirmWorldIntentGoalAction()` writes confirmed player-input goal drafts only through `living_world_engine` patch into `livingWorldState.playerGoals`, and `FreeGoalPanel` exposes the separate UI entry chosen by the user. It does not add new save fields or DeepSeek authority. Focused unit tests, `tsc`, free-goal e2e, v0.10 Qingmao e2e, build, and full `npm test` pass.
- `v0.11.0-b1` original-fact extraction pilot first cut is complete: `src/canon/qingmao-canon-fact-cards.json` stores 8 Qingmao fact cards with summaries, source pointers, visibility/classification, hidden-ref boundaries, and no original prose excerpts. `src/canon/qingmao-canon-fact-cards.test.ts` verifies the copyright/source-pointer/hidden-fact rules.
- `v0.11.0-b1-2` fact-card helper and adjudication reference bridge are complete: `src/engine/v011-qingmao-fact-cards.ts` exposes read-only fact-card helpers, safe prompt context, `PlayerKnownFact`/`HiddenFactRefState` builders, and intent-to-fact-ref mapping. `WorldIntentAdjudication.factCardRefs` now carries visible/hidden fact-card refs, while `deepSeekContract.visibleFactIds` excludes hidden fact cards. Focused tests, `tsc`, full `npm test`, and `npm run build` pass.
- `v0.11.0-process-1b` project-dashboard and Git-policy first cut is complete: `v0.11.0-项目仪表盘.md` is now the user-facing progress dashboard, `v0.11.0-Git提交与推送制度.md` defines commit/push cadence and handoff requirements, and v0.11-after items have been carried into `指导大纲/v0.12.0/codex/00-总览/`.
- `v0.11.0-b2` first slice `可见范围调查`, b2-2 Bai contact pressure sample, b2-3 Fang Yuan hidden-protection failure sample, b2-4 investigation follow-up hints, b2 lightweight review, b2-5 Bai contact-window formal action, and b2-6 Qingmao escape-route preparation chain are complete; `v0.11.0-b2-启动检查-可见范围调查.md` freezes its goals/non-goals, `v0.11.0-b2-可见范围调查第一刀.md` records implementation and verification, `v0.11.0-b2-2-白家接触压力样本.md` records the `factionPressure` opportunity sample, `v0.11.0-b2-3-方源隐藏保护失败样本.md` records the protected-failure `npcMemories/actionConsequences` sample, `v0.11.0-b2-4-调查结果后续提示候选.md` records the derived hint layer, `v0.11.0-b2-轻量复盘与升级决策.md` records A/B/C/D, `v0.11.0-b2-5-白家接触窗口正式行动.md` records the first formal follow-up action, and `v0.11.0-b2-6-逃离青茅山路线准备链.md` records the first long-goal-to-action chain.
- `v0.11.0-rc` local quality closure is complete: `v0.11.0-rc-质量收束记录.md` records full unit tests, type check, build, runtime/Qingmao asset scans, production-preview smoke, FreeGoalPanel e2e, long e2e, and key Qingmao region/battlefield e2e passing.
- `v0.11.0` testing engineering gate is established: `v0.11.0-测试工程化总纲.md` and `v0.11.0-a3-裁决样本矩阵.md` define layered tests, QA/test owner, quantitative gates, sample growth targets, and recurring evolution reviews.
- `v0.11.0-process-1` development-process evolution first version is complete: user input protocol, expert phase gates, ADR/review/templates, and external-mode mapping are established. Codex must classify user input as direction, boundary, priority, feel, tradeoff, or release input, and stop before scope expansion, canon/IF boundary changes, persistence changes, new DeepSeek authority, external runtime dependencies, writable subagents, or public commitments.
- Hard design gate approved before `v0.11.0-a2/a3/b2`: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`.
- Long-route docs: `指导大纲/长期路线/`, including `RebornG-长期架构演进路线图-纯前端到薄后端.md`.
- Current v0.11 completion docs: `指导大纲/v0.11.0/codex/00-总览/`.
- Current v0.13 formal draft docs: `指导大纲/v0.13.0/codex/00-总览/`.
- Previous v0.12 completed docs: `指导大纲/v0.12.0/codex/00-总览/`.
- `v0.12.0-a1` first cut is complete: `src/canon/qingmao-canon-fact-cards.json` expanded from the v0.11 Qingmao pilot into a v0.12 fact-card base; `src/canon/qingmao-canon-anchors.json` establishes 10 Qingmao canon anchors; `src/engine/v012-qingmao-canon-anchors.ts` exposes read-only prompt-safe anchor helpers; `src/engine/v011-qingmao-fact-cards.ts` maps more free-text intents to visible/hidden fact-card refs. Focused tests for fact cards, anchors, helper redaction, and v0.12 intent mapping pass; `npx tsc --noEmit --pretty false` and full `npm test -- --reporter=dot` also pass.
- `v0.12.0-a2` first cut is complete: `src/canon/qingmao-low-rank-if-matrix.json` defines the low-rank Qingmao IF matrix with five deviation levels, seven approved axes, cost types, and representative rules; `src/engine/v012-qingmao-if-matrix.ts` exposes read-only matching and preview helpers. Focused tests cover schema integrity, anchor/fact refs, two samples per axis, and extreme inputs such as rank-nine demands, killing Bai Ning Bing, hidden Flower Wine location, Spirit Spring secrets, First Gen truth, joining Bai clan, escaping Qingmao, resource feeding, and wolf-tide patrol. `npx tsc --noEmit --pretty false` and full `npm test -- --reporter=dot` pass after this change.
- MiroFish intake gate is established for v0.12 and later canon/IF/NPC/faction/route work. `v0.12.0-MiroFish资料需求与交付协议.md` defines when a package is `blocking`, `preferred`, `optional`, or `not_needed`; `指导大纲/vMiroFish/README.md`, `requests/README.md`, and `intake-reviews/README.md` define the handoff workflow. Current b1 request is `指导大纲/vMiroFish/requests/2026-05-16-qingmao-route-supply-pursuit-pack.md`. The current Codex thread cannot contact the MiroFish thread directly; the user must pass request files to thread `019e207b-c55d-7e23-b450-efa7a054a165`. MiroFish output is candidate-only, quote-redacted, and must pass intake review before absorption.
- MiroFish b1 package intake review and first-handshake process hardening are complete. `指导大纲/vMiroFish/v0.12.0/qingmao_route_supply_pursuit_pack_export_ready.json` contains 17 export-ready items with 35 source pointers and no forbidden quote/originalText/excerpt/verbatim fields. Review file `指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-route-supply-pursuit-pack-intake-review.md` marks the package `accepted_for_candidate_pool`: routeCandidate/supplyRequirement/pursuitTrigger may feed v0.12-b1 rule drafts, factionPressure is deferred to b2 reaction bridge, and hiddenFactRef is deferred to hidden fact gates/b3. Process file `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md` records the request -> user handoff -> delivery -> intake review -> candidate absorption loop. b1 data gate is cleared for a conservative first cut. Future major-version planning and small-phase startup reviews must proactively tell the user when a new MiroFish package is `blocking` or `preferred`; the current Codex thread cannot directly contact MiroFish thread `019e207b-c55d-7e23-b450-efa7a054a165`.
- `v0.12.0-b1` route/supply/pursuit first cut is complete: `src/canon/qingmao-route-supply-pursuit-pack.json` stores RebornG-owned rewritten rule drafts for 3 route candidates, 4 supply gaps, and 3 pursuit triggers from the reviewed MiroFish package; `src/engine/v012-qingmao-route-supply-pursuit.ts` exposes a preparation-only plan; existing `resolveQingmaoEscapeRoutePreparationAction()` now attaches route/supply/pursuit ids and source refs to the existing v22 action protocol without adding persistent fields. It still does not unlock escape, new regions, rewards, faction identity changes, NPC death, hidden facts, or DeepSeek authority. Focused tests, `tsc`, full `npm test`, `npm run build`, and FreeGoalPanel e2e pass.
- MiroFish b2 package intake review is complete. `指导大纲/vMiroFish/v0.12.0/qingmao_faction_pressure_pack_export_ready.json` contains 12 export-ready items with 34 source pointers and no forbidden quote/originalText/excerpt/verbatim fields. Review file `指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-faction-pressure-pack-intake-review.md` marks the package `accepted_for_candidate_pool`, promotable to `accepted_for_rule_draft` and `test_sample`.
- `v0.12.0-b2` NPC/faction reaction bridge first cut is complete: `src/canon/qingmao-faction-reaction-bridge.json` stores RebornG-owned rewritten rule drafts for 12 Qingmao light reaction rules; `src/engine/v012-qingmao-faction-reaction-bridge.ts` matches public known facts, action consequences, faction pressure, player goals, and last action refs into bounded reaction plans; `FreeGoalPanel` exposes a "局势反应 / 推演" entry. The action writes only existing v22 fields: `factionPressure`, `npcMemories`, `actionConsequences`, `worldClock.lastActionId`, local action ledger, and return context. It does not add persistent fields, bump save format, create standing deltas, change faction identity, grant rewards, unlock locations, settle NPC death/capture/pursuit results, mutate canon anchors, reveal hidden facts, or expand DeepSeek authority. Focused canon/engine tests, focused canon/engine/store tests, FreeGoalPanel e2e, `tsc`, full `npm test`, and `npm run build` pass.
- MiroFish b3 package intake review is complete. `指导大纲/vMiroFish/v0.12.0/fang_yuan_public_evidence_pack_export_ready.json` contains 15 export-ready items with 14 source pointers and no forbidden quote/originalText/excerpt/verbatim fields or hidden-causality terms. Review file `指导大纲/vMiroFish/intake-reviews/2026-05-16-fang-yuan-public-evidence-pack-intake-review.md` marks the package `accepted_for_candidate_pool`, promotable to `fact_card_draft`, `rule_draft`, and `test_sample`, with hidden boundary refs kept `hidden_ref_only`.
- `v0.12.0-b3` Fang Yuan public-evidence inquiry first cut is complete: `src/canon/qingmao-fang-yuan-public-evidence.json` stores RebornG-owned public evidence/rule drafts; `src/engine/v012-qingmao-fang-yuan-public-evidence.ts` matches player public inquiry text into visible public evidence and hidden boundary refs; `FreeGoalPanel` exposes a "旁证询问" entry for Fang Yuan investigations. The action writes only existing v22 fields: `knownFacts`, `hiddenFactRefs`, `npcMemories`, `factionPressure`, `actionConsequences`, `worldClock.lastActionId`, local action ledger, and return context. It does not add persistent fields, bump save format, settle tracking success/capture/escape, change Fang Yuan trajectory, reveal hidden facts, mutate canon anchors, grant rewards, unlock locations, or expand DeepSeek authority. Focused canon/engine tests, focused canon/engine/store tests, FreeGoalPanel e2e, `tsc`, full `npm test`, and `npm run build` pass.
- `v0.12.0-process-1` GitHub/CI engineering gate first cut is complete: `.github/workflows/ci.yml` establishes the deterministic quality gate on PR/push, `.github/pull_request_template.md` records RebornG-specific merge gates, and `.github/ISSUE_TEMPLATE/phase_task.yml` plus `bug_report.yml` standardize phase/bug intake. Playwright smoke remains manual via `workflow_dispatch run_e2e=true`; no branch protection, auto-deploy, auto-merge, EdgeOne config, runtime dependency, or save-format change was added.
- `v0.12.0-rc` quality closure is complete: `v0.12.0-rc-质量收束记录.md` records full unit tests, type check, build, runtime/Qingmao/player-visible-copy scans, production-preview smoke, FreeGoalPanel e2e, Qingmao region/battlefield e2e, and long e2e passing. `v0.12.0` is now complete as a local development milestone.
- `v0.13.0` mainline, first cut, v22 field strategy, `v0.13.0-process-0 Git安全收束`, and three v0.13 MiroFish package intakes are approved/complete. Mainline is `NPC 与势力反应系统`. `v0.13.0-a1` social-memory protocol/field table/test matrix is complete as a docs gate. `v0.13.0-a2` NPC memory projection first cut is complete: `src/canon/qingmao-npc-memory-rules.json`, `src/engine/v013-qingmao-npc-memory.ts`, and focused tests add read-only, non-named-subject projections only. `v0.13.0-b1` faction stance/pressure projection first cut is complete: `src/canon/qingmao-faction-stance-rules.json`, `src/engine/v013-qingmao-faction-stance.ts`, and focused tests add read-only faction pressure/opportunity projections. `v0.13.0-b2` public event chronicle first cut is complete: `src/canon/qingmao-public-event-chronicle-rules.json`, `src/engine/v013-qingmao-public-event-chronicle.ts`, and focused tests add read-only prompt-safe public summaries. `v0.13.0-b3` social follow-up candidates first cut is complete: `src/canon/qingmao-social-followup-rules.json`, `src/engine/v013-qingmao-social-followups.ts`, and focused tests add candidate-only explanation/message/cover/avoid/investigate followups. User approved b4 option A, and `v0.13.0-b4` Player Advocate readability UI first cut is complete: `FreeGoalPanel` now shows a read-only `社会影响 / 局势后续` foldout for NPC memory, faction stance, public event summaries, and social follow-up candidates; `tests/e2e/v013-social-impact-panel.spec.ts` guards hidden-fact and formal-reward leaks. `v0.13.0-process-1` first cut is complete: `.github` CI/templates are committed, `codex/**` push triggers remote Actions, run `25962959025` started and failed at type check because the remote branch lacks local historical baseline files such as package/type/TS config and older source changes. These cuts do not write store, add save fields, bump save format, create relationship/standing scores, open named NPC runtime rules, settle warrants/recruitment/tasks/rewards, expose hidden bodies, or expand DeepSeek authority. Current next step requires user decision: either start `v0.13.0-process-2 Git基线同步专项` before rc, or proceed to `v0.13.0-rc` with remote CI red. Stop before branch protection, automatic deployment, persistent social ledgers, named NPC runtime rule upgrades, formal standing/warrant/recruitment/tasks, rewards, or DeepSeek authority expansion.
- `v0.13.0-process-0` establishes per-version Git governance before a1: `v0.13.0-Git提交与推送计划.md` and `v0.13.0-process-0-Git安全收束.md` define the commit/push cadence, `Git / 回滚守门人` lightweight duty, branch/dirty-worktree risks, no `git add -A`, and no automatic EdgeOne deployment or branch protection without user decision.
- v0.13 MiroFish packages are delivered under `指导大纲/vMiroFish/intake-reviews/v0.13.0/` and passed intake review: `qingmao_npc_memory_motive_pack` (1564 items), `qingmao_faction_reputation_pressure_pack` (885 items), and `qingmao_public_event_chronicle_pack` (1153 items). The summary review is `指导大纲/vMiroFish/intake-reviews/v0.13.0/2026-05-16-v013-three-pack-intake-review-summary.md`. They may feed only `candidate_pool`, `rule_draft`, and `test_sample`; they are not canon, runtime truth, DeepSeek authority, player-visible hidden facts, or formal standing/warrant/recruitment/task/reward/location/faction/NPC-life conclusions.
- Later optional governance backlog: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-后续专项池.md`.
- Previous completed phase: `v0.10.0` locked as a local development milestone.
- Save format: `SAVE_FORMAT_VERSION = 22`.
- Runtime DeepSeek model: `deepseek-v4-flash`.

## Current Phase Facts

- `v0.10.0` theme: Qingmao three-clan regional mainline playability.
- `v0.10.0-a1` established `qingmao-region-board.json` without save-format bump.
- `v0.10.0-a2` established Qingmao clue/action candidate engine.
- `v0.10.0-b1` connected first formal Qingmao actions through existing local engines.
- `v0.10.0-b2` closed the low-rank mortal Gu and combat candidate pack without making it a reward/drop table.
- `v0.10.0-b3` closed the low-rank resource/refinement/feeding loop:
  - Moonlight Gu resource action gives `月华草 x1`.
  - Liquor Worm resource action gives `美酒 x1`.
  - White Jade Gu remains gap-display only, with no stable `碎玉片` source.
  - GuInventoryPanel shows Qingmao feeding source hints.
  - RefinePanel shows `frag_moonlight_advanced` thresholds and complete-recipe boundaries.
  - Same-scene anti-farm, single reward caps, gap non-production, and DeepSeek no-reward authority are tested.
- `v0.10.0-b4` first cut closed the initial visual/readability extension:
  - `qingmao-scene-variants.json` defines three scene variants: clan-school courtyard, front mountain patrol, and moonlit resource grove.
  - `v010-qingmao-scene-variants.ts` projects existing region actions, resource entries, and combat readiness into read-only UI cards.
  - `qingmao-visual-assets.json` registers 3 candidate SVG atmosphere assets as `candidate + generic_candidate`, not active runtime backgrounds.
  - ActionPanel shows composition, short-recording, runtime-link, and forbidden-implication lines.
  - No save-format bump, rewards, Gu, recipes, stable White Jade material source, or region persistence were added.
- `v0.10.0` is complete:
  - `npm test`, `npx tsc --noEmit --pretty false`, `npm run build`, runtime/Qingmao asset scans, v0.10 Qingmao e2e, long e2e, and production-preview smoke all pass.
  - Targeted lock verification on 2026-05-15 also passed: `npm run test:e2e -- tests/e2e/v090-b3-qingmao-battlefield.spec.ts tests/e2e/v010-qingmao-region-actions.spec.ts`, 7 tests.
  - No 500KB+ chunk warning is present.
  - Lock-review UI readability fixes ensure the Qingmao 5x3 battlefield keeps all three rows visible at desktop height; e2e now checks `c4_2` is above the action dock, not merely that 15 cells exist.
  - Bottom Gu/killer-move action cards have readable title, cost/range/target, description, counter, and utility blocks without vertical clipping in the Qingmao battlefield overlay.
  - D-006 EdgeOne public test remains out of scope.

## Hard Constraints

- DeepSeek may write narrative, candidates, clues, rumors, requests, and pressure.
- DeepSeek must not directly write registered materials, Gu, complete recipes, Immortal Gu, runtime paths, numeric rewards, locations, battle outcomes, fate, or endings.
- Local canon/engine owns formal access, rewards, battle facts, save facts, and original-world hard facts.
- Do not evaluate or propose switching away from `deepseek-v4-flash` unless the user reverses the decision.
- Do not add persistent region/resource history without explicit user approval and save-format migration.
- `three_clan_commission` remains blocked until persistent region state is approved.
- `v0.10.0` does not require EdgeOne public-test preparation; cloud release work is separate unless the user reopens D-006.

## Current Next Step

`v0.11.0` is complete as a local development milestone. The b2 living-world loop now covers visible-scope investigation, Bai contact pressure, Fang Yuan hidden-protection public failure, derived follow-up hints, Bai contact-window formal action, and Qingmao escape-route preparation. Both b2-5 and b2-6 use `action_protocol` patch, write only approved v22 fields, set `rewardPolicy = none`, and do not change faction, rewards, locations, NPC death, canon anchors, hidden facts, or DeepSeek authority. `v0.11.0-rc` verification passed: `npm test` (107 files, 632 tests), `npx tsc --noEmit --pretty false`, `npm run build`, runtime/Qingmao asset scans, `npm run check:production-preview`, `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`, `npm run test:e2e:long`, and `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts tests/e2e/v090-b3-qingmao-battlefield.spec.ts`.

User approved the `v0.12.0` formal draft scope, and `v0.12.0-a1/a2/b1/b2/b3/process-1/rc` is complete without save-format bump, rewards, route success, NPC death, faction identity changes, hidden fact reveal, tracking success/capture, Fang Yuan trajectory changes, DeepSeek authority expansion, branch protection, auto-deploy, or auto-merge. User then approved v0.13 mainline `NPC 与势力反应系统`, approved `v0.13.0-a1` design gate first, approved first-stage reuse of v22 fields rather than adding a persistent social ledger now, approved v0.13 MiroFish requests, approved per-version Git push/rollback governance through `v0.13.0-process-0`, and approved b4 UI option A. Three v0.13 MiroFish packages passed intake review. `v0.13.0-a1`, `v0.13.0-a2`, `v0.13.0-b1`, `v0.13.0-b2`, `v0.13.0-b3`, `v0.13.0-b4`, and `v0.13.0-process-1` first cuts are complete. Remote CI now runs but is red due to Git baseline mismatch, so current next step requires user decision: do `v0.13.0-process-2 Git基线同步专项` first, or proceed to `v0.13.0-rc` with local verification as authority; stop before persistent social ledger fields, named NPC runtime rule upgrades, faction identity changes, formal route/location unlocks, NPC survival/canon anchors, rewards, DeepSeek authority expansion, hidden fact reveal, formal tracking/capture systems, Fang Yuan trajectory changes, branch protection, automatic deployment, or PR-required full Playwright gates.

The long-term architecture decision is: do not do a large backend rewrite now. v1.0-before architecture remains frontend-first with local deterministic TypeScript core, static/public canon, Zustand saves, and DeepSeek runtime calls. From v0.12 onward, design public/hidden facts, canon helpers, World Intent Engine, route/supply/pursuit, and reaction bridge as backend-ready pure TS core. A thin backend/BFF is only a future gate for API-key protection, hidden/private canon delivery, cloud saves, prompt/token/cache observability, live eval archives, or public-test security. External AI life/TRPG projects, including the Bilibili `AI人生引擎` demo discussed by the user, are useful as breadth, free-input rhythm, and public-demo feedback references; no confirmed public source repo has been adopted. RebornG's core remains deterministic RPG world adjudication and original-fact depth, not a generic AI companion/chat shell or pure LLM life simulator.

The user approved a small project-order patch and then approved `v0.11.0-a1` architecture/save-hardening专项 with these conditions:

1. `v0.10.0` is now finished.
2. `v0.11.0` may start; a0 plus a1 first round are complete.
3. Defer large type splitting, engine directory reorganization, and version-prefix renaming.
4. Do not create Sub-Agent TOML yet; continue with checklist-based expert-council gates.

The user also approved D-011-011: the world-intent design gate is a hard prerequisite before `v0.11.0-a2/a3/b2`.

The user approved entering `v0.11.0-a2`, approved the first cut as design-gate output plus field table plus test matrix, and approved bumping `SAVE_FORMAT_VERSION` from `21` to `22`. Runtime skeleton now includes persistent `livingWorldState`, migration/default normalization, tests, `applyLivingWorldPatch()` rejecting DeepSeek/UI/narrative-text direct writes, and the first Qingmao mountain-patrol action backflow into `knownFacts/actionConsequences`.

The user approved four `v0.11.0-a3` scope constraints: only free-intent adjudication entry first, support only `obtain_item`/`join_faction`/`investigate`/`travel`/`long_term_goal`, DeepSeek candidate-only with local final ruling, and extreme samples in tests. First cut is implemented with no persistent write.

The user emphasized testing engineering as a core advantage and approved adding the testing plan before UI work. New cadence: every 2 minor phases do a lightweight evolution review; every major phase or rc does a full review of tests, gates, skills, docs, design drift, and process improvements.

The user approved `v0.11.0-process-1` because development flow itself is a core tool for building a living Gu world. User input must be high-value and structured, not ad hoc: direction, boundary, priority, feel, tradeoff, and release. Codex owns decomposition, implementation, testing, documentation, proposals, and process reminders.

Important correction for v0.11 planning: discussion examples such as wolf tide, spirit spring exhaustion, First Gen Gu Yue, Bai Ning Bing extremity, Fang Yuan hidden reset, and post-Qingmao route choice are not frozen canon anchors. Qingmao canon/IF work must first extract original facts from local source material and write summaries/source pointers only.

## Source Priority

1. Runtime canon and engine source.
2. `指导大纲/v0.12.0/codex/00-总览/` when discussing next scope.
3. `指导大纲/v0.11.0/codex/00-总览/` for completed v0.11 milestone facts.
4. Long-route docs in `指导大纲/长期路线/` when discussing living-world, free-intent, or era-start strategy.
5. `指导大纲/v0.10.0/codex/00-总览/` for completed milestone facts.
6. This `PROJECT-STATE.md`.
7. Latest `codex上下文信息/`.
8. `指导大纲/大方向/` as external reference only.
9. Old v0.6/v0.7/v0.8 docs and reports as historical evidence only.

## Triggered Expert Roles

- Governance or phase scope: Project Lead.
- Gu world, canon/IF, recipes, paths, rewards: Lore & World Designer.
- Economy, combat, save, exploit risk: Systems Architect.
- Prompt/context/DeepSeek telemetry: AI Pipeline Architect.
- UI/player comprehension/first rounds: Player Advocate plus Frontend & Motion Lead.
- Release/build/save compatibility: QA & Release Guardian.
- Codex stability/context/plugin/cache concerns: Dev Environment Steward.
- Git recovery and publish cadence: Git / rollback steward, jointly owned by QA & Release Guardian and Dev Environment Steward.
