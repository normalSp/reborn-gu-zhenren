# 2026-05-24 v2.6 complete context

## Current branch

`codex/v260-startup-private-canon-eval-archive-prep`

## Completed milestone

`v2.6.0` is complete locally as `private canon / eval archive / job queue / replay archive 工程预备`.

## User decisions

- D-260-001 through D-260-012: approved and executed.
- F-260-001 through F-260-012: still `future_gate_required`.

## Main artifacts

- `scripts/run-v260-private-canon-archive-boundary-check.mjs`
- `tests/evals/v260-private-canon-archive-boundary/samples.json`
- npm script `check:v260-private-canon-archive-boundary`
- report `artifacts/v2.6.0/private-canon-archive-boundary/2026-05-23T17-48-33-560Z/report.json`

## Checker result

- acceptedForGate: true
- schema valid: 18/18
- positive: 4/4
- negative: 13/13
- mutation/manual: 1/1
- P0 false negative: 0
- P1 false negative: 0
- boundaryAssertions: all false
- report body leak flags: all false

## Boundaries

v2.6 does not authorize runtime agent, backend/BFF/service, DeepSeek prompt/context/model/authority change, DeepSeek visible lore/RAG, live DeepSeek, MiroFish export/intake, external framework PoC/dependency/subagents, real hidden/private body, prompt body archival, knowledge-index body, runtime canon, save-format change, `runFingerprint`, formal location/faction/identity/reward/NPC life-death, public wording, legal/release changes, or EdgeOne deployment.

## Next candidate

Open v2.7 expert-council startup. Suggested mainline: low-rank multi-NPC / small-faction Agent Lab sample expansion, still report-only/offline by default.
