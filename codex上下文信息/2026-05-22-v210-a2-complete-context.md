# 2026-05-22 v2.1-a2 Agent Lab 设计门禁完成交接稿

## 当前状态

- 当前分支：`codex/v210-a2-agent-lab-design-gate`。
- 当前阶段：`v2.1.0-a2-Agent-Lab设计门禁草案.md` completed。
- 当前决策门：D-211，用户拍板前不进入 b1。
- 当前入口：`指导大纲/v2.1.0/codex/00-总览/README.md`。

## 已完成

- a0：v2.0 T3 复盘与 Agent Lab 范围冻结。
- a1：Claude Code 与开源 Agent 框架架构尽调。
- a2：Agent Lab 设计门禁。

a2 冻结内容：

- `AgentProposal` envelope 约束。
- L0-L5 agent 分层与权限矩阵。
- visibility gate 必须先于 agent context assembly。
- WorldCore post-check 三类输出：`accepted_candidate` / `needs_user_decision` / `rejected_violation`。
- failure taxonomy：P0 authority / hidden leak，P1 formal implication / source fabrication，P2 thin/repeated / wording risk。
- D-211 go/no-go 决策包。

## D-211 默认建议

建议批准：

- D-211-001：b1 写 Agent Lab report-only/offline runner 第一刀。
- D-211-002：b1 限定 dry-run only，不调用 live DeepSeek。
- D-211-003：允许 report-only 输出到 `artifacts/v2.1.0/`。
- D-211-005：runner 走 TypeScript-first / zero new dependency。
- D-211-010：b1 保持 MiroFish `not_needed`。
- D-211-012：b1 最小通过标准采用 schema 100%、P0=0、P1=0、P2 阈值另定。

建议暂缓或拒绝：

- D-211-004：b1 live DeepSeek eval。
- D-211-006：外部 agent framework 隔离 PoC。
- D-211-007：外部 SDK/agent 文件、命令或 git 权限。
- D-211-008：只读/分析型子代理。
- D-211-009：agent memory 持久化实验。
- D-211-011：薄 BFF / private canon / job queue / eval archive 技术预研。

## 硬边界

本阶段没有：

- runtime/source/UI/store/prompt 改动。
- save fields 或 `SAVE_FORMAT_VERSION` bump。
- DeepSeek prompt/context/model/authority 改动。
- live DeepSeek 调用。
- BFF/backend。
- 子代理。
- MiroFish export/intake。
- 第三方 agent SDK/framework 依赖、runner 或 PoC。
- 正式地点、阵营、奖励、NPC 生死、hidden/private body 可见化或 canon promotion。
- EdgeOne 部署。

## 下一步

向用户说明 D-211 逐项影响并等待拍板。若用户批准推荐组合，再切新语义分支进入 b1；否则按用户选择调整路线。
