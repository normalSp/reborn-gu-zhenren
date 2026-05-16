# 2026-05-16 长期路线架构演进交接

## 当前状态

用户确认不希望现在做大规模后端重构。长期架构路线已写入 `指导大纲/长期路线/`。

## 本轮新增/更新

- 新增：`指导大纲/长期路线/RebornG-长期架构演进路线图-纯前端到薄后端.md`
- 更新：`指导大纲/长期路线/README.md`
- 更新：`指导大纲/长期路线/RebornG-活世界长期路线图-v0.11至v1.0.md`
- 更新：`指导大纲/长期路线/世界意图裁决引擎-设计总纲.md`
- 更新：`指导大纲/长期路线/大时代开局远期扩展池.md`
- 更新：`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- 更新：`AGENTS.md`
- 更新：`reborn-expert-council` skill

## 架构结论

不做大规模后端化。v1.0 前默认保持：

- 纯前端为主。
- 本地确定性 TypeScript core。
- 静态/public canon。
- Zustand 存档。
- DeepSeek runtime API。

但从 v0.12 起，必须 backend-ready：

- public fact / hidden fact / IF deviation point 分离。
- hidden fact body 不应成为公开前端长期必需数据。
- engine/canon helper 保持纯 TS、纯函数优先、无 DOM/React/browser 强依赖。
- route/supply/pursuit、reaction bridge、World Intent Engine 都要可迁移。

## 后端/BFF 触发门禁

以下情况出现时再专项评审：

- 公开版本需要隐藏 API key。
- hidden fact body 不能再打进公开前端包。
- 需要云存档或跨设备同步。
- DeepSeek 成本、cache hit/miss、retry 需要集中观测。
- 玩家行为需要防篡改。
- 多区域正史锚点网络导致 bundle 明显膨胀。
- 进入公开测试或 v1.0 发布准备。

## 外部参照

用户提到 B 站项目。公开检索显示最相关项目为 LingChat，GitHub 上开源，广度覆盖 RAG、角色、脚本、语音、情绪、视觉等。可借鉴组件化、后端辅助、内容生态和文档组织；不照搬玩法核心。RebornG 的差异是确定性 RPG 世界裁决、原著事实深度、正史/IF 门禁和工程化测试。

## 下一步

回到 `v0.12.0-a1`：

- 原著事实卡扩展。
- 正史锚点表。
- public / hidden / IF 分类。
- schema/test。

本轮只改文档和 skill，未改 runtime，未跑测试。
