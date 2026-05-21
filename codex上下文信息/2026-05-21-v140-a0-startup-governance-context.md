# 2026-05-21 v1.4.0-a0 startup governance context

## 状态

- 分支：`codex/v140-a0-startup-governance-docs`
- 阶段：`v1.4.0-a0` 启动治理包已建立
- 主题建议：`南疆早期低阶区域样板`
- 当前阻塞：等待用户审批 D-140-001 至 D-140-010
- 下一步：审批后进入 `v1.4.0-a1-南疆低阶区域样板save-format设计门禁.md`

## 本次完成

- 修正项目仪表盘中 v1.3 收束后的入口状态。
- 建立 `指导大纲/v1.4.0/codex/00-总览/` 当前入口。
- 写入 v1.4 专家团启动会、范围冻结、总体开发大纲、执行路线图、需求决策池、测试矩阵、MiroFish 协议、Git 计划、真相源索引。
- 同步 `AGENTS.md` 与 `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` 到 v1.4-a0 当前口径。
- 执行 Skill sync audit，并同步外部 skills 的 Current Sync Override。

## D-140 待审批

1. D-140-001：v1.4 主线是否定为 `南疆早期低阶区域样板`。
2. D-140-002：是否确认 a0/a1/a2 先于 runtime。
3. D-140-003：b1 是否默认 projection-first。
4. D-140-004：a1 是否严肃评估 `SAVE_FORMAT_VERSION = 25`，但不自动批准 bump。
5. D-140-005：是否继续关闭完整南疆与完整商家城。
6. D-140-006：是否继续关闭正式地点、阵营、奖励、NPC 生死。
7. D-140-007：MiroFish 初始 need level 是否为 preferred。
8. D-140-008：正式区域名、商家城入口、势力规则、隐藏事实邻近、NPC 生死或 canon 晋升是否升级为 blocking。
9. D-140-009：Player Advocate / drift 强度是否按 b1 30 轮、持久字段阶段 40 轮、rc 100/120 轮规划。
10. D-140-010：v1.4 live probe 是否到 rc 再确认成本、样本、轮次和接受标准，不默认自动跑。

## 当前没有做

- 没有 runtime。
- 没有 save-format bump。
- 没有新增 store/schema/engine/UI 字段。
- 没有新增 `SAVE_FORMAT_VERSION = 25` 或持久区域/社会字段。
- 没有 DeepSeek 权限变化。
- 没有 MiroFish 新包导入。
- 没有 public wording。
- 没有 EdgeOne 部署。

## 同步文件

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/v1.4.0/codex/00-总览/`

外部 skill 已同步，但不属于本仓库 commit：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`
- `C:\Users\11411\.codex\skills\mirofish-reborng-export\SKILL.md`
- `reborn-combat-motion` 未触发，no update needed。

## 仍未开放

- 完整南疆。
- 完整商家城。
- 正式地点/阵营/奖励/NPC 生死。
- 正式商队/散修身份结论。
- `SAVE_FORMAT_VERSION = 25`。
- 新持久 region/social/location aggregate。
- DeepSeek 地点、阵营、奖励、NPC 生死或 canon 结论 authority。
- 全书基础包 runtime/canon/DeepSeek authority。

## 后续提醒

- v1.4-a0 是文档和治理入口，不是 runtime 阶段。
- D-140 只批准进入 a1/a2/routing；实际 save-format bump、持久字段、MiroFish blocking 包、live probe 成本和 public wording 仍需后续单独拍板。
- 进入 a1 前继续遵守 `Git分支切换与推送制度.md`、`Skill同步审计制度.md`、`长线叙事漂移测试制度.md` 和 `全书知识库治理制度.md`。
