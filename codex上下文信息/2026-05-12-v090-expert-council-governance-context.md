# 2026-05-12 v0.9.0 专家团工作制与 DeepSeek 治理上下文

日期：2026-05-12  
分支：`codex/v090-a3-beast-guardian-battlefield`  
任务：建立 RebornG 专家团工作制、项目治理入口、skill 路由和 DeepSeek 成本可观测基础。

## 当前事实

- `v0.9.0-a1/a2/a3` 已完成。
- 下一阶段为 `v0.9.0-b1`：统一“线索 -> 出发 -> 本地结算 -> 行动账本 -> 回流文本”协议。
- `package.json` 当前版本为 `0.9.0-a3.0`。
- 旧 v0.6/v0.7 专家团审查已标记为历史参考，不能再覆盖当前源码和 v0.9 文档事实。

## 本轮落地

- 新增 `指导大纲/v0.9.0/codex/00-总览/README.md`，作为 v0.9 Codex 当前入口。
- 新增 `v0.9.0-真相源索引.md` 和 `v0.9.0-决策记录.md`。
- 新增 `指导大纲/v0.9.0/codex/01-专家团工作制/`，包含章程、需求提案模板、版本审查模板、Codex 使用提醒、插件清单、DeepSeek 模型治理、视觉研发方向和 skill 镜像说明。
- 新增全局 skill：`C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`。
- 更新 `game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion` 三个全局 skill，补入 v0.9 当前事实和阶段完成后检查 skill 的规则。
- 更新标题页底部版本与模型显示，避免写死“DeepSeek V4 Pro”。
- `src/api/deepseek.ts` 增加模型配置、默认模型常量、prompt 前缀 hash、cache hit ratio。
- `src/engine/response-pipeline.ts` 透传 pipeline 级 token 汇总、缓存命中、重试 token、模型、temperature 和 prompt prefix hash，并修复日志中引用不存在变量的问题。
- 新增 `src/api/deepseek.test.ts` 覆盖模型默认/覆盖和缓存 telemetry。

## DeepSeek 边界

- 运行时默认模型由 `DEEPSEEK_DEFAULT_MODEL` 决定。
- 高质量或昂贵模型只用于评审或通过 eval 的对照测试。
- DeepSeek 只写叙事、候选、线索、传闻、请求和压力记录。
- 正式数值、奖励、位置、战斗结果、灾劫后果、宿命状态和结局由本地 canon/engine 决定。

## Codex 注意事项

- C 盘 40GB 可降低闪退风险，但不能保证不闪退。
- 不动 `hiberfil.sys`。
- 不清理 `.codex`、`plugins/cache`、`skills`、`state_*.sqlite`、`logs_*.sqlite`、`codex-runtimes`。
- 子代理默认只读；写入必须有明确文件所有权。
- 插件加载异常优先重启 Codex/CodeBuddy，让 marketplace 临时源重建，不要删除插件缓存。

## 验证记录

- `npm test -- src/api/deepseek.test.ts`：通过，1 file / 2 tests。
- `npm test`：通过，85 files / 523 tests。
- `npm run build`：通过；仅保留既有 chunk size 与 plugin timing 警告。
- `npm run test:e2e:long`：通过，18 Playwright tests。
- `npx tsc --noEmit`：本轮未作为阻断项；当前项目仍有历史类型债，已纳入专家团风险池。

## 后续建议

- 进入 `v0.9.0-b1` 前，先按专家团模板生成启动审查。
- b1 需求候选池：统一出发协议、DeepSeek 成本仪表、文档真相源收敛、青茅山凡战视觉竖切、Codex 插件恢复检查。
- 下一轮若开始视觉竖切，优先走“可读游戏 UI + 关键节点强演出”，不要全局重皮。
