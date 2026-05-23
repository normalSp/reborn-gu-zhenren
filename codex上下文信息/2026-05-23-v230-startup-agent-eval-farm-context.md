# 2026-05-23 v2.3 startup agent eval farm context

状态：v2.3 startup draft。
分支：`codex/v230-startup-agent-eval-farm`

## 本轮目标

用户要求开 v2.3 专家团启动会。

已完成：

- 建立 `指导大纲/v2.3.0/codex/00-总览/`。
- 起草 v2.3 专家团启动会、范围冻结、总体大纲、路线图、D-230 决策池、a0 复盘、测试矩阵、MiroFish 协议、Git 计划、Skill 同步审计。
- 同步项目仪表盘、PROJECT-STATE、AGENTS。
- 外部 skills 已同步到 v2.3 startup draft：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 当前口径

v2.3 推荐主线：

`Agent eval farm 与失败分类硬化`

下一步：

- 等待用户审批 D-230-001 至 D-230-012。
- 批准后进入 `v2.3.0-a1-failure-taxonomy与severity-rubric设计门禁.md`。

## 硬边界

本轮不改 runtime/source/UI/store/prompt/save，不新增 save fields，不 bump `SAVE_FORMAT_VERSION`，不调用 live DeepSeek，不启用 subagents，不接 BFF/backend，不新增 MiroFish export，不引入外部 framework PoC/依赖，不开放正式地点/阵营/奖励/NPC 生死或 canon promotion。
