# 2026-05-16 v0.13.0-process-0 Git 安全收束交接

## 背景

用户发现 GitHub 最新提交仍停在三天前，担心本地没有可回滚提交链。用户批准：

- 每个大版本都制度化小版本 commit / push。
- 先把 Git 推送制度写进 Skill / 专家团 / 仓库文档。
- 再做 `v0.13.0-process-0 Git安全收束`。

## 本次完成

新增：

- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-Git提交与推送计划.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-process-0-Git安全收束.md`

更新：

- `指导大纲/v0.13.0/codex/00-总览/README.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-小版本执行路线图.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-需求决策池.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-真相源索引.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`

## 关键决策

- 不新增独立可写专家。
- 新增轻量职责：`Git / 回滚守门人`。
- 职责由 `QA / Release Guardian` 和 `Codex Safety Officer / Dev Environment Steward` 共同承担。
- v0.13 的当前步骤变为 `process-0 Git安全收束`，然后进入 `a1 社会记忆协议、字段表、测试矩阵`。
- 每个大版本都必须建立自己的 Git 提交与推送计划。

## Git 当前状态

检查结果：

- 当前分支：`codex/v090-b1-world-action-protocol`
- remote：`origin git@github.com:normalSp/reborn-gu-zhenren.git`
- 最新可见提交：`8d5c15a feat: 收束v0.9.0-b2旧战斗入口`
- 工作区存在大量历史 modified / deleted / untracked 文件。

安全结论：

- 不允许 `git add -A`。
- 不允许把 v0.10-v0.13 历史工作一口气混成一个提交。
- 不自动部署 EdgeOne。
- 不启用 branch protection。
- 不重写历史。

## 后续建议

下一步如果继续 Git 安全收束：

1. 先创建或切换到建议分支 `codex/v013-npc-faction-reaction`，但只在确认不破坏工作区后执行。
2. 先提交项目治理和 v0.13 process-0 文档。
3. 再按 v0.12、v0.11、v0.10、v0.9 后续线分批整理历史成果。
4. 每次提交前列出 stage 文件清单。

## 验证

本次为文档 / Skill / 门禁更新，未修改运行时代码，未运行单测、构建或 e2e。

已通过只读核对：

- 读取 `reborn-expert-council` / `game-dev-text` / `reverend-insanity-lore` / `reborn-combat-motion` 相关口径。
- 读取 v0.13 README、路线图、需求池、真相源、仪表盘。
- 读取 v0.11 Git 提交与推送制度。
- 读取本地 git branch、remote、log、status。

## Commit / Push

- v0.13 分支已创建：`codex/v013-npc-faction-reaction`。
- `v0.13.0-process-0 Git安全收束` 首个治理提交已创建：`ce9b1e9 docs: 建立v0.13流程与Git安全收束`。
- 该提交已推送到 `origin/codex/v013-npc-faction-reaction`，作为 v0.13 第一条可回滚分支点。
- 提交范围只包含 v0.13 规划、MiroFish 请求、process-0 Git 计划、AGENTS、PROJECT-STATE 和本交接。
- 未纳入本次提交：运行时代码、测试存档、`.github/`、素材、zip、历史删除项、外部参考目录和其他历史脏项。
- 本记录会以一个后续小提交同步到远端，用于记录实际 commit / push 证据。
- 下一次推荐提交范围：继续按 `v0.13.0-process-0-Git安全收束.md` 的分组，先整理 v0.12 完成线与 CI 门禁，或在用户要求时直接进入 `v0.13.0-a1` 文档门禁。
