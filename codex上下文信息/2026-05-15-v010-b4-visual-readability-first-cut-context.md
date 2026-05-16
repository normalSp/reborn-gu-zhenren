# 2026-05-15 v0.10.0-b4 visual/readability first-cut context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Package baseline remains `0.9.0`.
- Runtime `SAVE_FORMAT_VERSION` remains `21`.
- Current project phase: `v0.10.0-b4` first cut complete.
- Queued after v0.10: `v0.11.0-a1` architecture/save hardening; do not start yet.

## Runtime Scope Completed

- Added `src/canon/qingmao-scene-variants.json`.
  - `clan_school_courtyard`
  - `front_mountain_patrol`
  - `moonlit_resource_grove`
- Added `src/engine/v010-qingmao-scene-variants.ts`.
  - Pure/read-only projection from existing Qingmao region actions, resource loop entries, and combat readiness.
  - Produces player question, composition line, recording line, runtime links, and forbidden implications.
- Updated `src/components/game/ActionPanel.tsx`.
  - Adds a “青茅场景变体” section.
  - Shows candidate art thumbnails, status labels, composition guidance, short-recording first step, runtime links, and forbidden implications.
- Updated `src/canon/qingmao-visual-assets.json`.
  - Adds three `candidate + generic_candidate` atmosphere assets.
  - They do not replace the active b3 generic battlefield background.
- Added public candidate SVGs:
  - `public/rebrng/scenes/s0-qingmao/qingmao-clan-school-courtyard-variant.svg`
  - `public/rebrng/scenes/s0-qingmao/qingmao-mountain-patrol-ridge-variant.svg`
  - `public/rebrng/scenes/s0-qingmao/qingmao-resource-grove-variant.svg`

## Hard Boundaries

- No persistent fields added.
- No `SAVE_FORMAT_VERSION` bump.
- No new rewards, Gu, complete recipes, stable `碎玉片` source, standing, location unlock, or region pressure state.
- DeepSeek still has no reward/canon authority.
- Visual assets are candidate atmosphere aids only; runtime active battlefield background remains `qingmao-mortal-battlefield-generic-atmosphere`.

## Verification So Far

- `npm test -- src/engine/v010-qingmao-scene-variants.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`: passed, 10 tests.
- `npm run check:qingmao-assets`: passed, 10 entries; active=4, candidate=3, review-only=2, blocked=1.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts`: passed, 3 tests.
- `npm test`: passed, 95 files / 579 tests.
- `npm run build`: passed.
- `npm run check:runtime-assets`: passed, 131 files, zero-byte=0.

## Superseded By

`codex上下文信息/2026-05-15-v010-rc-local-quality-context.md` records the completed `v0.10.0-rc` local quality candidate.
