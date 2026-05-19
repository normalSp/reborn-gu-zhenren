# 2026-05-19 v1.0.0 启动审查交接

## 当前状态

- `v0.19.0` 已完成并通过远端 CI。
- `v1.0.0` 启动审查与范围冻结草案已建立。
- 当前 v1.0 定位草案：`活世界早期正式版`。
- 当前不改 runtime，不新增 save field，不扩大 DeepSeek 权限。

## 新增文档

- `指导大纲/v1.0.0/codex/00-总览/README.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-总体开发大纲.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-启动审查与范围冻结.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-小版本执行路线图.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-需求决策池.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-测试矩阵.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-真相源索引.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-Git提交与推送计划.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-专家团启动会纪要.md`

## MiroFish 请求

请求文件位于 `指导大纲/vMiroFish/requests/v1.0.0/`：

1. `2026-05-19-v100-qingmao-southern-border-continuity-pack.md`
2. `2026-05-19-v100-low-rank-life-loop-release-boundary-pack.md`
3. `2026-05-19-v100-public-release-copy-art-boundary-pack.md`

当前 Codex 线程不能直接联系 MiroFish；用户需要转交给线程 `019e207b-c55d-7e23-b450-efa7a054a165`。

## 用户待决策

见 `指导大纲/v1.0.0/codex/00-总览/v1.0.0-需求决策池.md`：

- D-001 至 D-010。
- 最关键：v1.0 定位、主线、BFF/backend 暂缓、route/location 字段设计门禁、MiroFish 三包、rc 150 轮 Player Advocate。

## 硬停边界

必须停下来让用户决策：

- `SAVE_FORMAT_VERSION = 23`。
- route/location/currentRegion 持久字段。
- 正式地点、阵营、奖励、NPC 生死/抓捕。
- DeepSeek 权限扩大。
- BFF/backend 实施。
- live DeepSeek probe 执行。
- 自动部署或公开发布承诺。
- 大规模新图生成。

## 验证

本次为 docs/governance-only 启动包，不改 runtime。

建议检查：

- 文件存在性。
- v1.0 文档互相引用一致。
- MiroFish request 路径存在。
- 仪表盘、PROJECT-STATE、AGENTS 已同步。

## Git 状态

启动包提交：

- Commit：`515d0c2 docs: 建立v1.0启动审查与范围冻结`
- Push：已推送到 `codex/v013-npc-faction-reaction`
- GitHub Actions：`26088300312` 通过 deterministic quality gate

本次只 stage 了 v1.0 文档、v1.0 MiroFish request、仪表盘、PROJECT-STATE、AGENTS 和本 handoff。历史 dirty art/bgm/zip/大方向文件未纳入提交。
