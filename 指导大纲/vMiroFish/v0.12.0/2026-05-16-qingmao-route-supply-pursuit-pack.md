# 2026-05-16 Qingmao Route Supply Pursuit Pack

## Request

Source request:

- `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\requests\2026-05-16-qingmao-route-supply-pursuit-pack.md`

Request id:

- `mirofish-request-2026-05-16-qingmao-route-supply-pursuit-pack`

Target:

- RebornG `v0.12.0-b1 route / supply / pursuit 第一刀`

## Implementation

Added a request-specific compiler instead of reusing the general 14-item intake
package.

Files:

- `backend/app/services/qingmao_route_supply_pursuit_pack.py`
- `backend/scripts/build_qingmao_route_supply_pursuit_pack.py`
- `backend/tests/test_qingmao_route_supply_pursuit_pack.py`

Added API/frontend entry points:

- `GET /api/ri-corpus/living-world/qingmao-route-supply-pursuit-pack`
- `GET /api/ri-corpus/living-world/review-promotions`
- `/ri-corpus` buttons: `晋级检查`, `路线包`

The promotion API only reports promotable/blocked `approved` items. It does not
automatically feed `approved` items into RebornG. Human review still promotes
items to `export_ready`.

## Output

MiroFish output:

- `backend/uploads/ri_corpus/exports/qingmao_route_supply_pursuit_pack_export_ready.json`
- `backend/uploads/ri_corpus/reports/qingmao_route_supply_pursuit_pack_export_ready_report.json`

Copied RebornG handoff:

- `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\v0.12.0\qingmao_route_supply_pursuit_pack_export_ready.json`
- `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\v0.12.0\qingmao_route_supply_pursuit_pack_export_ready_report.json`
- `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy\指导大纲\vMiroFish\v0.12.0\2026-05-16-qingmao-route-supply-pursuit-pack.md`

Summary:

- Total items: 17.
- publicFact: 1.
- routeCandidate: 3.
- supplyRequirement: 4.
- pursuitTrigger: 3.
- factionPressure: 5.
- hiddenFactRef: 1.
- Source pointers: 35.
- Quote-like keys: 0.

Coverage:

- Caravan route/window: covered.
- Mountain or forest route risk: covered.
- Supply requirements: covered.
- Identity cover or suspicion: covered.
- Pursuit/monitoring trigger: covered.
- Faction pressure subjects: 5.

## Hidden Boundary

The hidden item is exported as `hiddenFactRef` only:

- `hiddenRefOnly: true`
- `runtimeVisible: false`
- `deepSeekVisible: false`
- hidden source pointer summaries are withheld
- hidden review notes are withheld

## Verification

- `uv run pytest tests\test_qingmao_route_supply_pursuit_pack.py`: 2 passed.
- `uv run pytest`: 112 passed.
- `npm run build`: passed with existing Vite warnings for
  `pendingUpload.js` mixed import and `index` chunk size.
- API smoke for `/living-world/qingmao-route-supply-pursuit-pack`: returned 17
  items, 35 source pointers, `quoteLikeKeys: 0`.
- Forbidden key scan for `quote`, `originalText`, `excerpt`, and `verbatim`
  in the MiroFish output and copied RebornG handoff output: no matches.
- `git diff --check`: passed with existing CRLF warnings in unrelated files.
