# 2026-05-16 Fang Yuan Public Evidence Pack

## Request

- requestId: `mirofish-request-2026-05-16-fang-yuan-public-evidence-pack`
- targetPhase: `v0.12.0-b3 方源公开旁证询问`
- blockingLevel: `blocking`
- RebornG target: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\v0.12.0`

## Output

- `backend/uploads/ri_corpus/exports/fang_yuan_public_evidence_pack_export_ready.json`
- `backend/uploads/ri_corpus/reports/fang_yuan_public_evidence_pack_export_ready_report.json`
- `codex/2026-05-16-fang-yuan-public-evidence-pack.md`

The pack is quote-redacted candidate material only. It is not canon, not runtime truth, and not DeepSeek-visible authority.

## Source

- Source dataset: `backend/uploads/ri_corpus/exports/living_world_review_strict_flash_100pkg_tight_v2_pressure_reviewable`
- Coverage basis: existing reviewed chapters `ri_lw_ch_0001` through `ri_lw_ch_0100`
- Blueprint: `backend/uploads/ri_corpus/blueprints/fang_yuan_public_evidence_pack.json`

This request was intentionally answered from the first 100 reviewed packages because RebornG is waiting on the b3 public-evidence gate and the 101-200 live batch is still in progress.

## Contents

- total items: 15
- source pointers: 14
- publicFactCandidate: 2
- publicEvidenceCandidate: 5
- npcObservationCandidate: 2
- inquiryReactionCandidate: 4
- hiddenBoundaryRef: 2

The selected surfaces cover early Qingmao low-rank public evidence around:

- lodging and inn-side public traces
- clan-school public ranking and conflict records
- visible supply and delivery traces
- merchant inquiry and continuing external pressure
- task-group absence and landlord-side whereabouts statements
- internal-affairs process traces
- hidden boundaries for supply purpose and post-arena internal checking

## Redaction And Gate

- No `quote`, `originalText`, `excerpt`, or `verbatim` keys are present.
- The validation scan found no forbidden value strings for Spring Autumn Cicada, rebirth, rollback, or future-memory terms.
- All items have non-empty `summary`, `publicTrigger`, `playerVisibleResult`, `sourcePointerIds`, `sourcePointers`, `review`, and `reborngGate`.
- All items are `runtimeAuthority: candidate_only`.
- All `hiddenBoundaryRef` items are `hiddenRefOnly=true`, `runtimeVisible=false`, and `deepSeekVisible=false`.
- Source pointer summaries are withheld for this request so RebornG receives locators without copied original prose or sensitive source summaries.

## Validation

Commands run:

```powershell
C:\Users\11411\.local\bin\uv.exe run python scripts\build_living_world_special_export.py --packages uploads\ri_corpus\exports\living_world_review_strict_flash_100pkg_tight_v2_pressure_reviewable --reviews uploads\ri_corpus\reviews\living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json --blueprint uploads\ri_corpus\blueprints\fang_yuan_public_evidence_pack.json --out uploads\ri_corpus\exports\fang_yuan_public_evidence_pack_export_ready.json --report-out uploads\ri_corpus\reports\fang_yuan_public_evidence_pack_export_ready_report.json
C:\Users\11411\.local\bin\uv.exe run pytest tests\test_living_world_special_export.py tests\test_ri_corpus_api.py
```

Result:

- special export summary: 15 items, 14 source pointers, 0 quote-like keys
- focused backend tests: 15 passed

## RebornG Intake Boundary

RebornG should treat this package as a review input for `v0.12.0-b3`.

Recommended intake classification:

- public items can enter `candidate_pool` or `fact_card_draft` after local review.
- inquiry items can enter `rule_draft` or `test_sample` only after checking player-visible wording.
- hidden boundary items stay `hidden_ref_only`; do not expose them to UI or DeepSeek.
- Do not promote any item directly into runtime truth.
