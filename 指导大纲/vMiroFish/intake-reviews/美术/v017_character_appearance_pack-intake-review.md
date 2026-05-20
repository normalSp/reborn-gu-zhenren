# v017_character_appearance_pack intake review

日期：2026-05-18
包名：`v017_character_appearance_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/美术/v017_character_appearance_pack_export_ready.json`
关联 report：`v017_character_appearance_pack_report.json`
目标阶段：v0.17 关键 NPC / 南疆代表立绘美术依据
结论：`accepted_for_character_art_candidate_pool_with_long_gong_deferred_and_name_alias_merge`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| source dataset | `0001-0600 strict/reviewable base` |
| deliveryStatus | `conditional_complete_candidate` |
| itemCount | 10 |
| skippedCount | 1 |
| sourcePointerCount | 29 |
| evidenceStatus | `direct` 3；`direct_partial` 7 |
| sourcePointersPresentForAllItems | true |
| forbiddenTextKeyCount | 0 |
| sensitiveLeakTermCount | 0 |
| gateErrorCount | 0 |

未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段。未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地、十转、天庭、永生等高阶事实泄漏。所有 item 均为 candidate-only，不具备 runtime / canon / DeepSeek 权威。

## 覆盖项

| item | evidenceStatus | RebornG 处置 |
|---|---|---|
| `shang-xin-ci` | direct | 可作商心慈立绘 prompt seed |
| `zhang-xin-ci-name-alias` | direct_partial | **命名消歧，不单独生图**；与 `shang-xin-ci` 合并 |
| `xiao-die` | direct | 可作小蝶立绘 prompt seed |
| `zhang-zhu-guard` | direct | 可作张柱/护卫立绘 prompt seed |
| `shang-yan-fei` | direct_partial | 可作商燕飞早期/公开阶段立绘 prompt seed；不得渲染后期高阶形象 |
| `wei-yang` | direct_partial | 可作魏央立绘 prompt seed |
| `shang-ya-zi` | direct_partial | 可作商牙眦立绘 prompt seed |
| `southern-border-rogue-cultivator-representative` | direct_partial | 可作南疆散修代表候选；需 art-director scope freeze |
| `three-clan-outer-surname-representative` | direct_partial | 可作三族外姓代表候选；需 art-director scope freeze |
| `caravan-guard-and-market-broker-representative` | direct_partial | 可作商队护卫/坊市掮客代表候选；需 art-director scope freeze |

## Deferred / skipped

| item | 原因 | RebornG 处置 |
|---|---|---|
| `long-gong` | 0001-0600 strict/reviewable base 中没有可用公开外观信号 | **deferred**；不得从后期或隐藏材料补画；不得进入 v1.0 前生图清单 |

## 命名与图量修正

- `张心慈` 是 `商心慈` 的化名/命名消歧项，不应画成第二个角色。
- `龙公` 本包明确 deferred，不应在当前窗口强行生图。
- 本包实际可画角色不是 10 张，而是 9 张：`商心慈 / 小蝶 / 张柱护卫 / 商燕飞 / 魏央 / 商牙眦 / 南疆散修代表 / 三族外姓代表 / 商队护卫或坊市掮客代表`。

## 可吸收方式

允许进入：

- `candidate_pool`
- `art_prompt_seed`
- `character_moodboard`

不可直接进入：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 角色命运/结局决定权
- 正式角色身份、势力归属、成长路径
- 高阶蛊仙形象或仙蛊持有状态

## 阻塞结论

v0.17 角色立绘不再被 MiroFish 全包阻塞，但仍有两个决策点：

1. `long-gong`：当前必须 deferred。若 v1.0 前一定需要龙公图，必须另发更后窗口或专项 hard-stop 请求；否则从 v1.0 必需图中剔除。
2. 三个代表型角色（南疆散修、三族外姓、商队护卫/坊市掮客）需要用户或 art-director 确认是否纳入 v1.0 必需图，而不是仅作为候选模板。

如果用户接受“龙公延期、张心慈合并商心慈、代表型角色按候选模板生成”，则可先生成非战斗角色图。
