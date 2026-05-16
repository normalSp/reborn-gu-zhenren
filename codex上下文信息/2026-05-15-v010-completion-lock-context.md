# 2026-05-15 v0.10.0 completion lock context

## Current State

- Workspace: `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- Package baseline remains `0.9.0`.
- Public release baseline remains `v0.9.0`.
- Runtime `SAVE_FORMAT_VERSION` remains `21`.
- Runtime DeepSeek model remains `deepseek-v4-flash`.
- Current completed development milestone: `v0.10.0`.
- Next step: discuss and freeze `v0.11.0` scope.

## User Decision

The user asked whether `v0.10.0` is complete. Based on the completed rc quality gate and targeted lock verification, `v0.10.0` is now marked complete as a local development milestone.

This is not an EdgeOne public release stage and does not change `package.json` from `0.9.0`.

## Verification

- Previous rc evidence:
  - `npm test`: passed, 95 files / 579 tests.
  - `npx tsc --noEmit --pretty false`: passed.
  - `npm run build`: passed, no 500KB+ chunk warning.
  - `npm run check:runtime-assets`: passed.
  - `npm run check:qingmao-assets`: passed.
  - `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts`: passed.
  - `npm run test:e2e:long`: passed.
  - `npm run check:production-preview`: passed.
- Targeted lock verification on 2026-05-15:
  - `npm run test:e2e -- tests/e2e/v090-b3-qingmao-battlefield.spec.ts tests/e2e/v010-qingmao-region-actions.spec.ts`: passed, 7 tests.

## Locked v0.10.0 Scope

Completed:

- Qingmao region board and identity/action boundaries.
- Qingmao region action engine and first formal action loops.
- Low-rank Gu/combat candidate pack and validation entry.
- Resource/refinement/feeding minimum loop.
- Qingmao scene variants and candidate atmosphere assets.
- Local rc quality gate.
- Qingmao battlefield readability fixes:
  - 5x3 third row visible above the action dock.
  - Bottom Gu/killer-move action cards readable without overlap or clipped description/counter blocks.

Not included:

- EdgeOne public-test preparation.
- Persistent Qingmao region state.
- `three_clan_commission` runtime unlock.
- Save-format bump.
- New model evaluation or model switching.
- New rewards, Gu, complete recipes, stable White Jade material source, or canon outcome mutation.

## Updated Sources

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/v0.10.0/codex/00-总览/README.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-小版本执行路线图.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-决策记录.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-rc-本地质量收束.md`
- `指导大纲/v0.10.0/codex/00-总览/v0.10.0-完成与成果锁定.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a1-架构与存档加固专项草案.md`
- Global skills updated:
  - `reborn-expert-council`
  - `game-dev-text`
  - `reverend-insanity-lore`
  - `reborn-combat-motion`

## Next Discussion

Expert-council recommended `v0.11.0` discussion candidates:

1. Proposed `v0.11.0` mainline: living-world foundation and free-intent gate.
2. `v0.11.0-a0` visible old-debt cleanup: remove player-facing `待 v0.x` / old-version placeholder text.
3. `v0.11.0-a1` architecture/save hardening: approved previously, likely first heavy implementation phase.
4. Qingmao canon-anchor and IF-freedom专项 must start from original-text fact extraction. Earlier examples such as wolf tide, spirit spring exhaustion, First Gen Gu Yue, Bai Ning Bing extremity, Fang Yuan hidden reset, and post-Qingmao route choice were user discussion examples, not frozen anchor facts.
5. DeepSeek meaningful-choice protocol: generate strategic options that change location, risk, time pressure, faction standing, resources, or IF vectors, while local engine decides feasibility and consequences.
6. Region persistence and route unlock: requires explicit `SAVE_FORMAT_VERSION` decision if persistent fields are added.

Do not start v0.11 runtime work until the user finishes scope discussion or approves a concrete first phase.
