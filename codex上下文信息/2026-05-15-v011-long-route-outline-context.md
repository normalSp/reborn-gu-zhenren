# 2026-05-15 v0.11 long-route outline context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Package baseline remains `0.9.0`.
- Public release baseline remains `v0.9.0`.
- Completed local development milestone: `v0.10.0`.
- Runtime `SAVE_FORMAT_VERSION` remains `21`.
- Runtime DeepSeek model remains `deepseek-v4-flash`.
- No runtime source was changed in this documentation pass.

## User Direction

The user wants the long-term vision written into project docs before implementation:

- Final target is a living Reverend Insanity-inspired Gu world where the player feels like they crossed into another life.
- Development must be broken into small requirements and implemented step by step.
- Previous work moved too quickly into Gu Immortal/high-rank topics before Gu Master low-rank life was stable.
- Big-era starts, such as being born in Theft Heaven Demon Venerable's era, are desirable but remote-future work.

## Documents Added

- `指导大纲/长期路线/README.md`
- `指导大纲/长期路线/RebornG-活世界长期路线图-v0.11至v1.0.md`
- `指导大纲/长期路线/世界意图裁决引擎-设计总纲.md`
- `指导大纲/长期路线/大时代开局远期扩展池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-总体开发大纲.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-启动审查与范围冻结.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-世界意图裁决引擎专项.md`

## Documents Updated

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-完成与成果锁定.md`
- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-后续专项池.md`
- `codex上下文信息/2026-05-15-v010-completion-lock-context.md`

## Proposed v0.11 Mainline

`v0.11.0` draft theme:

`活世界地基与自由意图闸门`

Recommended stage split:

1. `v0.11.0-a0` visible old-debt cleanup.
2. `v0.11.0-a1` architecture and save hardening.
3. `v0.11.0-a2` living-world state protocol.
4. `v0.11.0-a3` free-intent adjudication engine.
5. `v0.11.0-b1` original-fact extraction pilot.
6. `v0.11.0-b2` Qingmao minimal living-world loop.
7. `v0.11.0-rc` quality closure.

## Important Correction

The user's examples about wolf tide, spirit spring exhaustion, First Gen Gu Yue, Bai Ning Bing extremity, Fang Yuan hidden reset, and post-Qingmao route choice are discussion examples, not frozen anchor facts.

Qingmao canon/IF work must first extract original facts from local original source material and store only summaries, source pointers, and design decisions. Do not copy long original text into project docs or prompts.

## Pending User Decisions

Before runtime implementation, ask the user to approve or adjust:

1. Whether `v0.11.0` mainline is officially `活世界地基与自由意图闸门`.
2. Whether `v0.11.0-a0` visible old-debt cleanup enters first.
3. Whether `v0.11.0-a2/a3` may introduce persistent fields, with a `SAVE_FORMAT_VERSION` bump decided per actual field list.
4. Whether full Qingmao original plot anchors are deferred to `v0.12.0`.
5. Whether big-era starts remain in long-term pool only.

## Boundaries

- Do not start v0.11 runtime work until the user approves the scope.
- Do not evaluate or switch models unless the user reverses the prior decision.
- Do not create Sub-Agent TOML yet.
- Do not edit `指导大纲/大方向` directly.
- DeepSeek may understand intent and narrate options; local engine owns feasibility, rewards, locations, NPC life/death, canon facts, IF deviation, and save writes.
