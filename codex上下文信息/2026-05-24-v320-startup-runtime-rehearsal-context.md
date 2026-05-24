# 2026-05-24 v3.2 startup runtime rehearsal context

## 当前状态

- 分支：`codex/v320-startup-runtime-rehearsal`
- 当前完成里程碑：`v3.1.0` runtime agent 门禁二次加固
- 当前入口：`指导大纲/v3.2.0/codex/00-总览/README.md`
- v3.2 状态：startup completed；D-320 pending user approval；F-320 proposed `future_gate_required`

## 本轮完成

- 已确认 v3.1 准入证据允许开 v3.2：`v32RehearsalAdmissible=true`，`runtimeImplementationApproved=false`。
- 已建立 v3.2 expert-council startup 文档包：
  - 专家团启动会纪要
  - 启动审查与范围冻结
  - 总体开发大纲
  - 小版本执行路线图
  - 前置授权包
  - 例外停机清单
  - 需求决策池
  - 测试矩阵
  - 真相源索引
  - MiroFish 资料需求与交付协议
  - Git 提交与推送计划
  - startup Skill 同步审计记录
- 已同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`PROJECT-STATE.md`。
- 已同步本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 待用户决策

请用户决定是否批准：

- D-320-001 至 D-320-012。
- F-320-001 至 F-320-012 全部保持 `future_gate_required`。

获批后才可以进入 v3.2 `/goal` 自动推进。

## 绝对边界

当前未授权：

- runtime agent implementation
- runtime/source/UI/store/prompt/save changes
- new save fields / `SAVE_FORMAT_VERSION` bump / `runFingerprint`
- live DeepSeek / prompt-context-model-authority changes / DeepSeek visible lore-RAG
- backend/BFF/service/job queue/eval archive/cloud save
- MiroFish export/intake / real original facts / named NPC / hidden-adjacent / formal lore
- knowledge-index body / runtime canon / hidden-private body / prompt body archival
- external framework PoC/dependency/read-only scan/vendored subset/patch artifact/subagents
- L4/L5 runtime / HeavenWill-Fate runtime adjudication / original key figure runtime agent
- formal location/faction/identity/reward/NPC life-death
- public wording / legal-release boundary / EdgeOne
