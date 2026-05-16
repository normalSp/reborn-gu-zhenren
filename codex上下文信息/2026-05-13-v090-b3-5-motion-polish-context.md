# 2026-05-13 v0.9.0-b3-5 C-037 演出衔接抛光上下文

## 阶段状态

`v0.9.0-b3-5` C-037 已完成：月光/白玉/禁忌演出衔接抛光。

本轮没有改战斗规则、伤害、命中、AI、AP、奖励、掉落或存档协议；没有引入 Three.js/WebGL；没有改变 DeepSeek 边界。

## 关键落地

- `src/animations/gsap/battlefieldTimeline.ts`
  - 月光分支增加 `moon echo` 二段残光。
  - 白玉分支增加 `jade crack` 承压裂光。
  - 禁忌/失败/反制分支增加 `boundary sigil`。
  - 失败/反制/禁忌门槛优先于月光/白玉来源判断，防止越界失败被播成成功月刃。
  - effect layer 写入 `data-qingmao-polish`，用于自动化验收。
- `src/components/game/BattlefieldCombatOverlay.tsx`
  - 挂载 `battlefield-gsap-moon-echo`、`battlefield-gsap-jade-crack`、`battlefield-gsap-boundary-sigil`。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 验收三个新增节点。
  - 验收月光、白玉、禁忌三条 polish 分支。

## 验证

- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，1 file / 7 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm run check:qingmao-assets`：通过，7 entries；active=4，review-only=2，blocked=1。
- `npm run build`：通过，仅保留既有 500KB+ chunk warning 与 plugin timings warning。
- `npm test`：通过，87 files / 538 tests。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。

## 下一步

进入 C-038：视觉资产阶段验收台账。

建议范围：

- 整理 b3-5 的截图台账、Playwright 附件、资产扫描结果和剩余风险。
- 明确 C-034/C-035/C-036/C-037 的验收证据。
- 不新增战斗事实、不新增视觉需求、不扩玩法。
- C-038 完成后再判断是否进入 `v0.9.0-rc` 启动审查。
