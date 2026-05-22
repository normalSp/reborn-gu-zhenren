# 2026-05-22 v1.9-b1 前复核交接稿

## 当前状态

- 当前分支：`codex/v190-b1-preflight-readiness-review`
- 基线：`3afd121 docs: 完成v1.9-a2区域活世界MiroFish intake`
- 本次性质：纯文档/治理复核；无 runtime、无 save-format bump、无 DeepSeek 权限变更、无 live DeepSeek、无 MiroFish 新导出、无 UI/store/backend/subagents。
- 用户输入：批准先做 b1 前复核，确认 `v2 readiness projection/report 第一刀` 是否保持 report-only / pure helper / 无 UI tab；若不够再加 a3，不直接冲 runtime。

## 复核结论

专家团结论：`v1.9.0-b1-v2-readiness-projection-report第一刀.md` 可以进入，但必须保持：

- report-only
- pure helper
- 无 UI tab
- 无 store action
- 无 save field / migration / defaults / `SAVE_FORMAT_VERSION = 25`
- 无 DeepSeek prompt/context/model/authority 变更
- 无 DeepSeek visible summary / full-book RAG
- 无 runtime canon / knowledge-index 正文晋升
- 无正式地点、阵营、奖励、NPC 生死、hidden/private 可见化
- 无 BFF/backend、subagents、public wording、EdgeOne

当前不需要先追加 `v1.9.0-a3-v2-readiness-report设计门禁.md`。

## a3 触发条件

如果 b1 过程中任何方案想把 report 变成玩家可见 runtime，或触发 UI/store/持久化/DeepSeek/MiroFish 新导出/canon/知识库正文/正式结论/后端/子代理/公开口径扩张，必须先停下，新增 `v1.9.0-a3-v2-readiness-report设计门禁.md` 并让用户决策。

## 已同步文档

- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-b1前复核-v2-readiness-projection-report.md`
- `指导大纲/v1.9.0/codex/00-总览/README.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-小版本执行路线图.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-总体开发大纲.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-需求决策池.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-测试矩阵.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-真相源索引.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-v2.0区域活世界readiness草案.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-Git提交与推送计划.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a1-v2区域活世界save-format与事件账本设计门禁.md`
- `指导大纲/项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

## Skill 同步

- `reborn-expert-council`：updated，已同步 b1 前复核和 a3 触发条件。
- `game-dev-text`：updated，已同步 report-only 工程边界和验证策略。
- `reverend-insanity-lore`：updated，已同步 b1 不正式化南疆/商家城/身份/地点/奖励/NPC 生死/hidden 的边界。
- `mirofish-reborng-export`：no_update_needed，本复核不新增 MiroFish export。
- `reborn-combat-motion`：no_update_needed，本复核不触碰 combat/motion/visual runtime。

## 下一步

进入：

`v1.9.0-b1-v2-readiness-projection-report第一刀.md`

默认产物：

- v2 第一核心区域 readiness scorecard
- v1.1-v1.8 projection 地基汇总
- v1.9-a2 reviewed source-pointer material 的候选/规则/测试引用
- 区域事件 envelope gap list
- 同开局差异度 gap list
- formal prop-word / English term hardening inputs
- T3 300+ 长测前置缺口
- v2.0 go/no-go 用户决策清单

## 验证口径

本复核只需文档级验证：

- `git diff --check`
- `rg -n "v1.9.0-b1前复核|V19-B1-|v1.9.0-b1-v2-readiness-projection-report第一刀|a3-v2-readiness" 指导大纲/v1.9.0/codex/00-总览 指导大纲/项目仪表盘.md AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

不运行 runtime/unit/e2e/live，因为本次不改源码、存档、prompt、UI 或后端。
