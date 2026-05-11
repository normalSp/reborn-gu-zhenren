# v0.8.0-c2.4 修行与灾劫叙事化上下文

日期：2026-05-11
分支：`codex/v080-c24-cultivation-calamity-narrative`
提交：`feat: 叙事化v0.8修行与灾劫`
阶段：世界闭环补强 c2.4

## 本轮目标

把修行/升仙/灾劫从行动面板里的独立按钮，推进为能被剧情承接的系统事实。核心调整是：灾劫先进入剧情场景与场景 AP 账本，正式资源、道痕、伤势、蛊虫损伤和战斗胜负仍由本地引擎或后续行动结算。

## 代码落地

- 新增 `src/canon/v080-calamity-scene-specs.json`：六类灾劫场景模板。
- 新增 `src/engine/v080-calamity-scene-engine.ts`：从 b2 `CalamityPreview` 构建 `CalamitySceneSpec`，并格式化 prompt 注入段。
- 扩展 `src/types/index.ts`：新增 `CalamitySceneKind`、`CalamitySceneSpec`。
- 扩展 `src/store/slices/cultivationSlice.ts`：
  - 新增 `stageCalamityScene()`。
  - 消耗 c2.2 场景 AP。
  - 写入 `flags.pendingCalamitySceneSpec`。
  - 写入 `calamity_warning` 轨迹。
  - 必要时生成 c2.3 `combatEventCandidates`。
- 扩展 `src/engine/context-builder.ts`：把待处理灾劫场景注入下一轮叙事上下文，并明确 DeepSeek 禁止结算正式数值。
- 更新 `src/components/game/ActionPanel.tsx`：
  - 凡人/五转/蛊仙三层说明。
  - 五转才显示 `尝试升仙`。
  - 六转以上才显示 `灾劫入场`。
  - 七转/八转档不再显示五转升仙说明。
- 扩展 `src/e2e/installE2eHarness.ts`：新增七转灾劫叙事化演示入口，summary 暴露 pending 灾劫场景和场景 AP。
- 更新 `tests/e2e/v080-cultivation-calamity.spec.ts`：覆盖七转面板、灾劫入场、场景 AP 与 reduced motion。

## 测试结果

已通过：

- `npm test -- src/engine/v080-calamity-scene-engine.test.ts src/store/slices/cultivationSlice.test.ts src/engine/v080-narrative-combat-orchestration.test.ts`
- `npm run build`
- `npx playwright test tests/e2e/v080-cultivation-calamity.spec.ts`

构建仅保留既有 `combat-squad` 500KB+ chunk 警告。

## 设计边界

- c2.4 不提升 `SAVE_FORMAT_VERSION`。
- c2.4 不做完整七至九转万劫链。
- c2.4 不开放洞天认主、传承系统或完整资源经济。
- `stageCalamityScene()` 不结算正式损伤，只把灾劫转为剧情场景事实。
- DeepSeek 只能写预兆、压迫和选择描述；正式数值结果仍由本地引擎结算。

## 下一阶段入口

推荐进入 `v0.8.0-c2.5`：

- 传承与待认主福地/洞天协议竖切。
- 复用 c2.2 场景 AP、c2.3 剧情战斗、c2.4 灾劫场景规格。
- 首批只做小传承洞府、三王传承旁支、待认主福地样板；洞天先作为传闻/高压边界。

后续仍需注意：

- 调息/修行详情长期更适合迁入空窍/仙窍面板，行动面板保留快捷入口。
- 灾劫正式处置动作需要继续拆出资源防护、阵位、牺牲蛊虫、修补仙窍等本地 action。
