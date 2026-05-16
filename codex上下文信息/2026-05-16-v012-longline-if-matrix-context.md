# 2026-05-16 v0.12 长线防崩坏与青茅 IF 矩阵交接

## 本轮目标

用户要求更新相关文档，并把 v0.12 到 v1.0 的版本路线讲清楚。当前只做治理、路线与范围文档，不进入运行时代码。

## 关键结论

- RebornG 近中期不把外部 AI 人生引擎的“0 岁到多年人生模拟”作为主目标。
- 当前核心压力是：玩家在青茅山与后续南疆早期路线中连续行动几十到上百轮时，事实、NPC 反应、势力压力、IF 偏离和 DeepSeek 叙事不能崩坏。
- 旧 v0.8 的剧情锚点/IF 矩阵是历史设计参考，不能直接把宿命战、尊者、天意级分支轴搬到青茅凡人阶段。
- v0.12-a2 的正式落位是“青茅低阶 IF 矩阵”：`npc_attention`、`faction_pressure`、`resource_control`、`route_escape`、`hidden_fact_probe`、`local_survival`、`canon_anchor_pressure`。

## 已更新文档

- `指导大纲/长期路线/RebornG-长线叙事防崩坏与青茅IF矩阵落位.md`
- `指导大纲/长期路线/README.md`
- `指导大纲/长期路线/RebornG-活世界长期路线图-v0.11至v1.0.md`
- `指导大纲/长期路线/RebornG-长期架构演进路线图-纯前端到薄后端.md`
- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-候选专项池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-启动审查与范围冻结.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`（版本 0.1.49，新增当前同步覆盖提示）

## 下一步

下一步 runtime 工作仍是 `v0.12.0-a1`：青茅原著事实卡扩展与正史锚点表第一刀。

开工前必须读取：

- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-启动审查与范围冻结.md`
- `指导大纲/长期路线/RebornG-长线叙事防崩坏与青茅IF矩阵落位.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-rc-质量收束记录.md`

## 测试与 Git

- 本轮只改文档，没有运行 npm 测试。
- 未提交、未推送。
