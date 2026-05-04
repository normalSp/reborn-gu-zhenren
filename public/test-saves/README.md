# 蛊真人模拟器 - P2 测试存档集

**生成日期**: 2026-05-03
**格式版本**: formatVersion 8
**使用方法**: 游戏主界面 → 存档(按钮) → 导入存档 → 选择 `.json` 文件

---

## 存档列表

| 文件 | 测试节点 | 域 | 境界 | 回合 | 数据量 |
|------|---------|-----|------|------|--------|
| `test-01-nanjiang-start.json` | 南疆开局 | 南疆 | 一转初阶 | 1 | 2.7KB |
| `test-02-beiyuan-start.json` | 北原开局 | 北原 | 一转初阶 | 1 | 2.6KB |
| `test-03-donghai-start.json` | 东海开局 | 东海 | 一转初阶 | 1 | 2.6KB |
| `test-04-ximo-start.json` | 西漠开局 | 西漠 | 一转初阶 | 1 | 2.6KB |
| `test-05-zhongzhou-start.json` | 中洲开局 | 中洲 | 一转初阶 | 1 | 2.6KB |
| `test-06-breakthrough.json` | 升转突破 | 南疆 | 二转高阶 | 20 | 3.2KB |
| `test-07-combat-famousscene.json` | 战斗+名场面 | 南疆 | 五转初阶 | 50 | 5.7KB |
| `test-08-economy.json` | 经济系统 | 南疆 | 三转高阶 | 35 | 4.3KB |
| `test-09-npc-crossdomain.json` | NPC交互+跨域 | 北原(跨域) | 四转初阶 | 45 | 5.3KB |
| `test-10-highrealm-daoheart.json` | 高阶+道心+成就 | 北原 | 五转巅峰 | 60 | 5.5KB |

---

## 各存档详细测试内容

### test-01 ~ 05: 五域开局
- 每个域使用正确的 chapterId、domain、playerPosition、flags
- 包含对应的 chapterHistory（第一章已激活）
- 对应的 goals（该域第一章的目标已设为 active）
- 探索区域和已知地点按域配置

### test-06: 升转突破
- 二转高阶境界，真元满(200/200)
- 已完成青茅山期，当前在商路求生第20回合
- 携带2只蛊虫(月光蛊、石皮蛊)，均已升到二转
- slqs_first_caravan 目标已完成，slqs_earn_200 进行中

### test-07: 战斗+名场面
- 五转初阶，南疆三王山前夜(sanwang_yitian)
- **决斗状态激活**：敌对NPC为白凝冰(五转巅峰冰道蛊师)
- **名场面触发**：sanwangshan L0 核心事件 + yitianshan L1 涟漪
- 章节历史完整(5章全走完 sanwang_tian 进行中)
- 完整 NPC 关系网(古月方源/白凝冰/商心慈/太白云生)
- 4个蛊虫 + 1个杀招(月刃连斩 Lv3)
- 全局事件状态含三王山+义天山

### test-08: 经济系统
- 三转高阶，2500元石 + 50仙元石
- 7只蛊虫(含饥饿状态的侦察蛊)
- 10种蛊材(materialBag)，覆盖喂养各种蛊虫的需求
- 完整货币日志(currencyLog 4条记录)
- 已访问3个商店(南疆商会/散修集市/坊市蛊材铺)
- 零债务，已解锁"商队后人"出身

### test-09: NPC交互+跨域
- 四转初阶，出身南疆，当前在北原王庭初现
- **8个NPC好感矩阵**（方源+15/商心慈+40/太白云生+20/白凝冰-10/黑楼兰+5/马鸿运+8/秦百胜-3/黑城-5）
- **跨域章节历史**：南疆5章(4完成+1进行中) → 北原
- 完整 characterRelations（含已知秘密/揭示秘密）
- 完整势力声望（南疆商会/古月山寨/三王山/黄金家族/影宗）
- 4条游戏事件日志（名场面+跨域迁移）
- 200元石债务

### test-10: 高阶+道心+成就
- **五转巅峰**，资质10(十绝体)，北原黄金试炼(north_golden)
- **道心极端值**：kill:15, mercy:0, scheme:8, ambition:12
- **12个成就已解锁**：包括 realm_1~4, gu_collector, gu_master, rich_500, rich_2000, combat_veteran, beiyuan_warrior, cross_domain
- **8只蛊虫**（含招灾蛊仙蛊+饥饿侦察蛊）
- **4个杀招**（月刃连斩5级/石皮护体4级/青丝绞杀3级/水龙卷4级）
- **本命蛊绑定**：力气蛊（已升级2次，冷却剩余5回合）
- 丰富蛊材（7种50+数量）
- 500元石债务
- 全局事件：wangting_fudi 已触发进行中
- 已解锁出身：battlefield_orphan

---

## 验证说明

1. 所有存档使用 `formatVersion 8`（与当前 SAVE_FORMAT_VERSION 一致）
2. 存盘中不包含 EXCLUDE_FROM_SAVE 字段（如 screenState, pipelinePhase 等）
3. 所有章节ID、成就ID、蛊虫名称均来自 canon 数据文件
4. 可序列化字段完整，无函数引用

## 生成脚本

如需重新生成或自定义存档，运行:
```bash
node generate-test-saves.cjs
```
