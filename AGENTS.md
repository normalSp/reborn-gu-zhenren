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

- Package baseline: `1.0.0`.
- Save format: `SAVE_FORMAT_VERSION = 24`; `v0.11.0-a2` runtime added persistent `livingWorldState`, `v1.1.0-b1` added the single aggregate `routeLocationState`, and `v1.2.0-b2` added the single aggregate `survivalEconomyState` minimum pressure ledger with migration/defaults/tests in the same change.
- Runtime DeepSeek model: `deepseek-v4-flash`.
- Pre-v1.1 bug cleanup is complete: new character creation no longer stalls at `等待天命显现...`, rank-five ascension UI requires `五转巅峰`, edited immortal/ascension saves dedupe Gu into aperture storage, volatile store content has been moved out of the cacheable DeepSeek system prompt, and mobile DebugOverlay no longer blocks player controls. Local verification passed focused unit/e2e, full unit, type check, build, scans, full e2e, long e2e, production-preview smoke, and a 3-sample `deepseek-v4-flash` live eval with cacheHitRatio `0.8157`. No save fields, save-format bump, model switch, or DeepSeek authority expansion was added.
- `v0.9.0` through `v1.2.0` are completed or locked milestones. Their phase lists, commit/run evidence, and detailed records are indexed in `指导大纲/historical-index.md`; do not treat old version docs as current gates unless AGENTS, PROJECT-STATE, current version docs, or a project-level process explicitly points to them.
- Still-current historical foundations: `v0.11.0` established `livingWorldState`, World Intent Engine, user-input protocol, and dashboard/Git discipline; `v0.12.0` established MiroFish intake, fact-card/canon-anchor/IF governance, and CI templates; `v0.14.0` established Player Advocate and test-matrix evolution gates; `v1.0.0` established the formal release wording and release-presentation asset boundary.
- `v1.0.0` is complete as a local development milestone and public release prep has user approval. EdgeOne deployment remains user-owned via CodeBuddy; Codex must not auto-deploy. Title screen hero and OG image are release presentation assets only, not gameplay/canon authority.
- `v1.1.0` is complete as a local development milestone: `路线、地点与区域状态地基`. User approved D-001 through D-024, including option A, a0/a1/a2 before runtime, Qingmao -> Southern Border early outer edge only, no BFF/backend, no DeepSeek authority expansion, 180-round rc Player Advocate if save format is bumped, `v1.1.0-process-2`, `historical-index.md`, compressed old-version display, a v1.6 stale-entrypoint checker plan, b1 `SAVE_FORMAT_VERSION = 23`, a single aggregate `routeLocationState`, conservative v22->v23 migration, b1 minimal route/location/region scope, b1 test gates, and a2 topic-sliced MiroFish/base-pack use. Implementation added only `routeLocationState`, canon allowlist, local `v110-route-location-state` engine, store action, world-panel route tab, tests, v110 e2e, T0 deterministic soak, and 180-round Player Advocate record. D-025 was later separately approved and executed as a small live DeepSeek drift probe (`deepseek-v4-flash`, 3 samples x 4 rounds). The first final run found no route/location formal authority drift but did find one P0 hidden-name echo under adversarial input; runtime mitigation removed protected hidden-fact hardcoding from `context-builder` and added L4 `C27 隐藏因果名词保护`. User then approved C27 clean re-probe; clean-final passed the blocking gate with 12/12 accepted, P0=0, P1=0, P2=1. Do not expand this into a claim that large-scale long live narrative quality is fully verified. Current docs: `指导大纲/historical-index.md`, `指导大纲/长期路线/RebornG-v1.1至v2.0长期路线重整草案.md`, `指导大纲/长期路线/RebornG-外部活世界参考映射.md`, `指导大纲/v1.1.0/codex/00-总览/`, `指导大纲/v1.1.0/codex/00-总览/v1.1.0-D025-live-drift-probe记录.md`, `指导大纲/流程制度/长线叙事漂移测试制度.md`, `指导大纲/流程制度/全书知识库治理制度.md`, v1.1 MiroFish intake review `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-19-v110-three-pack-intake-review-summary.md`, and full-book base-pack usage plan `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-20-全书基础包入库使用计划.md`.
- `v1.2.0` is complete as a local development milestone: `低阶蛊师生存与经济正式化第一阶段`. User approved D-120-001 through D-120-010, D-121-001 through D-121-007, D-122-001 through D-122-007, and D-123 through D-134 for conservative v1.2 closure. b1 projection-only runtime, b2 v24 minimum ledger, b3 refinement-preparation readability, b4 market-window boundary, process-1 anti-farm/save/rollback, process-2 deterministic drift/knowledge review, and rc 80-round Player Advocate are complete. Runtime promotes existing v0.15 refinement-boundary and market-window local actions into `LowRankSurvivalEconomyPanel`, using `survivalEconomyState` only as a minimum pressure ledger. v1.2 did not open formal inventory/currency/price table/trade settlement, real consumption/maintenance/refinement-failure settlement, black market/commission/stable arbitrage, DeepSeek economy authority, live DeepSeek drift probe, public wording, BFF/backend, or automatic deployment. Completion wording is only `低阶生存经济第一阶段`, not a full economy system.
- `v1.3.0-a2` is the current active draft: `NPC 与势力长期关系第二层`. User approved D-130-001 through D-130-009 and D-131-001 through D-131-007. v1.3 b1 must stay projection-only, must not bump `SAVE_FORMAT_VERSION = 25`, must not add `socialRelationState`, must use existing `livingWorldState.npcMemories`/`factionPressure`/`actionConsequences` only as projection evidence, and must keep legacy fields like `npcRelations`/`standings`/`npcContacts`/`dynamicNPCs` out of v1.3 authority unless a later normalization gate promotes them. a2 reuses v0.13 MiroFish NPC memory/motive, faction pressure, and public event chronicle packs as candidate/rule/test material; the full-book base is only archive/source-pointer inventory and coverage reference. b1 needs no new MiroFish package or live extraction. Formal named NPC allowlists, wanted/recruitment/blockade conclusions, hidden-adjacent/Fang Yuan public-evidence consequences, NPC life/death, or canon promotion remain blocking and require separate user approval. v1.3-rc live probe is approved in principle with model fixed to `deepseek-v4-flash`, but cost, sample count, rounds, and acceptance criteria still require user confirmation at rc. Current docs: `指导大纲/v1.3.0/codex/00-总览/`, especially `v1.3.0-a1-NPC势力关系save-format设计门禁.md` and `v1.3.0-a2-MiroFish-NPC势力关系topic-slice-intake.md`, plus project process `指导大纲/流程制度/Skill同步审计制度.md`.
- Skill sync audit is now a project-level process. From `v1.3.0-a0` onward, version startup, phase completion, rc, and cross-version process changes must audit triggered skills and record each as `updated`, `no_update_needed`, `deferred_with_reason`, or `blocked` according to `指导大纲/流程制度/Skill同步审计制度.md`. At minimum check `reborn-expert-council`, `game-dev-text`, `reverend-insanity-lore`, and conditionally `reborn-combat-motion` / `mirofish-reborng-export`.
- Dirty-worktree consolidation has removed deprecated manual/public test save fixtures from active gates. `测试存档/` and `public/test-saves/` are deprecated and ignored; do not recreate them. Long E2E now uses current Playwright harness/spec coverage instead of the old v070 fixture-loader spec. `.cursor/` is local Cursor configuration and ignored.
- Asset consolidation rule: runtime image maps and `public/rebrng/**` assets must land together and pass `npm run check:runtime-assets`; `doc/art/**` and `artifacts/**` are separate evidence/material commits; root `bgm/` audio files are local fan-pack staging and ignored unless the user explicitly approves runtime promotion into `public/audio/` plus source-manifest registration. v1.2-b2 approved the current BGM runtime-promotion review; runtime audio must still live under `public/audio/` and pass manifest reference checks. Text manifests/prompts under `bgm/` may be tracked.
- `v1.1.0` verification passed focused v110 tests, `tsc`, copy/assets scans, full unit tests (141 files / 778 tests), build, v110 e2e, 180-round Player Advocate gate, full e2e (91 tests), long e2e (29 tests), and production-preview smoke. Production preview intentionally still shows the v1.0 public release label because v1.1 public release wording has not been approved.
- `v1.1.0-a1` route/location/save-format design gate is approved at `指导大纲/v1.1.0/codex/00-总览/v1.1.0-a1-route-location-save-format设计门禁.md`; `v1.1.0-a2` field/migration/topic-slice gate is complete at `指导大纲/v1.1.0/codex/00-总览/v1.1.0-a2-字段表迁移矩阵与主题切片门禁.md`; `v1.1.0-rc-Player-Advocate-180轮走查记录.md` passed the gate.
- Test matrix evolution is now a project-level process. From `v0.14.0` onward, any new extreme player intent, bug scenario, Player Advocate finding, MiroFish intake candidate, DeepSeek eval drift, or expert-review boundary sample must be triaged into `current_matrix`, `future_sample_pool`, or `discarded` according to `指导大纲/流程制度/测试矩阵演进规则.md`; untriaged samples block phase completion.
- Long narrative drift testing is now a project-level process. From `v1.1.0-process-2` onward, runtime phases touching route/location/region/NPC/faction/economy/combat aftermath/free intent/DeepSeek narrative must run or explicitly exempt the long narrative drift gate in `指导大纲/流程制度/长线叙事漂移测试制度.md`. Live DeepSeek drift probes require separate user approval for cost, model, samples, and round count.
- Full-book knowledge-base governance is now a project-level process. MiroFish output remains in `指导大纲/vMiroFish/` as candidate material; RebornG-owned knowledge index entries live under `指导大纲/知识库/蛊真人/`; runtime canon remains limited to reviewed and tested `src/canon/*.json` subsets. Full-book base packages live at `指导大纲/vMiroFish/基础包/` and are only archive/source-pointer inventory until a topic-specific intake review promotes rewritten summaries or test samples. Knowledge-base entries must not become DeepSeek visible context or player-visible hidden facts unless a current version gate explicitly promotes a safe summary.
- Player Advocate playtest gate is now a project-level process. From `v0.14.0` onward, player-facing/runtime small versions need a 10-round player-view walkthrough, and rc needs a 50-round walkthrough. v0.14 upgrades high-risk player-facing phases that touch route continuation, location entry, faction prerequisites, hidden facts, or old saves to 20 rounds, and upgrades v0.14 rc to 60 rounds. Records live under the current version docs and must pass `check:player-advocate-gate` before claiming the phase is complete unless the phase is pure docs/CI/internal and the exemption is recorded. The gate script rejects placeholder or empty records and enforces filled round rows, yes/no understanding, and next-step understanding thresholds.
- MiroFish handoff is now part of the phase gate for canon/IF/NPC/faction/route/hidden-fact work. Current v0.18 packages under `指导大纲/vMiroFish/intake-reviews/v0.18.0/` passed intake review and were absorbed only as RebornG-owned candidate/rule/test material. v0.19 preferred request files are drafted under `指导大纲/vMiroFish/requests/v0.19.0/`; MiroFish output remains candidate material only, not canon, not runtime authority, and not DeepSeek authority.
- v0.13 MiroFish packages `qingmao_npc_memory_motive_pack`, `qingmao_faction_reputation_pressure_pack`, and `qingmao_public_event_chronicle_pack` are delivered under `指导大纲/vMiroFish/intake-reviews/v0.13.0/` and passed intake review. They may feed only candidate/rule drafts and tests; no additional MiroFish package is needed before a1/a2 unless a later subject allowlist, escalation precondition, or narrower public-event subset proves necessary.
- Before any living-world, free-intent, NPC memory, canon/IF adjudication, or Qingmao living-loop runtime work, read `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-设计门禁输出.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-活世界状态协议字段表.md`, and `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-测试矩阵.md`; World Intent Engine is an entry adjudicator/router, not a replacement for existing action/combat/resource/refine/story/canon/store authority.

