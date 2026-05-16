# Qingmao v0.13 MiroFish Request Packs Handoff

generatedAt: `2026-05-16 19:40 Asia/Shanghai`
sourceBase: `MiroFish backend/uploads/ri_corpus/exports/living_world_review_strict_flash_0200_reviewable`
scope: `ri_lw_ch_0001` through `ri_lw_ch_0200`
status: `complete_candidate`

## Delivered Files

- `qingmao_public_event_chronicle_pack_export_ready.json`
- `qingmao_public_event_chronicle_pack_export_ready_report.json`
- `qingmao_npc_memory_motive_pack_export_ready.json`
- `qingmao_npc_memory_motive_pack_export_ready_report.json`
- `qingmao_faction_reputation_pressure_pack_export_ready.json`
- `qingmao_faction_reputation_pressure_pack_export_ready_report.json`
- `qingmao_v013_request_packs_coverage_matrix.json`

## Summary

The three packs are quote-redacted MiroFish candidate exports only. They are not
RebornG canon, runtime authority, formal reward/task/location/faction/NPC-life
results, or DeepSeek-visible hidden truth.

- Public event chronicle: 1153 items, 1139 source pointers, 0 quote-like keys.
- NPC memory/motive: 1564 items, 1195 source pointers, 0 quote-like keys.
- Faction reputation/pressure: 885 items, 1019 source pointers, 0 quote-like keys.

The compiler skipped hidden or blocked-risk material instead of exporting it.
The delivered JSON contains no `quote`, `originalText`, `excerpt`, or `verbatim`
keys, and the QA scan found no Spring Autumn Cicada/rebirth/private-causality
terms in the exported payloads.

## Coverage Gate

`qingmao_v013_request_packs_coverage_matrix.json` reports:

- `completionGate.status = complete_candidate`
- no missing scope coverage for the three request families
- covered scopes include clan school/opening/training, three-clan competition,
  merchant/trade/supply, absence/refusal, route/detour, inquiry/message,
  rescue/aid, theft/deception, escape preparation, and external contact.

## Intake Boundary

RebornG intake should treat all items as candidate material. Acceptable promotion
targets are candidate pools, fact-card drafts, rule drafts, test samples, or
deferred notes after local review. Do not promote directly into runtime truth.

Hidden or hidden-adjacent facts remain withheld; if an item looks like it needs
hidden causality to be useful, keep it out of DeepSeek-visible prompt context and
request a local RebornG canon review instead.
