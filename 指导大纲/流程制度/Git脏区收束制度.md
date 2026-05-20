# Git 脏区收束制度

日期：2026-05-20
状态：项目级制度

## 目标

让 RebornG 的长期开发保持可追踪、可回滚、可复审。任何一个小版本完成后，都必须能回答：哪些文件属于本阶段，哪些是资产/证据，哪些是本机配置，哪些是废弃物，哪些仍待用户决策。

本制度处理“工作区已经乱了怎么收束”。开工前的主动分支切换、阶段基线和推送节奏，优先读 `Git分支切换与推送制度.md`。

## 触发条件

出现以下任一情况，先做脏区收束，不继续堆新功能：

1. 当前分支名和实际版本语义不一致。
2. `git status --short` 同时出现当前版本、历史版本、资产、MiroFish、测试证据或本机配置。
3. `modified + untracked` 超过 50 项。
4. 版本完成但未提交、未推送、未记录验证证据。
5. 用户明确询问“为什么工作区脏”“能不能继续开发”。

## 收束顺序

1. **分支语义先行**：若当前分支名落后于实际开发阶段，先切到新的 `codex/<version-or-task>` 收束分支。
2. **废弃物先清**：用户明确判定废弃的目录、临时 zip、旧生成草稿、本机 IDE 配置，先删除或加入 `.gitignore`。
3. **当前里程碑优先**：按 v1.1、v1.2-b1、后续版本等真实阶段拆分提交边界。
4. **资产单独成组**：图片、BGM、artifacts、候选图、MiroFish 基础包或 intake 证据不得混进 runtime 功能提交。
5. **制度/入口最后同步**：`AGENTS.md`、`PROJECT-STATE.md`、`项目仪表盘.md`、流程制度、skill 更新作为治理同步，不夹带未审功能。

## 禁止动作

1. 禁止 `git add -A`。
2. 禁止把本机配置、临时压缩包、旧测试存档重新纳入提交。
3. 禁止在分支语义错误时继续提交。
4. 禁止为了“干净”删除未确认的证据、artifacts、MiroFish 交付或美术资产。
5. 禁止把测试通过描述成单阶段结论，除非本阶段文件已单独 stage 或 commit。

## 废弃入口

下列路径已从 active gate 移除：

| 路径 | 处置 | 替代 |
|---|---|---|
| `测试存档/` | 删除并 ignore | Playwright harness demo、replay/eval 样本、当前版本 e2e fixture |
| `public/test-saves/` | 删除并 ignore | 当前版本 e2e、production-preview smoke、Player Advocate 记录 |
| `.cursor/` | ignore | 本机 Cursor 使用，不进入 RebornG Git |
| `指导大纲/大方向/` | 删除 | `指导大纲/长期路线/`、当前版本 docs、项目流程制度 |
| `指导大纲/vMiroFish/美术/` | 删除 | 已 intake 的 `指导大纲/vMiroFish/intake-reviews/美术/` 与 `doc/art/` |

## 资产分流

资产不是废弃物，但必须按用途分层收束：

| 路径 | 处置 | 说明 |
|---|---|---|
| `public/rebrng/**` | 可作为 runtime 资产提交 | 如果 `src/data/image-maps.ts` 或 manifest 引用，图片和映射必须同组提交，并通过运行时资产扫描 |
| `doc/art/**` | 可作为美术台账、候选图和 source evidence 提交 | 与 runtime 功能提交分离；候选图不等于 canon 或 gameplay authority |
| `artifacts/**` | 可作为小规模验证证据提交 | 记录 DeepSeek eval、截图、短录屏或门禁证据；不要混入 runtime 功能提交 |
| `bgm/*.md`、`bgm/**/*.md`、`bgm/**/*.txt` | 可作为本地 fan-pack 清单/歌词/风格说明提交 | 只记录资料与生成口径，不代表运行时启用 |
| `bgm/**/*.mp3` 等音频文件 | 默认 ignore，除非用户另批 runtime 晋升 | 根目录 `bgm/` 是本地暂存；运行时音频必须进入 `public/audio/` 并登记 source manifest |

## 提交流程

每个提交只 stage 明确路径：

1. 先列 `git status --short`。
2. 写出本提交包含/不包含的路径组。
3. `git add -- <path...>` 显式 stage。
4. `git diff --cached --stat` 复核。
5. 运行与该组相关的最小验证。
6. 中文提交信息必须说明版本、范围和边界。
7. 提交后再次 `git status --short`，确认剩余脏区属于下一组。

## 完成定义

脏区收束完成必须满足：

1. 当前分支语义正确。
2. 废弃路径已删除或 ignore。
3. 当前 runtime 版本和 docs/skill/仪表盘一致。
4. 每个剩余脏区都有明确归属：待提交、待用户决策、资产候选、外部证据或本机忽略。
5. 新功能开发前，当前小版本相关改动已经提交，或者在 handoff 中明确写出未提交原因。
