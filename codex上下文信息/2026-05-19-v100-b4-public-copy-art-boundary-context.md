# 2026-05-19 v1.0.0-b4 公开素材与文案边界上下文交接

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v1.0.0-b4 公开素材与文案边界`
- 状态：本地 preflight 已通过，待 commit/push/CI
- MiroFish：v1.0 三包已通过 intake；本阶段不需要新包
- 存档版本：`SAVE_FORMAT_VERSION = 22`，未变更
- DeepSeek：`deepseek-v4-flash`，未扩权

## 主要落地

新增：

- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-b4-公开素材与文案边界.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-b4-Player-Advocate-20轮走查记录.md`

修改：

- `指导大纲/v1.0.0/codex/00-总览/README.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-小版本执行路线图.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-总体开发大纲.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-测试矩阵.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-真相源索引.md`
- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-Git提交与推送计划.md`
- `指导大纲/项目仪表盘.md`

## 行为

b4 不改 runtime。它只把公开候选内容整理成可审包：

- hero 三件套候选 caption。
- v1.0 release note 候选稿。
- public FAQ 候选稿。
- 截图 / 短录屏素材说明边界。
- hidden fact、高阶事实、未开放系统的公开红线。

## 禁写边界

本阶段未写：

- runtime code。
- hero runtime binding。
- EdgeOne 自动部署。
- 大规模新图生成。
- 公开发布承诺。
- `SAVE_FORMAT_VERSION = 23`。
- route/location/currentRegion。
- 正式奖励、材料、蛊虫、蛊方、传承。
- 阵营转移、声望变化、正式任务。
- NPC 生死/抓捕/正史锚点。
- hidden fact body。
- DeepSeek 新权限。

## 验证

通过：

- `npm run check:v019-content-governance`：passed，heroEntries=3，mirofishPackages=3
- `npm run check:player-visible-copy`：passed，268 files scanned
- `npm test -- src/engine/v019-content-governance.test.ts --reporter=dot`：1 file，6 tests passed
- `npm run check:player-advocate-gate -- 指导大纲/v1.0.0/codex/00-总览/v1.0.0-b4-Player-Advocate-20轮走查记录.md 20`：20 rounds，理解率 100%，confused=0

## Git 注意

当前仓库仍有历史 dirty/untracked 文件，尤其是美术候选、bgm、外部参考、MiroFish 历史 intake、`.cursor/`、zip 等。后续提交仍不要用 `git add -A`，只 stage 当前阶段明确文件。

建议提交信息：

`docs: 整理v1.0公开素材与文案边界`

## 下一步

1. explicit stage b4 文件。
2. commit/push。
3. 等 GitHub Actions deterministic gate 通过。
4. 若 CI 通过，更新 b4 docs/dashboard/PROJECT-STATE/AGENTS/skill 的 commit/run id。
5. 之后进入 `v1.0.0-process-1` 预览、回滚、观测清单或 `v1.0.0-rc`。任何发布承诺、EdgeOne 部署、hero 正式绑定或大规模新图生成都必须停下来让用户决策。
