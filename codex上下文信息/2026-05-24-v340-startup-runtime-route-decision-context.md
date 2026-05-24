# 2026-05-24 v3.4 startup runtime route decision context

## 当前状态

- 分支：`codex/v340-startup-runtime-route-decision`
- 当前入口：`指导大纲/v3.4.0/codex/00-总览/README.md`
- 当前阶段：v3.4 专家团启动会已开；路线选择 pending
- v3.3 状态：completed；`f300ReopenDecisionPackageComplete=true`；`runtimeImplementationApproved=false`

## 本轮完成

- 新建 v3.4 startup 文档包：
  - README
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
- 同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`PROJECT-STATE.md`。
- 同步本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 专家团结论

三条路线：

1. Route 1：继续 report-only hardening。最安全，但边际收益下降，没有玩家可见提升。
2. Route 2：单独打开最小 `transient proposal-only` runtime first cut。专家团推荐，但必须用户明确批准。
3. Route 3：继续 defer 到 v3.5+。不推荐，除非用户当前希望保持零 runtime 风险。

## Route 2 的最窄定义

- 一个小区域。
- L2/L3 非原著关键 NPC 或抽象小队/小势力压力对象。
- transient AgentProposal。
- WorldCore post-check 最终裁决。
- expression-only。
- rejected proposal 不改变状态。
- 不写正式事实、不写玩家存档、不新增字段。
- 不调用 live DeepSeek。
- 不做 MiroFish、backend、external framework、subagent。

## 当前待用户决策

请选择 v3.4 路线：

- Route 1：继续 report-only hardening。
- Route 2：单独打开最小 transient proposal-only runtime first cut。专家团推荐。
- Route 3：继续 defer 到 v3.5+。

如果选择 Route 2，建议批准 D-340-001 至 D-340-012，并确认 F-340-002 至 F-340-012 继续 future gate；F-340-001 只打开最小 transient proposal-only 窄口。

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
