# RebornG 美术总路线图：v0.14 → v1.0

日期：2026-05-17
状态：阶段台账；v0.14 → v1.0 已按批次入库一部分资产，后续新批次仍需逐批审批
范围：从当前 `v0.14.0 青茅后续路线承接` 起，到 `v1.0 早期正式版` 为止的全部美术资产缺口与执行节奏

本文档是 RebornG 当前的美术总入口，取代 `doc/art/s0-qingmao-art-roadmap.md` 作为后续新增图、重做图、记录缺图、调整构图规则时的优先更新对象。旧 roadmap 保留为 S0 青茅第一卷的细节档案。

## 决策依据

下列用户决策已在 2026-05-17 收下，作为后续美术执行的 boundary input：

1. 全量审计：先看 v0.14 → v1.0 完整缺口，再分批立项。
2. 风格母版：重新生成一张新母版，验收后作为后续锁。
3. 工具与节奏：由 Cursor `GenerateImage` 出图；母版通过后允许小批量批跑，**不再硬约束单张慢产**。仍保留 Composition Contract、原著边界、Quality Drift Watch、设定色优先。

`reborn-expert-council` 阶段门禁仍生效：任何美术批次完成前，仍按 hard rule 检查不得隐含 Immortal Gu、十转、永生、宿命蛊归属、凡人宝黄天交易。

## 现有真实状态（2026-05-17 校对）

按 `public/rebrng/` 实际磁盘文件统计，下方与旧 roadmap 中的"`apps/desktop/src/assets/rebrng/`"路径不同；现行项目根本不存在 `apps/desktop/`，旧 roadmap 的目录引用全部以本表为准。

| 类型 | 数量 | 路径 | 运行时绑定 |
|---|---:|---|---|
| 蛊虫图鉴（S0 青茅） | 59 PNG | `public/rebrng/gu/s0-qingmao/` | `src/data/image-maps.ts` 的 `GU_IMAGE_MAP` 按蛊名映射，`GuInventoryPanel`/`MerchantPanel` 消费 |
| 原著角色 | 25 PNG（含 2 个 style-sample） | `public/rebrng/characters/canon/` | `CHAR_IMAGE_MAP` 在 `CharacterPanel` 按 NPC 名映射 |
| 原创角色 | 9 PNG（含 1 个 style-sample） | `public/rebrng/characters/original/` | 未在 `image-maps.ts` 中映射，目前是预留 |
| 场景图 | 6 PNG + 13 SVG | `public/rebrng/scenes/s0-qingmao/` | `qingmao-visual-assets.json` 管理：1 个 SVG background active、12 个 SVG candidate、6 个 PNG review-only |

`src/canon/qingmao-visual-assets.json` 的 `runtime_active` 白名单当前只包含：月光蛊、白玉蛊、酒虫；以及青茅凡战泛用底图 SVG 加 3 个候选 SVG 变体。春秋蝉 PNG 状态是 `blocked`，与 b3 凡战切片对齐。

`earthwolf-spider-third-battle.png` 等 6 张场景 PNG 已登记为 `review-only`；不得直接升级为 active background，除非后续场景绑定和 Composition Contract 另过门。

## 风格母版（gate-A）

旧 `quality-lock-master.png`（`output/imagegen/s0-qingmao/style-calibration/`）不在当前仓库内，已断链。

**当前生效母版**（2026-05-17 用户验收通过）：

- 标识：`qingmao-quality-lock-master-v2.png`
- 落地路径：`doc/art/style-lock/qingmao-quality-lock-master-v2.png`
- 候选源：`doc/art/style-lock/qingmao-quality-lock-master-v2-candidate-01.png`
- 实际尺寸：`1536x1024`（3:2，目标 `1672x941` ≈ 16:9；OpenAI 图生只支持 1024/1024、1536/1024、1024/1536 三档，母版仅锁视觉语言不锁尺寸；后续战斗 PNG 仍按 `1672x941` 单图生成或裁切）
- 主体：方源（普通蛊师装束，非原著具体战斗节点）vs 一个泛用低阶冰道蛊师，青茅山泛凡战；不绑定原著具体身份/章节；电锯金蜈作为手持蛊兵；冷月刃单条干净弧带；冰锥群作为冷光 rim
- 视觉目标：复现旧"样图 04"的画面流畅感——电影感大色块、低纹理密度、连续边缘光、灰绿冷雾、设定色优先
- 反目标：保留旧文档 `Avoid generic AI fantasy polish...` 全套反 AI 约束
- 通过状态：accepted（候选 01 通过 Quality Drift Watch 全项；面部克制度与前景岩石碎度为可接受弱点）
- 用法：后续所有 PNG（蛊图鉴 / 角色 / 场景 / 战斗 / 闪图）的视觉锁；同批连续两张出现碎、糊、设定色污染时停批复盘

## 节奏约定（替代旧 Single Image Cadence）

- 风格母版通过前：仍是单张。
- 风格母版通过后：
  - 蛊虫图鉴（标本卡片，构图稳定）：每批最多 4-6 张，批内必须按 Quality Drift Watch 抽检至少 2 张。
  - 杀招/仙蛊闪图：每批最多 4-6 张，构图统一（正方/近方、纯色背景、强压迫）。
  - 角色立绘：每批最多 2-3 张，避免脸型同质化。
  - 战斗场景图：仍**单张慢产**，每张要有独立 Composition Contract。
  - 区域大景 / 城景：单张慢产。
  - 场景泛用 SVG：可批量，因为生成成本主要在写 SVG，不消耗 image gen。
- 失败处理：批次内任何一张被拒，剩余张数停下，先复盘 prompt，不连续补抽。

## 路径与运行时白名单约定

- 蛊图鉴 PNG → `public/rebrng/gu/<sx>-<region>/<name>.png`；候选目录 → `doc/art/candidates/gu/<sx>-<region>/`。
- 原著角色 PNG → `public/rebrng/characters/canon/`；候选目录 → `doc/art/candidates/characters/canon/`。
- 原创角色 PNG → `public/rebrng/characters/original/`；候选目录 → `doc/art/candidates/characters/original/`。
- 场景 PNG → `public/rebrng/scenes/<sx>-<region>/`；候选目录 → `doc/art/candidates/scenes/<sx>-<region>/`。
- 场景 SVG → `public/rebrng/scenes/<sx>-<region>/<variant>.svg`，**不走候选目录**，直接 PR 评审。
- 杀招/仙蛊闪图 → `public/assets/battle/immortal_gu/`（`src/canon/battle-asset-manifest.json` 已使用此路径，目前文件不存在，需新增）。
- 入库后必须同步：`qingmao-visual-assets.json`（或对应区域 visual-assets JSON）+ `src/data/image-maps.ts`（蛊/角色映射）+ 本 roadmap 的"已入库登记"。

候选目录如不存在则在生图时按需创建；旧文档里的 `output/imagegen/...` 与 `output/archive/...` 已废弃，不再作为候选/归档路径。

## 缺口清单：按版本分

### v0.14（当前版）— optional

v0.14 主线是只读路线条件 + 一个前置行动样板。设计上 0 张美术 blocking。

| 优先级 | 资产 | 数量 | 类型 | 备注 |
|---|---|---:|---|---|
| optional | 青茅离开方向标 / 山道分岔泛用氛围 | 1 | SVG | 给 b4 路线承接 UI 用；不绑定具体南疆地点 |
| optional | "遮掩痕迹"行动卡氛围 | 1 | SVG | 已落地 b1 行动用；当前文字+CSS 可兜底 |

### v0.15 — 蛊师经济/炼蛊/喂养（最大具体缺口）

以 `doc/art/s0-qingmao-gu-atlas.md` 的 P0/P1/P2 清单 ∩ 已映射 ∩ 已入库为差，按外观依据强弱分四组：

#### D1. 方源/功能蛊（外观依据可生，约 9 张）

泥皮癞蛤蟆、掠夺蛊、石窍蛊、水罩蛊、奴熊蛊、清水蛊、水行防御蛊、雷翼蛊、天蓬蛊

构图：标本卡片，旧纸底色，单蛊主体，限定底色道法标识。可在母版锁后小批量。

#### D2. 方源/血道/合炼蛊（外观依据可生，约 5 张）

血气蛊、血月蛊、兜率花、雷盾蛊、生铁蛊

构图：同上。可与 D1 合批。

#### D3. 方源/金道/坐骑蛊（外观依据弱，约 3 张，**MiroFish 已交付**）

生铁蛊（曾用候选名"猪铁蛊"，原文锚 ch_0177/0178）、千里地狼蛛（坐骑形态）、阳蛊 / 阴蛊（与阴阳转身蛊配对关系）

#### D4. 白凝冰路线（外观依据弱，约 4 张，**部分需 MiroFish 第二轮**）

- 可入批：旋风蛊（功能锚命中、外观推断）
- atlas-pending/no-png（本轮剔出）：漩涡蛊、烈风蛊、雷眼蛊（第一卷无外观锚，待 MiroFish 第二轮请求扩展窗口）

#### D5. 铁血冷路线（外观依据弱，约 6 张，**MiroFish 已交付**）

正气蛊、铁手擒拿蛊（拳形是显化）、油龙蛊（黑油龙是显化）、火龙蛊（火龙是显化）、山丘巨傀蛊（曾用候选名"巨山傀儡蛊"，本体为青铜面罩、山泥巨傀是显化）、镇魔铁索蛊（曾用候选名"镇魔铁链蛊"，铁索是封印效果）

#### D6. 天鹤上人路线（外观依据弱，约 4 张，**MiroFish 已交付，部分需第二轮补强**）

- 可入批：御鹤蛊（曾用候选名"驭鹤蛊"）、至亲血虫（曾用候选名"血亲蛊"，原文为红玛瑙透明蝉形）、存息玉葬蛊（曾用候选名"玉葬续命蛊"，玉棺/玉茧为效果）
- atlas-pending（本轮剔出）：扬眉吐气蛊（仅功能锚命中、第一卷无标本外观；intake review summary 评为 `direct_name_function_only`，标本图应暂缓，待 MiroFish 第二轮第 130-150 章窗口或第二卷早期窗口扩展请求）

> 命名硬约束（来自 `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao-unfilled-gu-appearance-pack-intake-review.md` + R2 `qingmao-unfilled-gu-appearance-extension-pack-r2-intake-review.md`）：D3 / D5 / D6 中 6 行的请求名（猪铁蛊、巨山傀儡蛊、镇魔铁链蛊、驭鹤蛊、血亲蛊、玉葬续命蛊）属于翻译/转写偏差，**不得作为硬 canon** 出现在 atlas / image-maps / DeepSeek 上下文 / UI / tests；只能保留为「曾用候选名」。R2 追加 1 项命名硬约束：**雷眼蛊 → 电眼蛊**（用户 2026-05-18 单点确认；R2 intake review 命中证据为 `电眼蛊` 9 次 vs `雷眼蛊` 0 次，功能锚一致 confidence=high；同 R1 6 项处理方式，atlas/image-maps 实际改动延期到下次 atlas 整理批次；本轮不动 `doc/art/s0-qingmao-gu-atlas.md` / `src/data/image-maps.ts` / `src/canon/qingmao-visual-assets.json`，但 DeepSeek 上下文与玩家可见 UI 即刻生效，不再使用 `雷眼蛊` 候选名）。`D5/D6` 的 effect-only 项生图时必须画虫体本体为主、能力效果只能做氛围光或小幅环境元素。

#### D7. 经济场景泛用底图 SVG（约 4 张）

坊市摊位、客栈酒肆、商队驻地、夜间黑市。全部 SVG，跟 `qingmao-resource-grove-variant.svg` 一类做法。

v0.15 美术合计上限：约 31 张蛊 PNG + 4 张场景 SVG。其中 D3+D4+D5+D6 17 行的 MiroFish 外观依据包已于 2026-05-17 交付并通过 intake review（见 `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao-unfilled-gu-appearance-pack-intake-review.md`）；其中 `漩涡蛊 / 烈风蛊 / 雷眼蛊` 三只第一卷无外观锚，保留 atlas-pending/no-png，本轮不入批。

### v0.16 — 战斗/杀招/小队深化

| 子类 | 数量 | 类型 | 节奏 |
|---|---:|---|---|
| 旧战斗图清单待补（雷冠狼村战、熊力小组对白凝冰、方源猴王洞窟、一代对铁血冷鹤乱、血湖五转战候选 02 入库） | 5 | PNG，1672×941 | 单张慢产 |
| 杀招/重要仙蛊闪图（春秋蝉、人如故、鸿运齐天等；当前 `battle-asset-manifest.json` 已声明路径但文件不存在） | 6-10 | PNG，正方/近方，纯色背景 | 可批量 |
| 新棋盘地形 SVG（山道追击、河岸、洞窟） | 3 | SVG | 可批量 |

杀招闪图的资产路径由 `src/canon/battle-asset-manifest.json` 决定，落地后必须把 `assetPath` 改成实际路径并补建 `public/assets/battle/immortal_gu/` 目录。

### v0.17 — 多区域正史锚点网络（南疆/商家城/三王山/义天山）

**几乎 100% 需要 MiroFish 前置**。当前 `shang_clan_city_public_entry_pack` 在 v0.14 是 deferred，要做正式商家城美术必须先升级该包优先级或追加新包。

| 子类 | 估算 | 外观依据 | MiroFish |
|---|---:|---|---|
| 南疆/商家城/三王山/义天山区域大景 | 6 | 弱 | blocking |
| 商家城坊市/拍卖行/城门场景 | 3 | 弱 | blocking |
| 关键新原著角色立绘（商心慈、张心慈、龙公、商家城关键人物） | ~6 | 弱 | blocking |
| 南疆散修/三族外姓代表（原创+原著） | ~4 | 中 | preferred |

建议这一批不进入 v0.14/v0.15 排期，跟着 v0.17 系统冻结一起做。

### v0.18 — 蛊仙期门槛

按当前 hard rule，禁止暗示 Immortal Gu、十转、永生、宿命蛊归属、凡人宝黄天交易。
**v0.18 美术不在当前可执行范围**。等用户决策正式打开 v0.18 门禁再列。

### v0.19 — 内容工具/CI/长测

0 张美术。

### v1.0 — 发布收束

| 资产 | 数量 | 备注 |
|---|---:|---|
| 标题屏背景 / 版本 banner 美化 | 1 | 当前 `TitleScreen.tsx` 用 SVG/CSS 兜底，可保留 |
| EdgeOne 落地页 hero / OG share image | 1-2 | 公测准备前 |
| Player Advocate 60 轮走查产生的可读性补图 | 不可预先估 | rc 阶段按需补 |

## 时序与批次建议

| 时序 | 工作包 | 估算张数 | 是否 blocking | 是否可批量 | MiroFish |
|---|---|---:|---|---|---|
| 第 1 步 | A 风格母版重做 | 1 | 阻塞后续所有 PNG | 否 | not_needed |
| 第 2 步 | B 文档路径同步与白名单补登 | 0 | 否 | 纯文档 | not_needed |
| 第 3 步 | C v0.14 optional SVG | 0-2 | 否 | 可批 | not_needed |
| 第 4 步 | D1 + D2 14 张蛊 PNG | 14 | 否 | 是 | not_needed |
| 第 5 步 | E2 杀招/仙蛊闪图 | 6-10 | 否 | 是 | not_needed |
| 第 6 步 | D3 + D4 + D5 + D6 蛊 PNG | 14（剔除 atlas-pending 3 只） | 否，MiroFish 已交付 | 是 | delivered（`qingmao_unfilled_gu_appearance_pack`，2026-05-17 intake review accepted） |
| 第 7 步 | E1 战斗图 5 张 | 5 | 否 | 否（单张慢产） | not_needed |
| 第 8 步 | E3 + D7 SVG | 7 | 否 | 是 | not_needed |
| 远期 | F v0.17 多区域 + 角色 | ~19 | 否 | 视依据 | blocking |
| 远期 | G v0.18 蛊仙期 | 0（当前） | 否 | — | — |
| 远期 | H v1.0 发布 | 2-3 + rc 补图 | 否 | — | — |

近期可执行总量（第 1-5、第 7-8 步）：约 30 次生图调用 + ≤17 张待 MiroFish。

## 已入库登记（live ledger）

按入库时间顺序维护。每次入库必须同步更新本表 + `qingmao-visual-assets.json`（或对应 visual-assets JSON）+ `image-maps.ts`。

| 日期 | 文件 | 类型 | 状态 | 关联文档 |
|---|---|---|---|---|
| ≤2026-04-29 | 见 `s0-qingmao-art-roadmap.md` 与 `s0-qingmao-gu-atlas.md` | S0 青茅各类 | 历史入库 | 旧 roadmap |
| 2026-05-13 | `qingmao-mortal-battlefield-generic-atmosphere.svg` | 场景泛用 SVG | runtime_active | `v0.9.0-b3-5-C035-...md` |
| 2026-05-15 | `qingmao-clan-school-courtyard-variant.svg` / `qingmao-mountain-patrol-ridge-variant.svg` / `qingmao-resource-grove-variant.svg` | 场景候选 SVG | candidate | v0.10-b4 |
| 2026-05-17 | `doc/art/style-lock/qingmao-quality-lock-master-v2.png` (源 `qingmao-quality-lock-master-v2-candidate-01.png`，`1536x1024`) | 风格母版 v2 | accepted（gate-A 通过） | 本 roadmap "风格母版（gate-A）" |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/mudskin-toad-gu.png`（源 `doc/art/candidates/gu/s0-qingmao/mudskin-toad-gu-candidate-01.png`） | D1 蛊 | accepted（D1+D2 batch 1） | 本 roadmap D1；`GU_IMAGE_MAP['泥皮癞蛤蟆']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/plunder-gu.png`（源同名 candidate-01） | D1 蛊 | accepted（D1+D2 batch 1） | 本 roadmap D1；`GU_IMAGE_MAP['掠夺蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/stone-aperture-gu.png`（源同名 candidate-01） | D1 蛊 | accepted（D1+D2 batch 1） | 本 roadmap D1；`GU_IMAGE_MAP['石窍蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/water-shield-gu.png`（源同名 candidate-01） | D1 蛊 | accepted（D1+D2 batch 1） | 本 roadmap D1；`GU_IMAGE_MAP['水罩蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/bear-enslavement-gu.png`（源同名 candidate-01） | D1 蛊 | accepted（D1+D2 batch 1） | 本 roadmap D1；`GU_IMAGE_MAP['奴熊蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/living-steel-gu.png`（源 `doc/art/candidates/gu/s0-qingmao/living-steel-gu-candidate-02.png`；候选 01 因 toad 参考污染主体形态被拒，candidate-02 复盘后通过） | D3 蛊（原著名）| accepted（D3+D5+D6 batch 6a；命名对齐后入库，**不采用候选名"猪铁蛊"**） | 本 roadmap D3；`GU_IMAGE_MAP['生铁蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/thousand-li-earthwolf-spider.png`（源同名 candidate-01） | D3 蛊 | accepted（batch 6a） | 本 roadmap D3；`GU_IMAGE_MAP['千里地狼蛛']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/yang-gu.png`（源同名 candidate-01） | D3 蛊（阴阳转身蛊配对暖半）| accepted（batch 6a） | 本 roadmap D3；`GU_IMAGE_MAP['阳蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/yin-gu.png`（源同名 candidate-01） | D3 蛊（阴阳转身蛊配对冷半）| accepted（batch 6a） | 本 roadmap D3；`GU_IMAGE_MAP['阴蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/hill-giant-puppet-gu.png`（源同名 candidate-01） | D5 蛊（原著名；本体青铜面罩，effect-only 远景巨傀）| accepted（batch 6b；**不采用候选名"巨山傀儡蛊"**）| 本 roadmap D5；`GU_IMAGE_MAP['山丘巨傀蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/righteous-gu.png`（源同名 candidate-01） | D5 蛊（concept-only，最薄风险）| accepted（batch 6b） | 本 roadmap D5；`GU_IMAGE_MAP['正气蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/ironfist-grappling-gu.png`（源同名 candidate-01） | D5 蛊（effect-only：拳影远景）| accepted（batch 6b） | 本 roadmap D5；`GU_IMAGE_MAP['铁手擒拿蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/oil-dragon-gu.png`（源同名 candidate-01） | D5 蛊（effect-only：油龙远景）| accepted（batch 6b） | 本 roadmap D5；`GU_IMAGE_MAP['油龙蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/fire-dragon-gu.png`（源同名 candidate-01） | D5 蛊（effect-only：火龙远景 + 余烬）| accepted（batch 6b） | 本 roadmap D5；`GU_IMAGE_MAP['火龙蛊']` |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/whirlwind-gu.png`（源同名 candidate-01） | D4 蛊（功能锚命中 + 外观推断；漩涡/烈风/雷眼三只仍 atlas-pending） | accepted（batch 7；D4 finish 1/4，其余待 MiroFish R2） | 本 roadmap D4；`GU_IMAGE_MAP['旋风蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/demon-suppression-iron-rope-gu.png`（源同名 candidate-01） | D5 蛊（原著名；effect-only：铁索墙作封印氛围光） | accepted（batch 7；D5 finish 6/6；**不采用候选名"镇魔铁链蛊"**） | 本 roadmap D5；`GU_IMAGE_MAP['镇魔铁索蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/crane-control-gu.png`（源同名 candidate-01） | D6 蛊（原著名；别名功能锚命中、外观推断） | accepted（batch 7；**不采用候选名"驭鹤蛊"**） | 本 roadmap D6；`GU_IMAGE_MAP['御鹤蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/kinship-bloodworm.png`（源同名 candidate-01） | D6 蛊（原著名；红玛瑙透明蝉形发光，本体直证强锚） | accepted（batch 7；**不采用候选名"血亲蛊"**，原著为"虫"非"蛊"） | 本 roadmap D6；`GU_IMAGE_MAP['至亲血虫']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/jade-burial-life-gu.png`（源同名 candidate-01） | D6 蛊（原著名；effect-only：玉棺/玉茧作能力效果环境光，本体未明示） | accepted（batch 7；D6 finish 3/4，扬眉吐气蛊保留 atlas-pending；**不采用候选名"玉葬续命蛊"**） | 本 roadmap D6；`GU_IMAGE_MAP['存息玉葬蛊']`；intake review qingmao-unfilled-gu-appearance-pack |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/cleansing-water-gu.png`（源同名 candidate-01） | D1 蛊（水道/净化；净水液滴意象） | accepted（batch 8；D1 finish 1/4） | 本 roadmap D1；`GU_IMAGE_MAP['清水蛊']`；atlas 第 27 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/aqua-defense-gu.png`（源同名 candidate-01） | D1 蛊（水道/防御；层叠水壳板） | accepted（batch 8；D1 finish 2/4） | 本 roadmap D1；`GU_IMAGE_MAP['水行防御蛊']`；atlas 第 28 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/lightning-wings-gu.png`（源同名 candidate-01） | D1 蛊（雷道/移动；折叠虫翅 + 微弱电脉络） | accepted（batch 8；D1 finish 3/4） | 本 roadmap D1；`GU_IMAGE_MAP['雷翼蛊']`；atlas 第 29 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/sky-canopy-gu.png`（源同名 candidate-01） | D1 蛊（水道/防御；苍白穹顶壳） | accepted（batch 8；D1 finish 4/4） | 本 roadmap D1；`GU_IMAGE_MAP['天蓬蛊']`；atlas 第 30 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/blood-essence-gu.png`（源同名 candidate-01） | D2 蛊（血道/合炼材料；暗红珠核 + restrained 红雾，no-gore） | accepted（batch 8；D2 finish 1/4） | 本 roadmap D2；`GU_IMAGE_MAP['血气蛊']`；atlas 第 31 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/blood-moon-gu.png`（源同名 candidate-01） | D2 蛊（月道+血道攻击；血色月刃意象 + 银灰冷边） | accepted（batch 8；D2 finish 2/4） | 本 roadmap D2；`GU_IMAGE_MAP['血月蛊']`；atlas 第 32 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/tusita-flower.png`（源同名 candidate-01） | D2 蛊（木道/储物；折叠花瓣作袋形 + 内核虫感） | accepted（batch 8；D2 finish 3/4） | 本 roadmap D2；`GU_IMAGE_MAP['兜率花']`；atlas 第 33 行 |
| 2026-05-17 | `public/rebrng/gu/s0-qingmao/lightning-shield-gu.png`（源同名 candidate-01） | D2 蛊（雷道/防御；厚盾甲壳 + 微弱蓝白电纹） | accepted（batch 8；D2 finish 4/4） | 本 roadmap D2；`GU_IMAGE_MAP['雷盾蛊']`；atlas 第 35 行 |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-marketplace-stall-variant.svg` | D7 经济场景 SVG（坊市摊位；棚架轮廓 + 红/暖灯笼点缀 + 群众剪影暗示） | candidate（batch 9-svg；未入 visual-assets.json） | 本 roadmap D7；场景 SVG 不走候选目录直接 PR 评审 |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-tavern-inn-variant.svg` | D7 经济场景 SVG（客栈酒肆；门口暖光 + 红灯笼串 + 招牌窗格暗示） | candidate（batch 9-svg；未入 visual-assets.json） | 本 roadmap D7；场景 SVG 不走候选目录直接 PR 评审 |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-caravan-camp-variant.svg` | D7 经济场景 SVG（商队驻地；远山叠层 + 三角帐篷剪影 + 中央营火 + 货堆暗示） | candidate（batch 9-svg；未入 visual-assets.json） | 本 roadmap D7；场景 SVG 不走候选目录直接 PR 评审 |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-night-market-variant.svg` | D7 经济场景 SVG（夜间黑市；夯土墙剪影 + 兜帽人影 + 极弱红/暖光点 + 冷雾） | candidate（batch 9-svg；未入 visual-assets.json） | 本 roadmap D7；场景 SVG 不走候选目录直接 PR 评审 |
| 2026-05-17 | `doc/art/candidates/battle/killer_move_generic/killer-move-gold-path-flash-candidate-01.png` | A 杀招闪图候选（金道，1:1 试色；正方/纯色暗金底 + 中央放射爆点） | candidate（batch 10-A；未入 `battle-asset-manifest.json` `killer_move_generic.assetPath`；纯凡级泛用，非仙蛊） | 本 roadmap §v0.16 杀招/仙蛊闪图；流派色泛用，可后续绑 manifest 兜底 |
| 2026-05-17 | `doc/art/candidates/battle/killer_move_generic/killer-move-water-path-flash-candidate-01.png` | A 杀招闪图候选（水道；冷蓝青底 + 单条流体波刃） | candidate（batch 10-A；未入 manifest；纯凡级） | 同上 |
| 2026-05-17 | `doc/art/candidates/battle/killer_move_generic/killer-move-fire-blood-path-flash-candidate-01.png` | A 杀招闪图候选（火/血道；暗红底 + 角形火焰刃，no-gore） | candidate（batch 10-A；未入 manifest；纯凡级） | 同上 |
| 2026-05-17 | `doc/art/candidates/battle/killer_move_generic/killer-move-lightning-path-flash-candidate-01.png` | A 杀招闪图候选（雷道；冷蓝紫底 + 锯齿电脉络） | candidate（batch 10-A；未入 manifest；纯凡级） | 同上 |
| 2026-05-17 | `doc/art/candidates/battle/mortal_gu/moonlight-gu-attack-effect-candidate-01.png` | B 凡级蛊技 effect 候选（月光蛊 attack；冷银月刃单条横切弧） | candidate（batch 10-B；未升级 `qingmao-visual-assets.json` 月光蛊 entry） | 本 roadmap §v0.16；月光蛊 已 active（runtime_active），可作 strike-frame 升级 |
| 2026-05-17 | `doc/art/candidates/battle/mortal_gu/white-jade-gu-defense-effect-candidate-01.png` | B 凡级蛊技 effect 候选（白玉蛊 defense；玉白半透穹顶 + 极弱青绿 rim） | candidate（batch 10-B；未入 manifest；底部多余地形可裁切） | 本 roadmap §v0.16；白玉蛊 已 active |
| 2026-05-17 | `doc/art/candidates/battle/mortal_gu/liquor-worm-support-effect-candidate-01.png` | B 凡级蛊技 effect 候选（酒虫 support；暖琥珀内旋窍光） | candidate（batch 10-B；未入 manifest） | 本 roadmap §v0.16；酒虫 已 active |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-mountain-pass-pursuit-variant.svg` | C 棋盘地形 SVG（山道追击；多层山脊 + 前景巡查队三身影 + 右上远火光暖点） | candidate（batch 10-C；未入 visual-assets.json） | 本 roadmap §v0.16 棋盘地形 SVG |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-river-bank-variant.svg` | C 棋盘地形 SVG（河岸；冷青河面光纹 + 芦苇剪影 + 远岸轮廓 + 漂木暗示） | candidate（batch 10-C；未入 visual-assets.json） | 同上 |
| 2026-05-17 | `public/rebrng/scenes/s0-qingmao/qingmao-cave-interior-variant.svg` | C 棋盘地形 SVG（洞窟；钟乳石/石笋纵切 + 左下火把暖光 radial + 守夜剪影） | candidate（batch 10-C；未入 visual-assets.json） | 同上 |
| 2026-05-17 | `doc/art/candidates/title-hero/title-screen-hero-candidate-01.png` | D v1.0 hero 候选（TitleScreen；竹影前景 + 月光峰脊 + 远雾叠层 + 山下村落暖灯点） | candidate（batch 10-D；未绑定 `src/components/TitleScreen.tsx` 资产路径） | 本 roadmap §v1.0；单张慢产 |
| 2026-05-17 | `doc/art/candidates/title-hero/edgeone-landing-hero-candidate-01.png` | D v1.0 hero 候选（EdgeOne landing；石桌前景 + 暖灯 + 远山 + 右侧亭阁角） | candidate（batch 10-D；未绑定 landing 页面，无现成路径常量） | 本 roadmap §v1.0；单张慢产 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/thunder-crown-wolf-village-battle-candidate-01.png`（1536×1024，本批沿用 master v2 视觉语言；后续如入正式目录需裁切到 1672×941 并落 `public/rebrng/scenes/s0-qingmao/thunder-crown-wolf-village-battle.png`） | E1 v0.16 战斗场景候选（雷冠狼村战；shot_id `worm-eye-monster-gate`；低机位、雷冠狼压寨、木栅碎切、月刃单弧反击、人物匿名剪影） | candidate（batch 11-E1；未入 `qingmao-visual-assets.json`，未绑 runtime；候选 01 通过 Quality Drift Watch，弱点：狼眼 cyan glow 偏 neon 一档但低于停批阈值） | 本 roadmap §v0.16 战斗图清单；`s0-qingmao-art-roadmap.md` `thunder-crown-wolf-village-battle.png` 行从 `queued-after-pilot` 推进为 `generated-pass-single-1` 候选 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/xiong-li-squad-vs-bai-ning-bing-candidate-01.png` | E1 v0.16 战斗场景候选（熊力小组对白凝冰；shot_id `over-shoulder-squad-threat`；肩后视角、前景小队背影 + 武器剪影、远处冷白小形体、压倒性差距、不做英雄封面） | candidate（batch 12-E1；候选 01 通过 Quality Drift Watch；面部全在阴影；武器为粗矛/长弯刀/狼牙棒，无现代物） | 本 roadmap §v0.16；`s0-qingmao-art-roadmap.md` `xiong-li-squad-vs-bai-ning-bing.png` 从 `queued-after-pilot` 推进为 `generated-pass-single-1` 候选 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/fang-yuan-monkey-king-cavern-fight-candidate-01.png` | E1 v0.16 战斗场景候选（方源猴王洞窟；shot_id `claustrophobic-cavern-attack`；钟乳压顶 + 石柱纵切 + 猴王上扑斜跨画面 + 方源蹲伏低位 + 月刃单弧 + 玉色防御盘半透明） | candidate（batch 13-E1；候选 01 通过 Quality Drift Watch；方源面部全在阴影、不识具体身份；猴王为野兽剪影非卡通孙悟空；无金箍棒/无神光） | 本 roadmap §v0.16；`s0-qingmao-art-roadmap.md` `fang-yuan-monkey-king-cavern-fight.png` 从 `queued-after-pilot` 推进为 `generated-pass-single-1` 候选 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/first-gen-vs-tie-xue-leng-crane-chaos-candidate-01.png` | E1 v0.16 战斗场景候选（一代古月对铁血冷鹤乱；shot_id `vertical-storm-layering`；上层远天孤鹤极小 + 中段鹤群混乱 + 铁链 + 血蝠 + 下方双蛊师对峙） | candidate（batch 14-E1；候选 01 通过 Quality Drift Watch；天鹤上人为上方左侧极小苍白剪影、不做英雄出场；双方面部全在阴影；铁链旧铁无光；血蝠暗红克制；鹤群无序非 V 队形） | 本 roadmap §v0.16；`s0-qingmao-art-roadmap.md` `first-gen-vs-tie-xue-leng-crane-chaos.png` 从 `queued-after-pilot` 推进为 `generated-pass-single-1` 候选 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/blood-lake-rank-five-battle-candidate-02.png`（前次候选 01 因色块撕裂/细节平均/张力不足被拒；本次 candidate-02 改为低机位贴近水面 + 单条斜向大暗形） | E1 v0.16 战斗场景候选（血湖五转战 candidate-02；shot_id `low-bloodline-grapple`；低机位水面 + 山石巨傀与血河蟒缠斗成单条斜向大暗形 + 铁血冷在巨傀肩头小但可见 + 一代古月在远雾棺台旁极小剪影 + 少量血道蛊影） | candidate（batch 15-E1；候选 02 通过 Quality Drift Watch；前次失败模式已修正；血湖暗酒红克制无亮红 splatter；双方面部均不识；正式目录暂不入库） | 本 roadmap §v0.16；`s0-qingmao-art-roadmap.md` `blood-lake-rank-five-battle.png` 从 `candidate-awaiting-user-review-single-4-redo`（候选 01 被拒）推进为 `candidate-awaiting-user-review-single-5-pass`（候选 02 通过 Quality Drift Watch） |
| 2026-05-18 | `doc/art/candidates/title-hero/og-share-image-candidate-01.png` | F v1.0 OG share / 社媒缩略图候选（宽幅大景：多层山脊 + 月牙 + 雾间村落暖灯 + 前景 Gu 蛊虫剪影克制冷蓝 rim 不发光 + 中景旅人剪影 + 竹叶前景） | candidate（batch 16-F；候选 01 通过 Quality Drift Watch；缩略图尺度仍可读；不绑定原著具体人物；不绑定具体页面，落地页可单独走 `edgeone-landing-hero-candidate-01.png`） | 本 roadmap §v1.0；单张慢产；与 `title-screen-hero-candidate-01.png` / `edgeone-landing-hero-candidate-01.png` 视觉语言一致 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/xiong-li-squad-vs-bai-ning-bing-candidate-01.png` | E1 v0.16 战斗场景旧候选（被否定） | **rejected-composition-lore-mismatch** | 用户 2026-05-18 否定：肩后视角夜行小队 + 白凝冰远岭极小冷白形体的构图与原著严重不符。原著（第 22454 节附近，狼潮章节）实际剧情是：方源故意把白凝冰引向熊力小组当时与豪电狼率领的电狼狼群激战的战场，三方混战；熊力（红眼+熊豪蛊+双熊之力砂钵大小拳头）、熊姜（游僵蛊双瞳惨绿+僵尸态）、白凝冰（白衣白发+双瞳水晶湛蓝+水球护罩）三人形成战场最激烈焦点；其余三位熊家蛊师挡电狼；方源脱离战场远处观望。旧 candidate-01 既不是三方混战、也没有狼群、也没有原著色配；定位 `rejected-composition-lore-mismatch`，不入正式目录；继续保留候选目录以便对比。 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/xiong-li-squad-vs-bai-ning-bing-candidate-02.png` | E1 v0.16 战斗场景旧候选（被否定，第二轮重生仍不合用户预期） | **rejected-pov-and-composition** | 用户 2026-05-18 二次否定：candidate-02 虽然修正了三方混战的核心叙事，但视角是中景平视，没有方源观察者视角；构图整体仍是"近景对战封面"而不是"远观者眼中的战场"；不符合原著"方源脱离战场、抱臂远观、狼群攒动如大磨盘"的关键视觉。保留候选目录比对，不入正式目录。 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/xiong-li-squad-vs-bai-ning-bing-candidate-03.png` | E1 v0.16 战斗场景候选（第二次重生，按"方源 POV + 大磨盘狼群"原著锚校正） | accepted-candidate-by-user（batch 20-E1-redo-2；候选 03 通过 Quality Drift Watch；用户 2026-05-18 选 A 接受为后续 v0.16 候选维护方向；**方源在树林阴影下抱臂背向镜头作过肩 POV 前景**、竹叶/树枝框框；从他位置往下俯视战场；电狼狼群环绕成圆形大磨盘；中央 6 位蛊师拼杀焦点：熊力红眼+巨臂、熊姜瘦削僵尸、白凝冰水球冷蓝；远景豪电狼带 cold-blue 冠角；面部全在阴影；山雾克制；尚未正式入库） | 本 roadmap §v0.16；shot_id 自定义 `over-shoulder-distant-observer`；候选 01/02 均 rejected；原著锚定第 22454/22521/22547/22684 节（方源脱离战场、抱臂旁观、树林阴影下、狼群攒动如大磨盘） |
| 2026-05-18 | `doc/art/candidates/battle/scenes/fang-yuan-monkey-king-cavern-fight-candidate-01.png` | E1 v0.16 战斗场景旧候选（被否定） | **rejected-anatomy-lore-mismatch** | 用户 2026-05-18 否定：(1) 猴姿势出戏（偏拟人/孙悟空感）；(2) 方源手部读起来像两只右手；(3) 原著（第 114-116 节）方源**不带任何刀**，武器只有锯齿金蜈（手部蛊兵）+ 月芒蛊催出的月刃（能量光刃）+ 白玉蛊全身防御；关键姿势是"脱下上衣、双手低垂提上衣领口、双眼半闭等石猴王偷袭"作罗网式诱捕；玉眼石猴王体型为普通石猴三倍 + 双眼血红光芒，仍是野兽形态非孙悟空。旧 candidate-01 定位 `rejected-anatomy-lore-mismatch`；不入正式目录；保留比对。 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/fang-yuan-monkey-king-cavern-fight-candidate-02.png` | E1 v0.16 战斗场景候选（重生，构图按原著校正） | accepted-candidate-by-user（batch 18-E1-redo；候选 02 通过 Quality Drift Watch；用户 2026-05-18 选 A 接受为后续 v0.16 候选维护方向；方源双手解剖正确对称提上衣领角；锯齿金蜈作节段蜈蚣甲壳兵清晰缠在左前臂；不带刀；玉眼石猴王从左上扑下、体型明显三倍大、双眼血红、野兽姿势；石林+钟乳+晦暗红光；面部全在阴影；尚未正式入库） | 本 roadmap §v0.16；shot_id `claustrophobic-cavern-attack`；候选 01 已 `rejected-anatomy-lore-mismatch`；原著锚定第 114-116 节 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/blood-lake-rank-five-battle-candidate-02.png` | E1 v0.16 战斗场景旧候选（被否定） | **rejected-composition-lore-mismatch** | 用户 2026-05-18 否定：candidate-02 的"一代古月在远雾棺台旁极小剪影"与原著严重不符。原著（第 182-185 节）实际刻画：古月一代以**山丘巨傀蛊化身**降临血湖战场，"顶天立地的巨人，双足立血湖深处，湖水只达它的腰侧；身躯极为雄壮，双臂上能跑马车，拳头上能站大象；脸面古朴，是放大版的青铜面具"。古月一代是**主视觉巨大支配者**，与铁血冷正面对撞；血河蟒缠绕巨傀；火龙蛊点燃湖面黑油形成火海；上千刀翅血蝠群从洞顶涌出；棺台只是被血浪冲刷的废弃背景元素。旧 candidate-01/02 均不入正式目录；保留比对。 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/blood-lake-rank-five-battle-candidate-03.png` | E1 v0.16 战斗场景旧候选（被否定，第一次重生仍缺对抗张力） | **rejected-insufficient-clash-tension** | 用户 2026-05-18 二次否定：candidate-03 虽然把巨傀升级为主视觉、修正了构图，但**山丘巨傀蛊与血河蟒只有"被动盘缠"的静态读数，没有对抗感**；同时水位偏脚踝、不符合原著"水及腰侧"。保留候选目录比对，不入正式目录。 |
| 2026-05-18 | `doc/art/candidates/battle/scenes/blood-lake-rank-five-battle-candidate-04.png` | E1 v0.16 战斗场景候选（第二次重生，按"巨傀双手铁钳抓蟒身 + 双龙合并热焰炙烤"原著强对抗瞬间校正） | accepted-candidate-by-user（batch 21-E1-redo-2；候选 04 通过 Quality Drift Watch；用户 2026-05-18 选 A 接受为后续 v0.16 候选维护方向；**巨傀双手前后铁钳抓握血河蟒身躯**（左手抓蟒颈、右手抓蟒身）；蟒头被压制大张血盆口、尖牙暴露、嘶吼挣扎；**左肩黑油龙、右肩火龙合并热焰炙烤蟒身**；水位修正为腰侧；铁血冷在巨傀肩头高度空中腾挪小但可见；血湖表面火海克制；洞顶蝠群剪影；远景棺台左下边缘元素；方源极小贴壁；面部全不识别；**对抗张力强、巨灵天神降临符合原著用语**；尚未正式入库） | 本 roadmap §v0.16；shot_id `worm-eye-titan-grapple`；候选 01/02/03 均 rejected；原著锚定第 32257-32289 节（"双足立血湖，湖水只达腰侧"、"青铜面具脸面"、"左右双龙，山丘巨人，如巨灵天神降临"、"巨傀双手如铁钳，死死制住血河蟒"、"油龙和火龙伺机而动，攀上血河蟒；双龙合并，形成熊熊热焰，炙烤血河蟒"） |
| 2026-05-18 | `public/rebrng/scenes/s0-qingmao/qingmao-mountain-pass-fork-variant.svg` | C v0.14 optional 非战斗场景 SVG（山道分岔泛用氛围；多层山脊 + 木质方向标 + 左叉降雾村光暖点 + 右叉回山冷绿；为 v0.14 路线承接 UI 用） | candidate（batch 22-svg；未入 visual-assets.json；场景 SVG 不走候选目录直接 PR 评审；不绑定具体南疆地点） | 本 roadmap §v0.14 optional 行；同 D7 经济场景 SVG 视觉语言 |
| 2026-05-18 | `public/rebrng/scenes/s0-qingmao/qingmao-cover-tracks-action-card-variant.svg` | C v0.14 optional 非战斗场景 SVG（"遮掩痕迹"行动卡氛围；远景追兵火把暖点 + 中前景脚印渐隐 + 竹叶覆盖 + 持竹枝匿名手部剪影沿弧扫过；为 v0.14-b1 "遮掩逃离痕迹" 行动卡氛围用） | candidate（batch 22-svg；未入 visual-assets.json；场景 SVG 不走候选目录直接 PR 评审；不暗示具体身份、不暗示南疆/福地） | 本 roadmap §v0.14 optional 行；同 D7 经济场景 SVG 视觉语言 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/shang-clan-city-panorama-candidate-01.png` | v0.17 非战斗区域候选（商家城大景；山体分层城市 + 贸易街灯 + 雾中城墙） | candidate（batch 23-region；MiroFish direct；已落候选目录；未入 runtime） | `v017_region_appearance_pack-intake-review.md`；无宝黄天/仙蛊暗示 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/shang-clan-city-gate-candidate-01.png` | v0.17 非战斗城景候选（商家城城门；守卫查验 + 商队入城） | candidate（batch 23-region；MiroFish direct；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/shang-clan-city-market-candidate-01.png` | v0.17 非战斗城景候选（商家城坊市；垂直山城尺度 + 棚布摊位 + 低阶人流） | candidate（batch 23-region；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上；区别于青茅坊市 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/shang-clan-city-auction-house-candidate-01.png` | v0.17 非战斗城景候选（商家城凡级拍卖行；木质楼厅 + 分层包厢 + 中央展台） | candidate（batch 23-region；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上；严格 mortal-tier，无宝黄天交易 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/southern-border-main-region-candidate-01.png` | v0.17 非战斗区域候选（南疆主区域；湿润山路 + 层叠山林 + 远处寨落/商旅灯） | candidate（batch 24-region；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上；候选氛围图，不是正式区域 unlock |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/southern-border-mountain-pass-candidate-01.png` | v0.17 非战斗区域候选（南疆山口；木质关口 + 峡道商旅 + 雾中山路） | candidate（batch 24-region；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/three-kings-mountain-candidate-01.png` | v0.17 非战斗区域候选（三王山；三峰轮廓 + 古道残构 + 山雾） | candidate（batch 24-region；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上；不画传承门/福地/高阶遗物 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/yi-tian-mountain-concept-candidate-01.png` | v0.17 非战斗区域概念候选（义天山；孤峰 + 风暴山雾 + 山路） | concept-only candidate（batch 24-region；用户接受 concept-only 先画；已落候选目录；未入 runtime） | 同上；不绑定正式 canon，不暗示后期大战 |
| 2026-05-18 | `doc/art/candidates/scenes/v017-southern-border/southern-border-river-valley-concept-candidate-01.png` | v0.17 非战斗区域概念候选（南疆河谷；雾河 + 渡口 + 商队远影） | concept-only candidate（batch 24-region；用户接受 concept-only 先画；已落候选目录；未入 runtime） | 同上；泛南疆河谷候选 |
| 2026-05-18 | `assets/shang-xin-ci-candidate-01.png` | v0.17 角色立绘候选（商心慈；早期商队公开阶段，朴素旅装） | external-generated-not-in-current-workspace（用户确认另一窗口已生成；本线程不重复生成，待归档到 `doc/art/candidates/characters/canon/`） | `v017_character_appearance_pack-intake-review.md`；`张心慈` 合并为命名消歧，不单独画 |
| 2026-05-18 | `doc/art/candidates/characters/canon/xiao-die-candidate-01.png` | v0.17 角色立绘候选（小蝶；商队侍女/同伴，警觉姿态） | candidate（batch 25-character；MiroFish direct；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/characters/canon/zhang-zhu-guard-candidate-01.png` | v0.17 角色立绘候选（张柱/护卫；成熟商队保护者） | candidate（batch 25-character；MiroFish direct；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `assets/shang-yan-fei-candidate-01.png` | v0.17 角色立绘旧候选（商燕飞；年龄感偏年轻） | external-weaker-candidate-not-in-current-workspace（另一窗口候选，保留对比；建议不用作首选） | 同上；candidate-02 更符合成熟家主感 |
| 2026-05-18 | `assets/shang-yan-fei-candidate-02.png` | v0.17 角色立绘候选（商燕飞；成熟家主，公开阶段） | external-generated-not-in-current-workspace（用户确认另一窗口已生成；本线程不重复生成，待归档到 `doc/art/candidates/characters/canon/`） | 同上；不画高阶/仙蛊/血道 spectacle |
| 2026-05-18 | `doc/art/candidates/characters/canon/wei-yang-candidate-01.png` | v0.17 角色立绘候选（魏央；商家城公开阶段，沉稳武者） | candidate（batch 25-character；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/characters/canon/shang-ya-zi-candidate-01.png` | v0.17 角色立绘候选（商牙眦；商家城公开阶段，算计感） | candidate（batch 25-character；MiroFish direct_partial；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/characters/original/southern-border-rogue-cultivator-representative-candidate-01.png` | v0.17 代表模板候选（南疆散修代表；非具名 canon 人物） | candidate-template（batch 26-character；用户接受代表模板口径；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/characters/original/three-clan-outer-surname-representative-candidate-01.png` | v0.17 代表模板候选（三族外姓代表；非具名 canon 人物） | candidate-template（batch 26-character；用户接受代表模板口径；已落候选目录；未入 runtime） | 同上 |
| 2026-05-18 | `doc/art/candidates/characters/original/caravan-guard-market-broker-representative-candidate-01.png` | v0.17 代表模板候选（商队护卫/坊市掮客代表；非具名 canon 人物） | candidate-template（batch 26-character；用户接受代表模板口径；已落候选目录；未入 runtime） | 同上；无宝黄天/仙材交易暗示 |

后续新增图在此追加。

## 命名硬约束 ledger（继承 v0.14 R1 + R2）

下列 7 行候选名属翻译/转写偏差，**不得作为硬 canon** 进入 atlas / image-maps / DeepSeek 上下文 / UI / tests，只可保留为「曾用候选名」。atlas/image-maps 的实际改动在下次 atlas 整理批次同步落实，本表已即刻对 DeepSeek 上下文与玩家可见 UI 生效。

| # | 候选名（停用） | 原著锚定名（生效） | 落地依据 | 状态 |
|---|---|---|---|---|
| 1 | 猪铁蛊 | **生铁蛊** | R1 intake review | atlas/image-maps 已对齐 |
| 2 | 巨山傀儡蛊 | **山丘巨傀蛊** | R1 intake review | atlas/image-maps 已对齐 |
| 3 | 镇魔铁链蛊 | **镇魔铁索蛊** | R1 intake review | atlas/image-maps 已对齐 |
| 4 | 驭鹤蛊 | **御鹤蛊** | R1 intake review | atlas/image-maps 已对齐 |
| 5 | 血亲蛊 | **至亲血虫** | R1 intake review | atlas/image-maps 已对齐 |
| 6 | 玉葬续命蛊 | **存息玉葬蛊** | R1 intake review | atlas/image-maps 已对齐 |
| 7 | 雷眼蛊 | **电眼蛊** | R2 intake review（用户 2026-05-18 单点确认） | atlas/image-maps 待下次 atlas 整理批次同步；目前两者均未有 `<slug>.png` 入库，无映射改动需求；DeepSeek 上下文 + 玩家可见 UI 即刻生效，不再使用 `雷眼蛊` 候选名 |

## 原著错位复盘备忘（v0.16 战斗场景 E1 三张）

2026-05-18 用户提出 3 张 E1 战斗场景 candidate-01 出戏，要求按原著重做。下表是机械化复盘：哪条 prompt 锚点错位 → 原著实际怎么写 → 重生 candidate 怎么改。

### 1. 熊力小组对白凝冰（两次重生）

| 维度 | candidate-01 错位 prompt 锚点 | candidate-02 仍未达预期 | 原著实际 | candidate-03 修正 |
|---|---|---|---|---|
| 视角 | 肩后夜行小队 | 中景平视战场 | 方源"脱离战场，站在远处好整以暇地观望着"、"站在远处，抱臂旁观"、"在远处树林的阴影下，抱臂远观"（第 22521/22547/22684 节） | 方源在树林阴影下抱臂背向镜头作过肩 POV 前景；竹叶/树枝框框；从他位置往下俯视战场 |
| 战场形态 | 山道夜行 + 远岭极小白凝冰 | 三方对峙 + 狼群环绕 | "狼群攒动，好像是一个大磨盘，六位蛊师忘我地拼杀着"（第 22523 节） | 电狼狼群环绕成圆形大磨盘 + 中央 6 位蛊师拼杀焦点 |
| 白凝冰 | 远岭极小冷白 | 顶点 + 水球护罩 | 水球护罩中的白衣白发少年，**双瞳水晶湛蓝** | 中央拼杀焦点之一，水球护罩冷蓝 |
| 熊力 | 4 名小队夜行武器剪影之一 | 中景左侧巨拳壮汉、双瞳赤红 | "双眼喷火"+ 砂钵大小的拳头 + 双熊之力 | 中央焦点（远景下尺度变小但可读） |
| 熊姜 | 未明确 | 中景右侧、苍绿瞳僵尸态 | "催游僵蛊、双瞳一片惨绿、化身僵尸" | 中央焦点（远景下尺度变小） |
| 其余 3 位熊家蛊师 | 未刻画 | 中后景与电狼缠斗 | 竭尽全力应付电狼 | 中央磨盘内一起拼杀 |
| 方源 | 未刻画 | 远景弱可见 | 远处树林阴影下抱臂冷观 | **作为前景过肩 POV，画面里最大的剪影框 viewer 的视角** |
| 构图 shot | `over-shoulder-squad-threat`（错） | `triangular-ritual-battle`（半对） | over-shoulder distant observer overlook | 自定义 `over-shoulder-distant-observer` |

### 2. 方源猴王洞窟

| 维度 | candidate-01 错位 prompt 锚点 | 原著实际（第 114-116 节） | candidate-02 修正 |
|---|---|---|---|
| 方源是否带刀 | 用户反馈中提到 candidate-01 月刃读起来像金属刀的画法存在歧义 | **不带任何金属刀剑**。武器只有锯齿金蜈（手部蛊兵）+ 月芒蛊催出的月刃（能量光刃）+ 白玉蛊全身防御 | 明确不带刀。锯齿金蜈作节段甲壳蛊兵缠左前臂；月刃完全去除作为氛围，避免歧义；白玉蛊光晕做 rim |
| 方源关键姿势 | 蹲伏 + 月刃单弧（与原著姿势不符） | **脱下上衣、双手低垂提上衣领口、双眼半闭、撤掉白玉蛊（书中本意是诱敌；视觉上保留白玉蛊作"备用防御"风险更低）** | 蹲伏低位、半侧身、双手低垂对称提上衣领角作罗网、双眼半闭沉静 |
| 方源手部 | 用户反馈：像有两只右手 | 必须左手提左角、右手提右角，对称 | 明确双手解剖对称：左手左角、右手右角，掌心向内 |
| 猴王类型 | 偏拟人/孙悟空感 | **玉眼石猴王**，野兽形态（与普通玉眼石猴外形一样但体型大三倍），双眼血红光芒，尖锐猴爪，有隐石蛊会隐身偷袭 | 野兽四足姿势 + 体型三倍大 + 双眼血红 + 灰绿石皮 + 隐身残影；明确 no Sun Wukong, no headband, no gold staff, no robes |
| 场景 | 钟乳压顶 + 石柱纵切 + 月刃单弧 | 山体石林 + 中央巨大石柱 + 高数十米 + 晦暗的红光 | 石林石柱纵切 + 钟乳压顶 + 晦暗红光（去掉月刃单弧） |
| 远景小石猴 | 未刻画 | 数百只玉眼石猴在石林深处骚动 | 远景左下小石猴剪影骚动 |

### 3. 血湖五转战（两次重生）

| 维度 | candidate-02 错位 prompt 锚点 | candidate-03 仍未达预期 | 原著实际 | candidate-04 修正 |
|---|---|---|---|---|
| 古月一代位置 | "远雾棺台旁极小剪影" | 主视觉巨人但 | "顶天立地的巨人，降临血湖战场"（山丘巨傀蛊化身） | 主视觉中央巨灵天神 |
| 巨傀水位 | 未刻画 | 偏脚踝 | "双足立在血湖深处，湖水只达它的腰侧"（第 32257 节） | **水位修正到腰侧** |
| 巨傀脸面 | 未刻画 | 青铜面具 | "脸面古朴，是放大版的青铜面具" | 青铜面具古朴严正 |
| 巨傀身躯 | 未刻画 | 雄壮双臂 | "身躯极为雄壮，双臂上能跑马车，拳头上能站大象" | 雄壮双臂、宽肩、土陶质感 |
| 巨傀双手动作 | 未刻画 | 仅有身躯 + 蛇盘 | **"巨傀双手如铁钳，死死制住血河蟒"** + "巨傀双手一前一后，抓捏住血河蟒的身躯"（第 32283/32287 节） | **双手前后铁钳抓握血河蟒身躯**：左手抓蟒颈、右手抓蟒身、蟒身被水平拉直在两手间 |
| 双龙伴生 | 未刻画 | 未刻画 | "左肩搁火龙头、左肩搁油龙头" + "油龙和火龙伺机而动，攀上血河蟒；双龙合并，形成熊熊热焰，炙烤血河蟒"（第 32263/32285 节） | **左肩黑油龙、右肩火龙合并热焰炙烤蟒身** |
| 血河蟒姿态 | 未刻画或弱化 | 被动盘缠静态 | 被铁钳压制、奋死挣扎、嘶吼、最终被烤焦 | **蟒头大张血盆口、尖牙暴露、痛苦嘶吼挣扎** |
| 对抗张力 | 缺 | 缺（静态） | "两强对立！" | **多层对抗读数**：巨傀手 vs 蟒身（铁钳）/ 双龙合焰 vs 蟒身（炙烤） |
| 铁血冷 | 未明确 | 小但可见 | 五转，空中腾挪，闯阵者 | 巨傀肩头高度空中腾挪小但可见（约巨傀的 1/15） |
| 血湖表面 | 偏静 | 火海 | 火龙蛊点燃黑油形成火海 | 血湖表面火海克制 |
| 刀翅血蝠群 | 未刻画 | 远景蝠云 | 上千头从洞顶+血湖深处涌出 | 洞顶上方蝠群剪影 |
| 棺台 | 焦点 | 远景边缘 | 被血浪冲刷的废弃背景元素 | 远景左下边缘破损石棺 |
| 方源 | 未明确 | 弱可见 | 极小，贴血湖壁/洞口岩壁 | 远景右下角极小剪影 |
| 构图 shot | `low-bloodline-grapple` | `worm-eye-monster-gate`（半对） | 巨像+双龙+蛇+空中腾挪+蝠云+火海，强对抗 | 自定义 `worm-eye-titan-grapple` |

## MiroFish 美术请求与 intake 状态（2026-05-18）

| 包 | 位置 | 优先级 | 状态 | 处置 |
|---|---|---|---|---|
| `qingmao_unfilled_gu_appearance_pack` | `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao-unfilled-gu-appearance-pack-intake-review.md` | preferred | 已交付 + 已 intake | 已用于 D3/D5/D6/D4 可画蛊的命名对齐与 prompt seed；不进入 runtime truth |
| `qingmao_unfilled_gu_appearance_extension_pack_r2` | `指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao-unfilled-gu-appearance-extension-pack-r2-intake-review.md` | preferred | 已交付 + 已 intake | `雷眼蛊 → 电眼蛊` 生效；4 只 body 全缺，不解锁标本本体图 |
| `qingmao_unfilled_gu_effect_only_aura_card_pack_r3` | 旧 `指导大纲/vMiroFish/美术/` 草稿已删除 | preferred | 未采用，**本轮不转交** | 仅在用户另行选择"4 atlas-pending 蛊做 effect-only 气场卡"时重建项目自有请求；默认 atlas-pending |
| `v016_battle_scene_composition_anchor_pack` | `指导大纲/vMiroFish/intake-reviews/美术/v016_battle_scene_composition_anchor_pack-intake-review.md` | preferred | 已交付 + 已 intake | 8/8 构图锚点可进 `composition_contract_seed`；用户 2026-05-18 要求先不生战斗图，因此只作核验依据 |
| `v017_region_appearance_pack` | `指导大纲/vMiroFish/intake-reviews/美术/v017_region_appearance_pack-intake-review.md` | blocking | 已交付 + 已 intake | 7/9 区域/城景解除 MiroFish 阻塞；`义天山`、`南疆河谷` 为 concept-only，需用户决定是否先画概念候选或发 0601-0800 R2 |
| `v017_character_appearance_pack` | `指导大纲/vMiroFish/intake-reviews/美术/v017_character_appearance_pack-intake-review.md` | blocking | 已交付 + 已 intake | 9 张可画角色/代表解除 MiroFish 阻塞；`龙公` deferred；`张心慈` 并入 `商心慈`，不单独生图 |

本轮综合 intake 结论见：`指导大纲/vMiroFish/intake-reviews/v0.14.0/2026-05-18-art-roadmap-mirofish-intake-and-request-summary.md` 与 `指导大纲/vMiroFish/intake-reviews/美术/2026-05-18-v016-v017-art-delivery-intake-summary.md`。

### v1.0 非战斗图当前阻塞点（2026-05-18 intake 后）

| 项 | 当前结论 | 是否可立刻生图 |
|---|---|---|
| 商家城大景 / 城门 / 坊市 / 凡级拍卖行 | MiroFish direct/direct_partial；不得暗示宝黄天交易 | 可生候选 |
| 南疆主区域 / 南疆山口 / 三王山 | MiroFish direct_partial；仍是候选，不是 runtime canon | 可生候选 |
| 义天山 | `concept_only` | 需用户决定：先画概念候选，或补 0601-0800 R2 |
| 南疆河谷 | `concept_only` | 需用户决定：先画泛南疆河谷候选，或补 0601-0800 R2 |
| 商心慈 / 小蝶 / 张柱护卫 / 商燕飞 / 魏央 / 商牙眦 | MiroFish direct/direct_partial；只画早期公开阶段 | 可生候选 |
| 张心慈 | 命名消歧：与商心慈合并 | 不单独生图 |
| 龙公 | 0001-0600 无公开外观信号，deferred | 不可生；若 v1.0 必需需另发专项 |
| 南疆散修代表 / 三族外姓代表 / 商队护卫或坊市掮客代表 | 代表模板 direct_partial | 需用户接受“代表模板”口径后生图 |
| 仙蛊闪图 | canon/IF hard stop | 不可直接生；需 expert council §Lore + §Systems |
| 4 只 atlas-pending 蛊 | body missing | 默认不画；只有用户选 effect-only 气场卡才启用 R3 |

用户 2026-05-18 决策：接受 `义天山` / `南疆河谷` 作为 concept-only 候选先画；`龙公` 从 v1.0 必需图剔除/延期，不画；接受 3 张代表型角色按模板口径纳入本轮非战斗生图。因此本轮非战斗可生图池扩到 18 张候选（9 区域/城景 + 9 角色/代表，`张心慈` 不单独计，`龙公` 不计）。

当前线程 2026-05-18 补图状态：已补并归档 16 张候选（9 区域/城景 + 小蝶、张柱护卫、魏央、商牙眦、3 张代表模板）。商心慈与商燕飞由用户确认在另一窗口已生成，本线程不重复生成；待从另一窗口补归档到 `doc/art/candidates/characters/canon/` 后再更新本表路径。

## 风险与硬边界

- DeepSeek 不通过美术输出新事实；所有美术只能表现已注册的本地 canon 与战场事实。
- 美术不得暗示 Immortal Gu、十转、永生、宿命蛊归属、凡人宝黄天交易。
- 美术不得让玩家身份误读为原著具体人物（除非该资产显式绑定原著节点且不进入凡战通用棋盘）。
- 美术不得添加可读文字、水印、签名、logo。
- 美术不得添加现代物件、过度血腥、明亮二游卡面光、塑料皮肤、网红脸。
- 节奏放开后，仍必须按 Quality Drift Watch 抽检；若同一批连续两张出现碎、糊、设定色污染，立刻停批复盘。

## 关联文档

- `doc/art/s0-qingmao-art-roadmap.md`：S0 青茅第一卷历史台账（细节归档；新增图请优先更新本文档）
- `doc/art/s0-qingmao-image-prompts.md`：旧 prompt 模板与场景母版历史
- `doc/art/s0-qingmao-gu-atlas.md`：第一卷蛊虫图鉴资料索引与外观依据
- `doc/art/proposals/`、`doc/art/reports/`：历史评审与构图变体提案
- `src/canon/qingmao-visual-assets.json`：当前运行时美术资产白名单
- `src/canon/battle-asset-manifest.json`：杀招/重要仙蛊闪图清单（含死链待补）
- `src/data/image-maps.ts`：蛊名/角色名 → PNG 文件名映射
- `指导大纲/长期路线/RebornG-活世界长期路线图-v0.11至v1.0.md`：v0.11 → v1.0 长期路线总图
- `指导大纲/vMiroFish/requests/v0.14.0/`：当前版 MiroFish 需求请求
