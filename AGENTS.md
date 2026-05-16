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
- `v0.11.0-process-1b` project dashboard and Git policy are established. Every phase completion must update `v0.11.0-项目仪表盘.md`; every handoff must record commit/push status according to `v0.11.0-Git提交与推送制度.md`.
- `v0.11.0-b2` first slice through b2-6 is complete: investigating Bai clan can write visible `knownFacts/actionConsequences/factionPressure` as a contact opportunity; investigating Fang Yuan writes hidden ref plus public failure `actionConsequences/npcMemories` without leaking hidden causality; investigating spirit spring remains hidden-fact protected; Bai follow-up hints can become a formal contact-window action; confirmed escape goals can execute the first Qingmao route-preparation action. A/B are done and C Fang Yuan public-evidence inquiry is deferred.
- `v0.11.0-rc` quality closure is complete: full unit tests, type check, build, runtime/Qingmao asset scans, production-preview smoke, FreeGoalPanel e2e, long e2e, and key Qingmao region/battlefield e2e pass.
- `v0.12.0` is complete as a local development milestone: a1/a2/b1/b2/b3/process-1 and rc quality closure pass. `v0.12` starts from Qingmao original fact cards and canon anchors, then Qingmao low-rank IF matrix, route/supply/pursuit, lightweight NPC/faction reaction, Fang Yuan public-evidence inquiry after more public facts, and GitHub/CI as a process sidecar. Next step is `v0.13.0` startup review and scope freeze.
- `v0.12.0-process-1` GitHub/CI engineering gate is established: `.github/workflows/ci.yml` runs the deterministic quality gate, PR/issue templates require phase scope, user decision, MiroFish need, save-format impact, DeepSeek/hidden-fact boundaries, dashboard/handoff updates, and verification evidence. Playwright smoke is manual via `workflow_dispatch run_e2e=true` unless later promoted by user decision.
- `v0.12.0-rc` quality closure passed: `npm test -- --reporter=dot`, `npx tsc --noEmit --pretty false`, `npm run build`, runtime/Qingmao/player-visible-copy scans, production-preview smoke, FreeGoalPanel e2e, Qingmao region/battlefield e2e, and long e2e all pass.
- `v0.13.0` is complete as a local development milestone. Mainline was `NPC 与势力反应系统`: `v0.13.0-a1` social-memory protocol/field table/test matrix, `v0.13.0-a2` read-only NPC memory projection, `v0.13.0-b1` read-only faction stance/pressure projection, `v0.13.0-b2` read-only prompt-safe public event chronicle, `v0.13.0-b3` candidate-only social followups, `v0.13.0-b4` FreeGoalPanel social-impact foldout, `v0.13.0-process-1` remote Actions gate, `v0.13.0-process-2` Git baseline sync, and `v0.13.0-rc` quality closure are complete. GitHub Actions runs `25965710557` and `25965994252` passed after syncing the baseline and moving CI Node to `22.12.0`. Retrospective `v0.13.0-rc` Player Advocate 50-round gate passed on 2026-05-17 with 94% next-step understanding and zero P0/P1 player blockers. Current next step is next-version startup review and user decision for `v0.14.0` direction. Do not upgrade named NPC/faction rules, persistent social ledgers, formal standing/warrant/recruitment/tasks, or DeepSeek authority without user decision.
- Player Advocate playtest gate is now a project-level process. From `v0.14.0` onward, player-facing/runtime small versions need a 10-round player-view walkthrough, and rc needs a 50-round walkthrough. Records live under the current version docs and must pass `check:player-advocate-gate` before claiming the phase is complete unless the phase is pure docs/CI/internal and the exemption is recorded. The gate script rejects placeholder or empty records and enforces filled round rows, yes/no understanding, and next-step understanding thresholds.
- MiroFish handoff is now part of the phase gate for canon/IF/NPC/faction/route/hidden-fact work. Current b1 package `qingmao_route_supply_pursuit_pack_export_ready.json`, b2 package `qingmao_faction_pressure_pack_export_ready.json`, and b3 package `fang_yuan_public_evidence_pack_export_ready.json` passed intake review and may feed only candidate/rule drafts; MiroFish output is not canon, not runtime authority, and not DeepSeek authority.
- v0.13 MiroFish packages `qingmao_npc_memory_motive_pack`, `qingmao_faction_reputation_pressure_pack`, and `qingmao_public_event_chronicle_pack` are delivered under `指导大纲/vMiroFish/intake-reviews/v0.13.0/` and passed intake review. They may feed only candidate/rule drafts and tests; no additional MiroFish package is needed before a1/a2 unless a later subject allowlist, escalation precondition, or narrower public-event subset proves necessary.
- Before any living-world, free-intent, NPC memory, canon/IF adjudication, or Qingmao living-loop runtime work, read `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-设计门禁输出.md`, `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-活世界状态协议字段表.md`, and `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a2-测试矩阵.md`; World Intent Engine is an entry adjudicator/router, not a replacement for existing action/combat/resource/refine/story/canon/store authority.

For fuller current facts, read `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` first, then `指导大纲/v0.13.0/codex/00-总览/README.md`, then `指导大纲/v0.12.0/codex/00-总览/README.md`.

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
- Current formal draft docs: `指导大纲/v0.13.0/codex/00-总览/`
- Previous completed draft docs: `指导大纲/v0.12.0/codex/00-总览/`
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
- Project dashboard: `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
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
8. If the change touches player-facing/runtime experience, apply the Player Advocate gate: small-version completion needs 10 walkthrough rounds, rc needs 50 rounds, and the record must be checked with `npm run check:player-advocate-gate -- <record.md> <10|50>`. Pure docs/CI/internal phases may be exempt only if documented.
9. Produce 3-5 candidate requirements only when scope is not already approved.
10. Run relevant checks and update docs/context at phase completion.
11. Update the project dashboard and record commit/push status in the handoff.
12. For v0.13 and later, check the current version Git plan before committing or pushing; do not push EdgeOne deployment changes automatically.

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
