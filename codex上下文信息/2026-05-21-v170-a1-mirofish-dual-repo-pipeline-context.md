# v1.7.0-a1 MiroFish 双仓 topic-slice 流水线治理补丁交接稿

时间：2026-05-21
当前分支：`codex/v170-a1-mirofish-dual-repo-pipeline`
基线分支：`codex/v170-a1-regional-life-design-gate`

## 用户最新批准

用户同意：

- 如果 `v1.7-a2` 第一轮由主线程跑通 `RebornG request -> MiroFish export -> RebornG intake review -> 测试矩阵/规则草案`，就把双仓流水线写入 skill、专家团和相关制度。
- 这件事不能停留在对话中，必须成为实打实的自动流水线。
- 等 `southern_border_low_rank_outer_edge_life_slice` 样板稳定后，再由 Codex 给出风险收益，交用户决策是否允许只读/分析型子代理参与提速。

## 已落地内容

- 新增项目级制度：`指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`。
- 新增只读检查脚本：`scripts/check-mirofish-dual-repo-pipeline.mjs`。
- 新增 npm 命令：`npm run check:mirofish-dual-repo-pipeline`。
- 同步 `AGENTS.md`、`PROJECT-STATE.md`、`指导大纲/项目仪表盘.md`、v1.7 文档、MiroFish README、请求入口、intake 入口。
- 同步 skill：
  - `reborn-expert-council`
  - `mirofish-reborng-export`
  - `reverend-insanity-lore`
  - `game-dev-text`

## 当前边界

本补丁只做制度、入口和只读检查。

不得解读为已批准：

- D-171-001 至 D-171-010。
- `v1.7-a2` runtime 实现。
- 新存档字段或 `SAVE_FORMAT_VERSION` bump。
- MiroFish 基础包直接进入 runtime/canon/DeepSeek visible context。
- writable subagent 操作 RebornG 或 MiroFish 文件。
- 正式地点、势力、奖励、NPC 生死或隐藏事实公开。

## a2 前置检查

进入 `v1.7.0-a2` 前至少运行：

```powershell
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=a1
```

若 MiroFish 仓库不在默认路径，可设置：

```powershell
$env:MIROFISH_REPO='D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish'
```

## 下一步建议

1. 完成本治理补丁的检查、提交和推送。
2. 回到 `v1.7-a1` 的 D-171-001 至 D-171-010 决策。
3. 用户批准后进入 `v1.7-a2`，由主线程跑通首个 topic-slice 闭环。
4. 首个样板稳定后，另开一轮风险收益评估，决定是否引入只读/分析型子代理。
