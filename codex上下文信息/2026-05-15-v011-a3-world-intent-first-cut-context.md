# 2026-05-15 v0.11.0-a3 自由意图本地裁决第一刀交接

## 用户决策

用户批准 a3 第一刀四条范围：

1. 只做自由意图裁决入口，不做完整大世界。
2. 首批意图类型限定为 `obtain_item`、`join_faction`、`investigate`、`travel`、`long_term_goal`。
3. DeepSeek 只生成候选解释/表达方式，本地引擎最终裁决可行性、门槛、阻断理由和回流字段。
4. 极端意图样本必须进入测试。

## 已完成

新增：

- `src/canon/v011-world-intent-rules.json`
- `src/engine/v011-world-intent-engine.ts`
- `src/engine/v011-world-intent-engine.test.ts`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-第一刀-自由意图本地裁决引擎.md`

更新：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `.learnings/LEARNINGS.md`
- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 运行时口径

本刀只做纯本地裁决：

- 不接 UI。
- 不新增 store action。
- 不写 `livingWorldState`。
- 不新增持久化字段。
- 不提升 `SAVE_FORMAT_VERSION`，仍为 `22`。

`WorldIntentEngine` 输出：

- `IntentCandidate`
- `IntentRuling`
- route suggestion
- DeepSeek contract
- suggested player goal draft
- `statePatchApplied: false`

`suggestedPlayerGoal` 只是草案，不能自动写入。后续必须由玩家确认，再通过 `applyLivingWorldPatch()` 写入 `livingWorldState.playerGoals`。

## 样本裁决

- `我要拿九转蛊` -> `obtain_item` / `long_term_goal` / 不允许立即执行。
- `我要获得春秋蝉` -> `obtain_item` / `world_rule_blocked` / 不允许。
- `我要去宝黄天交易` -> `travel` / `world_rule_blocked` / 凡人不允许。
- `我要投靠白家` -> `join_faction` / 按身份裁决，古月/熊家需要前置，白家本家可行动，散修/外来可尝试接触。
- `我要跟踪方源` -> `investigate` / `available_with_cost` / 只做可见行踪调查，不泄露隐藏因果。
- `我要逃离青茅山` -> `travel` / `requires_prerequisite` / 需要路线、补给、身份遮掩和追踪风险。
- `我要杀死白凝冰` -> `long_term_goal` / `major_if_deviation` / 不直接判定 NPC 死亡。

## 验证

已通过：

```powershell
npm test -- src/engine/v011-world-intent-engine.test.ts src/engine/v011-living-world-patch.test.ts src/store/defaultLivingWorldState.test.ts
npx tsc --noEmit --pretty false
```

## 下一步

进入 `v0.11.0-a3-2` 前需要用户决策：

1. 是否把自由意图入口接到 UI/store。
2. 入口放主行动面板、青茅区域面板，还是单独“自由目标”面板。
3. 玩家确认长期目标后，是否允许写入 `livingWorldState.playerGoals`。
