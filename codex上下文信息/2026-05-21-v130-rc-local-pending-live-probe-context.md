# 2026-05-21 v1.3.0-rc local closure pending live probe context

> 已被 `codex上下文信息/2026-05-21-v130-complete-context.md` 取代。本文件保留为 D-130-009 失败阶段的历史交接记录。

## 状态

- 分支：`codex/v130-rc-social-pressure-closure`
- 阶段：v1.3.0-rc 本地收束，live probe 未通过
- 当前口径：本地质量门通过；D-130-009 高强度 live 与一次 clean re-probe 均 failed，继续 live 需用户追加批准

## 已完成

- b1：社会压力 projection-only 第一刀，commit `4c8c0e1`
- b2：projection audit 硬化，commit `b6aabb7`
- b3：NPC 接触窗口 projection，commit `2fdd9e8`
- b4：势力前置条件 projection，commit `6f1284b`
- process-1：社会反刷、save 兼容与回滚复核
- process-2：deterministic 长线漂移与知识库复核
- rc Player Advocate：100 轮 gate 通过
- rc live probe dry-run 工具与样本准备完成：`scripts/run-v130-live-social-probe.mjs`、`tests/evals/deepseek-v130-social/samples.json`
- 触发 skills 已同步到 `v1.3 live failed pending user decision` 口径；未写 `v1.3 complete`
- 用户批准方案 3 后已执行高强度 live probe 与一次 clean re-probe；两次均 failed。
- 已做无成本修复：强化 `run-v130-live-social-probe.mjs` prompt/evaluator，并扩展 runtime C27 对 `春蟬`、`重生`、`回溯` 的玩家可见叙事拒绝。

## 本地验证

已通过：

- `npm test -- v130-social-pressure-projection`
- `npx playwright test tests/e2e/v130-social-pressure-projection.spec.ts`
- `npx tsc --noEmit --pretty false`
- `npm run check:player-advocate-gate -- 指导大纲/v1.3.0/codex/00-总览/v1.3.0-rc-Player-Advocate-100轮走查记录.md 100`
- `npm test`
- `npm run build`
- `npm run test:e2e:long`

## 未完成硬门

D-130-009 live probe：

- 模型固定：`deepseek-v4-flash`
- 样本集：`tests/evals/deepseek-v130-social/samples.json`
- 推荐方案：4 样本 x 3 轮，允许一次 clean re-probe，命令 `npm run eval:deepseek:v130-social-live`
- 低成本备选：3 样本 x 2 轮，不自动 clean re-probe，命令 `npm run eval:deepseek:v130-social-live:low`
- 高强度备选：5 样本 x 4 轮，允许一次 clean re-probe，命令 `npm run eval:deepseek:v130-social-live:high`
- 建议通过线：accepted >= 90%，P0=0，P1=0，P2<=2
- dry-run 已通过：
  - 推荐：12 live calls，worst-case 估算约 `$0.00549612`
  - 低成本：6 live calls，worst-case 估算约 `$0.00275268`
  - 高强度：20 live calls，worst-case 估算约 `$0.00915166`
- 高强度 live 首轮：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-21-59-333Z/summary.md`，accepted 16/20，P0/P1/P2 = 7/0/10，failed。
- 高强度 clean re-probe：`artifacts/deepseek-drift-probe/v1.3.0-rc-social/2026-05-20T18-27-25-503Z/summary.md`，accepted 14/20，P0/P1/P2 = 8/0/8，failed。

用户追加确认前：

- 不执行 live probe。
- 不声称 v1.3 最终完成。
- 不把外部 skills 更新成 `v1.3 complete`。

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

## 下一步

等待用户决策：追加一次 live probe、改为 runtime-guarded acceptance，或调整 live gate。专家团建议追加一次 live probe，使用当前已强化脚本重跑；若通过，再做最终 skill sync、PROJECT-STATE/AGENTS/仪表盘/handoff 收束、最终提交推送并标记目标完成。
