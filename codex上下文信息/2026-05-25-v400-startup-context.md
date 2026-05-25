# 2026-05-25 v4.0 startup context

分支：`codex/v400-startup-high-world-prep`。
版本：`v4.0.0`。
主题：`Auto-Theater Combat 与 HeavenWill/Fate Pressure 高阶世界表达模型`。

## 当前结论

用户要求开 v4.0 专家团启动会，并随后完成一轮 v4.0 总体设计讨论。本轮已建立 `指导大纲/v4.0.0/codex/00-总览/` 启动包，并新增 `v4.0.0-总体设计讨论纪要.md` 与 `v4.0.0-Auto-Theater-Combat美术与交互总纲.md`。

用户随后询问 v4.0 到 v5.0 的路线大纲是否已做好。当前已新增 `指导大纲/长期路线/v4.0-v5.0-AutoTheater到高阶世界Runtime总体大纲.md`，作为 v4.1-v4.9 与 v5.0 第一刀的长期路线基线。该总纲只授权规划，不授权 runtime。

用户进一步批准 `D-400-001` 至 `D-400-012`，确认 `F-400-001` 至 `F-400-012` 全部继续 `future_gate_required`，并要求专家团评估 RebornG 离最终目标还差多少个大版本、是否需要 v4.0 到最终版本总纲。当前已新增 `指导大纲/长期路线/v4.0-v12.0-RebornG终局形态总体大纲.md`，作为 v4.0 到 v12 final-candidate 的终局路线基线。该总纲只授权规划，不新增 runtime/save/DeepSeek/MiroFish/backend/external-framework/F-400 权限。

startup commit `fc8e5132` 已推送，GitHub Actions run `26402655412` passed。

`D-400-001` 至 `D-400-012` 已获用户批准，`F-400-001` 至 `F-400-012` 全部继续 `future_gate_required`。

## 美术与交互总纲结论

- Auto-Theater Combat 作为 RebornG 后续战斗表现的核心招牌。
- 视觉方向为水墨战争沙盘、道痕规则可视化、杀招栈舞台、Combat Ledger 复盘和 DeepSeek 表达分层。
- v4.0 只冻结视觉语法、外部参考矩阵和 Playwright 截图验收计划。
- 不授权 theater UI implementation、素材生成、运行时接入、外部渲染依赖或战斗结算。

## 总体设计讨论结论

- 用户赞成 `Auto-Theater Combat`。
- 纯自走棋不作为高阶主路线。
- 高阶主表达采用自走棋式准备、WorldCore 自动结算、Battle Theater、Killer-Move Stack、Combat Ledger。
- 凡阶战斗纳入同一底层范式，但只按 `Auto-Theater Lite` 预备；v4.0 不迁移凡阶 runtime，不替换现有棋盘/行动卡。
- DeepSeek 可做表达和战斗意图候选，不能裁决命中、伤害、资源、NPC 生死、奖励、环境破坏或宿命结局。
- 天道/宿命只做 `pressure / constraint / risk`，不做玩家结局裁决。

## v4.0-v5.0 长期路线结论

- v4.0：Auto-Theater + HeavenWill/Fate 双预备，先设计、schema/envelope、report-only checker 和视觉语法。
- v4.1：Auto-Theater contract v1。
- v4.2：Auto-Theater Lite 凡阶映射，不迁移凡阶 runtime。
- v4.3：高阶战场语义实验室，覆盖空域、地面、地下、水域、洞天、阵法、领域、仙蛊屋和环境破坏。
- v4.4：杀招栈与 Combat Ledger 硬化。
- v4.5：HeavenWill / Fate / L5 宏观压力实验室。
- v4.6：高阶 lore / MiroFish intake 准入。
- v4.7：Auto-Theater runtime 准入包。
- v4.8：最小 Auto-Theater first cut 候选；只有另批 future gate 后才可能 runtime。
- v4.9：v5.0 前安全收束。
- v5.0：高阶世界第一刀；不是完整蛊仙、五域两天、原著关键人物 live agent 或全部蛊虫/杀招/仙蛊屋开放。

## v4.0-v12.0 终局路线结论

- 专家团判断有必要建立 v4.0 到终局版本总纲。
- 终局路线暂定为 `v4.0 -> v12.0 final-candidate`，不是锁死最终版本号；按当前野心，离真正终局至少还差 8 个左右大版本。
- v5：高阶世界第一刀。
- v6：多区域与多身份基础。
- v7：Agent Society 扩展。
- v8：经济、炼养用、宝黄天与资源生态。
- v9：高阶战斗与战争系统成熟。
- v10：原著时代锚点与关键人物安全接触。
- v11：任意时代/身份与内容工厂。
- v12：终局候选与世界级质量收束。

## 启动包边界

本轮只做文档、专家团意见、前置授权包和入口同步。

不授权：

- 高阶战斗 runtime / 凡阶战斗 runtime 迁移 / 自走棋 runtime / theater UI / Auto-Theater 素材生成 / 杀招栈 runtime / 仙蛊屋状态写入。
- HeavenWill/Fate runtime 裁决。
- L4/L5 runtime 或原著关键人物 agent。
- save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`。
- live DeepSeek、DeepSeek prompt/context/model/authority change、DeepSeek visible lore/RAG。
- MiroFish export/intake。
- backend/BFF/service。
- external framework PoC/dependency/read-only scan/patch artifact/subagents。
- formal location/faction/identity/reward/NPC life-death/warrant/recruitment/blockade。
- public/legal/EdgeOne/main auto-merge。

## 下一步

可在已批准的 D-400 前置授权包内进入 v4.0 开发；若触发 F-400 或例外停机清单必须停止自动推进并回到用户决策。
