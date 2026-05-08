# Gu Economy And Event Anchors

## Gu And Killer Moves

- 蛊虫是世界规则的最小可操作单位，分凡蛊与仙蛊；仙蛊具有唯一性，不能在全局重复流通。
- 杀招是多只蛊虫组合出来的使用方式，不等同于蛊虫。重复杀招应按核心蛊组合或杀招名去重。
- 宝黄天可交易仙蛊、仙材、仙蛊方、杀招传承。当前实现证据见 `src/engine/auction-engine.ts` 与 `src/store/slices/auctionSlice.ts`。

## Economy Terms

| Term | Development Summary | Canon Source |
| --- | --- | --- |
| 元石 | 凡级蛊师经济核心，低转修炼/交易/食宿使用。 | `src/canon/economy.json` |
| 仙元石 | 蛊仙交易货币，宝黄天、仙窍经营、势力维护使用。 | `src/canon/economy.json` |
| 蛊材 | 炼蛊、喂养、资源节点产出的材料统称。 | `src/canon/economy.json`, `src/canon/shop-items.json` |
| 仙材 | 宝黄天与仙窍经营关键资源，v0.7交易池应非空。 | `src/canon/economy.json` |
| 仙蛊方/残方 | 炼制或升炼路线的配方碎片，适合成就、探索、拍卖联动。 | `src/canon/fragment-recipes.json` |

## Event Anchors

| Anchor | Design Use | Search Terms |
| --- | --- | --- |
| 春秋蝉重生 | 正史线起点、命运回滚、方源核心动机。 | `春秋蝉`, `重生` |
| 青茅山/古月山寨 | 新手期、家族秩序、开窍、早期蛊虫经济。 | `青茅山`, `古月山寨`, `开窍` |
| 商家城 | 南疆贸易、演武场、商路、人情债。 | `商家城`, `演武场` |
| 三王山 | 传承、杀招/蛊方、魔道冲突升级。 | `三王山`, `传承` |
| 北原王庭 | 部族战争、小队战、权力竞逐。 | `王庭`, `北原` |
| 义天山 | 高转大战、宿命/棋局压迫，不适合低转玩家硬改主线。 | `义天山` |
| 逆流河 | 高压意志考验、逆流护身印、道心里程碑。 | `逆流河` |
| 宿命大战 | 天庭与尊者级冲突，适合作为远期L3世界状态。 | `宿命蛊`, `天庭`, `大战` |
