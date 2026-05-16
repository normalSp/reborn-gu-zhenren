# 2026-05-16 Qingmao Faction Pressure Pack

## Request

- requestId: `mirofish-request-2026-05-16-qingmao-faction-pressure-pack`
- targetPhase: `v0.12.0-b2 NPC / faction reaction bridge 第一刀`
- blockingLevel: `preferred`; if RebornG writes formal reaction rules, upgrade to `blocking`.
- source request: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\requests\2026-05-16-qingmao-faction-pressure-pack.md`

## Output

- `backend/uploads/ri_corpus/exports/qingmao_faction_pressure_pack_export_ready.json`
- `backend/uploads/ri_corpus/reports/qingmao_faction_pressure_pack_export_ready_report.json`
- blueprint: `backend/uploads/ri_corpus/blueprints/qingmao_faction_pressure_pack.json`

## Summary

- totalItems: 12
- factionPressure: 8
- npcReactionCandidate: 4
- reviewStatus: 12 `export_ready`
- sourcePointers: 34
- quoteLikeKeys: 0

Coverage:

- clanSchoolPressure: 2
- taskGroupPressure: 3
- merchantPressure: 2
- internalAffairsTrace: true
- externalClanSuspicion: true

## Boundaries

This package is candidate material only. It is not RebornG canon, runtime truth,
faction standing, reward logic, NPC fate, pursuit result, or formal route unlock.

The export intentionally keeps:

- `runtimeAuthority = candidate_only`
- `runtimeVisible = false`
- `deepSeekVisible = false`
- `requiresHumanCanonReview = true`

It redacts original-text quote keys and avoids hidden fact bodies.

## Validation

- `uv run python scripts/build_living_world_special_export.py ...`
- `uv run pytest tests/test_living_world_special_export.py tests/test_ri_corpus_api.py`
- API smoke through `http://localhost:3000/api/ri-corpus/living-world/special-export-blueprint`
- forbidden key scan for JSON keys: no `quote`, `originalText`, `excerpt`, or `verbatim`.

## RebornG Intake Note

RebornG should run an intake review before absorbing this package. Safe promotion
targets are `candidate_pool`, `rule_draft`, `test_sample`, or `deferred`; no item
should be promoted directly into runtime truth.
