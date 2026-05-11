# 2026-05-11 v0.8.0-b3 中后期剧情锚点上下文

分支：`codex/v080-b3-midgame-anchors`
基线：`codex/v080-b2-cultivation-calamity`
提交目标：`feat: 接入v0.8中后期剧情锚点`

## 范围

b3 做正式持久化，不是临时 UI 竖切。`SAVE_FORMAT_VERSION` 从 `16` 升到 `17`，新增 `storyAnchorState`，把中后期锚点、宿命状态、IF 向量、天意账本、因果债、候选事件、压力记录和本地结算轨迹从旧 `flags` 升为长期系统。

本阶段覆盖四个锚点：

- `yi_tian_mountain`：义天山侧翼战场、梦境试探、局部阵营选择。
- `reverse_flow_river`：逆流河入口压力、个人试炼、追击/撤退候选。
- `dream_shadow_sect`：梦境与影宗线索、魂道交易、侧翼战斗压力。
- `fate_war`：宿命战侧翼、救援/撤退/IF 站队候选。

`venerable_game` 和 `heavenly_court_endgame` 只保留后续入口，不在 b3 做终局。

## 关键文件

- `src/canon/v080-midgame-anchor-rules.json`：b3 规则源，引用 canon anchor 与 IF 轴，登记禁区改写和禁止运行时奖励。
- `src/engine/v080-midgame-anchor-engine.ts`：纯本地锚点引擎，负责入场、候选、IF、天意、因果和结局输入。
- `src/store/slices/storyAnchorSlice.ts`：正式 store action，负责写入 `storyAnchorState` 并维护旧 flags 兼容镜像。
- `src/store/initialState.ts`、`src/store/index.ts`：v17 默认值、迁移与 persist normalize。
- `src/engine/state-update-applier.ts`：阻断/降级 AI 直接写宿命状态、锚点结果、关键 NPC 生死、正式结局或奖励。
- `src/engine/context-builder.ts`：注入当前锚点、正史边界、IF 向量、天意/因果压力和禁止越权规则。
- `src/components/game/StoryAnchorPanel.tsx`：底部 `宿命` 面板。
- `src/components/game/ChoicePanel.tsx`：新增正史/IF/天意/禁区锚点标签。
- `tests/e2e/v080-midgame-anchor.spec.ts`：桌面、移动端与 reduced motion 验收。

## 本地安全原则

- DeepSeek 只能写候选、压力和传闻。
- 正史结果、关键 NPC 生死、宿命状态、奖励、战斗胜负、资源损益必须由本地引擎或后续正式系统结算。
- 正史模式只允许旁观、侧翼战场、救援、撤退、关系变化和局部战果。
- IF 模式允许偏移，但必须写入 `IfBranchVector`，并同步天意、因果、关系或势力代价。
- 禁止运行时奖励 `宿命蛊`、`永生蛊`、十转、真正永生、普通战斗击杀尊者。

## 存档

`测试存档/v0.7.0` 全量升级为 `formatVersion = 17`，每个测试档补 `state.storyAnchorState` 与兼容 flags 镜像。

新增专项：

- `42-v0.8-b3-义天山侧翼战场.json`
- `43-v0.8-b3-逆流河入口压力.json`
- `44-v0.8-b3-梦境影宗线索.json`
- `45-v0.8-b3-宿命战侧翼IF分叉.json`

## 已验证

- `npm test -- src/engine/v080-midgame-anchor-engine.test.ts src/store/slices/storyAnchorSlice.test.ts src/store/test-save-fixtures.test.ts`：3 个测试文件、16 个用例通过。
- `npm test`：66 个测试文件、428 个用例通过。
- `npm run build`：通过；仅保留既有 `combat-squad` chunk 体积提示。
- `npx playwright test tests/e2e/v080-midgame-anchor.spec.ts`：2 个 b3 宿命面板/Choice 标签用例通过，覆盖桌面与移动端 reduced motion。
- `npm run test:e2e:long`：18 条长链路用例通过。

## 后续入口

- b3 可把中后期剧情选择导向战斗、修行和蛊虫剧情表现化系统，但只能传递场景授权、候选和压力，不能替代这些系统的正式结算。
- c1 需要从 `storyAnchorState`、`cultivationState`、battlefield 轨迹和长期关系/势力结果构建终局解析输入。
- 若后续要保存正式章节战斗中断点，应另行设计迁移，不复用 b1/b1.1 的临时 battlefield UI 状态。
