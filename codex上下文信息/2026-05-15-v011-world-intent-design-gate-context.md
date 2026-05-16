# 2026-05-15 v0.11 world intent design gate context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Completed local development milestone: `v0.10.0`.
- Proposed next mainline: `v0.11.0 活世界地基与自由意图闸门`.
- No runtime code was changed in this pass.

## User Concern

The user identified `World Intent Engine` as a future foundation and asked how to avoid conflicts with existing subsystems before implementation. The user also asked how to absorb design ideas from external projects and papers without losing project stability.

## Gate Added

New hard gate:

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎-设计门禁.md`

This gate is required before runtime work on:

- `v0.11.0-a2` living-world state protocol.
- `v0.11.0-a3` free-intent adjudication engine.
- `v0.11.0-b2` Qingmao minimal living-world loop.

## Integration Rule

The World Intent Engine is not a replacement for existing systems. It is an entry adjudicator and router:

`player free goal -> intent candidate -> local ruling -> existing action protocol/local engines -> ledger/save -> DeepSeek narrative backflow`

It must not directly grant rewards, change locations, mutate NPC life/death, rewrite canon anchors, or bypass combat/resource/refinement/story/store authority.

## External Ideas Mapped

- Concordia: GM-style grounded adjudication -> RebornG local Gu-world GM.
- Generative Agents: memory/reflection/planning -> bounded structured NPC memory and faction reaction.
- AI Town: shared state/transactions/simulation -> store actions with explicit patch/log/effect ownership.
- TextWorld: text action spaces/testability -> finite intent kinds, legal/illegal target tests.
- ReAct/Reflexion/Tree of Thoughts: candidate generation/failure learning/multi-path search -> DeepSeek can propose 3-5 options, local engine filters and scores them.

No external runtime dependency is approved by this gate.

## Updated Docs

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-启动审查与范围冻结.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎专项.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- Global skills: `reborn-expert-council`, `game-dev-text`

## Next Decision

User decision:

- D-011-011 is approved as a hard prerequisite before `a2/a3/b2`.

After approval, the next implementation sequence remains:

1. Freeze v0.11 scope.
2. Do `v0.11.0-a0` visible old-debt cleanup.
3. Do `v0.11.0-a1` architecture/save hardening.
4. Execute the design gate before starting `a2/a3/b2` runtime work.
