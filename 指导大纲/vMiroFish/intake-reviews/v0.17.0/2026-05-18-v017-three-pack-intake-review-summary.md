# v0.17.0 MiroFish 三包 Intake Review

日期：2026-05-18
状态：通过，允许进入 RebornG 候选规则层
审查人：RebornG 专家团

## 审查对象

| 包 | 文件 | 条目 | 结论 |
|---|---|---:|---|
| 低阶战斗遭遇候选 | `v017_low_rank_combat_encounter_pack_export_ready.json` | 12 | 通过 |
| 杀招/蛊虫反制边界 | `v017_killer_move_counter_boundary_pack_export_ready.json` | 12 | 通过 |
| 小队/阵法战术候选 | `v017_squad_formation_tactics_pack_export_ready.json` | 10 | 通过 |
| 合并覆盖报告 | `v017_combat_requests_0600_combined_coverage.json` | - | 通过 |

## 自动核验

- JSON 均可解析。
- 未发现 `quote`/原文正文字段。
- 三个 export 包均为 `export_ready`。
- 三个 report 的质量门显示为通过。
- 合并覆盖报告给出 `0001-0600` 严格范围内一次性交付足够、置信度高。
- 合计 source pointers：低阶战斗 54，反制边界 55，小队战术 45。

## 吸收口径

本次只吸收为 RebornG 自有候选规则、测试样本和 UI 提示材料：

1. 可进入 `src/canon/v017-combat-deepening-rules.json` 的 RebornG-owned candidate rules。
2. 可进入 `v0.17.0` 测试矩阵和 Player Advocate 样本。
3. 可用于低阶战斗候选、杀招/蛊虫反制、小队/阵法提示。

不得作为：

- 原著 canon 真相源。
- 运行时奖励、掉落、地点、阵营、NPC 生死依据。
- DeepSeek prompt 权限来源。
- 对外宣传承诺。
- 未经本地引擎验证的正式剧情结果。

## 阻断项

无本轮阻断项。

## 注意事项

- `v017_combat_flower_wine_cave_risk` 一类遗藏/洞窟样本只能保留为危险提示或 future candidate，不得开放正式遗藏、地点奖励或隐藏事实。
- 涉及狼潮、青书、熊力、白凝冰等高影响样本，本轮只作为小队/阵法/撤退压力提示，不落 NPC 生死、战局胜负或正史结果。
- 所有低阶战斗样本必须经过本地 `CombatEventCandidate` 入口校验，且不得设置 `enemySpecIds`，避免触发旧兽材掉落链。

## 进入 v0.17 的使用计划

| v0.17 阶段 | 使用方式 |
|---|---|
| b1 | 从低阶战斗包挑 2-3 个低风险样本进入行动工作台战斗准备入口 |
| b2 | 用低阶战斗包和本地战斗轨迹生成可解释回流 |
| b3 | 用反制边界包在蛊道/战斗准备中显示可用、不可用、反制、风险 |
| b4 | 用小队战术包只读展示士气、守卫、阵点、撤退/追击压力 |

结论：三包合格，v0.17 可以继续开发；不需要追加 MiroFish 包。
