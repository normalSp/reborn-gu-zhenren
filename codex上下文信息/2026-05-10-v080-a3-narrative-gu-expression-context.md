# v0.8.0-a3 蛊虫剧情表现化上下文

日期：2026-05-11  
分支：`codex/v080-a3-narrative-gu-expression`  
基线：`codex/v080-a2-combat-ui-motion`

## 目标

a3 让玩家持有的蛊虫/已学杀招进入剧情选择、下一轮叙事上下文和本地候选校验。它不接正式战斗结算，不允许 DeepSeek 直接写奖励、掉落、胜负、HP、真元、状态变化，也不提升 `SAVE_FORMAT_VERSION`。

## 实现范围

- 新增 `src/canon/narrative-gu-scene-utility-map.json`，覆盖 53 只蛊和 15 个杀招的全部 `sceneUtilities`，并固定剧情用途分类。
- 新增 `src/engine/v080-narrative-gu-affordances.ts`：
  - 从 `inventory`、`apertureInventory.gu`、临时授权 token、已学杀招收集可用剧情能力。
  - 生成 prompt 注入段，约束 DeepSeek 只能写候选和风险。
  - 校验 `choices[].gu_affordance` / `choices[].guAffordances`。
  - 校验 `state_update.gu_use_suggestions.add`，未持有、未知、用途不匹配、禁忌门槛不足、未过 `sceneValidated` 的建议不执行正式效果。
  - 生成“玩家本轮选择详情”上下文，下一轮不只知道 `choiceId`。
- 类型与 schema 增加 `NarrativeGuUtilityCategory`、`NarrativeGuChoiceAffordance`、`utilityId/category/riskHint`。
- `context-builder`、`response-pipeline`、`narrative-consistency`、`state-update-applier` 已接入 a3 校验链。
- `ChoicePanel` 显示“蛊虫解法 / 缺少蛊虫 / 禁忌门槛 / 待校验”标签和 hover tooltip；Motion 负责轻量 UI 状态，不新增 GSAP。
- E2E harness 新增 `startNarrativeGuAffordanceDemo()`，用于桌面、移动端和 reduced motion 验收。

## 边界

- 普通 `sceneUtilities` 不自动产生数值、资源、掉落或胜负。
- 战斗攻击类蛊虫只能作为剧情提示或进入本地战斗引擎，不能由剧情候选直接结算。
- 禁忌蛊需要强场景门槛；没有 `sceneValidated=true` 和 `sceneTags` 时只能保留为候选或线索。
- 旧文本“使用某蛊”仍会被识别；未持有或未登记时降级为“寻找某蛊线索”。

## 测试记录

- `npm test -- src/engine/v080-narrative-gu-affordances.test.ts src/engine/v080-combat-expression-data.test.ts src/engine/narrative-consistency.test.ts src/engine/v080-narrative-schema.test.ts`：通过。
- `npm test`：通过，61 个测试文件 / 395 个用例。
- `npm run build`：通过。
- `npx playwright test tests/e2e/v080-narrative-gu-affordance.spec.ts`：通过，桌面与移动端 reduced motion 各 1 例。
- `npm run test:e2e:long`：通过，18 个 v0.7 长链路用例。

## a4 / b1 入口

- a4 若继续做剧情 UI，需要把 `guAffordances` 与背包、图鉴、场景行动卡联动。
- b1 群像战斗接入时，剧情选择应只产生战斗意图或场景授权，再由 a1/a2 战斗引擎输出 `BattleResolutionStep[]`。
- 仙蛊与仙蛊屋仍作为剧情授权、见闻和高压演出，不进入常规运行时库。
