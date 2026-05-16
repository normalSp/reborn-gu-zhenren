# 2026-05-15 v0.10.0-rc local quality context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Package baseline remains `0.9.0`.
- Runtime `SAVE_FORMAT_VERSION` remains `21`.
- Current phase: `v0.10.0-rc` local quality candidate complete.
- Awaiting user decision: whether to lock `v0.10.0` and then enter queued `v0.11.0-a1`.

## RC Verification

- `npm test`: passed, 95 files / 579 tests.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed, no 500KB+ chunk warning.
- `npm run check:runtime-assets`: passed, 131 files, zero-byte=0.
- `npm run check:qingmao-assets`: passed, 10 entries; active=4, candidate=3, review-only=2, blocked=1.
- `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts`: passed, 3 tests.
- `npm run test:e2e:long`: passed, 29 tests.
- `npm run check:production-preview`: passed; local production preview rendered nonblank root and no fatal TypeError/ReferenceError/Cannot read class errors.
- Lock-review UI fix: Qingmao battlefield readout panels were compacted into `qingmao-readout-stack` so Gu/art/storyboard notes no longer vertically squeeze the board as heavily at desktop 900 height.
- After the UI fix, `npx tsc --noEmit --pretty false` passed and `npm run test:e2e -- tests/e2e/v090-b3-qingmao-battlefield.spec.ts tests/e2e/v010-qingmao-region-actions.spec.ts` passed, 7 tests.
- After the UI fix, `npm run build` and `npm run check:qingmao-assets` also passed.
- Second lock-review UI fix after user screenshot: the 5x3 cells no longer use width-driven aspect ratio in the Qingmao overlay, the action dock/action list/trace are height-capped, and the e2e now asserts `battlefield-cell-c4_2` remains above `battlefield-action-dock`.
- Visual proof captured at `artifacts/v0.10.0/rc/qingmao-battlefield-layout-fix.png`; 2048x1024 metrics: board height about 308px, `c4_2` bottom about 565.8, action dock y about 820.5.
- `.learnings/ERRORS.md` now records this as a current anti-regression pattern: battlefield UI tests must verify actual visible rows, not just cell count.
- Third lock-review UI fix after user screenshot: bottom Gu/killer-move action cards no longer use multi-row grid inside a capped action dock. Qingmao action cards now stay in one horizontal row, have fixed height, and clip overflowing detail text.
- E2E now asserts `battlefield-action-list` has no vertical overflow and all visible `.battlefield-action-card` items share the same y position.
- Visual proof captured at `artifacts/v0.10.0/rc/qingmao-battlefield-action-dock-fix.png`; 2048x1024 metrics: action list height 118px, `scrollHeight=clientHeight=118`, visible cards all y=898.
- Fourth lock-review UI fix after user feedback: 116px fixed action cards clipped the lower half of descriptions. Qingmao action cards are now 154px high and keep title, cost/range/target, description, counter, and utility inside the card.
- E2E now also asserts each visible action card has non-empty description/counter text and that both blocks remain inside the card bounds.
- Visual proof captured at `artifacts/v0.10.0/rc/qingmao-battlefield-action-card-readable.png`; 1440x900 metrics: action list height 156px, `scrollHeight=clientHeight=156`, visible cards height 154px.

## Scope Boundaries

- D-006 EdgeOne public test remains out of v0.10 scope.
- No persistent Qingmao region state added.
- No save-format bump.
- No model switching or new model evaluation.
- No new rewards, Gu, complete recipes, stable White Jade material source, standing, location unlock, or canon outcome mutation.

## Decision Needed

User decision is now needed before further work:

- Approve locking `v0.10.0` current results and move to `v0.11.0-a1` architecture/save hardening.
- Or request a targeted v0.10 bugfix/adjustment before lock.
