# 2026-05-20 v1.2.0 startup context

状态：D-120 与 D-121 已批准；v1.2 a1/a2 门禁已过；b1 projection-only 第一刀已完成本地实现。

## 本轮完成

- 新建 `指导大纲/v1.2.0/codex/00-总览/` 启动包。
- 新增 v1.2 专家团启动会、启动审查、总体大纲、路线图、需求池、真相源、测试矩阵、MiroFish 协议和 Git 计划。
- 同步 `指导大纲/项目仪表盘.md`、`指导大纲/historical-index.md`、`AGENTS.md`、`PROJECT-STATE.md`。
- 同步 skill：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。
- 用户随后批准 D-120-001 至 D-120-010，进入 `v1.2.0-a1-低阶生存经济save-format设计门禁.md`。
- 已起草 a1 门禁，展开 `SAVE_FORMAT_VERSION = 24`、持久经济字段、第一刀 runtime、真实消耗/交易/价格/库存、Player Advocate 强度和 live probe 的收益、风险、未来影响、游戏性与原著味平衡。

## 当前口径

`v1.2.0` 当前 active draft 是 `低阶蛊师生存与经济正式化第一阶段`。

当前已批准 D-120 系列、D-121 系列和 b1 projection-only runtime。

D-121 批准结果：

- D-121-001：b1 不 bump；`SAVE_FORMAT_VERSION = 24` 只作为 b2 可再批路线。
- D-121-002：若新增持久经济字段，只允许单一 `survivalEconomyState`；b1 不新增。
- D-121-003：b1 第一刀 runtime 为 projection-only。
- D-121-004：b1 禁止真实消耗、维护周期、炼蛊失败代价。
- D-121-005：v1.2 默认禁止正式交易、价格、库存、买卖。
- D-121-006：runtime 小版本 Player Advocate 20 轮；rc 60/80 分级。
- D-121-007：live DeepSeek drift probe 当前不执行，b1/b2 稳定后另批。

## 必须停手让用户决策

- 新增或修改持久经济字段。
- `SAVE_FORMAT_VERSION = 24`。
- 正式库存、货币、价格表、商店库存、买卖结算。
- 食料消耗、维护周期、炼蛊失败代价的真实结算。
- 黑市、委托、代售、稳定套利。
- 商家城、完整南疆市场、宝黄天、高阶蛊材、仙蛊。
- DeepSeek 经济/奖励/材料/蛊虫/蛊方/价格/交易/地点/阵营/NPC 生死权限。
- v1.2 live DeepSeek drift probe 成本、模型、样本和轮次。
- EdgeOne 自动部署或对外发布口径。

## 继承门禁

- 继承 v0.15 低阶经济、补给、喂养、炼养用、商队窗口和灰色交易边界。
- 继承 v1.1 `routeLocationState` 和 `SAVE_FORMAT_VERSION = 23` 事实。
- 继承 v1.1 D-025 hidden-name echo、DeepSeek 越权和术语边界样本。
- 使用全书基础包时，只能按主题切片 intake，不能整包吸收。

## 后续更新

后续 b1 详情见 `codex上下文信息/2026-05-20-v120-b1-context.md`。该记录确认：b1 只做低阶生存经济压力投影，不 bump `SAVE_FORMAT_VERSION = 24`，不新增 `survivalEconomyState`，不开放正式消耗、价格、库存或交易，并已通过 focused unit、type check、focused e2e、20 轮 Player Advocate、T0-lite 长线叙事漂移检查、build 和 player-visible-copy。

## Git 状态

本轮未提交、未推送、未部署。若后续提交，按 `v1.2.0-Git提交与推送计划.md` 显式 stage 路径，不使用 `git add -A`。
