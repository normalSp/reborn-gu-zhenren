# 2026-05-22 v2.1.0 D-211 decisions context

## Current branch

- `codex/v210-d211-agent-lab-decisions`

## User decisions

User approved:

- D-211-001: b1 may write Agent Lab report-only/offline runner first cut.
- D-211-002: b1 must be dry-run only, no live DeepSeek.
- D-211-003: b1 reports may write to `artifacts/v2.1.0/`.
- D-211-005: b1 must be TypeScript-first / zero new dependency.
- D-211-010: b1 MiroFish remains `not_needed`.
- D-211-012: b1 minimum gate is schema 100%, P0=0, P1=0, P2 threshold later.

User did not approve:

- D-211-004: no b1 live DeepSeek unless separately requested.
- D-211-006: no external framework PoC until self-owned AgentProposal gates pass.
- D-211-008: no read-only/analysis subagents now; future risk/benefit report needed.
- D-211-011: thin BFF/private canon/job queue/eval archive moves to v2.4+.

Conditional:

- D-211-009: memory only report-only, not formal save.
- D-211-007: do not open external SDK/agent file, shell, patch, or git permissions now; create future D-212 open-source SDK/agent intake evaluation.

## Current scope

Next recommended work is `v2.1.0-b1-Agent-Lab-report-only-offline-runner第一刀.md`.

Allowed in b1:

- TypeScript-first.
- zero new dependency.
- dry-run only.
- report-only/offline runner.
- report output under `artifacts/v2.1.0/`.
- abstract/synthetic samples only.
- AgentProposal schema + validator + WorldCore post-check.

Still forbidden:

- runtime agent.
- save fields or `SAVE_FORMAT_VERSION` bump.
- DeepSeek prompt/context/model/authority change.
- live DeepSeek.
- BFF/backend.
- external SDK/framework dependency or PoC.
- external SDK/agent file, command, patch, or git permissions.
- subagents.
- MiroFish export/intake.
- formal locations/factions/rewards/NPC life-death/canon promotion.
- EdgeOne deployment.

## Updated docs

- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-D211决策记录与开源SDK权限评估.md`
- `指导大纲/v2.1.0/codex/00-总览/README.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-需求决策池.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-小版本执行路线图.md`
- `指导大纲/v2.1.0/codex/00-总览/v2.1.0-a2-Agent-Lab设计门禁草案.md`
- `指导大纲/长期路线/v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## Skill sync

Repo audit records:

- `reborn-expert-council`: updated
- `game-dev-text`: updated
- `reverend-insanity-lore`: updated
- `reborn-combat-motion`: no_update_needed
- `mirofish-reborng-export`: no_update_needed

External skill files were also updated to current D-211 state.
