# Skill 同步审计制度

日期：2026-05-21
状态：项目级流程制度；从 v1.3.0-a0 起执行

## 目标

把“专家团和相关 skill 会随项目进化”从人工记忆变成机械闭环。每次版本启动、阶段完成、rc 收束或治理制度变化，都必须明确记录相关 skill 是已更新、无需更新、延后还是阻塞，避免出现某个 skill 的 Current Sync Override 停在旧阶段而没人发现。

## 触发条件

出现以下任一情况，必须执行 Skill 同步审计：

1. 进入新大版本或小版本启动包。
2. 完成 runtime 小版本、process 阶段或 rc。
3. 新增或修改项目级流程制度。
4. 修改 MiroFish、知识库、测试矩阵、长线漂移、Git、Player Advocate 等跨版本规则。
5. 用户指出 skill、专家团或制度口径可能落后。

## 必查 skill

每次审计至少检查：

| skill | 触发范围 | 必查点 |
|---|---|---|
| `reborn-expert-council` | 版本范围、专家团、用户决策、治理制度 | Current Sync Override、硬停、当前 active draft、MiroFish/知识库/测试门 |
| `game-dev-text` | runtime、save、store、engine、测试、DeepSeek pipeline | 当前版本完成状态、save-format、测试强度、禁止越权 |
| `reverend-insanity-lore` | 原著、蛊、炼养用、经济、NPC/势力、隐藏事实 | 原著边界、MiroFish/topic-slice、不可见事实、当前版本口径 |
| `reborn-combat-motion` | 战斗、杀招、小队、视觉动效、资产呈现 | 仅在 combat/motion/visual runtime 受影响时必查 |
| `mirofish-reborng-export` | 新 MiroFish 包、基础包切片、coverage、quote-redacted export | 生产/导出规则、topic slice、不得直接改 RebornG canon/runtime |

## 输出状态

每个被审计 skill 必须写成四种状态之一：

| 状态 | 含义 | 是否允许阶段完成 |
|---|---|---|
| `updated` | 已按当前版本和制度同步 | 允许 |
| `no_update_needed` | 已检查，当前改动不影响该 skill | 允许 |
| `deferred_with_reason` | 暂不更新，并写明原因、补点和最晚时间 | 允许，但不得进入受影响 runtime |
| `blocked` | skill 已明显落后且会误导下一步 | 不允许完成相关阶段 |

不得只写“检查过”。必须写状态、理由和下一步。

## 审计记录位置

审计结果必须至少落在当前版本文档中：

- 大版本启动：`vX.Y.Z-a0-治理补丁与范围冻结.md` 或启动审查文件。
- runtime 小版本完成：对应阶段记录。
- rc：rc 质量收束记录。
- handoff：最新 `codex上下文信息/*.md` 摘要。

若新增项目级制度，还必须同步：

1. `指导大纲/流程制度/README.md`
2. `指导大纲/项目仪表盘.md`
3. `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
4. `AGENTS.md`
5. 必要时同步外部 skill 文件本身

## 推荐检查命令

人工审计可使用：

```powershell
rg -n "Current sync override|当前同步|v1\\.|SAVE_FORMAT_VERSION|MiroFish|DeepSeek|Player Advocate|live probe" C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md C:\Users\11411\.codex\skills\game-dev-text\SKILL.md C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md C:\Users\11411\.codex\skills\mirofish-reborng-export\SKILL.md
```

进入 v1.6 后，可把本制度纳入过期入口自动检查脚本，但加入 CI 硬门前仍需用户批准。

## 硬停

以下情况必须停下来，不得继续声称阶段完成：

1. 当前版本已经修改了原著/IF、MiroFish、知识库或 DeepSeek 边界，但 `reverend-insanity-lore` 仍停在旧阶段。
2. 当前版本新增 save format、store、engine 或测试制度，但 `game-dev-text` 仍停在旧阶段。
3. 当前版本新增跨版本流程制度，但 `reborn-expert-council` 没有同步或没有明确延后理由。
4. MiroFish 基础包、topic slice 或导出流程被使用，但没有说明 `mirofish-reborng-export` 的调用/参考边界。
5. 审计记录没有写入当前版本文档和 handoff。
