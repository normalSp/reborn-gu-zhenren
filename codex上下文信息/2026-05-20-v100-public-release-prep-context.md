# 2026-05-20 v1.0 public release prep context

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 上一提交：`a56e972 fix: 收束v1.1前置bug与启动文档`
- 本轮目标：开始 v1.0 public release prep，但不自动部署、不发布公告、不形成公开承诺。

## 本轮新增/更新

- 新增 `指导大纲/v1.0.0/codex/00-总览/v1.0.0-public-release-prep-启动检查.md`
- 新增 `指导大纲/v1.0.0/codex/00-总览/v1.0.0-public-release-prep-用户审批清单.md`
- 更新 `指导大纲/v1.0.0/codex/00-总览/README.md`
- 更新 `指导大纲/项目仪表盘.md`
- 更新 `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- 更新 `AGENTS.md`

## 轻量公开候选门

已通过：

- `npm run check:production-preview`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run check:v019-content-governance`

production preview 结果：

- 本地 URL：`http://127.0.0.1:4182/?e2e=1`
- Console：仅有 `[Achievement] 已加载 35 个成就定义`
- 发现：首屏仍显示 `蛊真人世界 · 人生重来模拟器 · v0.9.0`

## 必须停手让用户决策

发布前必须让用户审批：

1. 是否把 `package.json`、标题页和游戏页显示统一成 `v1.0.0`。
2. 公告标题和正文。
3. hero 三件套是否正式使用以及是否绑定 title/landing/OG。
4. 截图/短录屏素材方向。
5. EdgeOne 是否执行手动公开预览或正式发布。
6. 本轮公开称为 `v1.0 公开候选` 还是 `v1.0 正式发布`。

## 下一步

如果用户批准版本标识改为 `v1.0.0` 或 hero 绑定，需要做一个小补丁并重跑完整发布验证：

- `npx tsc --noEmit --pretty false`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run check:v019-content-governance`
- `npm run test:e2e`
- `npm run test:e2e:long`
- `npm run check:production-preview`

仍不得自动部署 EdgeOne、扩大 DeepSeek 权限、添加存档字段、正式开放 route/location/faction/reward/NPC-life、引入 BFF/backend 或公开承诺。
