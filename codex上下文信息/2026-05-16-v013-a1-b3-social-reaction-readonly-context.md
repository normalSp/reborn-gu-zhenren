# v0.13.0 a1-b3 社会反应只读引擎上下文交接

日期：2026-05-16
分支：`codex/v013-npc-faction-reaction`
主提交：`154657e feat: 建立v0.13社会反应只读引擎`
状态：a1/a2/b1/b2/b3 第一刀完成；b4 需要用户决策。

## 完成内容

MiroFish v0.13 三包 intake：

- `qingmao_npc_memory_motive_pack`
- `qingmao_faction_reputation_pressure_pack`
- `qingmao_public_event_chronicle_pack`

结论：三包均 `accepted_for_candidate_pool`，只可进入候选池、规则草案、测试样本；不是 canon、runtime truth、DeepSeek authority。

v0.13-a1：

- `v0.13.0-a1-社会记忆协议.md`
- `v0.13.0-a1-字段表与写入权限.md`
- `v0.13.0-a1-测试矩阵.md`

v0.13-a2：

- `src/canon/qingmao-npc-memory-rules.json`
- `src/engine/v013-qingmao-npc-memory.ts`
- `src/engine/v013-qingmao-npc-memory.test.ts`

只读 NPC 记忆投影，不写 store，不开放命名 NPC runtime rule。

v0.13-b1：

- `src/canon/qingmao-faction-stance-rules.json`
- `src/engine/v013-qingmao-faction-stance.ts`
- `src/engine/v013-qingmao-faction-stance.test.ts`

只读势力态度/压力投影，不写声望、通缉、招揽、任务或奖励。

v0.13-b2：

- `src/canon/qingmao-public-event-chronicle-rules.json`
- `src/engine/v013-qingmao-public-event-chronicle.ts`
- `src/engine/v013-qingmao-public-event-chronicle.test.ts`

只读 prompt-safe public summary，不暴露 hidden body。

v0.13-b3：

- `src/canon/qingmao-social-followup-rules.json`
- `src/engine/v013-qingmao-social-followups.ts`
- `src/engine/v013-qingmao-social-followups.test.ts`

candidate-only 后续行动候选，不创建正式任务、不发奖励、不写存档。

## 验证

- `npm test -- src/engine/v013-qingmao-npc-memory.test.ts src/engine/v013-qingmao-faction-stance.test.ts src/engine/v013-qingmao-public-event-chronicle.test.ts src/engine/v013-qingmao-social-followups.test.ts --reporter=dot`：4 个 test file、15 个测试通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：121 个 test file、689 个测试通过。
- `npm run build`：通过，无 500KB+ chunk warning。
- `git diff --cached --check`：提交前通过。

## 边界

本轮没有：

- 新增持久化字段。
- 提升 `SAVE_FORMAT_VERSION`。
- 写入 `npcMemories`、`factionPressure`、`actionConsequences` 或 `localActionLedger`。
- 正式声望、通缉、招揽、任务、奖励、地点、阵营或 NPC 生死。
- hidden fact reveal。
- DeepSeek 新写入权。

## 下一步决策

当前停在 `v0.13.0-b4 Player Advocate 可读性走查 UI`。

需要用户决策 UI 入口：

- 方案 A：放进 `FreeGoalPanel`，作为“社会影响 / 局势后续”折叠区。
- 方案 B：做独立 `SocialMemoryPanel`，在活世界/自由目标旁边展示。
- 方案 C：先只做开发调试面板，等体验稳定再转玩家 UI。

专家团建议：选 A。它最省风险，能复用现有自由目标上下文；如果后续内容变多，再拆成独立面板。

## Git / 推送状态

- 主实现提交：`154657e feat: 建立v0.13社会反应只读引擎`。
- 本交接文件和仪表盘状态将作为后续小提交记录。
- 推送状态：待本交接提交后执行 `git push`。
