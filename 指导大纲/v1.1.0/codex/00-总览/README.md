# RebornG v1.1.0 Codex 当前入口

日期：2026-05-20
状态：本地开发里程碑完成；D-025 小规模 live DeepSeek drift probe 已批准并执行，C27 后 clean re-probe 阻塞门通过；未自动部署
主题：`路线、地点与区域状态地基`

## 定位

`v1.1.0` 是 v1.x 阶段的第一块地基。

`v1.0.0` 已经完成“青茅到南疆早期连续体验”的候选验收，但它刻意没有新增正式 route/location/currentRegion 持久字段。`v1.1.0` 的任务是把这件事推到设计门禁和小范围正式化：

> 世界开始正式承认玩家在哪里、从哪里来、走在什么路线、面对什么区域压力。

## 已获用户批准

- v1.1 主线选择 A：正式路线/地点/区域承接地基。
- 允许专家团在设计门禁中严肃评估 `SAVE_FORMAT_VERSION = 23`。
- 先做 a0/a1/a2 与 process-2 文档、设计、门禁，再进入 runtime。
- 建立长线叙事漂移测试制度、全书知识库治理制度和知识库骨架。
- 建立历史索引，压缩旧版本阶段清单展示，并把过期入口自动检查脚本规划到 v1.6。
- v1.1 默认先做 deterministic / replay 漂移检查；live DeepSeek drift probe 的成本、模型、样本和轮次必须单独确认。
- D-019 至 D-024 已批准：b1 可 bump `SAVE_FORMAT_VERSION = 23`，采用单一 `routeLocationState` 聚合对象、保守迁移矩阵、最小 scope、b1 测试门和 a2 主题切片。
- D-025 已在 v1.1 完成后单独批准并执行：3 样本 x 4 轮，`deepseek-v4-flash`，手动 live，不进 CI；C27 后 clean-final 为 12/12 accepted，P0=0，P1=0，P2=1。
- a2、b1-b4、process-1/2 与 rc 已按最小范围收束：`SAVE_FORMAT_VERSION = 23`，新增唯一持久对象 `routeLocationState`，UI 只展示 route/location/region scope。
- `v1.1.0-rc-Player-Advocate-180轮走查记录.md` 已通过 `check:player-advocate-gate`。

## 尚未自动批准

以下事项仍必须停下来让用户决策：

- 超出 D-019/D-020/D-022 范围的 `SAVE_FORMAT_VERSION` 或持久字段变更。
- 超出 `routeLocationState` 最小 scope 的正式 route/location/currentRegion 写入。
- 正式进入南疆地点、商家城、阵营、奖励、NPC 生死。
- 扩大 DeepSeek 权限。
- 公开发布承诺、自动部署、后端/BFF。
- 扩大 live DeepSeek drift probe 的成本、模型、样本或轮次；D-025 只批准本次小规模手动 probe 和 C27 后 clean re-probe。
- 删除历史制度/文档，或废弃仍被当前门禁引用的流程入口；D-016/D-017 只批准索引和展示压缩。

## 当前权威文件

- `v1.1.0-总体开发大纲.md`
- `v1.1.0-启动审查与范围冻结.md`
- `v1.1.0-小版本执行路线图.md`
- `v1.1.0-需求决策池.md`
- `v1.1.0-真相源索引.md`
- `v1.1.0-测试矩阵.md`
- `v1.1.0-MiroFish资料需求与交付协议.md`
- `v1.1.0-Git提交与推送计划.md`
- `v1.1.0-专家团启动会纪要.md`
- `v1.1.0-a1-route-location-save-format设计门禁.md`
- `v1.1.0-a2-字段表迁移矩阵与主题切片门禁.md`
- `v1.1.0-process-2-长线叙事漂移与知识库门禁.md`
- `v1.1.0-rc-Player-Advocate-180轮走查记录.md`
- `v1.1.0-D025-live-drift-probe记录.md`

