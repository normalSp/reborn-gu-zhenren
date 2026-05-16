# 2026-05-15 v0.11.0 测试工程化门禁交接

## 用户决策

用户接受 v0.11 第一版自由意图会更像“目标管理 + 裁决说明”，不要求短期爽快，游戏计划等到 v1.0.0 后再公开。

用户要求补齐：

1. `v0.11.0` 测试工程化总纲。
2. `a3` 裁决样本矩阵。
3. 专家团与开发流程需要能随项目推进自我复盘、自我进化，不能只靠用户提醒。

## 已完成

新增：

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-测试工程化总纲.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-裁决样本矩阵.md`

更新：

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a3-第一刀-自由意图本地裁决引擎.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `.learnings/LEARNINGS.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 测试工程化口径

`v0.11.0-测试工程化总纲.md` 将测试分为：

- L0 类型/Schema。
- L1 canon 规则。
- L2 纯 engine 裁决。
- L3 store/save。
- L4 UI/E2E。
- L5 DeepSeek Eval。
- L6 长测/发布烟测。

首批硬指标：

- 硬边界样本通过率 100%。
- DeepSeek 越权覆盖率 100%。
- 隐藏事实泄露 0。
- 非法状态写入 0。
- 存档迁移失败 0。
- UI 文本遮挡/滚动死区 0。

样本规模目标：

- a3 第一刀：7 条基础样本 + DeepSeek 越权样本。
- a3-2：30+ 条，覆盖 UI/store/同义表达/取消/重复提交/旧存档。
- b2 前：80+ 条，覆盖青茅活世界、原著事实卡、DeepSeek eval。
- rc：100+ 条，作为发布前固定回归池。

## 自我进化机制

后续按固定节奏复盘：

- 每 2 个小版本或 3 个功能切口：轻量复盘一次。
- 每个大阶段、rc 或严重回归后：完整复盘一次。

复盘输出必须归类为：

- 新增测试。
- 新增门禁。
- 更新 skill。
- 更新文档。
- 架构债。
- 延期需求。
- 用户决策。

## a3-2 当前口径

用户已选择单独“自由目标”面板。

a3-2 开工前必须先补 UI/store 样本：

- 极端目标只展示本地裁决，不立即写奖励、地点、势力、NPC 生死或正史锚点。
- 玩家确认长期目标后，只允许写入 `livingWorldState.playerGoals`。
- 取消、重复提交、旧存档迁移、DeepSeek 候选越权时，UI 与 store 仍以本地裁决为准。

## 验证

本轮为文档、skill 和治理门禁更新，未改运行时代码，未运行 `npm test` 或构建。
