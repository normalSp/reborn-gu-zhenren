# 2026-05-16 Living-World Review Promotion

## Goal

Expand the conservative RebornG intake package without treating every `approved`
candidate as export-ready. Promotion must remain local, auditable, and
quote-redacted.

## Inputs

- Packages:
  `backend/uploads/ri_corpus/exports/living_world_review_strict_flash_100pkg_tight_v2_pressure_reviewable`
- Original audit ledger:
  `backend/uploads/ri_corpus/reviews/living_world_item_reviews_tight_v2_pressure_reviewable_audit.json`

## Implementation

- Added `backend/app/services/living_world_review_promotion.py`.
- Added `backend/scripts/promote_living_world_reviews.py`.
- Added `backend/tests/test_living_world_review_promotion.py`.

The promotion pass evaluates only `approved` item reviews and writes promoted
reviews to a separate ledger. The original audit ledger is not mutated.

Promotion rules:

- Require source pointers.
- Block review notes that mention merge/manual follow-up risks.
- Block hidden-classified motives and pressures until a hidden-dependency gate
  exists in the RebornG intake shape.
- Promote valid pressure subjects.
- Promote `needs_review` pressure subjects only when the human note positively
  confirms the collective subject.

## Result

Dry-run/apply report:

- `backend/uploads/ri_corpus/reports/living_world_review_promotion_tight_v2_pressure_reviewable_dry_run.json`
- `backend/uploads/ri_corpus/reports/living_world_review_promotion_tight_v2_pressure_reviewable_applied.json`

Summary:

- Evaluated: 13 `approved` items.
- Promoted: 9.
- Blocked: 4.
- Promoted motive candidates: 1.
- Promoted pressure candidates: 8.

Blocked reasons:

- 3 hidden-classified motive/pressure records require a hidden-dependency gate.
- 1 motive review note asks for merge/manual follow-up.

Promoted ledger:

- `backend/uploads/ri_corpus/reviews/living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json`

Expanded conservative RebornG intake:

- `backend/uploads/ri_corpus/exports/reborng_intake_tight_v2_pressure_reviewable_promoted_export_ready.json`
- `backend/uploads/ri_corpus/reports/reborng_intake_tight_v2_pressure_reviewable_promoted_export_ready_report.json`

Intake summary:

- Total items: 14.
- Hidden facts: 3.
- Character motives: 3.
- Faction pressures: 8.
- Source pointers: 40.
- Quote keys: 0.

## Defaults

The backend and `/ri-corpus` frontend now prefer the promoted ledger:

- `reviews/living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json`

Fallback remains the original audit ledger when the promoted ledger is absent.

## Verification

- `uv run pytest tests\test_living_world_review_promotion.py` from
  `backend/`: passed.
- `uv run pytest tests\test_living_world_review_promotion.py tests\test_living_world_reborng_intake.py tests\test_living_world_pressure_filter.py`
  from `backend/`: 9 passed.
- `uv run pytest` from `backend/`: 108 passed.
- `npm run build` from `frontend/`: passed with existing Vite warnings for
  `pendingUpload.js` mixed import and `index` chunk size.
- `GET http://localhost:5001/api/ri-corpus/living-world/reborng-intake`:
  returns the promoted ledger by default with 14 items and `quoteKeys: 0`.
- `git diff --check`: passed with existing CRLF warnings in unrelated files.
