# 2026-05-19 v0.19.0 startup review context

## 状态

`v0.19.0 内容生产、长测与 v1.0 发布工具` 启动审查与范围冻结草案已建立，等待用户批准决策项。

## 文档

- `指导大纲/v0.19.0/codex/00-总览/README.md`
- `v0.19.0-总体开发大纲.md`
- `v0.19.0-启动审查与范围冻结.md`
- `v0.19.0-小版本执行路线图.md`
- `v0.19.0-需求决策池.md`
- `v0.19.0-真相源索引.md`
- `v0.19.0-测试矩阵.md`
- `v0.19.0-MiroFish资料需求与交付协议.md`
- `v0.19.0-Git提交与推送计划.md`

## MiroFish requests

- `v019_public_canon_boundary_pack`
- `v019_representative_playthrough_anchor_pack`
- `v019_release_art_caption_boundary_pack`

这些是 preferred，不阻塞 a1 文档/schema，但建议 b2/b3/b4 前完成 intake。

## 用户待决策

需要用户审阅并批准 `v0.19.0-需求决策池.md` 中 D-001 至 D-008：

- v0.19 主线是否确认为“内容生产、长测与 v1.0 发布工具”。
- a1/a2 是否先做文档/门禁，不动 runtime。
- 是否现在转交 3 个 MiroFish preferred request。
- 是否保持 `SAVE_FORMAT_VERSION = 22`。
- 后段 live DeepSeek narrative probe 是否仅作为 optional，并执行前再确认样本。
- b4 是否只整理 release art pack，不做大规模新图生成。
- EdgeOne 是否只做 preview/rollback checklist，不自动部署。
- 是否暂不做 BFF/backend，只做风险评估。

## 必须停手

新增 save field、正式 route/location/faction/reward/NPC-life、DeepSeek 权限扩大、BFF/backend 实现、自动部署、公开发布承诺、新图批量生成，都必须停下来让用户决策。

## 同步状态

- `AGENTS.md` 已加入 v0.19 启动审查草案、MiroFish request 和硬停边界。
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` 已同步 v0.19 active draft。
- `指导大纲/项目仪表盘.md` 已同步 v0.19 待决策状态。
- 全局 `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md` 受当前 workspace-write 沙箱限制，本轮未直接写入；仓库镜像和项目状态已更新。
