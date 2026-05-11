# v0.8.0-c2.5 传承与待认主福地/洞天竖切上下文

日期：2026-05-11
分支：`codex/v080-c25-inheritance-land-claim`
提交：待提交，建议 `feat: 接入v0.8传承与待认主福地竖切`

## 本轮目标

接入有限传承/福地竖切，把传承线索、试炼进度、待认主福地条件和洞天边界传闻从剧情文案升级为持久状态和本地校验系统。同时修复六转及以上仍看到五转升仙内容的问题。

## 代码落地

- `src/canon/v080-inheritance-land-rules.json`：首批四类样板，小传承洞府、三王传承旁支、待认主福地、洞天边界传闻。
- `src/engine/v080-inheritance-land-engine.ts`：传承入场、候选登记、试炼行动、福地认主、prompt 注入、禁区拦截和 deterministic RNG。
- `src/store/slices/inheritanceLandSlice.ts`：新增持久 `inheritanceLandState`，接入场景 AP 消耗、行动账本、奖励应用和福地认主。
- `src/store/initialState.ts` / `src/store/index.ts`：`SAVE_FORMAT_VERSION = 20`，v19->v20 迁移补默认状态。
- `src/schemas/narrative.schema.ts` / `src/types/index.ts`：扩展 choice 传承标签与 `state_update.inheritance_land_candidates.add`。
- `src/engine/context-builder.ts`：注入传承/福地上下文、洞天禁区和禁止越权规则。
- `src/engine/state-update-applier.ts`：AI 传承候选走本地登记；直接写奖励、福地/洞天归属、仙蛊、资源节点等越权字段会被降级。
- `src/components/game/InheritanceLandPanel.tsx`：新增底部 `传承` 面板。
- `src/components/game/ChoicePanel.tsx`：新增 `传承线索 / 待认主福地 / 洞天传闻 / 禁区拦截` 标签与 tooltip。
- `src/components/game/AperturePanel.tsx`：补待认主/已认主福地摘要。
- `src/components/game/GameScreen.tsx`：新增 `传承` 导航；移动端抽屉给底部导航留出点击区；版本标识更新为 `v0.8.0-c2.5`。
- `src/e2e/installE2eHarness.ts`：新增 `startInheritanceLandDemo()`，覆盖六转福地/传承 UI 场景。
- `测试存档/v0.7.0`：全量升级到 `formatVersion = 20`，新增 51-54 四个 c2.5 专项档。

## 世界观与系统边界

- DeepSeek 只能写传承线索、候选、地灵条件、传闻和叙事压力。
- 传承奖励、认主结果、资源节点、福地归属、洞天边界全部由本地引擎校验和结算。
- 小传承只产出已登记凡蛊、材料、配方碎片、杀招碎片。
- 三王传承旁支只允许旁支争夺、试炼和线索，不改写正史核心结果。
- 待认主福地要求六转以上、场景 AP、地灵执念、试炼/守护/资源压力通过后才能认主。
- 洞天在 v0.8 只做高压传闻、禁区边界和后续入口，不开放正式认主。
- 不开放十转、永生蛊、真正永生、玩家获得宿命蛊、普通战斗击杀尊者。

## 验证结果

已通过：
- `npm test -- src/engine/v080-inheritance-land-engine.test.ts src/store/slices/inheritanceLandSlice.test.ts src/engine/v080-narrative-schema.test.ts src/store/test-save-fixtures.test.ts`
- `npm test`：79 个测试文件 / 493 条用例通过。
- `npm run build`：通过，仅保留既有 chunk 大小警告。
- `npx playwright test tests/e2e/v080-inheritance-land.spec.ts`：桌面和移动端 reduced motion 2 条通过。

## 剩余风险

- c2.5 只做有限传承/福地样板，不覆盖全部原著传承、洞天吞并、完整地灵长期经营或仙蛊屋。
- 传承守护战已能复用 c2.3 剧情战斗候选，但 c2.5 未新增完整守护战内容链。
- 福地认主后长期经营、吞并、地灵成长、洞天边界突破适合 v0.9 或内容扩展继续拆分。

## 下一阶段入口

建议进入 `v0.8.0-content-rc` 或 `v0.8.0-rc`：
- 精选青茅山、商家城、三王山、王庭福地等前中期剧情长线。
- 给传承/福地系统补内容链，而不是继续扩运行时协议。
- 全量长测、测试存档、经济复验和发布收口。
