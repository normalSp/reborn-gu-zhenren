# RebornG v0.17.0 Codex 当前入口

日期：2026-05-18
状态：本地开发里程碑已完成，Git/远端 CI 收束中
主题：`战斗、杀招、小队与阵法深化`

## 定位

`v0.17.0` 承接 `v0.16.0 系统收束、UI 减法与权威归并`。v0.16 已经把正式底栏收束为：

`地图 / 行动 / 角色 / 蛊道 / 世界 / 记录`

因此 v0.17 的战斗深化不再从演武按钮或旧调试入口出发，而要回到新的玩家心智：

`行动 -> 战斗候选/出战准备 -> 本地战斗裁决 -> 战斗轨迹 -> 蛊道/记录/社会后果回流`

## 当前权威文件

- `v0.17.0-总体开发大纲.md`
- `v0.17.0-启动审查与范围冻结.md`
- `v0.17.0-小版本执行路线图.md`
- `v0.17.0-需求决策池.md`
- `v0.17.0-真相源索引.md`
- `v0.17.0-测试矩阵.md`
- `v0.17.0-MiroFish资料需求与交付协议.md`
- `v0.17.0-Git提交与推送计划.md`

## 主目标

让低阶战斗从“可演示的棋盘样板”升级为“可解释、可回流、可持续扩展的玩家行动结果”。

## 完成范围

| 阶段 | 主题 | 是否 runtime | MiroFish need |
|---|---|---:|---|
| a1 | 战斗权威与旧系统接缝设计门禁 | 否 | not_needed，已完成 |
| a2 | 战斗字段表、trace schema、测试矩阵 | 否 | preferred packages 已通过 intake，已完成 |
| b1 | 行动工作台到战斗准备/入场第一刀 | 是 | 已完成 |
| b2 | 低阶战斗轨迹与后果回流第一刀 | 是 | 已完成 |
| b3 | 杀招/蛊虫反制与风险显示第一刀 | 是 | 已完成 |
| b4 | 小队/阵法/撤退/追击第一刀 | 是 | 已完成 |
| rc | 全量质量收束与 Player Advocate | 是 | 本地已完成，远端 CI 收束中 |

## 明确非目标

除非用户另行批准，v0.17 不做：

- 新增存档字段或提升 `SAVE_FORMAT_VERSION`。
- 正式材料消耗、正式战利品、正式掉落池、正式蛊虫奖励。
- 正式地点解锁、阵营转移、NPC 生死/捕获/永久重伤结论。
- DeepSeek 直接决定伤害、奖励、掉落、地点、阵营、NPC 生死或战斗结果。
- 高阶蛊仙战斗、仙蛊、仙材、宝黄天、福地/洞天、尊者线索。
- 完整南疆路线、完整商家城、三王山、义天山或多区域正史锚点网络。
- 大规模重写 combat engine 或 engine 目录结构。

## 关键交付

- `src/canon/v017-combat-deepening-rules.json`：RebornG-owned 战斗候选、反制、小队战术规则。
- `src/engine/v017-combat-deepening.ts`：只读规则投影、战斗候选构建、trace/backflow view。
- `src/store/slices/qingmaoRegionSlice.ts`：`registerV017CombatCandidateAction` 接入既有候选队列。
- `src/components/game/ActionPanel.tsx`：行动工作台显示 v0.17 战斗准备入口。
- `src/components/game/V017CombatBoundaryPanel.tsx`：杀招/蛊虫反制与小队战术只读提示。
- `src/components/game/GuDaoPanel.tsx`：蛊道杀招页显示 v0.17 边界提示。
- `src/components/game/NarrativeCombatPanel.tsx`：战后回流复核显示。

## 验证摘要

- MiroFish v0.17 三包 intake review 已通过，不需要追加包。
- focused tests、`tsc`、v0.17 e2e、全量 `npm test`、build、runtime/Qingmao/player-visible-copy scans、full e2e、long e2e、production-preview smoke 均通过。
- b1/b2/b3/b4 Player Advocate 20 轮均通过；rc 60 轮通过，下一步理解率 93.3%，P0/P1 阻断 0。

## 用户决策记录

1. 是否批准 v0.17 以 `战斗、杀招、小队与阵法深化` 为主线。
2. 是否批准小版本切分为 `a1/a2/b1/b2/b3/b4/rc`。
3. 是否批准 v0.17 默认不新增存档字段，所有战斗后果先写既有 action ledger / livingWorldState 现有字段 / UI trace。
4. 是否批准三份 MiroFish preferred 请求由用户转交；它们不阻塞 a1/a2，但建议 b2/b3/b4 前完成 intake。
5. 是否批准现有 `v017_region_appearance_pack`、`v017_character_appearance_pack` 降级为 art/deferred，不作为 v0.17 战斗主线阻塞包。

以上均已由用户批准；MiroFish 三包已到位并通过 intake。

## 当前建议

`v0.17.0` 可标记为本地开发里程碑完成。下一步应停止进入 `v0.18.0` 启动审查，由用户审定南疆路线/多区域承接、MiroFish 需求和是否引入任何新持久字段。
