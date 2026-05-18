# 2026-05-18 v0.15.0 docs startup context

## Current state

- Branch: `codex/v013-npc-faction-reaction`
- Version line: `v0.15.0 低阶蛊师经济、补给、炼养用深循环`
- Phase: docs startup, before `v0.15.0-a1`
- MiroFish baseline: request + intake review committed and pushed as `42c6841 docs: 验收v0.15 MiroFish交付包`.
- Docs startup baseline: committed and pushed as `619c5f1 docs: 建立v0.15低阶经济炼养用大纲`.
- Save format: unchanged, `SAVE_FORMAT_VERSION = 22`.
- DeepSeek: unchanged, runtime model `deepseek-v4-flash`; no authority expansion.

## What this handoff establishes

- v0.15 docs entry under `指导大纲/v0.15.0/codex/00-总览/`.
- Scope: low-rank Gu Master economy, supply, feeding, refinement fragments, refinement failure cost, caravan/market window, anti-farm.
- Default non-goals: full market, full Shang clan city, formal black market, commission resale, full price/inventory table, high-rank resources, new save fields, DeepSeek reward/material/recipe authority.
- MiroFish packages are candidate-only; black-market/commission package is deferred by default.

## Next gate

Enter `v0.15.0-a1 低阶经济炼养用设计门禁`.

a1 is docs/design only:

- Confirm fields.
- Confirm authority owners.
- Confirm test matrix.
- Confirm stop gates.
- Do not write runtime.

Stop before:

- New persistent fields or save-format bump.
- Formal material/stone/Gu/recipe rewards.
- Formal market/shop/black-market/commission systems.
- Location/faction/NPC-life/canon changes.
- DeepSeek authority expansion.

## Verification

No runtime verification was required for docs startup.

The MiroFish intake scan already confirmed the v0.15 packages are JSON-parseable, quote-redacted, candidate-only, runtime-invisible, and DeepSeek-invisible.
