# 2026-05-25 v4.0 startup context

分支：`codex/v400-startup-high-world-prep`。
版本：`v4.0.0`。
主题：`Auto-Theater Combat 与 HeavenWill/Fate Pressure 高阶世界表达模型`。

## 当前结论

用户要求开 v4.0 专家团启动会，并随后完成一轮 v4.0 总体设计讨论。本轮已建立 `指导大纲/v4.0.0/codex/00-总览/` 启动包，并新增 `v4.0.0-总体设计讨论纪要.md` 与 `v4.0.0-Auto-Theater-Combat美术与交互总纲.md`。

startup commit `fc8e5132` 已推送，GitHub Actions run `26402655412` passed。

`D-400-001` 至 `D-400-012` 仍为 `pending_user_decision`，但已按 Auto-Theater Combat / Auto-Theater Lite / Combat Ledger 口径修订。`F-400-001` 至 `F-400-012` 建议全部保持 `future_gate_required`。

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

请用户审批：

1. 修订后的 `D-400-001` 至 `D-400-012` 是否批准。
2. `F-400-001` 至 `F-400-012` 是否全部继续 `future_gate_required`。

批准后可进入 v4.0 开发；若触发例外停机清单必须停止自动推进。