项目级制度：

- `指导大纲/流程制度/长线叙事漂移测试制度.md`
- `指导大纲/流程制度/全书知识库治理制度.md`

历史入口：

- `指导大纲/historical-index.md`

知识库入口：

- `指导大纲/知识库/README.md`
- `指导大纲/知识库/蛊真人/README.md`

长期参考：

- `指导大纲/长期路线/RebornG-v1.1至v2.0长期路线重整草案.md`
- `指导大纲/长期路线/RebornG-外部活世界参考映射.md`

MiroFish intake：

- `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-19-v110-three-pack-intake-review-summary.md`
- `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-20-全书基础包入库使用计划.md`

全书基础包：

- `指导大纲/vMiroFish/基础包/`

全书基础包已登记为档案层，只能按主题切片进入 intake review。它不是 runtime canon、DeepSeek visible context 或 v1.1 范围扩张依据。

## 推荐小版本

| 阶段 | 主题 | 是否 runtime | MiroFish need |
|---|---|---:|---|
| a0 | 长期路线重整与 v1.1 启动审查 | 否 | 已完成 |
| a1 | route/location/save-format 设计门禁 | 否 | 已完成；D-019 至 D-024 批准；D-025 后续单独批准并执行 |
| a2 | MiroFish intake、字段表、旧档迁移矩阵 | 否 | 已完成；三包/基础包只做主题切片和测试样本 |
| b1 | 正式路线状态第一刀 | 是 | 已完成；`SAVE_FORMAT_VERSION = 23` + `routeLocationState` |
| b2 | 区域状态与玩家可读位置面板 | 是 | 已完成；世界面板新增路线 tab |
| b3 | 前期账本 -> 路线/区域压力回流 | 是 | 已完成；从既有 v018/v100 账本派生，不写奖励/阵营/NPC 结果 |
| b4 | 南疆早期外缘行动承接 | 是 | 已完成；只写外缘投影，不开放完整南疆/商家城 |
| process-1 | 旧档迁移、回滚、生产预览专项 | 否或脚本 | 已完成；旧档迁移纳入 focused tests 与 production-preview |
| process-2 | 长线叙事漂移与知识库门禁 | 否；后续可接脚本 | 已完成；T0 deterministic soak 已跑；D-025 小规模 live probe 与 C27 后 clean re-probe 已执行并记录 |
| rc | v1.1 质量收束 | 是 | 已完成；180 轮 Player Advocate 通过 |

## 当前结论

`v1.1.0` 已完成为本地开发里程碑。

已实施：

- `SAVE_FORMAT_VERSION = 23`。
- 新增唯一持久对象 `routeLocationState`，含保守默认、v22 -> v23 迁移、normalization 和异常旧档阻断。
- 新增 `v110-route-location-state` 本地引擎、canon allowlist、store action、世界面板路线 tab、E2E harness 摘要。
- T0 deterministic soak、focused unit/store tests、v110 E2E、type check、copy/assets scans、full unit、build、full E2E、long E2E、production-preview smoke 和 Player Advocate 180 轮门禁通过。
- D-025 小规模 live probe 已执行并复测：原 final run 发现 adversarial hidden-fact 输入下的受保护隐藏名词 echo；已移除 runtime prompt 中隐藏事实硬编码，并新增 L4 `C27 隐藏因果名词保护`。C27 后 clean-final 为 12/12 accepted，P0=0、P1=0、P2=1，阻塞门通过。

仍未授权且未执行：

- 将本次 D-025 结果宣传为大规模长线 live narrative quality 已通过。
- 扩大 live DeepSeek drift probe 规模或加入 CI。
- 自动 EdgeOne 部署。
- 完整南疆、商家城核心、正式地点/阵营/奖励/NPC 生死。
- DeepSeek route/location/region 字段写入权。
- BFF/backend 或新的外部运行时依赖。
