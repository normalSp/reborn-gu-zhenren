# 2026-05-13 v0.9.0 正式标识与 EdgeOne 发布配置上下文

## 本轮范围

- 用户批准把项目从 `0.9.0-rc` 收口为正式 `0.9.0`。
- 部署目标明确为腾讯云 EdgeOne Pages / CodeBuddy 集成。
- 用户允许制作一组展示 v0.9.0 新功能的对外截图/短录屏素材。
- 本轮不新增 gameplay、存档字段、模型评估或世界观事实。

## 代码与配置

- `package.json` / `package-lock.json`：版本改为 `0.9.0`。
- `src/components/title/TitleScreen.tsx`：标题页显示 `v0.9.0`。
- `src/components/game/GameScreen.tsx`：游戏页页脚显示 `v0.9.0`。
- `edgeone.json`：新增 EdgeOne Pages 配置，`npm ci` -> `npm run build` -> `./dist`，Node `22.11.0`。
- `scripts/capture-qingmao-v001-materials.mjs`：Windows 下改用 `cmd.exe` 启动 Vite，并用 `taskkill /T /F` 清理子进程；新增 EBUSY/EPERM retry；短录屏输出为 `qingmao-v090-public-feature-short.webm`；manifest 状态为 `public_candidate_material`。

## 文档与 skill

- 新增 `指导大纲/v0.9.0/codex/00-总览/v0.9.0-正式发布与EdgeOne部署记录.md`。
- 更新当前入口、真相源索引、发布闸门、风险池、需求决策池、阶段跟踪、路线图、V-001 素材审查包、素材捕获记录、插件清单和 skill 镜像说明。
- 全局 skill 已同步：
  - `reborn-expert-council` v0.1.14
  - `game-dev-text` v2.3.13
  - `reverend-insanity-lore` v0.3.12
  - `reborn-combat-motion` v0.2.10

## 公告与素材

公告标题暂定：

`RebornG v0.9.0《线索入世，青茅开战》`

对外候选素材：

- `artifacts/v0.9.0/post-visual-expansion/V001/qingmao-desktop-overview.png`
- `artifacts/v0.9.0/post-visual-expansion/V001/qingmao-moonlight-action.png`
- `artifacts/v0.9.0/post-visual-expansion/V001/qingmao-white-jade-guard.png`
- `artifacts/v0.9.0/post-visual-expansion/V001/qingmao-forbidden-failure.png`
- `artifacts/v0.9.0/post-visual-expansion/V001/qingmao-v090-public-feature-short.webm`

素材边界：只展示 v0.9.0 UI/演出样板，不承诺完整最终美术，不暗示仙蛊、十转、永生、宿命蛊归属、凡人宝黄天交易或洞天正式认主。

## 验证结果

- `npm run capture:qingmao:v001`：通过；manifest `packageVersion = 0.9.0`，`status = public_candidate_material`。
- `npx tsc --noEmit --pretty false`：通过。
- `npm test`：通过，88 files / 543 tests。
- `npm run check:runtime-assets`：通过，128 files，zero-byte=0。
- `npm run check:qingmao-assets`：通过，7 entries，active=4、review-only=2、blocked=1。
- `npm run build`：通过；无 500KB+ chunk warning，仅 Rolldown plugin timings 提示。
- `npx playwright test tests/e2e/v090-product-route-closure.spec.ts tests/e2e/v090-training-ground-clue-entry.spec.ts tests/e2e/v090-beast-hunt-battlefield.spec.ts`：通过，6 tests。

## EdgeOne 结论

当前 Codex 会话没有 Tencent/EdgeOne 专用插件或 skill，不能直接替用户完成账号授权和云端发布。仓库侧已准备好 EdgeOne Pages 构建配置。后续部署可走：

- CodeBuddy IDE 官方 EdgeOne Pages 部署入口。
- EdgeOne Pages 控制台连接仓库。
- 后续安装官方 `TencentEdgeOne/edgeone-pages-skills` 或接 EdgeOne Pages MCP 后，再让 AI 辅助云端操作。

账号 Token、项目 ID、域名后台权限不要写入仓库。
