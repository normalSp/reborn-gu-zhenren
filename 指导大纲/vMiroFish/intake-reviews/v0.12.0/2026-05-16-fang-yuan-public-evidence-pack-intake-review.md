# MiroFish Intake Review: Fang Yuan Public Evidence Pack

日期：2026-05-16
审查对象：`v0.12.0-b3 方源公开旁证询问`
结论：`accepted_for_candidate_pool`，可转为 `fact_card_draft`、`rule_draft` 与 `test_sample`。不得直接进入 runtime truth。

## 主包路径

- 主包：`指导大纲/vMiroFish/v0.12.0/fang_yuan_public_evidence_pack_export_ready.json`
- 报告：`指导大纲/vMiroFish/v0.12.0/fang_yuan_public_evidence_pack_export_ready_report.json`
- 说明：`指导大纲/vMiroFish/v0.12.0/2026-05-16-fang-yuan-public-evidence-pack.md`
- 请求：`指导大纲/vMiroFish/requests/2026-05-16-fang-yuan-public-evidence-pack.md`

## 统计

| 项目 | 数量 |
|---|---:|
| totalItems | 15 |
| publicFactCandidate | 2 |
| publicEvidenceCandidate | 5 |
| npcObservationCandidate | 2 |
| inquiryReactionCandidate | 4 |
| hiddenBoundaryRef | 2 |
| sourcePointers | 14 |
| quoteLikeKeys | 0 |
| review status | 15 个 `export_ready` |

覆盖：

- clan-school public ranking / conflict evidence。
- lodging / inn-side public traces。
- visible supply and delivery traces。
- merchant inquiry and continuing pressure。
- task-group absence and landlord-side whereabouts statements。
- internal-affairs process trace。
- hidden boundaries for supply purpose and post-arena internal checking。

## 自动检查

已做轻量结构检查：

- quote/originalText/excerpt/verbatim 字段：未发现。
- 春秋蝉、重生、回溯、未来记忆等禁词：未发现。
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

结论：可以作为 b3 方源公开旁证候选材料，但 MiroFish 仍不是 canon，不是 runtime，不是 DeepSeek 权限源。

## 可吸收项

### 可转为 b3 public evidence draft

以下条目可转写成 RebornG-owned public evidence / fact draft：

- `fy_public_ch0010_night_exit_trace`
- `fy_public_ch0012_inn_lodging_shift`
- `fy_public_ch0018_family_inn_question`
- `fy_public_ch0022_clan_school_ranking_board`
- `fy_public_ch0024_inn_supply_trace`
- `fy_public_ch0028_school_gate_conflict`
- `fy_public_ch0031_repeat_school_gate_conflict`
- `fy_public_ch0056_merchant_inquiry_record`
- `fy_public_ch0058_inquiry_test_procedure`
- `fy_public_ch0058_continued_investigation_pressure`
- `fy_public_ch0092_task_absence_trace`
- `fy_public_ch0093_landlord_whereabouts_statement`
- `fy_public_ch0099_internal_affairs_trace`

吸收边界：

- 只能生成公开旁证、公开记忆、关系/势力压力和行动后果。
- 可以写入现有 `knownFacts`、`hiddenFactRefs`、`npcMemories`、`factionPressure`、`actionConsequences`、`localActionLedger` 或 `lastWorldActionReturnContext`。
- 不得写方源隐藏因果、真实目的、内心计划、未来信息、NPC 生死、抓捕、追踪成功、正史改变、奖励或地点解锁。

### 可转为 hidden boundary gate

以下条目只能转成 hidden ref / gate，不得进入玩家可见 UI 或 DeepSeek visible context：

- `fy_hidden_boundary_ch0024_supply_purpose`
- `fy_hidden_boundary_ch0087_arena_internal_check`

### 可转为测试样本

适合 b3 focused tests 的样本：

- 打听方源住处变化 -> 可得客栈/住处公开痕迹，不能推出真实目的。
- 查看族学榜单/询问同窗 -> 可得公开表现记录，不能推出隐藏原因。
- 询问酒水补给 -> 只能得到消费/送货痕迹，不能得到用途结论。
- 追问商队问询 -> 只能得到公开问询流程和外部压力，不能得到案件真相。
- 调查任务缺席/房东口供 -> 只能得到缺席和有限口供，不能确定所在地点或路线结果。

## 延期项

以下用法延期：

- 将公开旁证扩成完整方源行为时间线。
- 让 NPC / faction reaction 进一步决定抓捕、通缉、追踪成功或方源轨迹变化。
- 把 hidden boundary 转成玩家可见文本或 DeepSeek 可见事实。

## 阻断项

未发现必须完全阻断的条目。

以下用法必须阻断：

- 用 public evidence 直接揭示方源隐藏因果。
- 用 inquiry result 直接判定跟踪成功、抓捕成功、NPC 生死或正史改变。
- 用商队问询材料直接给出案件真相。
- 用酒水/补给旁证直接给出用途或目的地结论。
- 让 DeepSeek 决定方源公开旁证的最终事实。

## 主要风险

1. **第三者视角泄露风险**
   - 方源公开旁证只能给玩家角色可见的表象、口供和流程记录。
   - 不能把读者知道或主角隐藏因果写给玩家角色。

2. **公开证据过度确定风险**
   - 公开旁证只能形成有限结论、怀疑和压力。
   - 不能把“可能”“痕迹”“口供”升级成确定真相。

3. **方源线过早变成主线追踪**
   - b3 第一刀只做公开旁证询问，不做完整追踪系统。

## 对 v0.12-b3 的建议

可以解除 b3 的资料门禁，进入 conservative runtime first cut。

b3 第一刀建议：

- 新增 RebornG-owned `qingmao-fang-yuan-public-evidence` 本地规则草案。
- 新增 helper 根据玩家公开询问意图匹配 public evidence candidates。
- 允许写入现有 v22 字段：
  - `knownFacts`
  - `hiddenFactRefs`
  - `npcMemories`
  - `factionPressure`
  - `actionConsequences`
  - `worldClock.lastActionId`
  - `localActionLedger`
  - `lastWorldActionReturnContext`
- 不新增持久化字段。
- 不改变 `SAVE_FORMAT_VERSION`。

b3 第一刀禁止：

- hidden fact reveal。
- Fang Yuan hidden causality。
- tracking success / capture result。
- NPC death。
- reward writes。
- location unlock。
- canon anchor mutation。
- DeepSeek authority expansion。

## 当前阶段结论

审查结论：`accepted_for_candidate_pool`。

推荐吸收等级：

- `publicFactCandidate`：`accepted_for_fact_card_draft`。
- `publicEvidenceCandidate`：`accepted_for_fact_card_draft`。
- `npcObservationCandidate`：`accepted_for_rule_draft`。
- `inquiryReactionCandidate`：`accepted_for_rule_draft`。
- `hiddenBoundaryRef`：`hidden_ref_only`。
- 全包可抽成 focused `test_sample`。

是否需要用户决策：

- 不需要新的方向决策。
- 如果 b3 实现中要新增正式追踪系统、抓捕/逃脱结果、NPC 生死、方源轨迹变化、持久化 reaction state、地点解锁、奖励或隐藏事实展示，必须停下来请求用户决策。
