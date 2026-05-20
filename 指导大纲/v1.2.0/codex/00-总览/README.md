# RebornG v1.2.0 Codex 当前入口

状态：v1.2.0 本地开发完成；D-120 至 D-134 均已落地
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
- `v1.2.0-b2-最小survivalEconomyState-ledger.md`
- `v1.2.0-b2-BGM-runtime晋升专项.md`
- `v1.2.0-b2-Player-Advocate-20轮走查记录.md`
- `v1.2.0-b2-长线叙事漂移检查记录.md`
- `v1.2.0-b3-炼养用准备与失败代价第一刀.md`
- `v1.2.0-b4-交易窗口边界第一刀.md`
- `v1.2.0-process-1-经济反刷save兼容与回滚复核.md`
- `v1.2.0-process-2-长线漂移与知识库复核.md`
- `v1.2.0-rc-质量收束记录.md`
- `v1.2.0-rc-Player-Advocate-80轮走查记录.md`
- `v1.2.0-真相源索引.md`
- `v1.2.0-测试矩阵.md`
- `v1.2.0-MiroFish资料需求与交付协议.md`
- `v1.2.0-Git提交与推送计划.md`

## 当前已获批准

用户批准 D-120-001 至 D-120-010，允许 v1.2 按“低阶蛊师生存与经济正式化第一阶段”进入 a1 设计门禁。

用户随后批准 D-121-001 至 D-121-007，允许 b1 采用 projection-only runtime，并确认 b1 不 bump save format、不加持久经济字段、不做真实消耗、不开放正式库存/价格/交易、不执行 live probe。

用户在 b2 前已追加批准：

1. `SAVE_FORMAT_VERSION = 24`。
2. 单一聚合对象 `survivalEconomyState`。
3. 最小 pressure ledger。
4. 根目录 BGM 音频正式 runtime 晋升复核。
5. 每次进入新小版本/专项先切语义分支，并写入 Git 推送制度。

用户随后一次性批准 D-123 至 D-134，用于完成 v1.2 剩余收束：

1. b3 做炼养用准备、缺口、风险和维护周期可读性，不结算成功/失败。
2. b4 做询价、担保、身份风险、拒绝理由和候选窗口，不成交、不写价格表。
3. process-1 做经济反刷、旧档兼容、save 回滚和测试矩阵复核。
4. process-2 做 deterministic drift soak；live probe 不默认执行。
5. rc 使用 80 轮 Player Advocate。
6. v1.2 完成口径是“低阶生存经济第一阶段”，不是完整经济系统。

当前仍未批准：

1. 正式库存、正式货币、正式价格表、正式商店库存或交易结算。
2. 食料真实消耗、维护周期、炼蛊成功/失败和失败代价结算。
3. 黑市、委托、稳定套利、完整商队经济或商家城市场。
4. DeepSeek 经济、奖励、材料、蛊虫、配方、地点、阵营、NPC 生死或正式结算权限。
5. v1.2 live DeepSeek drift probe 的成本、轮次、样本和模型。
6. EdgeOne 自动部署或对外发布口径。

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

## 当前完成状态

当前已完成：

- `v1.2.0-a1-低阶生存经济save-format设计门禁.md`
- `v1.2.0-a2-主题切片知识库与测试矩阵门禁.md`
- `v1.2.0-b1-低阶生存经济projection-only第一刀.md`

当前 b1 已通过 focused unit、type check、focused E2E、20 轮 Player Advocate、T0-lite 长线叙事漂移检查、build、player-visible-copy 与相关经济回归。

当前 b2 已完成本地实现与验证：`SAVE_FORMAT_VERSION = 24`、`survivalEconomyState` 最小 pressure ledger、BGM runtime manifest 门禁和 Git 分支制度已落地；focused e2e、Player Advocate gate、build、资产扫描、完整回归、长测和 production-preview smoke 均已通过。

当前 v1.2 收束已按 D-123 至 D-134 完成：复用 v0.15 已验证的本地 action protocol，把 b3/b4 提升到 survival economy 面板与 v24 ledger 来源链中；仍不新增存档字段、不开放正式经济结算、不扩大 DeepSeek 权限。

最终本地验证来自 2026-05-20：

- `npm test`：143 files，784 tests 通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run build`：通过；仅 Rolldown plugin timings warning。
- `npm run check:runtime-assets`、`npm run check:qingmao-assets`、`npm run check:player-visible-copy`：通过。
- `npm run test:e2e`：63 tests 通过。
- `npm run test:e2e:long`：7 tests 通过。
- `npm run check:production-preview`：通过；仍显示已批准的 v1.0 public release label。

v1.3 专家团启动会前，真实消耗、炼蛊成功/失败、正式库存/价格/交易和任何 live probe 仍需另行决策。
