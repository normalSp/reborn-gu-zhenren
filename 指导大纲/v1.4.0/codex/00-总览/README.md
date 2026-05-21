# RebornG v1.4.0 Codex 当前入口

状态：v1.4.0 本地开发里程碑已完成
日期：2026-05-21
主题：南疆早期低阶区域样板

## 当前一句话

`v1.4.0` 已把 v1.1 路线/地点、v1.2 低阶生存经济、v1.3 社会压力投影揉成第一个“南疆早期低阶区域样板”。本阶段不是完整南疆、不是完整商家城、不是正式阵营/奖励/NPC 生死系统；落地形式是 projection-first 区域样板。

## 当前入口文件

- `v1.4.0-专家团启动会纪要.md`
- `v1.4.0-启动审查与范围冻结.md`
- `v1.4.0-总体开发大纲.md`
- `v1.4.0-小版本执行路线图.md`
- `v1.4.0-需求决策池.md`
- `v1.4.0-a0-治理补丁与范围冻结.md`
- `v1.4.0-a1-南疆低阶区域样板save-format设计门禁.md`
- `v1.4.0-a2-MiroFish-南疆低阶区域样板topic-slice-intake.md`
- `v1.4.0-b1-低阶区域projection-first第一刀.md`
- `v1.4.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.4.0-b1-长线叙事漂移检查记录.md`
- `v1.4.0-b2-route-survival组合可读性.md`
- `v1.4.0-b3-商队散修城外缘接触窗口.md`
- `v1.4.0-b4-区域事件模板与风险前置条件.md`
- `v1.4.0-process-1-区域反刷save兼容与回滚复核.md`
- `v1.4.0-process-2-长线漂移与知识库复核.md`
- `v1.4.0-rc-Player-Advocate-100轮走查记录.md`
- `v1.4.0-rc-live-probe复核记录.md`
- `v1.4.0-rc-Skill同步审计记录.md`
- `v1.4.0-rc-质量收束记录.md`
- `v1.4.0-真相源索引.md`
- `v1.4.0-测试矩阵.md`
- `v1.4.0-MiroFish资料需求与交付协议.md`
- `v1.4.0-Git提交与推送计划.md`

## 当前已完成

- 确认 v1.3.0 已完成为本地开发里程碑。
- 修正项目仪表盘中 v1.3 Git 状态口径。
- 建立 v1.4 a0 启动治理包。
- 用户已批准 D-140-001 至 D-140-010。
- 建立 a1 save-format / authority 设计门禁。
- 专家团建议 b1 保持 `SAVE_FORMAT_VERSION = 24`，不新增区域持久字段，先做 projection-first。
- 用户已批准 D-141-001 至 D-141-008。
- a2 MiroFish topic-slice intake 完成：复用 v0.18 reviewed packs，全文基础包仍为 archive/source-pointer。
- b1-b4 runtime 完成：新增 `V140RegionSampleProjection` 和世界面板 `区域` tab。
- b1 30 轮 Player Advocate gate 通过。
- rc 100 轮 Player Advocate gate 通过。
- process-1/process-2 与 Skill sync audit 完成。
- live probe 复核后不执行：本轮无 DeepSeek prompt/context/authority 变化。

## 硬边界

- 不默认 bump `SAVE_FORMAT_VERSION = 25`。
- 不默认新增 `regionSampleState`、`currentRegion`、`route_entered` 或正式区域持久字段。
- 不开放完整南疆、完整商家城、完整商队系统或全地图。
- 不开放正式地点解锁、阵营转移、任务奖励、NPC 生死、捕获、背叛。
- 不扩大 DeepSeek 权限。
- 不自动部署 EdgeOne。
- 不整包导入全书 MiroFish 基础包。

## 下一步

下一步建议开启 v1.5 专家团启动会：`冲突、追杀、杀招与小队后果深化`。进入 v1.5 前仍需先做 a0/a1/a2 门禁，不得默认开放正式地点、阵营、奖励、NPC 生死或 DeepSeek 新 authority。
