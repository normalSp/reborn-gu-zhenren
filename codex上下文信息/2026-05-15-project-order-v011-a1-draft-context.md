# 2026-05-15 project order patch and v0.11-a1 draft context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Package baseline: `0.9.0`
- Save format: `SAVE_FORMAT_VERSION = 21`
- `v0.10.0-b3` is complete.
- User requested a small governance patch, `.learnings` refresh, and feasible `指导大纲/大方向` recommendations summarized into a `v0.11-a1`专项.

## Completed In This Patch

- Added root `AGENTS.md` as the project-level Codex entry.
- Added `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` as the short current-state source.
- Updated `.gitignore` to ignore `.codex/*` local runtime data while allowing `.codex/skills/**`.
- Updated `.learnings/LEARNINGS.md` top section with current effective learning index.
- Updated `.learnings/ERRORS.md` top section with current anti-regression index.
- Added `指导大纲/v0.11.0/codex/00-总览/README.md`.
- Added `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a1-架构与存档加固专项草案.md`.
- Updated `指导大纲/v0.10.0/codex/00-总览/README.md` to point at the v0.11-a1 draft.
- Updated global skills:
  - `reborn-expert-council` to v0.1.29.
  - `game-dev-text` to v2.3.28.

## v0.11-a1 Draft Recommendation

Recommended first runtime work, if user approves:

1. Save migration and persist normalization unification.
2. `response-pipeline.ts` silent exception observability.
3. localStorage key centralization without changing key strings.
4. Expert-council gate checklist refinement.

Deferred:

- Big type split.
- Engine directory reorganization.
- Version-prefix file renaming.
- Full Sub-Agent TOML setup.
- Symphony/external orchestration.
- Full canon Zod schema sweep.

## User Decision Needed

Ask the user whether to approve:

- `V11-A1-D001`: make `v0.11.0-a1` an architecture/save-hardening专项.
- `V11-A1-D002`: defer big directory/type refactors.
- `V11-A1-D003`: defer Sub-Agent TOML setup and continue using checklist-based expert council.

No runtime code was changed in this governance patch. No tests were required beyond document/path verification.
