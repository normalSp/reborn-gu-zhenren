# v2.9.0 codex 总览

日期：2026-05-24
状态：startup completed locally；等待用户审批 D-290 / F-290
分支：`codex/v290-startup-pre-runtime-safety-closure`
主线：`v3.0 前安全收束：权限、prompt、eval、Player Advocate、MiroFish 边界统一复核`

## 一句话结论

v2.9 承接 v2.8 的 runtime admission 结果，但不进入 runtime agent 实现。启动审计结论是：`v2.0-v2.8` 基本按长期路线完成，已批准的代码/脚本/report-only 工具未发现缺口；代码 TODO/placeholder 命中主要是 UI 输入占位、测试 stub、错误分支或历史高阶面板旧注释，未发现 v2.x Agent Lab 路线“文档承诺了但代码没落”的阻塞项。v2.9 的任务是把 v3.0 前最后一道门禁做成可执行、可回滚、可验收的 go/no-go。

## 当前入口

| 文档 | 用途 | 状态 |
|---|---|---|
| `v2.9.0-专家团启动会纪要.md` | 专家团意见、启动结论、风险直说 | completed startup |
| `v2.9.0-长期路线按期实现审计.md` | v2.0-v2.8 长期路线兑现核对 | completed startup audit |
| `v2.9.0-文档代码一致性与TODO审计.md` | 文档/代码差异、TODO/placeholder triage | completed startup audit |
| `v2.9.0-启动审查与范围冻结.md` | 输入、边界、范围冻结 | completed startup |
| `v2.9.0-总体开发大纲.md` | v2.9 主线、产物、禁止项 | draft for approval |
| `v2.9.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc | draft for approval |
| `v2.9.0-前置授权包.md` | D-290 / F-290 全版本授权边界 | pending user approval |
| `v2.9.0-需求决策池.md` | D-290 / F-290 决策池 | pending user approval |
| `v2.9.0-测试矩阵.md` | 文档、审计、report-only 检查矩阵 | draft |
| `v2.9.0-真相源索引.md` | 本版本依据和禁止事实源 | completed startup |
| `v2.9.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 | completed startup；`not_needed` |
| `v2.9.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 | completed startup plan |
| `v2.9.0-startup-Skill同步审计记录.md` | startup skill sync audit | completed startup |

## 编号说明

v2.9 使用 `D-290` / `F-290`。它和 v2.8 的 `D-280` / `F-280` 分开，避免跨版本追踪混淆。

## 当前待审批

- D-290-001 至 D-290-012：建议用户一次性批准，允许后续 `/goal` 在授权包内完成 v2.9。
- F-290-001 至 F-290-012：建议保持 `future_gate_required`，触发即停止自动推进并找用户决策。

## 启动审计结论

- 长期路线兑现：v2.0-v2.8 与 `v2.0-v3.0 Agent Lab 到 Runtime Agent 总体大纲` 基本一致。
- 代码/工具证据：v2.1/v2.2/v2.3/v2.6/v2.7/v2.8 的 self-owned zero-dependency report-only/offline runner、samples、npm scripts 和 artifacts 均存在。
- 文档/代码差异：未发现已批准 v2.x Agent Lab / runtime admission scope 中“文档写了但代码没实现”的阻塞项。
- TODO/placeholder：代码命中已 triage；少数旧高阶 UI/历史迁移注释不属于 v2.0-v2.8 已批准 scope，不阻塞 v2.9，但保留为未来高阶系统复核输入。

## 硬边界

v2.9 startup 不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`。
- runtime agent、WorldCore runtime 接入、agent 写正式事实。
- live DeepSeek、DeepSeek prompt/context/model/authority 变更、DeepSeek visible lore/RAG。
- backend/BFF/private canon service/eval archive service/job queue service/cloud save。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- MiroFish export/intake、真实原著事实、命名 NPC、hidden-adjacent、方源公开证据、正式 lore 结论。
- 知识库正文、runtime canon、canon promotion、真实 hidden/private body、prompt body archive。
- 正式地点、阵营、身份、奖励、NPC 生死、正式游戏事实。
- public wording、release、EdgeOne 部署、法律/版权边界变化。

## 下一步

等待用户审批 D-290 / F-290。若全部批准，v2.9 后续可按前置授权包进入 `/goal` 连续完成；若触发 F-290，必须立即停止自动推进。
