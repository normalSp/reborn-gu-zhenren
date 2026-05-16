# RebornG v0.13.0 Codex 当前入口

日期：2026-05-16
状态：主线、第一刀、Git 安全收束和三项 MiroFish intake 已通过
主题：`NPC 与势力反应系统`

## 定位

`v0.13.0` 承接 `v0.12.0 青茅山正史锚点与 IF 框架`，目标是让世界开始像有人在里面生活。

长期路线原定义：

- NPC 记忆、印象、关系、怀疑、利益驱动。
- 势力声望、封锁、招揽、通缉、任务来源。
- 行动后果对 NPC/势力的长期影响。
- 事件编年史和公开行动摘要，不依赖 DeepSeek 长上下文硬记。
- 早期 Player Advocate 走查：玩家是否看得懂自己影响了什么。

专家团收束：

- v0.13 不一次性开放完整声望、通缉、招揽、阵营变化和任务网络。
- 第一优先级是“社会记忆协议”：玩家行动如何被不同 NPC/势力解释、记住、累积为压力和机会。
- 正式阵营身份变化、通缉生效、招揽成功、任务来源开放、声望数值公开，必须拆成后续小刀并单独决策。

## 当前权威文件

- `v0.13.0-专家团启动会纪要.md`
- `v0.13.0-总体开发大纲.md`
- `v0.13.0-启动审查与范围冻结草案.md`
- `v0.13.0-小版本执行路线图.md`
- `v0.13.0-需求决策池.md`
- `v0.13.0-真相源索引.md`
- `v0.13.0-MiroFish资料需求与交付协议.md`
- `v0.13.0-项目仪表盘.md`
- `v0.13.0-Git提交与推送计划.md`
- `v0.13.0-process-0-Git安全收束.md`
- `v0.13.0-a1-社会记忆协议.md`
- `v0.13.0-a1-字段表与写入权限.md`
- `v0.13.0-a1-测试矩阵.md`
- `v0.13.0-a2-NPC记忆投影引擎第一刀.md`
- `v0.13.0-b1-势力态度压力投影第一刀.md`
- `v0.13.0-b2-事件编年史与公开摘要第一刀.md`
- `v0.13.0-b3-后续行动候选第一刀.md`
- `v0.13.0-b4-Player-Advocate可读性UI第一刀.md`

## 建议主线

v0.13 主线已冻结为：

`公开行动 -> NPC/势力解释 -> 长期记忆/压力 -> 可见摘要 -> 后续行动候选`

这条主线服务三个目标：

1. 玩家知道自己做过什么。
2. NPC/势力对同一行为有不同解释。
3. 系统不用让 DeepSeek 长上下文硬记所有历史。

## 非目标

除非用户另行批准，v0.13 不默认做：

- 完整势力声望数值系统。
- 正式白家投靠、古月叛逃或阵营身份变化。
- 通缉正式生效、追杀成功、抓捕或 NPC 生死。
- 完整任务网络和任务奖励池。
- 青茅山主线结局、狼潮完整主线或后续地域正式开放。
- 新增奖励、蛊虫、蛊方、材料池。
- DeepSeek 获得关系、声望、任务、NPC 生死或地点解锁写入权。
- 大规模后端化或多人共享世界。

## MiroFish 总需求

v0.13 涉及 NPC 动机、势力关系、公开事件编年史，必须在规划阶段列出 MiroFish 包。

建议优先请求：

1. `qingmao_npc_memory_motive_pack`：青茅 NPC / 小组 / 家老 / 商队人物公开动机、记忆触发、怀疑与利益轴。
2. `qingmao_faction_reputation_pressure_pack`：古月、白家、熊家、商队、内务/族学等势力压力、封锁、招揽、通缉、任务来源候选。
3. `qingmao_public_event_chronicle_pack`：青茅公开事件编年史、玩家公开行为如何被归档成可见摘要。

当前 Codex 线程不能直接联系 MiroFish 会话；需要用户转交请求给会话 `019e207b-c55d-7e23-b450-efa7a054a165`。

当前三项 v0.13 MiroFish 包已交付并通过 intake review：

- `qingmao_npc_memory_motive_pack`：可进入 a1/a2 候选池。
- `qingmao_faction_reputation_pressure_pack`：可进入 a1/b1 候选池。
- `qingmao_public_event_chronicle_pack`：可进入 a1/b2 候选池。

三包只可进入 `candidate_pool`、`rule_draft`、`test_sample`；不得直接成为 canon、runtime truth、DeepSeek authority 或玩家可见隐藏事实。

## 下一步

用户已批准：

1. 采用 v0.13 主线：`NPC 与势力反应系统`。
2. 第一刀先做 `a1 社会记忆协议 + 字段表 + 测试矩阵`，不先写 runtime。
3. 第一阶段优先复用 v22 字段，不新增持久化关系账本。
4. 先请求 `qingmao_npc_memory_motive_pack` 和 `qingmao_faction_reputation_pressure_pack`。

当前行动：

- `v0.13.0-process-0 Git安全收束` 第一刀已建立：本版本 Git 计划、回滚守门职责、提交分组和脏项隔离记录已落文档。
- 三项 v0.13 MiroFish 包已通过 intake review，runtime 命名 NPC/势力规则的资料门槛已清除，但仍必须经过 a1 字段/权限/测试门禁。
- `v0.13.0-a1` 社会记忆协议、字段表与写入权限、测试矩阵已建立。
- `v0.13.0-a2` NPC 记忆投影引擎第一刀已完成 read-only projection，不写存档、不开放命名 NPC runtime 规则。
- `v0.13.0-b1` 势力态度 / 压力投影第一刀已完成 read-only projection，不写声望、不开放通缉、招揽、任务或奖励。
- `v0.13.0-b2` 事件编年史与公开行动摘要第一刀已完成 read-only prompt-safe summary，不写新存档字段、不把 hidden body 交给 DeepSeek。
- `v0.13.0-b3` 后续行动候选第一刀已完成 candidate-only 输出，不创建正式任务或奖励。
- 用户批准 b4 方案 A：把社会反应展示放进 `FreeGoalPanel` 的“社会影响 / 局势后续”折叠区。
- `v0.13.0-b4` Player Advocate 可读性 UI 第一刀已完成，只读展示 NPC 记忆、势力态度、公开行动摘要和后续候选。
- `v0.13.0-process-1` 已把 `.github` 门禁纳入当前分支并成功触发远端 Actions；远端 CI 因历史 Git 基线未同步而在 type check 失败。
- 当前下一步需要用户决策：先做 `v0.13.0-process-2 Git基线同步专项`，还是暂用本地完整验证进入 `v0.13.0-rc`。
