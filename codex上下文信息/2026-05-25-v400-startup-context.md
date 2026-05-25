# 2026-05-25 v4.0 startup context

分支：`codex/v400-startup-high-world-prep`。
版本：`v4.0.0`。
主题：`高阶战斗 theater 与 HeavenWill/Fate 宏观压力双预备`。

## 当前结论

用户要求开 v4.0 专家团启动会。本轮已建立 `指导大纲/v4.0.0/codex/00-总览/` 启动包。

startup commit `fc8e5132` 已推送，GitHub Actions run `26402655412` passed。

`D-400-001` 至 `D-400-012` 仍为 `pending_user_decision`。`F-400-001` 至 `F-400-012` 建议全部保持 `future_gate_required`。

## 启动包边界

本轮只做文档、专家团意见、前置授权包和入口同步。

不授权：

- 高阶战斗 runtime / theater UI / 杀招栈 runtime / 仙蛊屋状态写入。
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

1. `D-400-001` 至 `D-400-012` 是否批准。
2. `F-400-001` 至 `F-400-012` 是否全部继续 `future_gate_required`。

批准后可进入 v4.0 开发；若触发例外停机清单必须停止自动推进。
