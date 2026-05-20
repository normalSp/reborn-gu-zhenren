# v016_battle_scene_composition_anchor_pack intake review

日期：2026-05-18
包名：`v016_battle_scene_composition_anchor_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/美术/v016_battle_scene_composition_anchor_pack_export_ready.json`
关联 report：`v016_battle_scene_composition_anchor_pack_report.json`
目标阶段：v0.16 战斗场景构图锚点与历史战斗图核验
结论：`accepted_for_composition_contract_seed`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| source dataset | `0001-0600 strict/reviewable base` |
| deliveryStatus | `complete_candidate` |
| itemCount | 8 |
| skippedCount | 0 |
| sourcePointerCount | 20 |
| evidenceStatus | `direct` 6；`direct_partial` 2 |
| sourcePointersPresentForAllItems | true |
| forbiddenTextKeyCount | 0 |
| sensitiveLeakTermCount | 0 |
| gateErrorCount | 0 |

未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地、十转、天庭、永生等高阶事实泄漏。所有 item 均为 candidate-only，不具备 runtime / canon / DeepSeek 权威。

## 覆盖项

| item | evidenceStatus | 处置 |
|---|---|---|
| `xiong-li-squad-vs-bai-ning-bing` | direct | 可进入 `composition_contract_seed`；POV 仍需 RebornG 美术审定 |
| `fang-yuan-monkey-king-cavern-fight` | direct_partial | 可进入 `composition_contract_seed`；严禁引入春秋蝉示警机制 |
| `first-gen-vs-tie-xue-leng-blood-lake` | direct | 可进入 `composition_contract_seed` |
| `thunder-crown-wolf-village-battle` | direct | 可进入 `composition_contract_seed` |
| `first-gen-vs-tie-xue-leng-crane-chaos` | direct_partial | 可进入 `composition_contract_seed`；鹤群/天鹤上人介入方式仍需人工复核 |
| `fang-yuan-vs-bai-ning-bing-second-battle` | direct | 可核验历史图 |
| `qing-shu-vs-bai-ning-bing-forest-duel` | direct | 可核验历史图 |
| `earthwolf-spider-third-battle` | direct | 可核验历史图 |

## 可吸收方式

允许进入：

- `candidate_pool`
- `art_prompt_seed`
- `composition_contract_seed`
- 历史战斗图核验清单

不可直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式战斗结果、胜负、伤亡、关键蛊归属
- `qingmao-visual-assets.json` 或 `battle-asset-manifest.json` 的直接入库决策

## 生成边界

用户本轮明确“先不生战斗图”。因此本包通过 intake 后只解除“战斗构图锚点依据”问题，不触发战斗图生图。

## 结论

本包通过 RebornG intake，可作为 v0.16 战斗场景 Composition Contract 的候选底稿，也可用来核验历史 3 张战斗图。当前无 MiroFish 阻塞项，但战斗图继续暂停生成。
