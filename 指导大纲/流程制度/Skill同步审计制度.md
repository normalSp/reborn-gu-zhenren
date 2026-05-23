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

## Skill 文件健康门

Skill 同步不是把项目历史全部复制进 `SKILL.md`。`SKILL.md` 必须保持为可索引、可选择、可执行的规则入口；完整历史状态应放在 `AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`、`指导大纲/项目仪表盘.md`、`指导大纲/historical-index.md`、当前版本文档和 handoff。

每次 skill 审计必须额外检查：

1. `SKILL.md` 必须是 UTF-8 no BOM，文件开头必须直接是 frontmatter `---`。
2. frontmatter 必须可解析，至少包含 `name` 和 `description`；推荐包含 `version`。
3. 普通治理/工程/lore skill 只保留一个当前 `Current Sync Override`。旧版本同步记录不得继续累积在技能正文。
4. `mirofish-reborng-export` 这类生产/桥接 skill 可保留少量最近 bridge override，但必须避免把 RebornG 全历史塞入技能。
5. 单个 `SKILL.md` 超过 32KB 要视为 warning，超过 64KB 要视为 blocking，除非本次审计写明原因并得到用户认可。
6. 瘦身只能删除重复历史状态，不能删除硬停、边界规则、读取入口、操作流程、专家职责和当前版本 override。

若需要保留历史事实，写成 source pointer 指向项目文档，而不是复制全文。示例：`历史/current state 见 PROJECT-STATE.md、AGENTS.md、项目仪表盘和 historical-index`。

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

文件健康检查可用：

```powershell
@'
const fs = require('fs');
const path = require('path');
const skills = ['reborn-expert-council','game-dev-text','reverend-insanity-lore','reborn-combat-motion','mirofish-reborng-export'];
const root = 'C:/Users/11411/.codex/skills';
for (const name of skills) {
  const file = path.join(root, name, 'SKILL.md');
  const buf = fs.readFileSync(file);
  const text = buf.toString('utf8');
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(text);
  console.log({
    name,
    kb: +(buf.length / 1024).toFixed(1),
    bom: buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf,
    frontmatter,
    currentOverrideCount: (text.match(/Current sync override|Current Sync Override/g) || []).length,
  });
}
'@ | node -
```

进入 v1.6 后，可把本制度纳入过期入口自动检查脚本，但加入 CI 硬门前仍需用户批准。

## 硬停

以下情况必须停下来，不得继续声称阶段完成：

1. 当前版本已经修改了原著/IF、MiroFish、知识库或 DeepSeek 边界，但 `reverend-insanity-lore` 仍停在旧阶段。
2. 当前版本新增 save format、store、engine 或测试制度，但 `game-dev-text` 仍停在旧阶段。
3. 当前版本新增跨版本流程制度，但 `reborn-expert-council` 没有同步或没有明确延后理由。
4. MiroFish 基础包、topic slice 或导出流程被使用，但没有说明 `mirofish-reborng-export` 的调用/参考边界。
5. 审计记录没有写入当前版本文档和 handoff。
6. 任一必查 skill 的 frontmatter 解析失败、带 UTF-8 BOM、普通 skill 累积多个历史 `Current Sync Override`，或文件超过 64KB 且无用户认可的豁免。
