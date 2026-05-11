# 2026-05-11 v0.8.0-c2 全局重皮与体验收束上下文

## 分支

- 基线分支：`codex/v080-c13-promise-coverage-zero`
- 执行分支：`codex/v080-c2-global-reskin-ux`
- 计划提交：`style: 收束v0.8全局重皮与体验`

## 范围

c2 只做视觉、交互、移动端、reduced motion 和解释型 UI 收束；不新增剧情、战斗、修行、灾劫、锚点、终局或资源系统事实，不提升 `SAVE_FORMAT_VERSION`。

## 已实现方向

- 在 `src/index.css` 沉淀全局 `rg-*` UI 类：游戏壳、状态栏、底部工具带、侧栏/移动抽屉、面板、工具按钮、chip、选择卡、解释卡、行动卡、tooltip、滚动轨迹、滚动条和 focus ring。
- `StatusBar` 变为紧凑扫描式状态栏，生命、真元、AP、元石、阶段和天命状态在桌面/移动端都保持可读。
- `GameScreen` 统一桌面侧栏、移动端抽屉和底部工具带；移动端底部导航横向滚动，面板滚动边界更清楚。
- `ChoicePanel` 统一风险、蛊虫解法、锚点和系统约束标签；tooltip 用统一解释面板，说明风险、可用性、不可用原因和代价。
- `ActionPanel`、`GuInventoryPanel`、`StoryAnchorPanel`、`EndingResolverPanel`、`SaveLoadDialog`、`MaterialBagPanel`、`CharacterPanel` 接入统一面板/卡片/滚动/标签密度。
- 新增 `tests/e2e/v080-global-reskin-ux.spec.ts`，覆盖桌面主界面、高频面板、7x5 群像演武、天赋承诺清零，以及移动端 reduced motion 下选择、抽屉和大棋盘横滚。

## 动效边界

- Motion/CSS：面板进出、标签进入、tooltip、按钮 hover/press、列表重排、状态条、移动端抽屉、战斗棋盘 UI 状态。
- GSAP：继续只用于开战、杀招、破阵、重大锚点、终局压力等独立高强度 effect layer。
- UI 不私算战斗、修行、灾劫、锚点、终局或资源结果；只消费本地 engine/store 已落地事实。

## 验证计划

- `npm test`
- `npm run build`
- `npx playwright test tests/e2e/v080-global-reskin-ux.spec.ts`
- `npm run test:e2e:long`

## 验证结果

- `npm test`：通过，72 个测试文件 / 460 个用例。
- `npm run build`：通过，仅保留既有 `combat-squad` chunk 超过 500KB 的 Vite 提示。
- `npx playwright test tests/e2e/v080-global-reskin-ux.spec.ts`：通过，桌面与移动端 reduced motion 共 2 条。
- `npm run test:e2e:long`：通过，18 条长链路回归。

## 额外修复

- `ChapterTransition` 的普通过场层不再拦截指针事件，只有多路线选择器出现时才允许点击过场层。这样 c2 底部导航和移动抽屉不会被视觉过场遮挡。

## 后续入口

- `v0.8.0-c2.1`：传承与待认主福地/洞天协议竖切。
- `v0.8.0-content-rc`：青茅山、商家城、三王山、王庭福地等精选剧情长线。
- `v0.8.0-rc`：测试存档、长测、经济复验、发布收口。
