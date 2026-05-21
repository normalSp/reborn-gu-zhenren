# 2026-05-21 v1.8 启动会上下文

状态：v1.8-a0 启动会已起草，等待用户审批 D-180。
分支：`codex/v180-a0-expert-council-startup`
基线：`c36c121 feat: 完成v1.7区域活世界投影第一阶段`

## 当前结论

专家团建议 v1.8 主线为：

`低阶身份路线与同开局差异度地基`

该建议合并两条历史线：

- 长期路线原本给 v1.8 的“低阶人生分支职业与身份路线”。
- v1.7 future_sample_pool 中的 `runFingerprint` / `regionalEventLedger` / 同开局可重玩差异度。

v1.8-a0 只做 docs/governance，不改 runtime、不 bump save、不写 MiroFish request、不扩 DeepSeek、不启用子代理、不部署。

## 待用户审批

D-180-001 至 D-180-012，见：

`指导大纲/v1.8.0/codex/00-总览/v1.8.0-需求决策池.md`

批准后下一步进入：

`v1.8.0-a1-低阶身份路线与差异度save-format设计门禁.md`

## 关键硬停

- `SAVE_FORMAT_VERSION = 25`
- `identityRouteState`
- `professionState`
- `runFingerprint`
- `regionalEventLedger`
- 正式职业/身份系统
- 正式地点、阵营、奖励、工资、任务、NPC 生死
- DeepSeek RAG / 可见知识摘要 / hidden 可见化
- MiroFish 基础包整包导入
- public test / BFF
- EdgeOne 自动部署
- 子代理执行

以上都需要用户单独批准。
