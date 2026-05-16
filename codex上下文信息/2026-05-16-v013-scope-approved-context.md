# 2026-05-16 v0.13.0 范围批准交接

## 当前状态

用户已批准四项：

1. v0.13 主线为 `NPC 与势力反应系统`。
2. 第一刀先做 `v0.13.0-a1 社会记忆协议、字段表、测试矩阵`，不先写 runtime。
3. 第一阶段优先复用 v22 已有字段，不新增持久化关系账本。
4. 先请求 MiroFish 前两个包：`qingmao_npc_memory_motive_pack` 与 `qingmao_faction_reputation_pressure_pack`。

用户会转交 MiroFish 请求；当前 Codex 线程不能直接联系 MiroFish 会话。

## 已同步

- `指导大纲/v0.13.0/codex/00-总览/README.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-专家团启动会纪要.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-总体开发大纲.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-启动审查与范围冻结草案.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-小版本执行路线图.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-需求决策池.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v0.13.0/codex/00-总览/v0.13.0-项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`

## 下一步

可以进入 `v0.13.0-a1` 文档门禁开发。

runtime 命名 NPC/势力规则仍需等待 MiroFish 包交付并通过 intake review。

## process-1 口径

`v0.13.0-process-1` 是工程门禁小刀，不是 gameplay 小版本：

- 验证 GitHub Actions 远端首次运行。
- 复核 PR/Issue 模板是否覆盖 v0.13 的社会记忆风险。
- 记录远端 CI 证据和是否需要升级 branch policy。

边界：

- 不默认启用 branch protection。
- 不自动发布。
- 不自动合并。
- 不默认让所有 PR 跑完整 Playwright 或长测。

如果要启用 branch protection、自动发布、EdgeOne 自动部署或 PR 必跑完整 Playwright，需要用户单独决策。
