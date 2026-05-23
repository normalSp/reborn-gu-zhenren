# 2026-05-23 v2.5-a0 前置批量审批制度交接

分支：`codex/v250-a0-frontloaded-approval-process`

## 当前状态

- 用户已批准 D-270-001 至 D-270-006。
- 用户批准将“前置批量审批 + 例外停机”制度化、工程化。
- 本轮新增项目级制度：`指导大纲/流程制度/前置批量审批与例外停机制度.md`。
- v2.5 入口已建立：`指导大纲/v2.5.0/codex/00-总览/README.md`。
- v2.5-a0 记录：`v2.5.0-a0-前置批量审批与例外停机治理补丁.md`。
- v2.5-a0 skill sync：`v2.5.0-a0-Skill同步审计记录.md`。

## 新流程口径

从 v2.5 起，专家团启动会或 a1 设计门禁必须给用户一次性提供全版本前置授权包：

- 全版本阶段路线。
- 全部预计决策项。
- 自动继续范围。
- 例外停机清单。
- 负授权说明。
- 测试和证据计划。
- Git 与交接计划。

用户批准授权包后，后续 `/goal` 可以在授权包范围内连续执行到 rc；只有触发例外停机条件才回到用户。

## 仍必须停机的事项

- 新 save field / `SAVE_FORMAT_VERSION` bump。
- DeepSeek prompt/context/model/authority 扩大。
- live probe 超出已批档位或出现 P0/P1。
- MiroFish blocking：真实原著事实、命名 NPC、hidden-adjacent、方源证据、正式 lore 结论。
- backend/BFF/service、外部依赖、PoC、subagents、patch artifact。
- 正式地点、阵营、身份、奖励、NPC 生死、canon promotion。
- CI/测试连续失败且需要改变方案。
- 成本、公开发布、部署、法律/版权边界变化。

## 下一步

开 v2.5 专家团启动会。启动会不要再只给下一阶段 D 项，必须输出完整 v2.5 授权包，并把事项标成：

- `approved_in_frontloaded_pack`
- `future_gate_required`
- `blocked_or_rejected`

如果用户批准该授权包，再进入 `/goal` 连续完成 v2.5。