For fuller current facts, read `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` first, then `指导大纲/v1.3.0/codex/00-总览/README.md`; use `指导大纲/historical-index.md` before opening old version phase lists.

## Hard Rules

- DeepSeek writes narrative, candidates, clues, rumors, requests, and pressure only. Local canon and engine own numeric facts, rewards, locations, battles, fate, and endings.
- Follow `canon -> types/schema -> engine -> store -> UI -> tests/docs` for runtime work.
- Bump `SAVE_FORMAT_VERSION` only when adding persistent fields, and add migration/defaults/tests in the same change.
- Do not modify `deepseek密钥.txt`, `.env`, `.codex` runtime state, plugin cache, SQLite state/log files, or hibernation files unless the user explicitly asks.
- Do not use subagents unless the user explicitly asks for subagents, delegation, or parallel agent work.
- `指导大纲/大方向/` has been removed from the project; do not recreate or rely on it unless the user explicitly asks to import a specific external analysis into project-owned docs.
- Do not recreate `测试存档/` or `public/test-saves/` as active fixtures. Use Playwright harness demos, replay/eval samples, or current-version e2e fixtures instead.
- `.cursor/` is local Cursor configuration and must stay untracked.
- Do not reference root `bgm/` audio from runtime code. Runtime audio must live under `public/audio/` and be registered in the audio source manifest after user approval.
- Before entering a new small version or standalone专项, follow `指导大纲/流程制度/Git分支切换与推送制度.md`: create/switch to a semantic `codex/<version>-<phase>-<topic>` branch, record the baseline, and push after validated phase completion unless explicitly deferred.
- Before claiming a version phase complete, follow `指导大纲/流程制度/Skill同步审计制度.md`: record triggered skill sync status as `updated`, `no_update_needed`, `deferred_with_reason`, or `blocked`.
- Do not use `git add -A` in this repository while the worktree contains historical dirty files. Stage explicit paths only, and keep each small-version commit boundary narrow.

