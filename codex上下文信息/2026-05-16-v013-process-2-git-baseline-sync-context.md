# 2026-05-16 v0.13.0-process-2 Git 基线同步交接

## 状态

`v0.13.0-process-2 Git 基线同步专项` 已完成。

用户此前选择方案 A：先把 v0.13 当前成果锁进 Git/GitHub，再进入 `v0.13.0-rc`。

## 本轮完成

- 建立 `v0.13.0-process-2-Git基线同步专项.md`。
- 同步本地已验证历史工程基线到当前分支：
  - 配置、源码、测试、脚本、public test saves、Qingmao public runtime assets。
  - v0.10-v0.13 项目-owned 大纲、MiroFish 协议/评审、长期路线、上下文交接、`PROJECT-STATE.md`。
  - 旧根目录大纲文档迁移到 `指导大纲/v0.6.0之前的文档/`。
- 排除：
  - `RebornG_codebuddy.zip`
  - `artifacts/`
  - `bgm/`
  - `指导大纲/大方向/`
- 移除两个旧测试脚本里的硬编码 DeepSeek-key 形状默认值，改为仅使用 `DEEPSEEK_API_KEY` 环境变量。
- 修复 GitHub Actions Node 基线：
  - `.github/workflows/ci.yml` 从 Node `22.11.0` 调整为 `22.12.0`。
  - 原因：Vite/Rolldown engine 要求 `^20.19.0 || >=22.12.0`，22.11.0 会出现 optional native binding 问题。

## 验证

本地：

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：121 个 test file、689 个测试通过。
- `npm run build`：通过。
- `npm run check:runtime-assets`：通过，131 files，zero-byte=0。
- `npm run check:qingmao-assets`：通过，10 entries。
- `npm run check:player-visible-copy`：通过，238 files scanned。
- `git diff --cached --check`：机械清理 staged 文本尾随空格后通过。

远端：

- run `25965599827`：失败，原因是 Node 22.11.0 下 Rolldown Linux native optional binding 未安装。
- run `25965710557`：通过，deterministic quality gate 全绿。

## Git

- 当前分支：`codex/v013-npc-faction-reaction`。
- 已推送：
  - `4ed7b9a chore: 同步v0.13历史工程基线`
  - `66a1dbb ci: 修正v0.13远端Node基线`
- 本交接文件待随收尾文档提交。

## 后续

下一步进入 `v0.13.0-rc` 质量收束。

仍需停下来找用户决策的事项：

- 持久化社会账本。
- 命名 NPC runtime rule。
- 正式声望/通缉/招揽/任务网络。
- DeepSeek 新写入权。
- branch protection、自动部署 EdgeOne、PR 默认强制 full Playwright。

当前不需要新增 MiroFish 包。

## 注意

- `edgeone.json` 仍固定 Node `22.11.0`，本刀没有修改 EdgeOne 部署配置。后续公共部署前需要单独确认 EdgeOne 支持的 Node 版本是否应与 Vite/Rolldown engine 对齐。
- 旧 key 形状字符串已经从 HEAD 移除，但如果它是真实可用 key，应在 DeepSeek 控制台轮换。
