# RebornG v0.15.0 Codex 当前入口

日期：2026-05-18
状态：`v0.15-b1` 完成，补给/喂养缺口行动样板已通过本地质量门和远端 CI
主题：`低阶蛊师经济、补给、炼养用深循环`

## 定位

`v0.15.0` 承接 `v0.14.0 青茅后续路线承接`。v0.14 让玩家能看见离开青茅后的路线、条件、阵营前置和社会影响；v0.15 要让这些路线不再只是“文本往前走”，而是开始受低阶蛊师经济、补给、蛊材、食料、残方、炼蛊失败代价和反刷规则约束。

v0.15 的关键不是开放完整市场，也不是快速堆蛊虫，而是建立低阶蛊师长期行动的资源压力：

`玩家目标 -> 资源缺口 -> 补给/喂养/炼蛊前置 -> 本地结算/失败代价 -> 反刷限制 -> 回流路线和社会影响`

## 当前权威文件

- `v0.15.0-总体开发大纲.md`
- `v0.15.0-启动审查与范围冻结草案.md`
- `v0.15.0-小版本执行路线图.md`
- `v0.15.0-需求决策池.md`
- `v0.15.0-真相源索引.md`
- `v0.15.0-MiroFish资料需求与交付协议.md`
- `v0.15.0-Git提交与推送计划.md`
- `v0.15.0-低阶经济炼养用规则总纲.md`
- `v0.15.0-a1-设计门禁.md`
- `v0.15.0-a1-设计门禁执行记录.md`
- `v0.15.0-a1-字段表.md`
- `v0.15.0-a1-测试矩阵.md`
- `v0.15.0-a2-候选规则池与schema第一刀.md`
- `v0.15.0-b1-补给喂养缺口行动样板.md`
- `v0.15.0-b1-Player-Advocate-20轮走查记录.md`
- `v0.15.0-art-audit-美术资源盘点.md`
- `v0.15-art-audit-1-美术资源治理专项.md`
- `doc/art/v1-hero-selection-manifest.json`

## 主线

v0.15 主线冻结为：

`低阶蛊师经济、补给、炼养用深循环：让长期行动有资源、维护、失败和反刷压力`

重点交付：

- 低阶经济/炼养用设计门禁。
- 资源、蛊材、食料、残方、炼蛊失败代价字段表。
- 候选资源/补给/市场规则池。
- 补给准备或喂养缺口的正式行动样板。
- 炼蛊/残方/失败代价可读闭环。
- 商队/市场窗口候选，不开放完整坊市。
- 反刷、灰色交易和委托边界测试。
- v0.15 rc 质量收束和 Player Advocate 走查。

## 非目标

除非用户另行批准，v0.15 不做：

- 完整南疆市场、完整坊市或完整商家城系统。
- 正式黑市、委托代售、稳定套利或完整商品价格表。
- 任意蛊虫、蛊方、材料、元石奖励的自由发放。
- 稳定白玉蛊材料来源，除非经过专项决策。
- 二转/三转完整成长曲线一次性做完。
- 蛊仙、仙蛊、仙材、宝黄天交易、福地或高阶资源。
- 新增持久字段或提升 `SAVE_FORMAT_VERSION`，除非经过用户决策、迁移、默认值和测试。
- DeepSeek 获得奖励、材料、蛊虫、蛊方、地点、阵营、NPC 生死或正史结果写入权。
- BFF/backend、EdgeOne 自动部署、branch protection。

## Player Advocate 轮次

v0.15 涉及经济、奖励、材料和玩家长期理解，轮次按高风险处理：

- 纯文档/CI/Git/internal 阶段可豁免，但必须写明。
- 只读预览或纯设计阶段：可豁免或 10 轮。
- 涉及补给、材料、食料、炼蛊、市场、反刷、旧档或玩家可见行动的小版本：20 轮。
- v0.15 rc：60 轮。

## MiroFish 状态

v0.15 三个 request 已交付并通过 intake review：

1. `v015_low_rank_economy_refinement_feeding_pack_export_ready.json`：blocking 包，通过，进入 a1/a2 候选池。
2. `v015_southern_border_market_caravan_trade_pack_export_ready.json`：preferred 包，通过，进入 b1/b2 候选规则。
3. `v015_low_rank_black_market_commission_boundary_pack_export_ready.json`：optional/later 包，通过，但默认延期到 b2 后或 v0.16+，不作为第一刀 runtime 范围。

当前不需要新 MiroFish 补包。若后续要正式开放坊市、路引、黑市、委托代售、完整商家城交易或明确价格表，必须另提窄 request。

## 下一步

当前已完成：

- 用户批准进入 v0.15 文档启动。
- v0.15 MiroFish request 与 intake review 已提交并推送：`42c6841 docs: 验收v0.15 MiroFish交付包`。
- v0.15 文档启动包已建立并推送：`619c5f1 docs: 建立v0.15低阶经济炼养用大纲`。
- `v0.15.0-a1` 设计门禁已通过；可进入 a2 候选规则池第一刀。
- `v0.15.0-a2` 候选规则池与 schema 第一刀已完成：24 条当前候选规则、10 条灰色交易延期边界、只读 helper、focused tests、TypeScript、full unit 和 build 通过。
- 项目美术资源盘点第二版已完成：全项目 445 个媒体文件，334 个图片/视觉文件，110 个音频文件，1 个视频文件；`doc/art/` 66 张图已纳入统计。
- `v0.15-art-audit-1` 第一刀已完成：用户批准的 3 张战斗候选已复制到 `public/rebrng/scenes/s0-qingmao/` 稳定路径；`public/rebrng/scenes/s0-qingmao/` 现有三张 PNG 纳入 `review-only` 治理；9 张青茅场景 SVG 补登记为 `candidate`；v1.0 hero 三件套已复制到 `public/rebrng/release/v1-hero/`，但尚未绑定 UI/EdgeOne/OG meta。
- `v0.15.0-b1` 补给/喂养缺口行动样板已完成并推送：新增 `qingmao_supply_feeding_preparation_probe`，将离山补给、落脚遮掩、酒虫食料压力写入既有 `livingWorldState` 和本地行动账本；不发材料、不扣元石、不开放市场、不判定离山成功、不新增存档字段、不扩张 DeepSeek 权限；commit `8ec823c`，GitHub Actions run `26019950577` 通过。

下一步建议：

- 进入 `v0.15.0-b2`，先做炼蛊/残方/失败代价第一刀。
- 若需要正式材料、元石、库存消耗、新存档字段、市场交易或 DeepSeek 新权限，必须停下来让用户决策。
