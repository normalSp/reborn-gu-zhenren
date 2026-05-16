# 2026-05-15 v0.11.0-process-1 开发流程进化专项交接

## 用户决策

用户批准先做 `v0.11.0-process-1`，目标是把 RebornG 的开发流程本身变成强力工具。

用户核心诉求：

- 不能靠用户想到什么才补什么。
- 需要制度化用户输入：什么时候需要用户输入，需要什么样的输入。
- Codex 可以在批准范围内自动推进，但关键方向、边界、取舍和发布承诺必须停下来。
- 外部大厂、GitHub、AI agent 和论文模式可以借鉴思想，但不能引入重型流程或未验证可写多代理。

## 已完成

新增：

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-开发流程进化专项.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-用户输入协议.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-专家团阶段门禁.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-模板集.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-process-1-外部模式借鉴映射.md`

更新：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `.learnings/LEARNINGS.md`
- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-后续专项池.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`

## 核心规则

用户输入固定为 6 类：

- 方向。
- 边界。
- 优先级。
- 口感。
- 取舍。
- 发布。

Codex 可以自动推进：

- 已批准范围内的实现。
- 已批准范围内的测试补齐。
- 文档事实同步。
- 交接记录更新。
- 小型 bug 修复和回归测试。
- 不改变用户承诺的小重构。
- 专家团候选需求整理。

Codex 必须停下来：

- 范围扩大。
- 原著/IF 边界变化。
- 新增持久化字段或提升 `SAVE_FORMAT_VERSION`。
- DeepSeek 获得新写入权。
- 引入外部运行时依赖。
- 启用可写子代理。
- 对外发布或承诺。
- 需要牺牲一个重要目标换另一个目标。

## 外部思想吸收

外部模式只吸收思想：

- GitHub Flow / Actions：小批量、模板、CI。
- DORA：小步、自动验证。
- Google SRE：事故复盘、防复发。
- Microsoft SDL：威胁建模。
- Voyager：技能库、自我课程、自我验证。
- Generative Agents：观察、记忆、反思、计划。
- Reflexion：失败经验反哺。
- Agent-as-a-Judge：后续只读审查代理试点。

明确暂不做：

- 不引入重型项目管理工具。
- 不创建可写多子代理。
- 不照搬 Claude-Code-Game-Studios 全套组织结构。

## 下一步建议

继续 `v0.11.0-a3-2` 前，先按 process-1 判断：

- 是否还有用户边界/取舍未决。
- 是否需要新增 a3-2 UI/store 样本。
- 是否只写 `livingWorldState.playerGoals`。
- 是否无需再停下来问用户。

## 验证

本轮为文档、skill 和治理入口更新，未改运行时代码，未运行 `npm test` 或构建。
