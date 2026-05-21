# 2026-05-22 v1.9.0 startup council context

状态：v1.9.0 专家团启动会已召开
分支：`codex/v190-a0-expert-council-startup`
基线：`5af9b90`
推送：a0 文档收束后推送当前分支

## 当前口径

推荐主线：

`v2.0 区域活世界预备与门禁收束`

当前只完成启动会和治理文档，不代表 D-190 已批准，也不代表 v1.9 runtime 已开始。

## 新增文档

- `指导大纲/v1.9.0/codex/00-总览/README.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-专家团启动会纪要.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-启动审查与范围冻结.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-总体开发大纲.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-小版本执行路线图.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-需求决策池.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a0-治理补丁与范围冻结.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-v2.0区域活世界readiness草案.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-真相源索引.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-测试矩阵.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-Git提交与推送计划.md`

## 已同步

- `指导大纲/项目仪表盘.md`
- `指导大纲/historical-index.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## D-190 待用户决策

D-190-001 至 D-190-012 均为 pending。

专家团建议全部批准后进入：

`v1.9.0-a1-v2区域活世界save-format与事件账本设计门禁.md`

关键决策包括：

- v1.9 是否以 v2.0 区域活世界预备为主线。
- v2.0 第一核心区域候选是否先锁为南疆早期低阶外缘小区域。
- 是否继续保持 `SAVE_FORMAT_VERSION = 24`，并把 v25/event ledger/runFingerprint 放入 a1 严肃评估。
- MiroFish need 是否 preferred -> blocking。
- v1.8 P2 正式凭证词和英文术语风险是否进入 current_matrix/process-1。
- b/rc Player Advocate 与 live probe 强度。
- 是否继续禁止 DeepSeek RAG/BFF/public/EdgeOne/子代理/正式地点阵营奖励 NPC 生死。

## 权威边界

- 不改 runtime。
- 不 bump save-format。
- 不新增 `regionalEventLedger`、`runFingerprint`、`regionalLifeState`、`areaLivingState`、`identityRouteState`、`professionState`。
- 不做 MiroFish export/intake。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不开放正式地点/阵营/身份/奖励/NPC 生死。
- 不扩 DeepSeek 权限。
- 不部署 EdgeOne。

## skill sync

已更新：

- `reborn-expert-council` -> v1.9 startup active draft
- `game-dev-text` -> v1.9 startup active draft
- `reverend-insanity-lore` -> v1.9 startup active draft

记录为 `no_update_needed`：

- `mirofish-reborng-export`：启动会不执行 export，进入 a2 再触发。
- `reborn-combat-motion`：不触碰战斗表现/动效/视觉 runtime。

## 验证

启动会为 docs/governance 阶段。已验证：

- `git diff --check`：通过，仅有 CRLF 工作区提示。
- `npm run check:stale-entrypoints`：通过，P0/P1/P2=0/0/0。该命令生成的临时 report 未纳入本阶段提交边界，已清理。

## 下一步

把 D-190 逐项讲给用户。若用户批准，切新分支：

`codex/v190-a1-v2-readiness-save-gate`

然后进入 a1 设计门禁。
