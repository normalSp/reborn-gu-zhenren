# v0.9.0-rc C-050 发布前走查预检交接

日期：2026-05-13

## 当前结论

- C-049 DeepSeek 默认模型切换已完成。
- C-050 发布前走查预检已完成，只新增验收记录，不改运行时玩法、数值、存档或世界观事实。
- 当前没有新的自动化阻断。

## 本轮验证

- `npm run check:runtime-assets`：通过；128 files，audio=45，images=72，json=11，zero-byte=0。
- `npm run check:qingmao-assets`：通过；7 entries，active=4，review-only=2，blocked=1。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts tests/e2e/v090-product-route-closure.spec.ts`：通过；6 tests。

## 更新文档

- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-rc-C050-发布前走查预检记录.md`
- `指导大纲/v0.9.0/codex/00-总览/README.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-开发阶段跟踪.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-小版本执行路线图.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-rc-风险池与发布核对表.md`

## 下一步边界

需要用户拍板的事项：

- 正式发布口径与发布渠道。
- 对外素材使用。
- 下一轮视觉扩展或单张 bitmap 慢产。
- DeepSeek 其他模型评估已按用户最新决定关闭。
