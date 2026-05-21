# 2026-05-21 v1.6.0 complete context

## 当前状态

- 分支：`codex/v160-b1-to-rc-tooling-closure`
- 主题：`内容生产、canon schema 与长测工厂`
- 状态：v1.6.0 本地开发里程碑完成；本交接稿随 completion 提交进入分支，推送由本轮完成
- 用户决策：D-160-001 至 D-160-012、D-161-001 至 D-161-010、D-162-001 至 D-162-010 均已批准并落地

## 完成内容

- 新增 `scripts/v160-governance-utils.mjs`
- 新增 `scripts/check-mirofish-base-pack-inventory.mjs`
- 新增 `scripts/check-knowledge-index-boundaries.mjs`
- 新增 `scripts/check-mirofish-intake-promotions.mjs`
- 新增 `scripts/run-v160-long-test-replay.mjs`
- 新增 `scripts/check-stale-entrypoints.mjs`
- `package.json` 新增五个 report-only 检查 script
- v1.6 文档补齐 b1-b5、process-1、process-2、rc 记录
- 仪表盘、PROJECT-STATE、AGENTS、historical-index 已更新到 v1.6 complete
- 相关 skill 已同步：
  - `reborn-expert-council` -> 0.1.103
  - `game-dev-text` -> 2.3.71
  - `reverend-insanity-lore` -> 0.3.62
  - `mirofish-reborng-export` current override -> v1.6 complete
  - `reborn-combat-motion` 无需更新

## 验证

- `npm run check:mirofish-base-pack-inventory`：2340 chapters，P0=0，P1=0，P2=0，Info=1
- `npm run check:knowledge-index-boundaries`：entries=0，P0=0，P1=0，P2=0，Info=1
- `npm run check:mirofish-intake-promotions`：entries=0，matrixIds=22，P0=0，P1=0，P2=0，Info=1
- `npm run check:v160-long-test-replay`：matrixIds=22，dryRun=true，P0=0，P1=0，P2=0
- `npm run check:stale-entrypoints`：entrypoints=9，P0=0，P1=0，P2=0
- `npx tsc --noEmit --pretty false`：通过
- `npm test`：146 files，793 tests 通过
- `npm run build`：通过；仅 Rolldown plugin timings warning

## 边界

- 没有 runtime code。
- 没有 `SAVE_FORMAT_VERSION` bump。
- 没有新增存档字段。
- 没有 DeepSeek prompt/context/model/authority 变化。
- 没有知识库批量导入。
- 没有 runtime canon 晋升。
- 没有 hidden/private 可见化。
- 没有 CI hard gate 扩张。
- 没有 live DeepSeek probe。
- 没有 EdgeOne 部署。

## 下一步建议

下一步开 v1.7 专家团启动会。优先决定第一个受控 topic-slice 或区域活世界测试目标，再让 v1.6 工具链作为后勤门禁服务它。
