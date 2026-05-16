# RebornG v0.9.0 公开测试存档集

**同步日期**: 2026-05-15
**格式版本**: `formatVersion 22`
**使用方法**: 游戏主界面 -> 载入存档 -> 选择 `.json` 文件
**真相源**: `测试存档/v0.7.0/` 是长测与完整回归存档源，本目录是面向手动导入和发布包的精选镜像。

## 存档列表

| 文件 | 测试节点 | 域 | 境界 | 回合 |
|------|----------|----|------|------|
| `test-01-guyue-start.json` | 古月山寨开局身份路由 | 南疆 | 一转初阶 | 1 |
| `test-02-xiongjia-start.json` | 熊家寨开局身份路由 | 南疆 | 一转初阶 | 1 |
| `test-03-baijia-start.json` | 白家寨开局身份路由 | 南疆 | 一转初阶 | 1 |
| `test-04-caravan-squad.json` | 凡人商队小队编成 | 南疆 | 三转初阶 | 36 |
| `test-05-sanwang-squad-combat.json` | 三王山小队战遭遇 | 南疆 | 四转中阶 | 72 |
| `test-06-immortal-squad-combat.json` | 蛊仙期小队战 | 东海 | 六转初阶 | 180 |
| `test-07-dispatch-terrain-regression.json` | 小队外派地形回归 | 南疆 | 四转高阶 | 80 |
| `test-08-economy-tyh-pools.json` | 宝黄天全品类交易池 | 南疆 | 六转蛊仙 | 80 |
| `test-09-inheritance-land.json` | 待认主福地样本 | 南疆 | 六转初阶 | 221 |
| `test-10-grotto-heaven-boundary.json` | 洞天边界传闻禁区 | 疯魔窟外缘 | 六转初阶 | 128 |

## 覆盖范围

- 开局身份、地点、声望、行动入口。
- 小队编成、小队战、外派地形、奖励闸门与信任回流。
- 凡人/蛊仙经济边界，尤其是仙元、仙元石、宝黄天交易池。
- 福地、洞天边界、地灵执念与禁区压力。
- `v0.8` 修行、命运锚点、结局、福地候选与 `v0.9.0-a3` 道场线索状态。

## 维护规则

1. 本目录所有 `test-*.json` 必须保持当前 `SAVE_FORMAT_VERSION`，当前为 `formatVersion 22`。
2. 长测首选 `测试存档/v0.7.0/`；公开镜像只放 10 个最能代表 rc 回归面的样本。
3. 不再使用旧的 `generate-test-saves.cjs` 生成 `formatVersion 8` 存档；如需重建，先从当前真相源存档精选复制，再运行测试。
4. 更新后必须运行 `npm test -- src/store/test-save-fixtures.test.ts`。
