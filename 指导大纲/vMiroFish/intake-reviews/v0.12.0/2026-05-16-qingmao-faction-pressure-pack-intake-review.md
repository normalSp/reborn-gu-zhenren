# MiroFish Intake Review: Qingmao Faction Pressure Pack

日期：2026-05-16
审查对象：`v0.12.0-b2 NPC / faction reaction bridge 第一刀`
结论：`accepted_for_candidate_pool`，可转为 `accepted_for_rule_draft` 与 `test_sample`。不得直接进入 runtime truth。

## 主包路径

- 主包：`指导大纲/vMiroFish/v0.12.0/qingmao_faction_pressure_pack_export_ready.json`
- 报告：`指导大纲/vMiroFish/v0.12.0/qingmao_faction_pressure_pack_export_ready_report.json`
- 说明：`指导大纲/vMiroFish/v0.12.0/2026-05-16-qingmao-faction-pressure-pack.md`
- 请求：`指导大纲/vMiroFish/requests/2026-05-16-qingmao-faction-pressure-pack.md`

## 统计

| 项目 | 数量 |
|---|---:|
| totalItems | 12 |
| factionPressure | 8 |
| npcReactionCandidate | 4 |
| sourcePointers | 34 |
| quoteLikeKeys | 0 |
| review status | 12 个 `export_ready` |

覆盖：

- clanSchoolPressure：2
- taskGroupPressure：3
- merchantPressure：2
- internalAffairsTrace：true
- externalClanSuspicion：true

## 自动检查

已做轻量结构检查：

- quote/originalText/excerpt/verbatim 字段：未发现。
- 重复 item id：未发现。
- 缺 summary 项：未发现。
- 缺 source pointer 项：未发现。
- runtime authority 越权：未发现。
- DeepSeek visible 越权：未发现。
- hidden gate 异常：未发现。

## 权限边界

主包声明并实际符合：

- `runtimeAuthority = candidate_only`
- `runtimeVisible = false`
- `deepSeekVisible = false`
- `requiresHumanCanonReview = true`

结论：可以作为 b2 reaction bridge 候选材料，但 MiroFish 仍不是 canon，不是 runtime，不是 DeepSeek 权限源。

## 可吸收项

### 可转为 b2 rule draft

以下条目可转写成 RebornG-owned reaction rule draft：

- `pressure_ch0005_guyue_faction_competition`
- `pressure_ch0011_clan_school_refinement_exam`
- `pressure_ch0016_elder_security_alert`
- `reaction_ch0024_inn_caravan_wine_window`
- `reaction_ch0028_school_elder_observes_extortion`
- `pressure_ch0060_jiafu_caravan_revenge`
- `reaction_ch0078_tri_clan_external_suspicion`
- `pressure_ch0089_jiaosan_group_resource_distribution`
- `pressure_ch0090_jiaosan_group_social_payment`
- `pressure_ch0092_jiaosan_group_task_authority`
- `pressure_ch0096_sick_snake_group_trust_crisis`
- `reaction_ch0099_internal_affairs_task_trace`

吸收边界：

- 只能生成轻量反应候选：警惕、观望、试探、盘问、阻拦、交易窗口、谣言扩散、记录痕迹。
- 可以写入现有 `factionPressure`、`npcMemories`、`actionConsequences`、`localActionLedger` 或 `lastWorldActionReturnContext`。
- 不得写阵营身份、声望数值、奖励、NPC 生死、追击成败、正史锚点变化。

### 可转为测试样本

适合 b2 focused tests 的样本：

- 族学公开表现 -> 记录/观望，不立刻奖惩。
- 购买补给/商队窗口 -> 消费痕迹/库存压力，不给物品。
- 任务缺席/闭关 -> 上门查问/寻找下落，不判定追击成功。
- 内务堂申请 -> record trace，不泄露隐藏事实。
- 白家/熊家外部嫌疑 -> external suspicion，不开放阵营转换。

## 延期项

本包没有必须延期的条目。

但以下用法延期：

- `pressure_ch0060_jiafu_caravan_revenge` 中涉及商队长期追责，可先进入候选规则，不在 b2 第一刀结算长期复仇线。
- `reaction_ch0078_tri_clan_external_suspicion` 可先作为三寨互疑压力，不在 b2 第一刀扩大成完整三寨战争/通缉系统。

## 阻断项

未发现必须完全阻断的条目。

以下用法必须阻断：

- 用 reaction rule 直接改变阵营身份或声望。
- 用 reaction rule 直接结算 NPC 生死、通缉、追击成功/失败。
- 用 merchant pressure 发放元石、酒、材料或交易结果。
- 用 elder/security pressure 揭露隐藏事实。
- 用 external clan suspicion 开放白家/熊家投靠或地点解锁。
- 让 DeepSeek 直接决定 reaction 结果。

## 主要风险

1. **reaction bridge 过宽风险**
   - 包内覆盖族学、小组、商队、家老、外寨和内务堂。
   - b2 第一刀应做通用轻量反应桥，不做完整 NPC 系统。

2. **压力变成声望系统风险**
   - `factionPressure` 只能表达压力、机会、痕迹，不是声望数值。
   - 不得写 standing delta。

3. **商队长期线膨胀风险**
   - 贾富商队追责可以作为压力候选，不应在 b2 第一刀展开复仇线。

4. **外寨疑云变成阵营转换风险**
   - 白家/熊家嫌疑只能作为互疑压力，不可开放投靠或阵营切换。

## 对 v0.12-b2 的建议

可以解除 b2 的资料门禁，进入 conservative runtime first cut。

b2 第一刀建议：

- 新增 RebornG-owned `qingmao-faction-reaction-bridge` 本地规则草案。
- 新增 helper 根据公开 knownFacts / actionConsequences / factionPressure / playerGoals 匹配 reaction candidates。
- 允许写入现有 v22 字段：
  - `factionPressure`
  - `npcMemories`
  - `actionConsequences`
  - `worldClock.lastActionId`
  - `localActionLedger`
  - `lastWorldActionReturnContext`
- 不新增持久化字段。
- 不改变 `SAVE_FORMAT_VERSION`。

b2 第一刀禁止：

- standing delta。
- faction transfer。
- reward writes。
- location unlock。
- NPC death / capture result。
- canon anchor mutation。
- hidden fact reveal。
- DeepSeek authority expansion。

## 当前阶段结论

审查结论：`accepted_for_candidate_pool`。

推荐吸收等级：

- `factionPressure`：`accepted_for_rule_draft`。
- `npcReactionCandidate`：`accepted_for_rule_draft`。
- 全包可抽成 focused `test_sample`。

是否需要用户决策：

- 不需要新的方向决策。
- 如果 b2 实现中要新增正式声望、阵营变化、NPC 生死、追击成败、持久化 reaction state 或地点解锁，必须停下来请求用户决策。
