# 2026-05-22 v2.1 Agent Lab 启动包交接稿

## 当前状态

- 当前分支：`codex/v210-a0-agent-lab-startup`。
- 当前目标：启动 `v2.1.0 Agent Simulation Lab 启动版`，完成专家团启动会、v2.0 T3 复盘、Claude Code 架构尽调和 Agent Lab 设计门禁草案。
- 当前阶段：active planning / startup package。尚未进入 a0 实施，也未进入 b1/offline runner。
- 当前入口：`指导大纲/v2.1.0/codex/00-总览/README.md`。

## 已落地文档

- `v2.1.0-专家团启动会纪要.md`
- `v2.1.0-启动审查与范围冻结.md`
- `v2.1.0-总体开发大纲.md`
- `v2.1.0-小版本执行路线图.md`
- `v2.1.0-需求决策池.md`
- `v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结.md`
- `v2.1.0-a1-Claude-Code架构尽调.md`
- `v2.1.0-a2-Agent-Lab设计门禁草案.md`
- `v2.1.0-a0-Skill同步审计记录.md`
- `v2.1.0-真相源索引.md`
- `v2.1.0-测试矩阵.md`
- `v2.1.0-MiroFish资料需求与交付协议.md`
- `v2.1.0-Git提交与推送计划.md`

## 已同步入口

- `指导大纲/项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- 外部 skill current override：
  - `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
  - `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
  - `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 硬边界

本批只做文档/治理/尽调：

- 不改 runtime/source/UI/store/prompt。
- 不新增后端/BFF。
- 不调用 live DeepSeek。
- 不改 DeepSeek prompt/context/model/authority。
- 不新增 save fields，不 bump `SAVE_FORMAT_VERSION`。
- 不启用 subagents。
- 不新增 MiroFish export/intake。
- 不新增 public wording。
- 不新增正式地点、阵营、奖励、NPC 生死、canon promotion。
- 不自动部署 EdgeOne。

Claude Code 仅作为官方架构/Agent SDK/tool permission/hooks/session/MCP/subagents/approval/sandbox 思路参考；不得复制泄露、反编译或未授权源码，官方仓库源码也先按谨慎参考处理。

## 下一步

等待用户批准 D-210 系列后，进入：

`v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结.md`

a0/a1/a2 完成后，再由用户决定 b1 是否进入 report-only/offline runner。
