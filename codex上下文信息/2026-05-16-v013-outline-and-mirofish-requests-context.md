# 2026-05-16 v0.13.0 大纲与 MiroFish 请求交接

## 当前状态

`v0.12.0` 已完成本地开发里程碑。
`v0.13.0` 规划草案已建立，尚待用户批准。

## 本轮完成

新增 v0.13 规划目录：

- `指导大纲/v0.13.0/codex/00-总览/README.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-专家团启动会纪要.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-总体开发大纲.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-启动审查与范围冻结草案.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-小版本执行路线图.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-需求决策池.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-真相源索引.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-项目仪表盘.md`

新增 MiroFish 请求：

- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-npc-memory-motive-pack.md`
- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-faction-reputation-pressure-pack.md`
- `指导大纲/vMiroFish/requests/2026-05-16-qingmao-public-event-chronicle-pack.md`
- `指导大纲/vMiroFish/v0.13.0/README.md`

同步更新：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `指导大纲/长期路线/RebornG-活世界长期路线图-v0.11至v1.0.md`

## 专家团建议

v0.13 推荐主线：

`NPC 与势力反应系统`

推荐第一刀：

`v0.13.0-a1 社会记忆协议、字段表、测试矩阵`

核心路线：

`公开行动 -> NPC/势力解释 -> 长期记忆/压力 -> 可见摘要 -> 后续行动候选`

## MiroFish 需求

建议现在转交前两个包：

1. `qingmao_npc_memory_motive_pack`
2. `qingmao_faction_reputation_pressure_pack`

第三个包可以延期到 b2 前：

3. `qingmao_public_event_chronicle_pack`

当前 Codex 线程不能直接联系 MiroFish 会话，需要用户转交给：

`019e207b-c55d-7e23-b450-efa7a054a165`

## 待用户决策

1. 是否批准 v0.13 主线为 `NPC 与势力反应系统`。
2. 是否批准第一刀先做 a1 设计门禁，不先写 runtime。
3. 是否批准第一阶段优先复用 v22 字段，不新增持久化关系账本。
4. 是否批准现在请求 MiroFish 前两个包。

## 未改变

- 未改运行时代码。
- 未新增持久化字段。
- `SAVE_FORMAT_VERSION` 仍为 `22`。
- DeepSeek 权限未扩张。
- 未提交，未推送。
