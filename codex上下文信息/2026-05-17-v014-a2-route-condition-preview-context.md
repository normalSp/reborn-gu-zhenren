# 2026-05-17 v0.14.0-a2 路线条件读取交接

## 当前状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 当前阶段：`v0.14.0-a2 路线条件表与账本读取`
- 状态：已完成本地实现与验证，准备提交/推送
- 存档版本：仍为 `SAVE_FORMAT_VERSION = 22`
- DeepSeek 模型：仍为 `deepseek-v4-flash`

## 本次完成

1. v0.14 MiroFish 三包 intake 复核完成。
   - 三包可用于 candidate/rule/test 初筛。
   - `qingmao_exit_route_aftermath_pack` 带 1 个隔离项：`v014exit_30146f740a69`。
   - 隔离项只允许 hidden-boundary/future-sample，不得进入 UI、DeepSeek 或 route pressure 规则。

2. `v0.14.0-a1` 设计门禁收束。
   - 新增 `v0.14.0-a1-路线承接设计门禁执行记录.md`。
   - README、总体大纲、MiroFish 协议同步到 a1 通过。

3. `v0.14.0-a2` 只读 route condition preview 第一刀。
   - 新增 `src/canon/qingmao-route-continuation-rules.json`。
   - 新增 `src/engine/v014-qingmao-route-continuation.ts`。
   - 新增 `src/engine/v014-qingmao-route-continuation.test.ts`。
   - 支持山路逃离、商队接触、白家接触、散修过渡、商家城公开入口候选 5 类 route archetype。
   - 输出条件、缺口、风险、社会影响、可做前置、source refs、边界和 intent ruling hints。
   - 不写 store、不新增持久字段、不开放地点/阵营/奖励/NPC 生死、不扩张 DeepSeek 权限。

4. Player Advocate 流程增强。
   - 制度中新增 `deterministic_walkthrough` 与 `live_narrative_probe` 分层。
   - 模板新增 live DeepSeek、存档价值、transcript/存档落点字段。
   - a2 走 20 轮确定性玩家视角走查，95% 下一步理解率。

5. 项目状态同步。
   - 更新 `AGENTS.md`。
   - 更新 `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`。
   - 更新 `v0.11.0-项目仪表盘.md`。
   - 更新 v0.14 README、路线图、需求池、测试矩阵、总体大纲、MiroFish 协议。

## 验证

已通过：

```powershell
npm test -- src/engine/v014-qingmao-route-continuation.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-a2-Player-Advocate-20轮走查记录.md" 20
npm test -- --reporter=dot
npm run build
npm run check:player-visible-copy
npm run check:runtime-assets
npm run check:qingmao-assets
```

结果：

- focused unit：1 个文件，7 个测试通过。
- full unit：122 个文件，696 个测试通过。
- TypeScript：通过。
- build：通过，仅 Rolldown plugin timing warning。
- Player Advocate gate：20 轮，95% 下一步理解率，1 个困惑轮次。
- player-visible-copy：240 个文件扫描通过。
- runtime assets：131 个文件，0 zero-byte。
- Qingmao assets：10 entries，active=4。

## 当前边界

不得在未获用户决策前做：

- `route_entered`
- 新地域正式进入或商家城开放
- 阵营转移
- 正式声望/通缉/招揽/任务/奖励
- NPC 生死、抓捕、追杀成功
- save format bump
- DeepSeek 路线/地点/阵营/奖励/隐藏事实写入权
- EdgeOne 自动部署

## 下一步

进入 `v0.14.0-b1 候选后续到正式前置行动桥`。

默认推荐第一刀：

- `遮掩逃离痕迹`

目标：

- 从候选后续升级为正式前置行动样板。
- 只写现有 v22 字段。
- 不改变地点、阵营、奖励、NPC 生死。
- 走 20 轮 Player Advocate。

## Git

本阶段提交时只 stage v0.14-a1/a2 相关文件，不使用 `git add -A`。

仍不要 stage：

- `RebornG_codebuddy.zip`
- `artifacts/`
- `bgm/`
- `指导大纲/大方向/`
