# 2026-05-21 v1.3.0-a0 governance docs context

状态：v1.3-a0 文档与治理补丁已落地

## 本轮用户指令

用户批准 v1.3 方向与 D-130-001 至 D-130-008，并追加批准 v1.3-rc 必跑 live probe，模型固定 `deepseek-v4-flash`。用户指出 `reverend-insanity-lore` skill 停在 v1.2 b1 不应发生，要求先做好进入 v1.3 前的文档，把治理补丁写入制度。

## 当前分支

- `codex/v130-a0-startup-governance-docs`

## 本轮落地范围

- 建立 v1.3 启动包：`指导大纲/v1.3.0/codex/00-总览/`。
- 新增项目级 `Skill同步审计制度.md`。
- 记录 MiroFish 基础包用法：只做 archive/source-pointer inventory 和 topic slice，不能整包吸收。
- 记录 `mirofish-reborng-export` 与 `reborn-expert-council` 的桥接边界：生产/导出 skill 不并入治理 skill。
- 记录 v1.3-rc live probe 已原则批准，但成本、样本、轮次和接受标准仍需 rc 前确认。
- 同步外部 skill：`reborn-expert-council`、`reverend-insanity-lore`、`mirofish-reborng-export`；`game-dev-text` 本轮为 docs-only，记录为无需更新到 a1。

## Skill audit

| skill | 状态 | 说明 |
|---|---|---|
| `reborn-expert-council` | `updated` | 已加入 v1.3 D-130、Skill sync audit、MiroFish bridge |
| `game-dev-text` | `no_update_needed` | v1.3-a0 不触碰 runtime/save；a1 再审计 |
| `reverend-insanity-lore` | `updated` | 已从 v1.2 b1 更新到 v1.2 complete + v1.3 a0 |
| `mirofish-reborng-export` | `updated` | 已加入 full-book topic slice 与 v1.3 request family 草案 |
| `reborn-combat-motion` | `no_update_needed` | v1.3-a0 未触碰 combat/motion |

## 未做

- 未写 runtime。
- 未 bump `SAVE_FORMAT_VERSION = 25`。
- 未新增社会关系存档字段。
- 未扩大 DeepSeek 权限。
- 未导入全书基础包到 runtime/canon/DeepSeek。
- 未自动部署 EdgeOne。

## 下一步

完成 diff 检查、显式 stage、提交并推送当前分支。下一步进入 `v1.3.0-a1-NPC势力关系save-format设计门禁.md`，评估 v25、社会聚合字段、b1 projection-only、blocking MiroFish 条件和 rc live probe 规模。
