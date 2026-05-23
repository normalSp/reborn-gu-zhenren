# 2026-05-23 v2.5 startup private canon / knowledge visibility 交接

分支：`codex/v250-startup-private-canon-visibility`

## 当前状态

- v2.5-a0 前置批量审批与例外停机制度已完成并推送。
- 本轮已开 v2.5 专家团启动会。
- v2.5 主线建议：`private canon / knowledge visibility 试验设计`。
- 启动会已输出完整前置授权包：`指导大纲/v2.5.0/codex/00-总览/v2.5.0-前置授权包.md`。
- D-250-001 至 D-250-012 等待用户审批。
- F-250-001 至 F-250-010 标记为 `future_gate_required`。

## 本轮新增文档

- `v2.5.0-专家团启动会纪要.md`
- `v2.5.0-前置授权包.md`
- `v2.5.0-启动审查与范围冻结.md`
- `v2.5.0-总体开发大纲.md`
- `v2.5.0-小版本执行路线图.md`
- `v2.5.0-需求决策池.md`
- `v2.5.0-测试矩阵.md`
- `v2.5.0-真相源索引.md`
- `v2.5.0-Git提交与推送计划.md`
- `v2.5.0-MiroFish资料需求与交付协议.md`
- `v2.5.0-startup-Skill同步审计记录.md`

## 硬边界

当前不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- private canon service、backend/BFF、eval archive service、runner、artifact。
- live DeepSeek、DeepSeek prompt/context/model/authority 变化、DeepSeek visible lore/RAG。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- MiroFish export/intake。
- 知识库正文、runtime canon、真实 hidden/private body、原著正文、MiroFish raw output。
- 正式地点、阵营、身份、奖励、NPC 生死、canon promotion。
- public wording 或 EdgeOne 部署。

## 下一步

等待用户审批：

- D-250-001 至 D-250-012。
- 确认 F-250-001 至 F-250-010 为 `future_gate_required`。

用户批准后，后续可用一个 `/goal` 在授权包内完成 v2.5。若用户修改授权包，先更新 `v2.5.0-前置授权包.md` 和 `v2.5.0-需求决策池.md`。
