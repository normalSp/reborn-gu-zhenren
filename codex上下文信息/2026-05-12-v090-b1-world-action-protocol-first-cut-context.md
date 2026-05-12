# 2026-05-12 v0.9.0-b1 统一行动协议第一刀上下文

日期：2026-05-12  
分支：`codex/v090-b1-world-action-protocol`  
检查点提交：`fae5701 chore: 建立 v0.9.0-b1 治理检查点`

## 本轮先处理的工程卫生

- 修正 PowerShell 输出干扰：`C:\Users\11411\Documents\WindowsPowerShell\profile.ps1` 现在只在真实交互终端显示 fastfetch，Codex/脚本输出保持安静。
- 设置 Git 全局中文路径显示：`core.quotepath=false`，并设置 commit/log 输出为 UTF-8。
- 进入 b1 前已提交治理检查点，避免治理文档和 b1 功能代码混杂。

## b1 第一刀落地

- 新增统一行动协议类型：
  - `WorldActionCandidate`
  - `WorldActionDeparture`
  - `WorldActionResolution`
  - `NarrativeReturnContext`
- 新增 `src/engine/v090-world-action-protocol.ts`：
  - 候选归一
  - 出发记录
  - 本地结算记录
  - 投影到 `LocalActionLedgerEntry`
  - 构造下一轮 DeepSeek 可读的回流文本
- 新增 `src/engine/v090-world-action-protocol.test.ts`。

## 当前边界

- 第一刀只做纯协议层，没有桥接道场、传承、灾劫或 UI。
- 没有提升 `SAVE_FORMAT_VERSION`。
- 没有改变 DeepSeek 正式权限：DeepSeek 仍只能承接事实，不能写正式奖励、资源、胜负、地点、福地归属、宿命状态或原著硬事实。

## 验证

- `npm test -- src/api/deepseek.test.ts`：通过，作为治理检查点提交前验证。
- `npm test -- src/engine/v090-world-action-protocol.test.ts src/engine/v080-scene-session-engine.test.ts`：通过。

## 下一步

- 以道场为黄金样板，将 `src/engine/v090-training-ground-clue-engine.ts` 的线索、出发、磨练、对决、狩猎结果投影到统一行动协议。
- 道场桥接后再扩展传承/福地、灾劫和野外最小样板。
- 每一步都验证“同一正式行动只扣一次 AP”与“回流文本不得让 AI 改写本地事实”。

