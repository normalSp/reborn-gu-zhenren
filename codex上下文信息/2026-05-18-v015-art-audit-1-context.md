# 2026-05-18 v0.15-art-audit-1 上下文交接

## 当前状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 当前阶段：`v0.15-art-audit-1 美术资源治理与 v1.0 发布支撑专项`
- 阶段状态：已完成本地收束，资源/manifest 提交为 `37ad706 docs: 收束v0.15美术资源治理专项`
- 下一步：可恢复 `v0.15.0-b1 补给/喂养行动样板`

## 本阶段做了什么

- 按用户批准，保留方源/方正 style-sample 与风格母版候选归档。
- 将 roadmap 已接受的三张战斗候选图复制到稳定 public 路径：
  - `public/rebrng/scenes/s0-qingmao/xiong-li-squad-vs-bai-ning-bing.png`
  - `public/rebrng/scenes/s0-qingmao/fang-yuan-monkey-king-cavern-fight.png`
  - `public/rebrng/scenes/s0-qingmao/blood-lake-rank-five-battle.png`
- 选定 v1.0 hero 三件套到稳定 public 路径：
  - `public/rebrng/release/v1-hero/title-screen-hero.png`
  - `public/rebrng/release/v1-hero/edgeone-landing-hero.png`
  - `public/rebrng/release/v1-hero/og-share-image.png`
- 新增 `doc/art/v1-hero-selection-manifest.json`，记录三件套均为 `selected_candidate`，尚未绑定 UI/EdgeOne/OG。
- 更新 `src/canon/qingmao-visual-assets.json` 到 `v0.15-art-audit-1`：
  - 23 entries
  - active=4
  - candidate=12
  - review-only=6
  - blocked=1
- 补登记 9 张青茅泛用场景 SVG 为 `candidate + generic_candidate`。
- 三张既有 public 青茅剧情 PNG 与三张新入库战斗 PNG 均保持 `review-only + specific_scene_only`，不自动替换 runtime 背景。

## 明确没有做

- 未绑定标题页、EdgeOne 落地页或 OG 分享图。
- 未新增 runtime UI 入口。
- 未新增或修改存档字段。
- 未授予 DeepSeek 新权限。
- 未开放正式材料、元石、蛊虫、蛊方、市场、黑市、委托、地点、阵营或 NPC 生死结果。
- 未删除历史美术资源。

## 验证

```powershell
npm run check:qingmao-assets
npm run check:runtime-assets
```

结果：

- `check:qingmao-assets` 通过：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- `check:runtime-assets` 通过：173 files，audio=45，images=117，json=11，zero-byte=0。

## Git 与推送

- 资源/manifest/专项文档提交：`37ad706 docs: 收束v0.15美术资源治理专项`
- 状态交接提交：`687ac63 docs: 记录v0.15美术治理交接`
- 推送：已推送到 `origin/codex/v013-npc-faction-reaction`

## 下一阶段入口

恢复 `v0.15.0-b1` 前先读取：

- `指导大纲/v0.15.0/codex/00-总览/README.md`
- `指导大纲/v0.15.0/codex/00-总览/v0.15.0-a1-低阶经济炼养用设计门禁.md`
- `指导大纲/v0.15.0/codex/00-总览/v0.15.0-a2-候选规则池与schema第一刀.md`
- `指导大纲/v0.15.0/codex/00-总览/v0.15-art-audit-1-美术资源治理专项.md`

`v0.15.0-b1` 默认仍走保守路线：只在既有字段和受控 action protocol 内做补给/喂养行动样板。若需要正式材料/元石/库存消耗、市场、黑市、委托、存档字段或 DeepSeek 新权限，必须先停下来让用户决策。
