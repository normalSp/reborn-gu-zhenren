# v4.0.0 总览

状态：startup completed；startup commit `fc8e5132` / GitHub Actions `26402655412` passed；总体设计讨论、Auto-Theater 美术/交互总纲、v4.0-v5.0 长期路线与 v4.0-v12.0 终局路线指针已记录；D-400 已获用户批准，F-400 全部继续 `future_gate_required`。
日期：2026-05-25。
分支：`codex/v400-startup-high-world-prep`。
主线建议：`Auto-Theater Combat 与 HeavenWill/Fate Pressure 高阶世界表达模型`。

## 定位

`v4.0.0` 承接 `v3.9.0` 的 v4.0 前安全收束。专家团建议 v4.0 不直接开放完整蛊仙、高阶战斗 runtime、天道/宿命裁决或 L4/L5 原著关键人物 agent，而是先把两条高风险长期路线拆成可审计的架构预备：

1. `Auto-Theater Combat` 高阶战斗表达与结算架构预备：自走棋式准备、WorldCore 自动结算、battle theater、杀招栈、Combat Ledger、领域/阵法/地形压力、仙蛊屋状态、环境破坏证据链。
2. HeavenWill / Fate / L5 宏观压力预备：Fate state、HeavenWill pressure、era anchor graph、causality debt、L5 macro director。

总体设计讨论已确认：不采用纯自走棋，也不把棋盘作为高阶战斗主容器。棋盘保留为凡阶/中阶/局部战术镜头；凡阶底层按 `Auto-Theater Lite` 预备，高阶主表达按 theater / stack / ledger 设计。

Auto-Theater Combat 应作为 RebornG 后续战斗表现的核心招牌：水墨战争沙盘、道痕规则可视化、杀招栈舞台、Combat Ledger 复盘和 DeepSeek 表达分层。v4.0 只冻结视觉语法与验收计划，不生成素材、不实现 theater UI。

`指导大纲/长期路线/v4.0-v5.0-AutoTheater到高阶世界Runtime总体大纲.md` 已作为 v4.0 后续路线基线：v4.1-v4.9 逐步硬化 Auto-Theater contract、凡阶 Lite 映射、高阶 theater、杀招栈、宏观压力、MiroFish/lore 准入和 v5.0 go/no-go，v5.0 才候选第一个高阶世界可玩试点。

`指导大纲/长期路线/v4.0-v12.0-RebornG终局形态总体大纲.md` 已作为更远期终局路线基线：专家团判断离真正终局至少还差 8 个左右大版本，v5 做高阶第一刀，v6-v9 扩多区域、agent society、经济和高阶战斗，v10-v12 才触碰关键原著时代、任意身份和终局质量收束。本路线只作规划，不新增 runtime/save/DeepSeek/MiroFish/backend/external-framework/F-400 授权。

本启动包只开专家团会和前置授权包，不改 runtime、save、prompt、UI、后端、外部依赖或 MiroFish。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 DeepSeek prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake；当前建议 need level 为 `not_needed`，触发真实原著/hidden/L4/L5 时升级 blocking。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 agent framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- 不开放 persistent agent state、agent memory store 或 self-learning 写入。
- 不开放 L4/L5 runtime、方源等原著关键人物 agent、HeavenWill/Fate runtime 裁决。
- 不实现高阶战斗 runtime、凡阶战斗 runtime 迁移、纯自走棋 runtime、theater UI、杀招栈数值、仙蛊屋状态写入或环境破坏结算。
- 不新增正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不新增 knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- 不改公开发布、法律边界，不部署 EdgeOne，不自动合并 `main`。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v4.0.0-专家团启动会纪要.md` | 专家团意见、路线选择、收益风险 |
| `v4.0.0-总体设计讨论纪要.md` | Auto-Theater Combat、自走棋取舍、凡阶 Lite、DeepSeek 与天道/宿命边界 |
| `v4.0.0-Auto-Theater-Combat美术与交互总纲.md` | theater 布局、色彩语言、杀招栈、Combat Ledger、动效分工、素材分层、外部参考和截图验收 |
| `v4.0.0-启动审查与范围冻结.md` | 进入条件、范围、非目标 |
| `v4.0.0-总体开发大纲.md` | v4.0 总体目标和阶段产物 |
| `v4.0.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线建议 |
| `v4.0.0-前置授权包.md` | 已获用户批准的 D-400/F-400 状态与授权边界 |
| `v4.0.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v4.0.0-需求决策池.md` | 决策项状态表 |
| `v4.0.0-a1-高阶战斗theater与杀招栈设计门禁草案.md` | Auto-Theater Combat / theater / stack / ledger 设计门禁草案 |
| `v4.0.0-a2-HeavenWill-Fate-L5宏观压力设计门禁草案.md` | 天道/宿命/L5 宏观压力设计门禁草案 |
| `v4.0.0-测试矩阵.md` | 启动文档自检与后续实现测试计划 |
| `v4.0.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v4.0.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v4.0.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v4.0.0-process-1-开发流程与系统连续性审计.md` | 开发制度可靠性、跨版本接续和孤儿系统审计 |
| `v4.0.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前建议

用户已批准 `D-400-001` 至 `D-400-012`，并确认 `F-400-001` 至 `F-400-012` 全部继续 `future_gate_required`。Codex 可在该授权包内完成 v4.0；触发例外停机清单时必须立即停止并报告用户。
