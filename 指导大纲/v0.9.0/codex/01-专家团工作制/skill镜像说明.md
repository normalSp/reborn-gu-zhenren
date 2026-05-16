# Skill 镜像说明

## 全局 skill

主文件位于：

`C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`

它是 Codex 自动触发的工作入口。

## 仓库镜像

仓库内保留本说明和专家团工作制文档，作为版本化依据。若全局 skill 更新了项目规则，必须同步检查本目录；若本目录更新了流程，必须同步检查全局 skill。

## 必须协同的核心 skill

- `game-dev-text`
- `reverend-insanity-lore`
- `reborn-combat-motion`

每次版本完成后都要判断这三个 skill 是否需要更新。若发现乱码、过期版本事实或职责缺口，先修 skill，再进入下一轮开发。

## 当前同步状态

更新时间：2026-05-13

- `reborn-expert-council`：v0.1.24
- `game-dev-text`：v2.3.23
- `reverend-insanity-lore`：v0.3.22
- `reborn-combat-motion`：v0.2.20

同步事实：v0.9.0 已正式收口；DeepSeek 运行时默认模型已切换为 `deepseek-v4-flash`，且用户已明确决定不再评估其他模型。v0.10.0 主线为 `青茅山三寨区域主线可玩化`；当前已完成 `v0.10.0-b2` 收束验收，低阶凡蛊/战斗内容包仍为 candidate-review，ready 模板可登记为现有 `combatEventCandidates`，NarrativeCombatPanel 会显示入口校验、rewardPolicy 和不可直接掉落边界，候选进入现有 `skirmish_5x3` battlefield route，战后回流不会激活 `beastLoot`、材料掉落或奖励池。b3 资源、炼蛊、喂养启动审查已起草，D-008 至 D-012 等待用户审。
