# 2026-05-19 v1.0.0-b3 自由意图收束上下文交接

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v1.0.0-b3 自由意图与极端意图收束`
- 状态：已完成，commit `352948e` 已推送，GitHub Actions `26095586533` 通过
- MiroFish：v1.0 三包已通过 intake；本阶段不需要新包
- 存档版本：`SAVE_FORMAT_VERSION = 22`，未变更
- DeepSeek：`deepseek-v4-flash`，未扩权

## 主要落地

新增：

- `src/canon/v100-free-intent-release-closure-rules.json`
- `src/engine/v100-free-intent-release-closure.ts`
- `src/engine/v100-free-intent-release-closure.test.ts`
- `tests/e2e/v100-free-intent-release-closure.spec.ts`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-b3-自由意图与极端意图收束.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-b3-Player-Advocate-30轮走查记录.md`

修改：

- `src/engine/v011-world-intent-engine.ts`
- `src/engine/v011-world-intent-engine.test.ts`
- `src/store/slices/livingWorldSlice.ts`
- `src/components/game/FreeGoalPanel.tsx`
- `指导大纲/v1.0.0/codex/00-总览/README.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-小版本执行路线图.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-真相源索引.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-测试矩阵.md`
- `指导大纲/项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- 全局 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`

## 行为

`FreeGoalPanel` 新增 `v1.0 自由意图收束` 面板。它读取本地规则和 `adjudicateWorldIntent()`，展示七类真实玩家意图样本：

- 逃离青茅山。
- 投靠白家。
- 跟踪方源。
- 去商家城。
- 拿盗天魔尊传承。
- 一转拿九转蛊。
- 杀死关键 NPC 改写正史核心因果。

前置为 `v100_low_rank_life_loop_release_acceptance`。未完成 b2 life loop 时按钮禁用。

验收成功后只写现有 v22 字段：

- `knownFacts.v100_free_intent_release_closure_acceptance`
- `factionPressure.faction_pressure_v100_free_intent_public_risk`
- `npcMemories.npc_memory_v100_free_intent_public_boundary`
- `actionConsequences.consequence_v100_free_intent_release_closure_probe`
- local action ledger / return context

## 禁写边界

本阶段未写：

- `SAVE_FORMAT_VERSION = 23`
- route/location/currentRegion
- 正式奖励、材料、蛊虫、蛊方、传承
- 阵营转移、声望变化、正式任务
- NPC 生死/抓捕/正史锚点
- hidden fact body
- DeepSeek 新权限
- BFF/backend
- 自动部署或公开承诺

## 验证

通过：

- `npm test -- src/engine/v011-world-intent-engine.test.ts --reporter=dot`：11 tests passed
- `npm test -- src/engine/v100-free-intent-release-closure.test.ts --reporter=dot`：3 tests passed
- `npm run test:e2e -- tests/e2e/v100-free-intent-release-closure.spec.ts`：1 passed
- `npm run check:player-advocate-gate -- 指导大纲/v1.0.0/codex/00-总览/v1.0.0-b3-Player-Advocate-30轮走查记录.md 30`：30 轮，理解率 100%
- `npx tsc --noEmit --pretty false`：passed
- `npm test -- --reporter=dot`：138 files，763 tests passed
- `npm run build`：passed
- `npm run check:runtime-assets`：173 files，zero-byte=0
- `npm run check:qingmao-assets`：23 entries checked
- `npm run check:player-visible-copy`：268 files scanned
- `npm run check:v019-content-governance`：passed
- `npm run check:production-preview`：passed

## Git 注意

当前仓库仍有历史 dirty/untracked 文件，尤其是美术候选、bgm、外部参考、MiroFish 历史 intake、`.cursor/`、zip 等。后续提交仍不要用 `git add -A`，只 stage 当前阶段明确文件。

建议提交信息：

`feat: 收束v1.0自由意图与极端意图`

## 下一步

1. b3 已完成：commit `352948e feat: 收束v1.0自由意图与极端意图`。
2. push 已完成：branch `codex/v013-npc-faction-reaction`。
3. GitHub Actions 已通过：run `26095586533`。
4. 下一步进入 `v1.0.0-b4` 公开素材与文案边界；b4 前不需要新 MiroFish 包，除非公开文案要新增未审核原著事实。
5. b4 若形成 public commitment、自动部署或大规模新图生成，必须停下来让用户决策。
