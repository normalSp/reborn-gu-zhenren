# 2026-05-15 v0.11.0-b2 轻量复盘上下文

## 当前阶段

- 当前分支：`codex/v090-b1-world-action-protocol`
- remote：`origin git@github.com:normalSp/reborn-gu-zhenren.git`
- 当前开发线：`v0.11.0`
- 当前阶段：`v0.11.0-b2` 轻量复盘已完成
- 存档版本：`SAVE_FORMAT_VERSION = 22`
- DeepSeek 运行模型：`deepseek-v4-flash`

## 本轮目标

用户选择 4：先把 b2 收束复盘，再决定哪条提示值得升级成正式行动。

本轮未改运行时代码，只做治理、复盘和下一步决策入口。

## 本轮新增文档

- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-b2-轻量复盘与升级决策.md`

## 本轮更新文档

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-小版本执行路线图.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-真相源索引.md`
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-需求决策池.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 复盘结论

b2 地基是稳的：

- 玩家调查可以被本地裁决。
- 调查结果能写入活世界账本。
- 白家可见调查能产生势力机会压力。
- 方源/灵泉隐藏事实仍被保护。
- b2-4 能把账本派生为玩家可读后续提示。

但下一步从“提示”升级为“正式行动”会改变玩家可做的事，因此必须让用户决策。

## 专家团建议

推荐顺序：

1. A：白家接触窗口正式行动。优先。只做公开试探/递话/核对接触窗口，不投靠成功。
2. B：逃离青茅山路线准备链。第二优先。只做路线、补给、追踪风险准备，不开放新地域。
3. C：方源旁证调查。延期。需要更多方源公开活动事实卡和隐藏事实防线。
4. D：进入 rc 收束。稳，但玩家还不能顺着提示继续正式行动。

## 用户决策点

下一步需要用户选择：

- A：先做白家接触窗口正式行动。
- B：先做逃离青茅山路线准备链。
- C：先做方源旁证调查。
- D：不继续 b2 runtime，进入 rc 收束。

如果用户选 A，下一刀必须冻结：

- 不投靠成功。
- 不改势力归属。
- 不给奖励。
- 不开放地点。
- 不触发白凝冰重大 IF。
- 不新增持久字段，除非用户另批。

## 验证

本轮只改文档和 skill，没有改运行时代码，未重跑测试。

最近运行时验证仍来自 b2-4：

```powershell
npm test -- src/engine/v011-qingmao-investigation-followups.test.ts src/engine/v011-qingmao-visible-investigation.test.ts src/store/slices/livingWorldSlice.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts
npm run build
```

## Git 状态

- 当前分支：`codex/v090-b1-world-action-protocol`
- 是否 commit：否
- 是否 push：否
- 未 commit/push 原因：当前工作区存在大量历史脏项与未跟踪文件，且分支名仍偏旧；为避免混入历史改动，本轮不 stage/commit/push。
- 本阶段建议提交范围：v0.11.0 process-1b、b2、b2-2、b2-3、b2-4、b2 复盘相关文件。
- 不应纳入提交的脏项：历史 v0.6/v0.7/v0.8 删除/迁移、旧测试存档批量变化、与本轮无关的 runtime 改动。
