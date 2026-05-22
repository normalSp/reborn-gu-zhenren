# 2026-05-22 v2.1-a2 Agent Lab 设计门禁交接稿

## 当前状态

- 当前分支：`codex/v210-a2-agent-lab-design-gate`。
- 当前阶段：`v2.1.0-a2-Agent-Lab设计门禁草案.md` active。
- 已完成：`v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结`、`v2.1.0-a1-Claude-Code架构尽调.md`、`v2.1.0-a1-Agent框架吸收矩阵.md`。
- 当前入口：`指导大纲/v2.1.0/codex/00-总览/README.md`。

## 本轮入场动作

用户明确要求进入 `v2.1.0-a2`。本轮只做入场同步：

- 将 v2.1 入口、路线图、决策池、Git 计划和项目仪表盘从 a1 阶段切到 a2 入场状态。
- 将 a1 Claude Code / 开源 Agent 框架尽调标记为 completed，作为 a2 设计输入。
- 将 a2 设计门禁标记为 active，并加入入场记录、执行重点、禁止范围和 D-211 go/no-go 决策草案。
- 更新 PROJECT-STATE、AGENTS、Skill 同步审计记录。
- 同步外部 skill current override：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 硬边界

本阶段仍是文档/治理/设计门禁：

- 不改 runtime/source/UI/store/prompt。
- 不新增 save fields，不 bump `SAVE_FORMAT_VERSION`。
- 不改 DeepSeek prompt/context/model/authority。
- 不调用 live DeepSeek。
- 不建 BFF/backend。
- 不启用子代理。
- 不新增 MiroFish export/intake。
- 不引入 LangGraph、Mastra、OpenAI Agents SDK、Google ADK、AutoGen、CrewAI、PydanticAI、Letta、OpenHands 或其他 agent SDK/framework 依赖。
- 不写 runner，不做 PoC。
- 不开放正式地点、阵营、奖励、NPC 生死、hidden/private body 可见化或 canon promotion。
- 不自动部署 EdgeOne。

## 下一步

继续完成：

`v2.1.0-a2-Agent-Lab设计门禁草案.md`

a2 完成后，把 D-211 go/no-go 决策项交给用户。用户批准前，不进入 b1/offline runner、framework PoC、live eval、子代理、BFF/backend 或 runtime agent。
