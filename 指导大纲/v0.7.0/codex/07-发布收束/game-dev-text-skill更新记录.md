# game-dev-text Skill 更新记录

更新时间：2026-05-08

## 更新原因

`C:\Users\11411\.codex\skills\game-dev-text\SKILL.md` 是用户级 Codex skill，不属于 RebornG 仓库。旧版文件存在以下问题：

- 文件内容显示为乱码，不利于后续自动压缩后继续使用。
- 仍要求读取 `session_summary_*.md`、`.learnings`，但当前 RebornG 的可信交接已经转向 `codex上下文信息` 和 `指导大纲/v0.7.0/codex`。
- 固定要求 `npm run lint/read_lints`，而当前 `package.json` 没有 `lint` 脚本。
- 固化旧的仙元石/元石比例，不符合后续 economy-balance 配置化和用户最新决策。
- 与 `reverend-insanity-lore` 重复维护大量世界观细节，容易出现两个 skill 口径分叉。
- 没有固化用户长期协作要求：默认不用子代理、阶段结束更新并复读上下文、中文提交并推送、不确定项必须直接沟通。

## 已更新内容

- 将 `game-dev-text` 版本提升为 `2.1.0`。
- 新增 `RebornG 协作协议`：
  - 默认不使用子代理，除非用户明确授权。
  - 开发前读取最新 `codex上下文信息`、`指导大纲/v0.7.0/codex` 和对应版本大纲。
  - 按 canon 数据 -> 类型 -> engine -> store -> UI -> 测试/文档推进。
  - 每个可提交阶段使用中文、具体、可追溯的提交信息并推送。
  - 阶段结束必须更新上下文交接文件，并重新读取确认没有遗漏。
  - 不确定项、文档冲突、数值风险、世界观风险或更优方案必须直接在对话中说明。
- 将验证命令改为读取 `package.json` 后选择实际存在的脚本；当前 RebornG 常用 `npm test`、`npm run build`、涉及浏览器时 `npm run test:e2e:long`。
- 删除固定汇率和重复世界观表，改为要求涉及蛊真人术语/流派/宝黄天/炼养用时同时遵守 `reverend-insanity-lore`。
- 增加旧文档 superseded 风险提醒：旧大纲或旧报告与最新 codex/源码冲突时，以最新上下文和源码为准。

## 对项目的影响

- 本次 skill 文件更新不改变运行时代码和存档格式。
- RebornG 仓库内新增本记录，保证用户级 skill 的改动也能被后续开发者理解和追溯。
- 后续任务中，`game-dev-text` 负责工程流程、可玩性、数值闭环和交付质量；`reverend-insanity-lore` 负责世界观硬边界和原著口径。

## 验收方式

- 检查 `game-dev-text` 不再包含 `npm run lint`、`read_lints`、固定旧汇率或 `session_summary_*.md` 优先级。
- 检查 skill 包含“不用子代理、更新并复读上下文、中文提交推送、直接沟通风险”的协作协议。
- RebornG 项目回归仍以 `npm test`、`npm run build`、`npm run test:e2e:long` 为准。

## 本轮验收结果

- Skill 文件已实际更新到 `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`，版本 `2.1.0`。
- 已确认 skill 本体不含旧 `read_lints`、固定旧汇率、`session_summary` 或 `.learnings` 优先入口。
- `npm test`：通过 41 个测试文件 / 298 个用例。
- `npm run build`：通过；保留 Vite 500KB+ chunk 警告为非阻塞优化项。
- `npm run test:e2e:long`：通过 3 条 Playwright 长测路径。
