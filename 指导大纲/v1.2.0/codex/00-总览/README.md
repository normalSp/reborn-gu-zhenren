# RebornG v1.2.0 Codex 当前入口

状态：D-120 与 D-121 已批准；a1/a2 已过门；b1 projection-only 第一刀已完成本地实现
日期：2026-05-20
主题：低阶蛊师生存与经济正式化第一阶段

## 当前一句话

`v1.2.0` 承接 `v1.1.0` 的路线、地点与区域状态地基，把 `v0.15.0` 中已经验证过的低阶经济、补给、喂养、炼养用和市场窗口候选压力，升级为更稳定的低阶生存循环；它不是完整库存、完整市场、价格表、黑市、委托套利或商家城开放版本。

## 当前入口文件

- `v1.2.0-专家团启动会纪要.md`
- `v1.2.0-启动审查与范围冻结.md`
- `v1.2.0-总体开发大纲.md`
- `v1.2.0-小版本执行路线图.md`
- `v1.2.0-需求决策池.md`
- `v1.2.0-a1-低阶生存经济save-format设计门禁.md`
- `v1.2.0-a2-主题切片知识库与测试矩阵门禁.md`
- `v1.2.0-b1-低阶生存经济projection-only第一刀.md`
- `v1.2.0-b1-Player-Advocate-20轮走查记录.md`
- `v1.2.0-b1-长线叙事漂移检查记录.md`
- `v1.2.0-真相源索引.md`
- `v1.2.0-测试矩阵.md`
- `v1.2.0-MiroFish资料需求与交付协议.md`
- `v1.2.0-Git提交与推送计划.md`

## 当前已获批准

用户批准 D-120-001 至 D-120-010，允许 v1.2 按“低阶蛊师生存与经济正式化第一阶段”进入 a1 设计门禁。

用户随后批准 D-121-001 至 D-121-007，允许 b1 采用 projection-only runtime，并确认 b1 不 bump save format、不加持久经济字段、不做真实消耗、不开放正式库存/价格/交易、不执行 live probe。

当前尚未批准：

1. 新增或修改持久经济字段。
2. 将 `SAVE_FORMAT_VERSION` 从 `23` 提升到 `24`。
3. 新增 `survivalEconomyState`。
4. 正式库存、正式货币、正式价格表、正式商店库存或交易结算。
5. 食料真实消耗、维护周期、炼蛊成功/失败和失败代价结算。
6. 黑市、委托、稳定套利、完整商队经济或商家城市场。
7. DeepSeek 经济、奖励、材料、蛊虫、配方、地点、阵营、NPC 生死或正式结算权限。
8. v1.2 live DeepSeek drift probe 的成本、轮次、样本和模型。
9. EdgeOne 自动部署或对外发布口径。

## 专家团初步结论

v1.2 可以开，但必须先做 a0/a1/a2 三个设计与治理门：

1. `a0`：启动审查、范围冻结、历史经济边界复核。
2. `a1`：低阶生存经济 authority/save-format 设计门禁，严肃评估是否需要 `SAVE_FORMAT_VERSION = 24`。
3. `a2`：MiroFish 主题切片、知识库使用边界、测试矩阵与反刷样本冻结。

a1/a2 已过门，b1 已按保守路线完成第一刀：先做可解释的补给/喂养/维护压力投影，不开放真实库存扣减、买卖、价格表或市场。

## 硬边界

- 本地 canon/engine/store 拥有数值、奖励、库存、消耗、交易、地点、路线、阵营、战斗、命运和结局事实。
- DeepSeek 只能写 narrative、候选、线索、传闻、请求和压力，不得写正式经济结算。
- MiroFish 和全书基础包只作为候选材料、source pointer、测试样本和知识库后勤，不得直接进入 runtime/canon/DeepSeek visible context。
- 凡涉及新增持久字段，必须在同一变更中包含 save format bump、migration、defaults 和测试。
- 凡涉及正式库存、价格、交易、委托、黑市、稳定收益、蛊材消耗、蛊虫维护或炼蛊结果，必须先由用户拍板。

## 当前下一步

当前已完成：

- `v1.2.0-a1-低阶生存经济save-format设计门禁.md`
- `v1.2.0-a2-主题切片知识库与测试矩阵门禁.md`
- `v1.2.0-b1-低阶生存经济projection-only第一刀.md`

当前 b1 已通过 focused unit、type check、focused E2E、20 轮 Player Advocate、T0-lite 长线叙事漂移检查、build、player-visible-copy 与相关经济回归。若要进入 b2 最小 ledger 或只读资源视图，仍需重新确认是否实际 bump `SAVE_FORMAT_VERSION = 24` 与是否新增 `survivalEconomyState`。
