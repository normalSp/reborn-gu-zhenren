# v0.16 / v0.17 美术 MiroFish 交付 intake 汇总

日期：2026-05-18
交付目录：`指导大纲/vMiroFish/intake-reviews/美术/`
关联 roadmap：`doc/art/v014-to-v100-art-roadmap.md`

## 包级结论

| 包 | deliveryStatus | RebornG intake 结论 | 是否解除阻塞 |
|---|---|---|---|
| `v016_battle_scene_composition_anchor_pack` | `complete_candidate` | `accepted_for_composition_contract_seed` | 解除战斗构图锚点阻塞；但用户要求先不生战斗图 |
| `v017_region_appearance_pack` | `conditional_complete_candidate` | `accepted_for_region_art_candidate_pool_with_two_low_evidence_items` | 解除 7/9 区域图阻塞；2 张 concept-only 需用户口径 |
| `v017_character_appearance_pack` | `conditional_complete_candidate` | `accepted_for_character_art_candidate_pool_with_long_gong_deferred_and_name_alias_merge` | 解除 9 张可画角色阻塞；龙公 deferred，张心慈并入商心慈 |

三包共同通过：

- JSON 可解析。
- sourcePointers 全 item 覆盖。
- `forbiddenTextKeyCount = 0`。
- `sensitiveLeakTermCount = 0`。
- `gateErrorCount = 0`。
- 不含原文正文承载字段。
- 不授予 runtime / canon / DeepSeek 权威。

## v1.0 非战斗图阻塞点

### 已解除

- 商家城大景、城门、坊市、凡级拍卖行：可进入候选生图。
- 南疆主区域、南疆山口、三王山：可进入候选生图。
- 商心慈、小蝶、张柱护卫、商燕飞、魏央、商牙眦：可进入候选生图。
- 南疆散修代表、三族外姓代表、商队护卫/坊市掮客代表：可进入候选生图，但需用户接受“代表模板”口径。

### 仍需用户口径

| 项 | 阻塞类型 | 选项 |
|---|---|---|
| `yi-tian-mountain` | low-evidence / concept-only | A：按概念候选图生成；B：先发 0601-0800 R2 再画 |
| `southern-border-river-valley` | low-evidence / concept-only | A：按泛南疆河谷候选图生成；B：先发 0601-0800 R2 再画 |
| `long-gong` | deferred，无 0001-0600 公开外观信号 | A：从 v1.0 必需图剔除；B：另发后期窗口/专项 hard-stop 请求 |
| `zhang-xin-ci` | name alias merge | 不单独生图；并入 `shang-xin-ci` |
| 代表型角色 3 张 | scope freeze | A：纳入 v1.0 候选生图；B：先不画，等角色名单冻结 |
| 仙蛊闪图 | canon/IF hard stop | 先走 expert council §Lore + §Systems，不由本次 MiroFish 直接解锁 |
| 4 只 atlas-pending 蛊 | body missing | 默认不画；只有用户选择 effect-only 气场卡才启用 R3 |

## 当前可立即开始的非战斗生图池

如果用户接受 concept-only / deferred 处理口径，当前可先从以下非战斗图开始：

### 区域/城景

1. `shang-clan-city-panorama`
2. `shang-clan-city-gate`
3. `shang-clan-city-market`
4. `shang-clan-city-auction-house`
5. `southern-border-main-region`
6. `southern-border-mountain-pass`
7. `three-kings-mountain`

可选低证据候选：

8. `yi-tian-mountain`
9. `southern-border-river-valley`

### 角色

1. `shang-xin-ci`
2. `xiao-die`
3. `zhang-zhu-guard`
4. `shang-yan-fei`
5. `wei-yang`
6. `shang-ya-zi`

可选代表模板：

7. `southern-border-rogue-cultivator-representative`
8. `three-clan-outer-surname-representative`
9. `caravan-guard-and-market-broker-representative`

## 推荐下一步

先不生战斗图。建议用户确认以下口径后开始非战斗生图：

1. 接受 `yi-tian-mountain` 和 `southern-border-river-valley` 作为 `concept-only candidate`，还是先补 R2。
2. 接受 `long-gong` 从 v1.0 必需图移出，还是发后期窗口专项。
3. 接受 3 张代表型角色进入 v1.0 候选生图，还是先等 v0.17 角色名单冻结。

在这三点明确前，最稳妥的可生图池是 7 张区域/城景 + 6 张具名角色，共 13 张非战斗候选。
