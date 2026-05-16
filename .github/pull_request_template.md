# RebornG Pull Request

## Scope

- Version / phase:
- User-approved decision id:
- MiroFish need: `not_needed` / `optional` / `preferred` / `blocking`
- Save-format impact: `none` / `requires SAVE_FORMAT_VERSION bump`

## Boundary Checklist

- [ ] This PR does not add persistent fields without migration/defaults/tests.
- [ ] DeepSeek remains candidate/narrative/pressure only.
- [ ] Hidden facts are not exposed to UI or `deepSeekContract.visibleFactIds`.
- [ ] Rewards, locations, NPC death/capture, canon anchors, and faction identity are still local-engine/user-approved only.
- [ ] NPC/faction/social-memory outputs remain candidate/read-only unless this PR has explicit user approval, migration, and tests.
- [ ] If this touches canon/IF/NPC/faction/route/Fang Yuan/hidden facts, the MiroFish intake review is linked or explicitly not needed.
- [ ] The project dashboard and handoff note are updated.

## Verification

- [ ] `npx tsc --noEmit --pretty false`
- [ ] `npm test -- --reporter=dot`
- [ ] `npm run build`
- [ ] `npm run check:runtime-assets`
- [ ] `npm run check:qingmao-assets`
- [ ] `npm run check:player-visible-copy`
- [ ] Relevant Playwright e2e:

## User Decision Needed Before Merge

- [ ] No
- [ ] Yes, explain:
