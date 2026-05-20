# 2026-05-20 脏区收束专项交接稿

## 当前状态

- 分支：`codex/v120-dirty-worktree-consolidation`
- 业务收束提交链截至：`2c7f7fa docs: 收束素材候选与验证证据`
- 本交接与推送状态提交后，最新 HEAD 以 `git log -1` 和最终回复为准。
- 推送：已推送到 `origin/codex/v120-dirty-worktree-consolidation`
- `git status --short`：clean
- `git status --short --ignored bgm`：仅剩 `bgm/v0.7/*.MP3` 音频被 ignore，作为本地 fan-pack 暂存，不是 runtime 资产。
- EdgeOne：未部署。

## 本次收束提交

1. `f7102de chore: 收束脏区制度并移除废弃测试存档`
   - 删除并 ignore `测试存档/`、`public/test-saves/`。
   - 删除旧 v070 fixture-loader 长测、旧生成脚本、旧测试存档单测。
   - 长 E2E 改为当前 Playwright harness/spec 覆盖。
   - 新增 `指导大纲/流程制度/Git脏区收束制度.md`。

2. `eb55971 feat: 收束v1.1路线地点状态地基`
   - 收束 v1.1 本地开发成果：`SAVE_FORMAT_VERSION = 23`、`routeLocationState`、v110 route/location engine/store/UI/tests/docs、D-025/C27 记录。

3. `2ff2771 feat: 完成v1.2低阶生存经济投影第一刀`
   - 收束 v1.2-b1 projection-only runtime、测试、Player Advocate、T0-lite 漂移记录和仪表盘。

4. `7274511 docs: 收束MiroFish资料层与基础包`
   - 收束 `指导大纲/vMiroFish/` 和全书基础包档案层。
   - 仍是 archive/source-pointer inventory，不是 canon、runtime、DeepSeek visible context。

5. `1252a7e chore: 强化脏区资产收束门禁`
   - `.cursor/`、旧测试存档、BGM 音频 ignore 规则固化。
   - `check:runtime-assets` 新增 `image-maps.ts` 引用存在性与 0 字节校验。
   - 同步 `AGENTS.md`、`PROJECT-STATE.md`、Git脏区制度、BGM sourcing guide、仪表盘和 v1.2 Git 计划。

6. `bf73c3c assets: 入库青茅蛊虫运行时图片映射`
   - 提交 27 张新增 `public/rebrng/gu/s0-qingmao/*.png`。
   - 同步 `src/data/image-maps.ts` 的 `GU_IMAGE_MAP`。
   - 收束 `doc/art/v014-to-v100-art-roadmap.md` 与旧 S0 roadmap 指针。

7. `2c7f7fa docs: 收束素材候选与验证证据`
   - 提交 `artifacts/**` 验证证据、`doc/art/candidates/**` 候选图。
   - 提交 `bgm/*.md`、`bgm/**/*.md`、`bgm/**/*.txt` 文本清单、歌词和风格说明。
   - 未提交根目录 BGM 音频。

## 专家团审计结论

### 已修正

- 旧测试存档目录仍可能被误当 active gate：已删除并 ignore，替代为 current e2e、replay/eval、Player Advocate 和 production-preview。
- `image-maps.ts` 引用图片缺少门禁：已并入 `npm run check:runtime-assets`，现在校验 83 个图片映射引用。
- `.cursor/` 本机配置可能被误提交：已 ignore。
- `指导大纲/大方向/` 与 `vMiroFish/美术/` 旧入口可能被误用：已删除，AGENTS/PROJECT-STATE/制度指向项目-owned docs。
- BGM 根目录口径不清：已定为本地 fan-pack 暂存；文本可追踪，音频默认 ignore，runtime 晋升需另批并登记 source manifest。

### 仍需保持的边界

- 不自动部署 EdgeOne。
- 不新增 `SAVE_FORMAT_VERSION = 24` 或 `survivalEconomyState`。
- 不开放正式库存、价格、交易、消耗、维护、炼蛊失败代价、黑市、委托或稳定套利。
- 不扩大 DeepSeek 权限。
- 不把 MiroFish 基础包或知识库直接喂给 runtime、UI 或 DeepSeek。
- 不把 D-025 小规模 probe 写成大规模长线 live narrative quality 已完全验证。

## 最终验证

- `npm test`：141 files，778 tests 通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run check:runtime-assets`：163 runtime files，83 image-map refs，zero-byte=0。
- `npm run check:qingmao-assets`：23 entries 通过。
- `npm run check:player-visible-copy`：273 files scanned，通过。
- `npm run build`：通过。
- `npm run test:e2e:long`：7 tests 通过。
- `npm run check:production-preview`：通过；预览仍显示已批准的 `v1.0.0` public release label。

## 后续建议

1. 若继续 v1.2-b2，先回到用户决策门：是否批准 `SAVE_FORMAT_VERSION = 24`、`survivalEconomyState`、最小 ledger 或只读资源视图。
2. 若要启用根目录 BGM 音频，必须单独做音频晋升小专项：版权/来源口径、`public/audio/` 目标路径、`audio-source-manifest`、运行时引用和扫描验证。
