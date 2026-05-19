# 2026-05-19 v1.0.0-process-1 预览回滚与观测上下文交接

## 当前状态

- 分支：`codex/v013-npc-faction-reaction`
- 阶段：`v1.0.0-process-1 预览回滚与观测清单`
- 状态：流程文档已建立，本地 production smoke 与远端 CI 通过
- MiroFish：不需要新包
- 存档版本：`SAVE_FORMAT_VERSION = 22`，未变更
- DeepSeek：`deepseek-v4-flash`，未扩权

## 主要落地

新增：

- `指导大纲/v1.0.0/codex/00-总览/v1.0.0-process-1-预览回滚与观测清单.md`

修改：

- `README.md`
- `v1.0.0-小版本执行路线图.md`
- `v1.0.0-Git提交与推送计划.md`
- `v1.0.0-真相源索引.md`
- `指导大纲/项目仪表盘.md`

## 禁写边界

本阶段不做自动部署、不改 EdgeOne 配置、不改 branch protection、不新增 runtime 功能、不新增外部依赖、不生成新图、不发布公告。

## 待验证

- `npm run check:production-preview`：通过，本地预览 `http://127.0.0.1:4182/?e2e=1`，无 P0/P1 runtime error。
- Git：commit `0c2ed24 docs: 建立v1.0预览回滚与观测清单`，已推送。
- GitHub Actions：run `26097693808` 通过。

## 下一步

1. 进入 `v1.0.0-rc`。
