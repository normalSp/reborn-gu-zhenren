# 2026-05-21 v1.4.0-a1 save-format gate context

## 状态

- 分支：`codex/v140-a1-region-save-format-gate`
- 阶段：`v1.4.0-a1` save-format / authority 设计门禁已建立
- 当前阻塞：等待用户审批 D-141-001 至 D-141-008
- 下一步：审批后进入 `v1.4.0-a2-MiroFish-南疆低阶区域样板topic-slice-intake.md`

## 用户已批准

D-140-001 至 D-140-010 全部批准：

- v1.4 主线：`南疆早期低阶区域样板`。
- a0/a1/a2 先于 runtime。
- b1 默认 projection-first。
- a1 严肃评估 `SAVE_FORMAT_VERSION = 25`，但不自动批准 bump。
- 默认关闭完整南疆、完整商家城、正式地点/阵营/奖励/NPC 生死。
- MiroFish 初始 preferred；正式区域名、商家城入口、势力规则、隐藏事实邻近、NPC 生死或 canon 晋升升级为 blocking。
- b1 30 轮 Player Advocate，持久字段阶段 40 轮，rc 100/120 轮。
- live probe 到 rc 再确认成本、样本、轮次和接受标准，不默认自动跑。

## a1 专家团结论

- 建议 b1 保持 `SAVE_FORMAT_VERSION = 24`。
- 建议 b1 不新增 `regionSampleState` / `regionalSampleState`。
- 建议 b1 新增纯 engine projection helper，组合既有 `routeLocationState`、`survivalEconomyState` 与 `livingWorldState` 证据。
- region posture 限定为山路外缘、商队接触窗口、散修聚点线索、城外缘门槛。
- a2 继续做 preferred topic-slice intake，不在 b1 前要求新 blocking 包。

## D-141 待审批

1. D-141-001：b1 是否保持 `SAVE_FORMAT_VERSION = 24`。
2. D-141-002：b1 是否禁止新增 `regionSampleState` / `regionalSampleState`。
3. D-141-003：b1 是否新增纯 engine `V140RegionSampleProjection` 或等价只读 projection helper。
4. D-141-004：b1 region posture 是否限定为山路外缘、商队接触窗口、散修聚点线索、城外缘门槛。
5. D-141-005：b1 是否继续禁止正式地点、阵营、奖励、交易、NPC 生死写入。
6. D-141-006：a2 MiroFish 是否保持 preferred，不在 b1 前要求新 blocking 包。
7. D-141-007：b1 测试门禁是否采用 focused unit + old-save + hidden/DeepSeek authority + 30 轮 Player Advocate + T0 deterministic soak。
8. D-141-008：a1 后是否先进入 a2 topic-slice intake，再进入 b1 runtime。

## 本次完成文件

- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-a1-南疆低阶区域样板save-format设计门禁.md`
- `指导大纲/v1.4.0/codex/00-总览/README.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-需求决策池.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-小版本执行路线图.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-总体开发大纲.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-测试矩阵.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-真相源索引.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.4.0/codex/00-总览/v1.4.0-Git提交与推送计划.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

外部 skill 已同步，但不属于本仓库 commit：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`
- `C:\Users\11411\.codex\skills\mirofish-reborng-export\SKILL.md`
- `reborn-combat-motion` 未触发，no update needed。

## 本阶段没有做

- 没有 runtime。
- 没有 save-format bump。
- 没有新增 schema/store/engine/UI 文件。
- 没有新增 MiroFish 包或 intake。
- 没有 DeepSeek 权限变化。
- 没有 public wording 或 EdgeOne 部署。

## 后续提醒

- D-141 若全批，下一步仍是 a2 topic-slice intake，不直接进入 b1 runtime。
- 若用户反向批准 v25/区域持久字段，必须在同一变更中补 migration/defaults/schema/store/tests，并提升 Player Advocate 至至少 40 轮。
- 正式区域名、商家城入口、势力规则、隐藏事实邻近、NPC 生死或 canon 晋升仍是 blocking。
