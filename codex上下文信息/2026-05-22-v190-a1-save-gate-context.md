# 2026-05-22 v1.9.0-a1 save gate context

状态：v1.9.0-a1 设计门禁已建立
分支：`codex/v190-a1-v2-readiness-save-gate`
基线：a0 提交 `67736a5`
推送：a1 文档收束后推送当前分支

## 用户决策

用户已批准：

- D-190-001 至 D-190-012。

当前等待用户批准：

- D-191-001 至 D-191-012。

## a1 完成口径

新增：

- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a1-v2区域活世界save-format与事件账本设计门禁.md`

更新：

- `指导大纲/v1.9.0/codex/00-总览/README.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-需求决策池.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-启动审查与范围冻结.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-总体开发大纲.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-小版本执行路线图.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a0-治理补丁与范围冻结.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-Git提交与推送计划.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-测试矩阵.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-MiroFish资料需求与交付协议.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-真相源索引.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-v2.0区域活世界readiness草案.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

外部 skill 已更新：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

## 专家团建议

建议用户批准 D-191-001 至 D-191-012：

- v1.9 b1 继续保持 `SAVE_FORMAT_VERSION = 24`。
- 暂不新增 `regionalEventLedger`。
- 暂不新增 `runFingerprint`。
- 暂不新增 `regionalLifeState` / `areaLivingState`。
- 暂不新增 `identityRouteState` / `professionState`。
- v2.0 第一核心区域候选锁为 `南疆早期低阶外缘小区域`，仅用于 a2 request/test/rule。
- a2 MiroFish topic-slice 升级为 `blocking`，topic 为 `southern_border_low_rank_region_life_v2_prelude_slice`。
- b1 先做 `v2 readiness projection/report 第一刀`，默认不新增 UI tab/store action/save field。
- process-1 收束 v1.8 P2 正式道具词/英文术语 hardening。
- v1.9 Player Advocate / live probe 强度按风险分层。
- v2.0 前把 T3 300+ 区域活世界 mixed/live/replay 长测设为硬门。
- 继续禁止 DeepSeek RAG/BFF/public/EdgeOne/子代理/正式地点阵营奖励 NPC 生死。

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

## live DeepSeek

- 是否调用 live DeepSeek：否。
- 原因：a1 是纯设计门禁，不触碰 runtime prompt、DeepSeek context 或玩家可见叙事。

## 验证

已验证：

- `git diff --check`：通过，仅有 CRLF 工作区提示。
- `npm run check:stale-entrypoints`：通过，P0/P1/P2=0/0/0。该命令生成的临时 report 未纳入本阶段提交边界，已清理。

## 下一步

如果用户批准 D-191，切新分支：

`codex/v190-a2-v2-prelude-mirofish-intake`

然后进入：

`v1.9.0-a2-MiroFish-v2区域活世界预备topic-slice-intake.md`
