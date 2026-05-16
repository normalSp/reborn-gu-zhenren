# 2026-05-15 v0.11.0-b1 原著事实卡试点上下文交接

## 阶段

`v0.11.0-b1` 第一刀已完成。

本刀只做静态事实卡模板和首批小样本，不接运行时裁决、不写存档、不做完整青茅主线。

## 新增文件

- `src/canon/qingmao-canon-fact-cards.json`
- `src/canon/qingmao-canon-fact-cards.test.ts`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b1-原著事实抽取试点.md`

## 首批事实卡

共 8 张：

- `qingmao_location_guyue_village`
- `guyue_aperture_ceremony_and_clan_school`
- `guyue_spirit_spring_resource_basis`
- `qingmao_three_clans_layout`
- `baijia_bai_ning_bing_public_talent`
- `guyue_moonlight_gu_local_specialty`
- `liquor_worm_rare_support_role`
- `fang_yuan_private_causality_hidden_anchor`

## 关键边界

- 事实卡只保存摘要、来源指针、关键词和设计边界。
- 不复制原著正文，不保存长段引文。
- 隐藏事实必须 `runtimeExposure = hidden_ref_only`。
- 隐藏事实不能有 `playerVisibleSummary`。
- 事实卡不是任务、奖励、地点、NPC 生死或正史锚点改写。

## 验证

已通过：

```powershell
npm test -- src/canon/qingmao-canon-fact-cards.test.ts
npx tsc --noEmit --pretty false
npm test
```

全量单测结果：102 个 test file、607 个测试通过。

测试覆盖：

- `copyrightPolicy = summary_and_locator_only`。
- 每张卡有 source pointer。
- 不允许 `originalText`、`excerpt`、`quote` 字段。
- source locator 格式为 `L数字` 或 `L数字-L数字`。
- 隐藏事实只作为 ref，不进入玩家可见摘要。

## 已同步

- v0.11 README
- 小版本路线图
- 真相源索引
- 需求决策池
- PROJECT-STATE
- AGENTS.md
- `reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore` skills

## 下一步

建议进入 `v0.11.0-b1-2`：

1. 建立事实卡读取 helper。
2. 让 World Intent Engine 可引用事实卡 ID 作为 visible/hidden fact refs。
3. 测试“可见事实可进入解释，隐藏事实只进入保护引用”。
4. 继续不新增存档字段。
