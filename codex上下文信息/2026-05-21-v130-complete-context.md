# 2026-05-21 v1.3.0 complete context

## 状态

- 分支：`codex/v130-rc-social-pressure-closure`
- 阶段：`v1.3.0` 本地开发里程碑完成
- 主题：`NPC 与势力长期关系第二层`
- 当前下一步建议：开 `v1.4` 专家团启动会

## 完成内容

- b1：社会压力 projection-only 第一刀。
- b2：projection audit 硬化。
- b3：NPC 接触窗口 projection。
- b4：势力前置条件 projection。
- process-1：社会反刷、save 兼容与回滚复核。
- process-2：deterministic 长线漂移与知识库复核。
- rc Player Advocate：100 轮 gate 通过。
- D-130-009：小规模 social live probe gate 通过。

## live probe 证据链

- 首轮高强度 live：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-21-59-333Z/summary.md`
  - 20 calls，accepted 16/20，P0/P1/P2 = 7/0/10，failed。
- clean re-probe：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-27-25-503Z/summary.md`
  - 20 calls，accepted 14/20，P0/P1/P2 = 8/0/8，failed。
- 用户再次批准方案 3 后追加高强度 live：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-43-31-785Z/summary.md`
  - 20 calls，accepted 19/20，P0/P1/P2 = 1/0/9，raw gate failed。
  - 唯一 P0 是“是否直接加入白家”的提问语境误判；同段明确否定正式成员身份。
- 修正 evaluator 后离线 replay/rescore：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-46-23-254Z/summary.md`
  - 20/20 accepted，P0/P1/P2 = 0/0/2，gate passed。
  - replay 不调用 API，不产生新成本；沿用原 live usage 估算成本 `$0.00308382`。

## 同步文件

- `scripts/run-v130-live-social-probe.mjs`
  - 新增 `--replay-results` 离线 replay/rescore。
  - 修正提问/否定语境的误判，不再把 `是否直接加入白家`、`旧字段不具权威` 算成正式结论。
- `指导大纲/v1.3.0/codex/00-总览/`
  - rc live probe、rc 质量、Skill 同步、路线图、测试矩阵、真相源索引、README 均更新到完成口径。
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

外部 skill 已同步，但不属于本仓库 commit：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`
- `C:\Users\11411\.codex\skills\mirofish-reborng-export\SKILL.md`
- `reborn-combat-motion` 未触发，no update needed。

## 仍未开放

- `SAVE_FORMAT_VERSION = 25`
- `socialRelationState`
- 正式 NPC 好感/关系数值
- 正式命名 NPC allowlist
- 正式阵营转移
- 正式通缉/封锁/招揽
- 正式任务/奖励
- NPC 生死/捕获/背叛
- DeepSeek 社会结论 authority
- MiroFish 原始包 runtime authority
- 全书基础包 DeepSeek visible context

## 后续提醒

- v1.3 live probe 只证明小规模 social projection gate，不代表大规模长线 live narrative quality 已完全验证。
- 进入 v1.4 前必须重新执行 Skill sync audit。
- 若 v1.4 触发 route/region/social/economy 持久字段、正式社会结论、DeepSeek 权限或新的 MiroFish blocking 包，必须先停下来让用户拍板。
