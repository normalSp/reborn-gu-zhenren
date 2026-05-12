# Codex 使用提醒

## 稳定性

- C 盘约 40GB 可显著降低闪退风险，但不能保证不闪退。
- 长任务每完成一个阶段都要写上下文交接，避免线程崩溃后丢失事实。
- 不动 `hiberfil.sys`，除非用户再次明确要求。
- 不清理 `.codex`、`plugins/cache`、`skills`、`state_*.sqlite`、`logs_*.sqlite`、`codex-runtimes`。

## 子代理

- 子代理默认只读，用于审查、对照、查漏。
- 只有明确授权、明确写入文件范围、且写入范围不重叠时，才让子代理改文件。
- 当前关键路径不要交给子代理独自完成。
- 子代理结论进入主线程后，必须由主线程整合并验证。

## 插件加载异常

- 如果 Codex 看不到插件，先完全退出并重启 Codex/CodeBuddy，让 `.codex/.tmp` 下 marketplace 临时源自动重建。
- 不要直接删除 `C:\Users\11411\.codex\plugins\cache`。
- 如仍异常，先备份 `config.toml`、`.codex-global-state.json`、`state_5.sqlite`，再考虑重建 marketplace 配置。

## 每次迭代前

- 先读最新 `codex上下文信息` 和 `00-总览/README.md`。
- 检查当前阶段、下一阶段、版本号、存档协议、测试结果是否一致。
- 判断是否需要更新 `reborn-expert-council` 或三个核心 skill。
