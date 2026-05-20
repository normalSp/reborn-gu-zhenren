# v017_region_appearance_pack intake review

日期：2026-05-18
包名：`v017_region_appearance_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/美术/v017_region_appearance_pack_export_ready.json`
关联 report：`v017_region_appearance_pack_report.json`
目标阶段：v0.17 多区域大景 + 商家城城景美术依据
结论：`accepted_for_region_art_candidate_pool_with_two_low_evidence_items`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| source dataset | `0001-0600 strict/reviewable base` |
| deliveryStatus | `conditional_complete_candidate` |
| itemCount | 9 |
| skippedCount | 0 |
| sourcePointerCount | 26 |
| evidenceStatus | `direct` 2；`direct_partial` 5；`concept_only` 2 |
| sourcePointersPresentForAllItems | true |
| forbiddenTextKeyCount | 0 |
| sensitiveLeakTermCount | 0 |
| gateErrorCount | 0 |

未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地、十转、天庭、永生等高阶事实泄漏。所有 item 均为 candidate-only，不具备 runtime / canon / DeepSeek 权威。

## 覆盖项

| item | evidenceStatus | RebornG 处置 |
|---|---|---|
| `southern-border-main-region` | direct_partial | 可作南疆泛区域大景 prompt seed |
| `shang-clan-city-panorama` | direct | 可作商家城大景 prompt seed |
| `three-kings-mountain` | direct_partial | 可作候选大景，但需避免过度具体化遗迹 |
| `yi-tian-mountain` | concept_only | **低证据项**；可画概念性远山/山势，不应绑定正式义天山 canon |
| `southern-border-mountain-pass` | direct_partial | 可作山口过渡景 prompt seed |
| `southern-border-river-valley` | concept_only | **低证据项**；可画泛南疆河谷，不应绑定正式区域 canon |
| `shang-clan-city-market` | direct_partial | 可作商家城坊市 prompt seed |
| `shang-clan-city-auction-house` | direct_partial | 可作凡级拍卖行 prompt seed；不得暗示宝黄天交易 |
| `shang-clan-city-gate` | direct | 可作商家城城门 prompt seed |

## 与 request 的差异

原 request 建议包含 0601-0800 作为补充窗口；本次交付只覆盖 0001-0600。MiroFish combined coverage 判定 0001-0600 对 candidate intake 足够，0601-0800 只会细化区域特征，不构成本次候选交付阻塞。

RebornG 复核口径：

- 对 7 个 direct/direct_partial 项，解除 v0.17 区域生图的 MiroFish 阻塞。
- 对 `yi-tian-mountain` 与 `southern-border-river-valley`，若要做“正式 canon 锚点级”区域图，建议补 0601-0800 R2；若只做 v1.0 前候选/氛围图，可按 concept-only 低证据生成，并在 ledger 标注 `concept-only candidate`。

## 可吸收方式

允许进入：

- `candidate_pool`
- `art_prompt_seed`
- `region_moodboard`

不可直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式地点解锁
- 正式势力归属 / 身份转换
- 正式商家城/三王山/义天山进入凭据
- 正式拍卖行交易接口

## 阻塞结论

当前 v0.17 区域美术不再被 MiroFish 全包阻塞，但有两个质量/边界决策点：

1. `yi-tian-mountain`：是否接受 concept-only 候选图，或先请求 0601-0800 R2。
2. `southern-border-river-valley`：是否接受泛南疆河谷候选图，或先请求 0601-0800 R2。

如果用户接受 concept-only 候选口径，则可先生成非战斗区域图；若要求全部正式 canon 锚点级依据，则这两张仍需 R2。
