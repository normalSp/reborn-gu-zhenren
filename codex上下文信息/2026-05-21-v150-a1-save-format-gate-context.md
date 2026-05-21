# 2026-05-21 v1.5.0-a1 save-format 门禁交接稿

## 状态

`v1.5.0-a1-冲突追杀杀招小队save-format设计门禁.md` 已建立。

当前分支：`codex/v150-a1-conflict-save-format-gate`

## 用户决策

- D-150-001 至 D-150-010：已批准。
- D-151-001 至 D-151-010：待用户批准。

## a1 专家团结论

建议 v1.5-b1：

- 保持 `SAVE_FORMAT_VERSION = 24`。
- 不新增 `conflictConsequenceState` / `pursuitState` / `combatAftermathState`。
- 新增纯 engine projection helper，例如 `V150ConflictAftermathProjection`。
- 只读组合 existing combat trace/action ledger、v1.1-v1.4 状态和 a2 复核后的 v0.17 资料。
- 冲突姿态限定为路线伏击风险、追杀注意窗口、反制缺口、小队/阵法准备度。
- 禁止正式掉落、奖励、NPC 生死、正式通缉/追杀、地点/阵营写入。

## 没有做什么

- 没有 runtime。
- 没有 save-format bump。
- 没有新增 schema/store/engine/UI。
- 没有 DeepSeek prompt/context/API/authority 变化。
- 没有 MiroFish 新包或 intake。
- 没有战斗动效/资产变化。
- 没有 EdgeOne 部署或 public wording。

## 下一步

等待用户批准 D-151-001 至 D-151-010。若全部批准，进入：

`v1.5.0-a2-MiroFish-战斗追杀杀招小队topic-slice-intake.md`
