# RebornG v1.4.0 Codex 当前入口

状态：a1 save-format / authority 设计门禁已建立；等待用户审批 D-141 系列后进入 a2
日期：2026-05-21
主题：南疆早期低阶区域样板

## 当前一句话

`v1.4.0` 建议把 v1.1 路线/地点、v1.2 低阶生存经济、v1.3 社会压力投影揉成第一个“南疆早期低阶区域样板”。本阶段不是完整南疆、不是完整商家城、不是正式阵营/奖励/NPC 生死系统；第一步仍是范围冻结、资料门禁、save-format/authority 设计和测试矩阵。

## 当前入口文件

- `v1.4.0-专家团启动会纪要.md`
- `v1.4.0-启动审查与范围冻结.md`
- `v1.4.0-总体开发大纲.md`
- `v1.4.0-小版本执行路线图.md`
- `v1.4.0-需求决策池.md`
- `v1.4.0-a0-治理补丁与范围冻结.md`
- `v1.4.0-a1-南疆低阶区域样板save-format设计门禁.md`
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
- 列出 D-141-001 至 D-141-008 待用户批准项。
- 执行本阶段 Skill sync audit。

## 硬边界

- 不默认 bump `SAVE_FORMAT_VERSION = 25`。
- 不默认新增 `regionSampleState`、`currentRegion`、`route_entered` 或正式区域持久字段。
- 不开放完整南疆、完整商家城、完整商队系统或全地图。
- 不开放正式地点解锁、阵营转移、任务奖励、NPC 生死、捕获、背叛。
- 不扩大 DeepSeek 权限。
- 不自动部署 EdgeOne。
- 不整包导入全书 MiroFish 基础包。

## 下一步

等待用户审批 D-141-001 至 D-141-008。若获批，进入：

`v1.4.0-a2-MiroFish-南疆低阶区域样板topic-slice-intake.md`
