# 2026-05-24 v2.6 startup context

当前分支：`codex/v260-startup-private-canon-eval-archive-prep`

当前状态：v2.6 专家团启动会已打开；startup docs 已落地，等待用户审批 D-260 前置授权包。

本次只做文档和入口同步，不改 runtime/source/UI/store/prompt/save，不新增后端，不新增 DeepSeek 权限，不调用 live DeepSeek，不请求 MiroFish，不引入外部依赖或 subagents。

关键文档：

- `指导大纲/v2.6.0/codex/00-总览/README.md`
- `指导大纲/v2.6.0/codex/00-总览/v2.6.0-专家团启动会纪要.md`
- `指导大纲/v2.6.0/codex/00-总览/v2.6.0-前置授权包.md`
- `指导大纲/v2.6.0/codex/00-总览/v2.6.0-需求决策池.md`
- `指导大纲/v2.6.0/codex/00-总览/v2.6.0-测试矩阵.md`

待用户决策：

- 是否批准 D-260-001 至 D-260-012。
- 是否确认 F-260-001 至 F-260-012 均保持 `future_gate_required`。

如果用户批准，下一步建议进入 `/goal` 完成 v2.6 全部开发。自动继续范围包括 a1/a2/b1/b2/b3/process-1/rc，其中 b1 可新增最小自有 zero-dependency / dry-run / report-only schema checker、synthetic fixtures、npm script 和 `artifacts/v2.6.0/` 报告。

任何 F-260 项触发必须停机，包括 backend/BFF/service、真实 hidden/private body、DeepSeek RAG、MiroFish export、external framework PoC/dependency/subagents、save format、正式地点/阵营/奖励/NPC 生死、public/deploy/legal。
