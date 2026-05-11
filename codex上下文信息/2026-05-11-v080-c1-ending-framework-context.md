# v0.8.0-c1 终局框架上下文交接

日期：2026-05-11  
分支：`codex/v080-c1-ending-framework`  
基线提交：`8e319c3 feat: 接入v0.8中后期剧情锚点`  
阶段提交信息：`feat: 建立v0.8终局框架`

## 阶段目标

c1 建立正式终局解析框架，但不把终局做成“数值通关按钮”。本阶段新增可持久化的 `endingState`，将终局候选、证据汇总、阻断记录、压力日志和已提交结局记录纳入存档协议；终局只能由本地引擎根据宿命状态、IF 向量、修行/战斗/势力证据和禁区规则生成并提交。

DeepSeek 仍只允许写候选、压力、传闻和叙事暗示；不得直接写正式结局、宿命蛊奖励、十转、真正永生、普通战斗击杀尊者或关键 NPC 生死。

## 主要落地

- 新增 `src/canon/v080-ending-framework-rules.json`，登记尊者博弈、天庭末章、终局族群权重、证据阈值、禁区文本和本地提交规则。
- 新增 `src/engine/v080-ending-framework-engine.ts`，提供 `createDefaultEndingFrameworkState`、`normalizeEndingFrameworkState`、`buildEndingResolutionInput`、`evaluateEndingReadiness`、`generateEndingRouteCandidates`、`validateEndingRouteCandidate`、`resolveEndingRoute`、`commitEndingOutcome`、`recordEndingPressure`。
- 扩展 `src/types/index.ts`，新增 `EndingFrameworkState`、`EndingRouteCandidate`、`EndingResolutionStep`、`EndingCommitRecord` 等正式类型，并让 `DeathRecord` 可承载终局总结。
- `SAVE_FORMAT_VERSION` 从 `17` 升到 `18`；`migrateSave` 和 zustand persist migrate 会为旧档补 `endingState`。
- 新增 `src/store/slices/endingSlice.ts`，接入候选刷新、候选提交、禁区压力记录。提交成功后进入 `game_over`，复用总结页展示终局记录。
- `context-builder` 和 `state-update-applier` 增加终局安全闸门：AI 直接写 `endingState`、`endingOutcome`、`finalOutcome`、尊者击杀、十转、永生等会被降级为 L3 warning 或压力记录。
- 新增 `src/components/game/EndingResolverPanel.tsx`，底部导航新增 `终局` 面板；展示终局状态、证据、候选、阻断原因、压力日志和本地轨迹。
- `GameOverScreen` 支持终局总结模式，区分普通死亡和终局提交，不播放死亡音效，不把阶段性结论伪装成真正永生或十转胜利。
- E2E harness 新增 `startEndingFrameworkDemo()`，用于桌面、移动端和 reduced motion 验收。
- `测试存档/v0.7.0` 全量升级到 `formatVersion = 18`，并新增 5 个 c1 专项存档：尊者博弈压力、天庭末章入口、宿命破碎候选、势力立足候选、身死道消总结。

## 文档同步

- 更新 `指导大纲/v0.8.0/codex/00-总览/v0.8.0-开发阶段跟踪.md`。
- 更新 `指导大纲/v0.8.0/codex/00-总览/v0.8.0-小版本执行路线图.md`。
- 更新 `指导大纲/v0.8.0/codex/04-前端动效/GSAP-Motion-全局重皮规范.md`。
- 新增 `指导大纲/v0.8.0/codex/07-终局框架/终局解析器设计.md`。

## 验证结果

已通过：

- `npm test -- src/engine/v080-ending-framework-engine.test.ts src/store/slices/endingSlice.test.ts src/store/test-save-fixtures.test.ts src/engine/v070b-squad-data.test.ts`
  - 4 个测试文件，20 个测试通过。
- `npm test`
  - 68 个测试文件，440 个测试通过。
- `npm run build`
  - 构建通过；仍保留既有 Vite chunk size warning。
- `npx playwright test tests/e2e/v080-ending-framework.spec.ts`
  - 2 个 E2E 测试通过。
- `npm run test:e2e:long`
  - 18 个 E2E 测试通过。

## 剩余风险

- Vite 仍提示 `combat-squad` 等 chunk 超过 500KB，这是既有打包体积风险，不阻塞 c1，但 c2 全局重皮/体验收束时适合一起拆分懒加载边界。
- PowerShell 终端输出中文路径时会出现 mojibake，只影响 shell 可读性，不影响文件内容和测试结果。
- c1 只建立终局框架和总结入口，不做 c2 全局视觉统一，也不做完整终局演出编排。
- 无关脏项继续保留，不纳入 c1 提交：`.codex/`、`bgm/`、根目录日报、`dead_code_audit_report.md`、`bug汇总/v0.6.0.md` 删除。

## c2 入口

下一阶段 `v0.8.0-c2` 可以从当前分支继续，重点做全局重皮与体验收束：

- 统一暗墨、金色道痕、血色风险、玉青生机的 UI 语言。
- 让 `终局`、`宿命`、`修行`、`凡战/群像战` 等面板在桌面与移动端拥有一致的信息密度。
- 将重大锚点、灾劫、终局提交接入 GSAP 独立效果层；Motion 继续负责卡片、列表、tooltip 和布局变换。
- 补移动端文字重叠、reduced motion 和长链路回归截图验收。
