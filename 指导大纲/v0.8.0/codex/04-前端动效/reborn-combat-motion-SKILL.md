---
name: reborn-combat-motion
description: |
  RebornG v0.8 combat expression and UI motion skill. Use when designing or implementing
  Gu/Killer Move combat presentation, GSAP timelines, Motion/Framer Motion UI state,
  battlefield UI, BattleResolutionStep playback, or GPT-5.5 frontend animation prompts.
version: "0.1.0"
---

# Reborn Combat Motion Skill

这是 `C:\Users\11411\.codex\skills\reborn-combat-motion\SKILL.md` 的仓库镜像。运行时仍以本机 skill 为准；本文件用于 GitHub 追踪、代码审查、迁移恢复和后续开发交接。

Use this skill for RebornG combat UI, Gu/Killer Move presentation, GSAP/Motion split, battlefield interaction, and GPT-5.5 animation prompt design.

## Source Order

Read these before changing combat animation or battle UI:

1. `src/canon/gu-expression-specs.json`
2. `src/canon/killer-move-expression-specs.json`
3. `指导大纲/v0.8.0/codex/03-战斗深化/蛊虫表现化战斗系统设计.md`
4. `指导大纲/v0.8.0/codex/04-前端动效/GSAP-Motion-全局重皮规范.md`
5. Existing runtime bridge files: `src/hooks/useAnimationBridge.ts`, `src/animations/gsap/`, `src/animations/motion/`, and combat UI components.

Use official library references as baseline guidance:

- GSAP React / agent skills: `https://github.com/greensock/gsap-skills`
- Motion React docs: `https://motion.dev/docs/react-animation`

## Core Rule

Do not animate invented combat outcomes. UI and animation consume engine/canon facts:

- `GuExpressionSpec`
- `KillerMoveExpressionSpec`
- `BattleResolutionStep`
- `BattleTraceEntry`
- store state that already exists

If a visual wants to show damage, movement, status, failure, backlash, or resource cost, that fact must come from engine output or registered canon data.

## GSAP vs Motion

Use GSAP for timeline-like spectacle:

- battle start
- killer move charge/release
- formation opening or breaking
- forbidden Gu activation
- heavy backlash
- battle end
- chapter or major scene transitions

Use Motion / Framer Motion for UI state:

- layout transitions
- unit movement between grid cells
- hover/press/selection feedback
- target range highlights
- action panel switches
- tooltips
- HP/essence/status bars
- save/load, inventory, atlas, and navigation transitions

Never let GSAP and Motion drive the same CSS property on the same element at the same time.

## RebornG Visual Language

Preferred vocabulary:

- dark ink ground
- gold dao-mark lines
- blood red risk and taboo
- jade/verdant healing and life
- formation grid lines
- aperture rings
- talisman-like glyphs
- restrained, readable game UI

Avoid:

- generic sci-fi HUD
- neon cyberpunk panels
- marketing hero layouts
- decorative gradient orbs
- animation that hides button text or battle reasons

## GPT-5.5 Prompt Template

When asking GPT-5.5 or another agent to build motion UI, include:

```text
Task:
Build/modify [component] for RebornG combat.

Data:
Use only [GuExpressionSpec/KillerMoveExpressionSpec/BattleResolutionStep/store fields].
Do not calculate damage, hit chance, state changes, or rewards in UI.

Animation split:
GSAP controls [timeline event].
Motion controls [layout/selection/hover/movement].

Style:
Dark ink, gold dao marks, blood risk, jade life, formation lines.
No generic sci-fi/neon/marketing UI.

Accessibility:
Support reduced motion. Text and buttons must remain readable.

Verification:
Check desktop 1440x900 and mobile 390x844. Confirm no overlap, nonblank animation, readable reasons, usable controls.
```

## Battle UI Acceptance

A combat UI change is incomplete unless it shows:

- who acts
- what Gu/Killer Move is used
- target/range/affected cells
- cost and cooldown
- why an action is unavailable
- counter or failure reason
- status and terrain changes
- readable battle trace
- reduced-motion fallback

## Lore Boundary

Follow `reverend-insanity-lore` for Gu, Immortal Gu, killer moves, paths, Treasure Yellow Heaven, rank ten, eternal life, and canon/IF boundaries. This skill governs presentation and animation, not lore authority.
