# v0.8.0-c1.3 天赋承诺覆盖清零上下文

日期：2026-05-11  
分支：`codex/v080-c13-promise-coverage-zero`  
上游：`codex/v080-c12-origin-lifebound-closure`

## 目标

c1.3 是 c2 全局重皮前的第三个补漏小版本，不提升 `SAVE_FORMAT_VERSION`。本阶段只清理天赋遴选页展示债：`TimelineConfigScreen` 的 P4 天赋池不得再把已能解释的展示别名归为泛泛 `待系统`，也不得出现 `需降级`。

## 实现范围

- `src/canon/v080-promise-effect-coverage.json`：版本标记推进到 `v0.8.0-c1.3`。
- `src/engine/v080-promise-effect-coverage.ts`：新增 c1.3 别名清账层，位于显式 truth source 规则之后、numeric fallback 之前。
- `src/engine/v080-promise-effect-coverage.test.ts`：新增 P4 天赋池与旧天赋池 release-facing 覆盖断言。
- `指导大纲/v0.8.0/codex/00-总览/v0.8.0-开发阶段跟踪.md`：记录 c1.3 为 c2 前置清账小版本。
- `指导大纲/v0.8.0/codex/00-总览/v0.8.0-小版本执行路线图.md`：补入 c1.3 小版本。
- `指导大纲/v0.8.0/codex/01-系统深化/v0.7承诺效果继承深化矩阵.md`：记录天赋承诺覆盖清零原则。

## 分类原则

- 道痕、流派亲和、生命/抗性/战斗、场景行动、资源闸门、阵位/伏击等由 v0.8 已有系统事实支撑的展示别名归入 `runtime_active`。
- 角色创建画像类属性归入 `creation_only`。
- 寿命、时间流速、仙蛊融合、梦境操控、蛊虫上限等高阶长期承诺只作为 `narrative_only` 边界和后续入口，不伪装为当前完整运行时循环。
- 未命中的新数值展示仍会落到 `planned_needs_system`，作为未来新增内容的诊断保护；但当前 P4 和旧天赋池必须为 0。

## 当前验证口径

执行前动态分类：
- P4 天赋池：`planned_needs_system = 99`，`needs_downgrade = 0`。

c1.3 分类器修改后动态分类：
- P4 天赋池：`planned_needs_system = 0`，`needs_downgrade = 0`。
- P4 + 旧 `INITIAL_TALENTS`：`planned_needs_system = 0`，`needs_downgrade = 0`。

## 后续入口

- c2：只做全局重皮、移动端体验、reduced motion 与解释型 UI，不再混入天赋承诺覆盖补债。
- c2.1 / content-rc：若要开放传承、待认主福地/洞天、完整高阶资源经济，应以独立系统竖切处理。

## 最终验证

- `npm test -- src/engine/v080-promise-effect-coverage.test.ts src/engine/modifier-engine.test.ts`：通过，2 个文件 / 15 条测试。
- `npx playwright test tests/e2e/v080-promise-coverage-zero.spec.ts`：通过，桌面凡人池与移动端 reduced-motion 蛊仙池均验证“待系统”过滤为空。
- `npm test`：通过，72 个文件 / 460 条测试。
- `npm run build`：通过；保留既有 `combat-squad` chunk 超 500KB 警告。
- `npm run test:e2e:long`：第一次复用旧 Vite dev server 时出现动态模块拉取失败；停止旧 5173 Vite 进程后重跑通过，18/18。
