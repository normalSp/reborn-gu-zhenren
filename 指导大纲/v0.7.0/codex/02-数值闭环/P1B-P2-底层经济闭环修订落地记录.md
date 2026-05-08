# P1-B/P2 底层经济闭环修订落地记录

日期：2026-05-08

## 结论

本轮修订撤销了“蛊虫催化物 / 工艺说明”这类不符合蛊真人世界观的分类，改为原著口径：

- `MaterialRegistry`：只承接可入库、可交易、可消耗的蛊材与仙材；食料作为 `usageTags`，不是新的玄幻资源类别。
- `RecipeRegistry`：承接蛊方、残方、炼蛊路线、升炼路线、逆炼/拆炼路线；若配方需要蛊虫，进入 `sourceGu` 或 `auxiliaryGu`，不得写入材料表。
- `Discovery/Rumor`：承接 AI 生成但未登记的蛊材、蛊方、传承、剧情物件，不直接进入背包、炼蛊 UI、宝黄天或经济池。

## 已落地工程点

- 新增 `src/engine/recipe-registry.ts`，统一从 `gu-database.json` 与 `fragment-recipes.json` 生成运行时配方视图。
- 修订 `src/engine/material-registry.ts`，删除 `gu_catalyst / process_note / consumable / rumor` 分类，改为 `gu_material / immortal_material` 与 `usageTags`。
- 修订 `src/engine/refine-engine.ts` 与 `src/engine/recipe-discovery.ts`，炼蛊/升炼/残方补全读取规范化配方成本。
- 新增 `src/canon/economy-balance.json` 与 `src/engine/economy-simulation.ts`，固化 P2 稳健节奏模拟入口。
- 新增轻量 skill：`C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`。

## P2 稳健节奏闸门

- 20 回合：能购买低级仙材或残方，不能稳定购买六转仙蛊。
- 100 回合：能完成一个六转大目标，不能重复购买多个六转大目标。
- 300 回合：可以形成多个六转资产，但七转以上仍是战略目标。

## 后续必做

- 将宝黄天当前低价运行时公式与 `economy-balance.json` 模拟价表做交叉审计，输出价格表给用户决策后再固化。
- 继续扩展养蛊食料闭环：喂养 UI 不能只扣元石，应优先读取 `feedRequirement` 与 MaterialRegistry 的 `feeding` 用途。
- 针对每个可炼蛊虫输出“材料来源路径”：商店、掉落、势力、训练场、仙窍资源点、宝黄天或剧情白名单。