## Skill Routing

- RebornG governance, version scope, proactive requirement review: `reborn-expert-council`
- Game systems, Zustand, DeepSeek pipeline, economy, save, tests: `game-dev-text`
- Reverend Insanity lore, Gu, recipes, paths, Treasure Yellow Heaven, canon/IF boundaries: `reverend-insanity-lore`
- Combat presentation, battlefield UI, GSAP/Motion, visual assets, reduced motion: `reborn-combat-motion`

## Project Memory

- Current active draft docs: `指导大纲/v1.3.0/codex/00-总览/`.
- Current completed milestone docs: `指导大纲/v1.2.0/codex/00-总览/`.
- Previous completed milestone docs: `指导大纲/v1.1.0/codex/00-总览/`.
- Public release baseline docs: `指导大纲/v1.0.0/codex/00-总览/`.
- Historical index for completed/locked versions and old phase lists: `指导大纲/historical-index.md`.
- Project dashboard: `指导大纲/项目仪表盘.md`.
- Project-level process docs: `指导大纲/流程制度/`.
- Git dirty-worktree consolidation process: `指导大纲/流程制度/Git脏区收束制度.md`.
- Git branch switching and push process: `指导大纲/流程制度/Git分支切换与推送制度.md`.
- Skill sync audit process: `指导大纲/流程制度/Skill同步审计制度.md`.
- Current knowledge base skeleton: `指导大纲/知识库/蛊真人/`.
- MiroFish handoff area: `指导大纲/vMiroFish/`.
- Full-book MiroFish base pack: `指导大纲/vMiroFish/基础包/`; usage plan `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-20-全书基础包入库使用计划.md`.
- Long-route docs: `指导大纲/长期路线/`.
- Latest handoff notes: newest files in `codex上下文信息/`.
- Design learnings: `.learnings/LEARNINGS.md`.
- Historical bugs: `.learnings/ERRORS.md`.
- Removed external analysis: `指导大纲/大方向/` is no longer a project entrypoint; use current project-owned docs instead.

## Phase Gate

Before entering a new version phase:

1. Reconcile `PROJECT-STATE.md`, the current version README, roadmap, truth-source index, `指导大纲/historical-index.md` when old-version facts are needed, and latest handoff.
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
13. Run the Skill sync audit when triggered, and record each relevant skill as `updated`, `no_update_needed`, `deferred_with_reason`, or `blocked`.
14. For v0.13 and later, check the current version Git plan and `Git分支切换与推送制度.md` before committing or pushing; do not push EdgeOne deployment changes automatically.

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
- Skill Sync Steward: Current Sync Override freshness, triggered skill audit status, and producer/governance skill boundaries.
