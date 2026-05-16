# S0 青茅山第一卷美术总台账

状态：`single-image-cadence-p0`
最近更新：2026-04-29
范围：《蛊真人》第一卷 / 青茅山阶段，当前按第 1-199 章维护。

本文档是第一卷美术资产的总入口。旧 prompt 文档继续保留作为生成历史和细节档案，但之后新增图、重做图、记录缺图、调整构图规则时，优先更新本文档。

## 来源与关联文档

- `docs/art/s0-qingmao-image-prompts.md`：旧的场景/角色 prompt 台账，记录当前暗黑国风厚涂方向，也记录了旧的“左侧 UI 留白”场景模板。
- `docs/art/s0-qingmao-gu-atlas.md`：第一卷蛊虫图鉴台账，包含来源链接、已生成状态、缺图清单和 prompt seed。
- `apps/desktop/src/assets/rebrng/`：项目正式美术资产根目录。
- `output/imagegen/s0-qingmao/`：候选图留档目录，正式选中后才复制到项目资产目录。

外部资料只做转述和视觉归纳，不长段搬运原文：

- [OpenAI Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- [OpenAI Cookbook GPT Image 1.5 Prompting Guide](https://cookbook.openai.com/examples/multimodal/image-gen-1.5-prompting_guide)
- [Learn Prompting shot types](https://learnprompting.org/docs/image_prompting/shot_type)
- [awesome-gpt-image-2-prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts)
- [image-generation-prompt-flow](https://github.com/backblaze-b2-samples/image-generation-prompt-flow)
- [LayoutLLM-T2I](https://github.com/LayoutLLM-T2I/LayoutLLM-T2I)
- [Reverend Insanity Wiki Volumes](https://reverend-insanity.fandom.com/wiki/Volumes)
- [Fang Yuan/Gu](https://reverend-insanity.fandom.com/wiki/Fang_Yuan/Gu)
- [Bai Ning Bing](https://reverend-insanity.fandom.com/wiki/Bai_Ning_Bing)

## 当前资产总量

2026-04-29 按项目 PNG 文件实际数量校验。

| 类型 | 数量 | 正式目录 | 规格说明 | 覆盖说明 |
| --- | ---: | --- | --- | --- |
| 场景 | active 3 PNG + runtime generic SVG 1 / archived 42 | `public/rebrng/scenes/s0-qingmao/` | 2026-04-29 已按“清理成品集”策略全部归档；当前单张慢产已入库 3 张具体场景图，C-035 新增 1 张泛用棋盘底图样板。 | 归档清单见 `output/archive/s0-qingmao/scenes-full-regeneration-20260429/manifest.json`。 |
| 原著角色 | 25 | `apps/desktop/src/assets/rebrng/characters/canon/` | 多数为竖幅立绘。 | 覆盖方源、方正、白凝冰、青书、铁家、一代、天鹤上人、族老、商队和关键配角。 |
| 原创角色 | 9 | `apps/desktop/src/assets/rebrng/characters/original/` | 多数为竖幅立绘。 | 服务 sandbox/player 视角的青茅山补充角色。 |
| 蛊虫图鉴 | 32 | `apps/desktop/src/assets/rebrng/gu/s0-qingmao/` | 标本卡片式 PNG。 | 核心辨识蛊已优先完成，许多功能蛊仍缺图。 |

归档前场景资产：

2026-04-29 已将正式目录内 42 张 PNG 全量归档到 `output/archive/s0-qingmao/scenes-full-regeneration-20260429/`。下面列表只保留为归档前语义参考；后续正式目录只放通过验收的生产级资产，不再混入 candidate、rejected 或 style-sample 文件。完整 42 张以 archive `manifest.json` 为准。

```text
academy-stones-pressure.png
aperture-ceremony.png
aperture-ceremony-candidate-03-crowd-rite-rejected.png
aperture-ceremony-custom-player-walk.png
aperture-ceremony-fang-yuan-walk.png
aperture-ceremony-fang-zheng-walk.png
aperture-eve-branch-house.png
bai-ning-bing-arrival-pressure.png
blackmarket-hidden-mouth.png
blood-lake-tomb.png
clan-elder-council-hall.png
clan-gu-vault-selection.png
fang-yuan-c-grade-cold-room.png
fang-zheng-a-grade-attention.png
first-gen-gu-yue-awakening.png
flower-wine-inheritance-remnant.png
gambling-rock-yard.png
gu-yue-village-daily-main.png
heavenly-essence-lotus-seizure.png
infirmary-debt-hall.png
jia-caravan-arrival.png
jia-jin-sheng-death-scene.png
lord-sky-crane-descends.png
moonlight-gu-cultivation.png
primeval-spring-underground-vault.png
qingmao-academy-gate-candidate-01-low-angle-order.png
qingmao-academy-gate-candidate-02-mountain-scale.png
qingmao-academy-gate-style-sample.png
qingmao-academy-gate-style-sample-rejected-v2.png
qingmao-academy-interior.png
qingmao-bamboo-night-road.png
qingmao-mountain-destruction-escape.png
qing-shu-final-stand.png
spring-autumn-cicada-rebirth-echo.png
tavern-rumor-point.png
three-clans-arena.png
tie-clan-investigation-hall.png
wolf-tide-omen.png
wolf-tide-village-defense.png
yao-le-sacrifice-ritual-muted.png
```

当前原著角色资产：

```text
bai-ning-bing.png
fang-yuan.png
fang-yuan-style-sample.png
first-gen-gu-yue.png
flower-wine-monk.png
gu-yue-bo.png
gu-yue-chi-cheng.png
gu-yue-chi-lian.png
gu-yue-dong-tu.png
gu-yue-dong-tu-wife.png
gu-yue-fang-zheng.png
gu-yue-fang-zheng-style-sample.png
gu-yue-mo-bei.png
gu-yue-mo-chen.png
gu-yue-qing-shu.png
gu-yue-yao-ji.png
gu-yue-yao-le.png
jia-fu.png
jia-jin-sheng.png
lord-sky-crane.png
tie-ruo-nan.png
tie-xue-leng.png
wang-da.png
xiong-jiao-man.png
xiong-li.png
```

当前原创角色资产：

```text
academy-clerk.png
blackmarket-middleman.png
branch-family-elder.png
gu-yue-branch-boy-style-sample.png
gu-yue-branch-girl.png
infirmary-accountant.png
inheritance-rumor-tempter.png
merit-registrar.png
mountain-herb-picker.png
```

当前蛊虫图鉴资产：

```text
black-boar-gu.png
bladewing-blood-bat-gu.png
blood-curtain-skyflower-gu.png
blood-frenzy-gu.png
blood-guillotine.png
blood-river-python.png
blood-skull-gu.png
blood-wight-gu.png
blue-bird-ice-coffin-gu.png
cactus-pointer-gu.png
chainsaw-golden-centipede.png
earth-communication-ear-grass.png
four-flavors-liquor-worm.png
frost-demon-gu.png
heaven-earth-magnificent-sound-gu.png
heavenly-essence-treasure-lotus.png
hope-gu.png
iceblade-gu.png
icicle-gu.png
jade-skin-gu.png
liquor-worm.png
little-light-gu.png
moonglow-gu.png
moonlight-gu.png
nine-leaf-vitality-grass.png
red-steel-relic-gu.png
shared-sense-gu.png
spring-autumn-cicada.png
stealth-rock-gu.png
white-boar-gu.png
white-jade-gu.png
yin-yang-rotation-gu.png
```

## 风格规范

当前有效风格：

- 冷峻国风暗黑幻想，低饱和青灰、旧纸、黑土、旧木、暗铜和少量朱砂。
- 角色图鉴和普通叙事场景仍可保留手绘感、旧纸感、硬边明暗分组和细节取舍。
- 第一卷的视觉核心是“青茅山秩序下求活”：家族制度、资源债务、山雾潮冷、压迫感和生存感。
- 避免明亮仙侠奇观、二游卡面高饱和、塑料皮肤、完美网红脸、赛博光、廉价渐变、过度发光、现代物件、可读文字、水印和重血腥。

P0 Battle Smoothness Lock：

- 定版参考：`output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-style-calibration-04.png`。
- 这里锁定的是画面流畅感，不是构图模板。后续战斗图仍必须按各自 `Composition Contract` 使用不同镜头和动线。
- 战斗图主风格改为电影感大色块、低纹理密度、连贯暗形、灰雾空间、连续边缘光、细节集中在焦点。
- 流畅感定义：暗部成组，地面成大面，衣袍成大折影，蛊虫或武器成少量清晰大段，背景用灰雾和大轮廓拉开层次。
- 边缘光必须是连续带状或大片反光，不使用点状高光、喷溅亮点、砂砾噪声、碎石纹理、满屏小色块、刮痕式厚涂、脏 grunge 和 AI 感碎细节。
- 设定色优先：蛊虫本体颜色服从 `s0-qingmao-gu-atlas.md`，朱砂橙、暗金、血月余光只能作为动线、边缘光或气氛色，不能污染主体设定色。

Quality Lock Master：

- 当前最高优先级参考：`output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-quality-lock-master.png`。
- 该图由样图 04 固化而来，状态为 `quality-lock-master`。后续参考它的画面组织方式：干净大暗形、低碎度、灰绿冷雾、局部连续暖边、焦点外细节收束。
- 这里仍然不锁构图。方源二战白凝冰可以沿用此镜头，其他战斗和叙事场景必须各自写 `Composition Contract`。
- `quality-lock-master` 的负例清单：地面被碎石和砂砾铺满、衣袍出现大量刮痕小笔触、蛊虫节段被画成满壳细纹、暖色变成点状火花、画面整体回到批量 AI 奇幻封面质感。

成片感提示实验：

- 用户反馈：单纯要求“厚涂插画”时，gptimg2 候选图可能出现破碎色块和碎笔触。
- 后续资产生产阶段可在单张慢产 prompt 中加入：`complete finished illustration, coherent large color masses, low fragmentation, clean grouped shadows, continuous rim light, clear focal hierarchy, image-like polished final frame`。
- 中文约束可写为：完整成片感，连续大色块，低碎片密度，干净暗形，连续边缘光，焦点层级清楚，像完成度高的正式图片，不要破碎厚涂色块。
- 该提示只是质量实验，不替代 `Composition Contract`、原著复核、设定色优先和 `Quality Drift Watch`。

Single Image Cadence：

- 后续所有场景图、战斗图、蛊虫图都改为一次只生成 1 张正式候选。
- 禁止连续批量摇图，禁止一次性生成 2-4 张再挑，除非用户明确要求探索多个方向。
- 每轮只处理 1 个资产：复核资料，写简短 `Composition Contract` 和 prompt，生成 1 张候选，人工/视觉验收，通过后再复制进正式目录并更新本文档。
- 不通过的候选只记录拒绝原因，不立刻连抽下一张；下一次生成必须先针对拒绝原因改 prompt。

Quality Drift Watch：

- 每张候选都必须和 `quality-lock-master` 对照，重点看画面是否变脏、变碎、点状高光增多、灰雾空间丢失、焦点外细节过密、设定色被气氛色污染。
- 若连续生成导致质量下降，立即停止本轮，不继续补图，先记录 `batch-aborted-not-adopted` 或 `quality-drift-rejected`。
- 每完成 4 张正式图，只做 contact sheet 对比构图和风格漂移；contact sheet 不是批量生成许可。

不同资产类型的构图规则：

- 角色图鉴可以保持统一构图。重点是脸型差异、身体比例、身份辨识和后续 UI 裁切。
- 蛊虫图鉴可以保持统一标本卡片构图。稳定格式本身是优点。
- 普通叙事场景可以继续使用 UI 留白，但每张图必须单独声明留白位置。
- 战斗场景不得继承旧规则：固定左侧低细节留白，主视觉固定在中右侧。
- 战斗场景优先保证动作叙事、镜头变化和缩略图可读性，UI 后续按图适配。

## 构图规范

调研结论：

- 文字 prompt 可以描述镜头类型、机位、远近、前景/中景/背景、主体相对位置，但不能稳定保证精确版式。
- GitHub prompt 项目适合借鉴词汇和流程，不适合当成构图控制引擎。
- Layout-first 类项目的价值是方法论：先决定对象位置、景别和动线，再写成 prompt。
- 构图敏感时，风格词要短，把 prompt 注意力留给镜头、层次和动作。

战斗图生成前必须填写 `Composition Contract`：

```yaml
scene_file:
status:
shot_id:
narrative_beat:
camera_height:
camera_distance:
foreground:
midground:
background:
primary_motion:
negative_space:
thumbnail_read:
must_not_repeat:
source_checkpoint:
```

C-035 泛用底图样板已单独冻结 Composition Contract：

- `composition_contract_id`: `c035-qingmao-generic-battlefield-atmosphere`
- 文件：`public/rebrng/scenes/s0-qingmao/qingmao-mortal-battlefield-generic-atmosphere.svg`
- 文档：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-b3-5-C035-青茅凡战泛用场景底图样板.md`
- 边界：只作为青茅凡战棋盘底层氛围，不绑定方源、白凝冰、青书等具体原著战斗身份；不暗示仙蛊、十转、永生、宿命蛊或宝黄天正式交易。

可用 `shot_id`：

| shot_id | 适用场景 | 硬规则 |
| --- | --- | --- |
| `overhead-crossfire` | 林道、山道、多方向攻防。 | 斜俯视，战斗路线从上方读得清。 |
| `low-ground-clash` | 近身硬碰硬。 | 前景武器或身体尺度压迫，敌人通过纵深读取。 |
| `side-scroll-pursuit` | 追逐、坐骑、逃亡压力。 | 横向运动贯穿画面，不做静态双人海报。 |
| `triangular-ritual-battle` | 三方高阶冲突。 | 三个压力点围绕一个危险中心。 |
| `worm-eye-monster-gate` | 巨兽压迫人类防线。 | 低机位仰视，人小兽大，先读到尺度。 |
| `over-shoulder-squad-threat` | 小队面对压倒性强敌。 | 前景小队背影框住远处威胁。 |
| `claustrophobic-cavern-attack` | 洞窟、小规模近战。 | 低顶、遮挡、非水平来袭，制造压迫。 |
| `vertical-storm-layering` | 飞行单位、高阶混战。 | 垂直旋动和多层空间，不做平面双人对峙。 |
| `central-void-standoff` | 少量用于对峙张力。 | 空白在双方之间，不固定放左侧。 |
| `deep-obstruction-ambush` | 伏击、追索、隐蔽危险。 | 前景遮挡破坏画面完整性，增加纵深。 |

批次规则：8 张战斗图至少使用 6 个不同 `shot_id`。同一批里主视觉落在同一画面三分区的图不得超过 2 张。

## 第一卷覆盖情况

| 剧情段 | 现有覆盖 | 缺口 |
| --- | --- | --- |
| 重生与开窍 | 较强。已有重生余波、开窍前夜、开窍大典多变体、方源/方正结果反应。 | 暂无高优先级缺口。默认 `aperture-ceremony.png` 保持方源单人涉河版本。 |
| 学堂压迫与早期修行 | 较强。已有学堂门前/室内、元石压迫、月光蛊修行、药堂债务、族库选择。 | 学堂切磋和同辈压迫还可补，但优先级低于战斗图。 |
| 花酒传承 | 中强。已有传承残痕、竹林夜路、天元宝莲夺取。 | 缺方源杀猴王取蛊的洞窟实战图。 |
| 商队、赌石、贾金生 | 中强。已有商队抵达、赌石场、死亡现场、酒肆风声。 | 暂无高优先级战斗缺口。 |
| 三寨冲突与白凝冰 | 部分覆盖。已有白凝冰登场压迫、三族擂台。 | 缺熊力小组对白凝冰、方源二战白凝冰、地狼蛛追杀等动作图。 |
| 狼潮 | 部分覆盖。已有狼潮前兆和村寨防御总览。 | 缺雷冠狼近景战斗焦点。 |
| 青书、药乐、牺牲线 | 部分覆盖。已有青书牺牲氛围和药乐牺牲图。 | 缺青书对白凝冰的交战中动作图。 |
| 铁家、一代、血湖、天鹤上人 | 部分覆盖。已有铁家调查、一代苏醒、血湖墓地、天鹤上人登场。 | 缺血湖五转战和鹤灾/高阶混战动作图。 |

## 战斗场景补图清单

构图重整后进入单张慢产流程。`fang-yuan-vs-bai-ning-bing-second-battle.png` 与 `qing-shu-vs-bai-ning-bing-forest-duel.png` 已用 `quality-lock-master` 流畅感入库；下一张优先 `earthwolf-spider-third-battle.png`。每次只生成 1 张候选；通过后再进入下一张，不再使用“前 2 张试点 + 后 6 张批量”的节奏。

| 文件名 | 状态 | shot_id | 构图摘要 | 视觉锚点 |
| --- | --- | --- | --- | --- |
| `qing-shu-vs-bai-ning-bing-forest-duel.png` | `generated-pass-single-2-with-notes` | `overhead-crossfire` | 斜俯视破碎林道。青书树化身形在下方，白凝冰位于远侧高处，藤蔓和冰刃交叉贯穿画面。构图通过，仍需关注藤蔓/地面碎色块。 | 古月青书、白凝冰、藤蔓、水罩/冰刃压力。 |
| `fang-yuan-vs-bai-ning-bing-second-battle.png` | `generated-pass-single-1` | `low-ground-clash` | 低机位近身冲突。电锯金蜈占前景，方源侧背压低，白凝冰在中远景，以画面上方冰鸟/冰锥施压。已按 `quality-lock-master` 入库。 | 方源、白凝冰、电锯金蜈、血月/月芒、天蓬/白玉防御。 |
| `earthwolf-spider-third-battle.png` | `generated-pass-single-3` | `battlefield-beast-charge` | 候选 02 已入库。三族大比武后的开阔战场，残阳如血、冰霜压场；千里地狼蛛失控向白凝冰冲锋，方源伏在蛛背，手中是锯齿金蜈。 | 黑色金属千里地狼蛛、方源伏背、锯齿金蜈、白凝冰冰锥迎击、冰锥在蛛身崩碎。 |
| `blood-lake-rank-five-battle.png` | `candidate-awaiting-user-review-single-4-redo` | `low-bloodline-grapple` | 候选 01 因色块撕裂、细节平均和张力不足拒绝。候选 02 改为低机位贴近血湖水面，山石巨傀与血河蟒缠斗形成一个斜向大暗形，铁血冷在巨傀上方控制，一代古月退到远处棺台冷雾中压迫登场。正式目录暂不入库。 | 一代古月、铁血冷、血河蟒、山石巨傀、血湖墓地、少量血道蛊影。 |
| `thunder-crown-wolf-village-battle.png` | `queued-after-pilot` | `worm-eye-monster-gate` | 低机位村寨破门。雷冠狼压过寨墙，蛊师小队在低处被雷光和木栅切割。 | 雷冠狼、村寨防线、小队、克制雷光。 |
| `xiong-li-squad-vs-bai-ning-bing.png` | `queued-after-pilot` | `over-shoulder-squad-threat` | 熊力小组肩后视角。前景是小队背影和武器，远处冷白小形体太平静，形成压倒性差距。 | 熊力小组、白凝冰、山道/崖壁压迫，不做英雄封面。 |
| `fang-yuan-monkey-king-cavern-fight.png` | `queued-after-pilot` | `claustrophobic-cavern-attack` | 洞窟近景压迫。猴王从上方或侧壁扑下，方源在低处反击，石柱遮挡制造纵深。 | 方源、猴王、月光/白玉防御、洞窟纵深。 |
| `first-gen-vs-tie-xue-leng-crane-chaos.png` | `queued-after-pilot` | `vertical-storm-layering` | 纵向风暴分层。铁链、血蝠、鹤群上下旋动，天鹤上人只做远景介入，不重复登场图。 | 一代古月、铁血冷、远景天鹤上人、鹤群、铁链和血道压力。 |

来源复核规则：每张战斗图最终写 prompt 前，都要复核本地蛊虫台账、现有美术 prompt、Wiki 条目和能找到的中文章节/章节摘要页。本文档只记录转述后的视觉事实，不粘贴长段原文。

## 风格校准记录

2026-04-28：P0 Pilot 的构图方向可取，但画面出现“脏、碎、小色块过密、AI 感强”的问题。当前正式目录中的 `qing-shu-vs-bai-ning-bing-forest-duel.png` 与 `fang-yuan-vs-bai-ning-bing-second-battle.png` 不作为最终风格依据，待定版风格后重做覆盖。

样图 04 已作为后续 P0 战斗图的画面流畅感定版参考。本轮锁定的是流畅块面和低碎度，不是固定构图：

| 样图 | 路径 | 尺寸 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| 方源二战白凝冰风格校准 01 | `output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-style-calibration-01.png` | `1672x941` | `style-rejected-too-fractured` | 构图可用，但高光和局部细节仍偏点状、碎裂。 |
| 方源二战白凝冰风格校准 02 | `output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-style-calibration-02.png` | `1672x941` | `style-rejected-too-fractured` | 白凝冰远景顺滑可取，但地面、方源和电锯金蜈仍有碎色块。 |
| 方源二战白凝冰风格校准 03 | `output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-style-calibration-03.png` | `1672x941` | `style-approved-fluidity-color-blocks` | 电影感大色块、低纹理密度、灰雾空间和连续边缘光通过；电锯金蜈本体偏暗红，设定色需修正。 |
| 方源二战白凝冰风格校准 04 | `output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-style-calibration-04.png` | `1672x941` | `quality-lock-master-source` | 保留 03 的画面流畅感，并把电锯金蜈本体修正为暗金/旧铜/冷铁齿刃。 |
| 方源二战白凝冰当前最佳参考 | `output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-quality-lock-master.png` | `1672x941` | `quality-lock-master` | 当前最高优先级画面参考。后续只学习流畅块面、干净暗形、低碎度和连续边缘光，不锁定其他图的构图。 |

2026-04-29 中断前连续 smoke batch 已废止。该批图未复制进 `apps/desktop/src/assets`，不作为正式资产，不作为继续批量生成的依据；后续若要采用其中某张，必须重新按单张流程登记、验收和入库。

| 批次 | 默认生成路径 | 状态 | 备注 |
| --- | --- | --- | --- |
| smoke-batch-after-archive | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_085f42bf48d167000169f0faed7dd88191bbc118d9c4ed564b.png` | `batch-aborted-not-adopted` | 连续生成的普通场景候选，未入库。 |
| smoke-batch-after-archive | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_085f42bf48d167000169f0fb38511481919607c9feac630d0b.png` | `batch-aborted-not-adopted` | 连续生成的仪式场景候选，未入库。 |
| smoke-batch-after-archive | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_085f42bf48d167000169f0fb737d908191b3771d3a6704a9fa.png` | `batch-aborted-not-adopted` | 连续生成的战斗候选，未入库；只作为“连续生成会漂移”的观察记录。 |

## 单张慢产候选/入库记录

| 日期 | 文件 | 候选路径 | 正式路径 | 尺寸 | 状态 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-13 | `qingmao-mortal-battlefield-generic-atmosphere.svg` | `-` | `public/rebrng/scenes/s0-qingmao/qingmao-mortal-battlefield-generic-atmosphere.svg` | `1672x941 viewBox` | `runtime-active-svg-sample` | C-035 泛用棋盘底图样板。采用可审查 SVG，不消耗图片生成；只表达冷雾、竹影、旧演武坪、金色道痕和凡人危险边界，不绑定具体人物战斗。 |
| 2026-04-29 | `fang-yuan-vs-bai-ning-bing-second-battle.png` | `output/imagegen/s0-qingmao/p0-scenes/fang-yuan-vs-bai-ning-bing-second-battle-candidate-quality-lock-master.png` | `apps/desktop/src/assets/rebrng/scenes/s0-qingmao/fang-yuan-vs-bai-ning-bing-second-battle.png` | `1672x941` | `generated-pass-single-1` | 使用 `quality-lock-master` 入库。保留低机位近身压迫、干净大暗形、低碎度、连续暖边；下一张为 `qing-shu-vs-bai-ning-bing-forest-duel.png`。 |
| 2026-04-29 | `qing-shu-vs-bai-ning-bing-forest-duel.png` | `output/imagegen/s0-qingmao/p0-scenes/qing-shu-vs-bai-ning-bing-forest-duel-candidate-01.png` | `apps/desktop/src/assets/rebrng/scenes/s0-qingmao/qing-shu-vs-bai-ning-bing-forest-duel.png` | `1672x941` | `generated-pass-single-2-with-notes` | 单张生成。raw 为 `1671x941`，已保留 `qing-shu-vs-bai-ning-bing-forest-duel-candidate-01-raw-1671x941.png` 并校正候选为 `1672x941`。斜俯视交叉火线、青书树化和远处白凝冰可读；构图通过，仍需关注藤蔓/地面碎色块。 |
| 2026-04-29 | `earthwolf-spider-third-battle.png` | `output/imagegen/s0-qingmao/p0-scenes/earthwolf-spider-third-battle-candidate-01.png` | `-` | `1672x941` | `rejected-composition-lore-mismatch` | 单张候选 01 拒绝。S 形山道不符合原著此段场地；方源手中蛊虫读法偏离锯齿金蜈。不得入库，后续改用 `battlefield-beast-charge`。 |
| 2026-04-29 | `earthwolf-spider-third-battle.png` | `output/imagegen/s0-qingmao/p0-scenes/earthwolf-spider-third-battle-candidate-02-source-corrected.png` | `apps/desktop/src/assets/rebrng/scenes/s0-qingmao/earthwolf-spider-third-battle.png` | `1672x941` | `generated-pass-single-3` | 单张重做候选 02 入库。锚定三族大比武战场、残阳、冰霜、失控千里地狼蛛冲向白凝冰；方源伏蛛背，手中为蜈蚣状多节锯齿金蜈。SHA256: `2c32beda5ee99ecd7422b7e6a47d14a2cb03ba11573e9f0f2c4f64c3ec66c1d6`。 |
| 2026-04-29 | `blood-lake-rank-five-battle.png` | `output/imagegen/s0-qingmao/p0-scenes/blood-lake-rank-five-battle-candidate-01.png` | `-` | `1672x941` | `rejected-style-fractured-low-tension` | 单张候选 01。raw 为 `1671x941`，已保留 `blood-lake-rank-five-battle-candidate-01-raw-1671x941.png` 并校正候选为 `1672x941`。拒绝原因：画面元素太平均，红水、碎石、蝠群、鳞片同时抢细节，色块撕裂且张力不足；正式目录未入库。SHA256: `1644453adc0319b64ba866b899683a8e9890db4b64077adfcef1cec8baebf77b`。 |
| 2026-04-29 | `blood-lake-rank-five-battle.png` | `output/imagegen/s0-qingmao/p0-scenes/blood-lake-rank-five-battle-candidate-02-smooth-tension.png` | `-` | `1672x941` | `candidate-awaiting-user-review-single-4-redo` | 单张候选 02。采用 `low-bloodline-grapple`：低机位血湖水线，山石巨傀与血河蟒形成斜向大暗形，铁血冷在巨傀上方，一代古月退到远处棺台冷雾。整体比 01 更收束，但仍需你确认巨傀裂纹、蟒身鳞片和水花碎度是否可接受；正式目录暂不入库。SHA256: `D904F7F71178341A7E0C159C87B288CEC72359F8B04B90E42B6238B96502B27C`。 |

## 已拒绝战斗草稿

2026-04-28 曾生成 8 张战斗草稿。它们不是正式资产，没有复制到 `apps/desktop/src/assets/rebrng/scenes/s0-qingmao/`，后续不得作为 pass 图使用。

拒绝原因：8 张都继承了旧的“左侧 UI 空雾 + 中右侧主体”惯性，作为一组时负空间、斜线动势和海报式站位高度重复。其中猴王洞窟图还不是目标尺寸。

| 计划文件名 | 草稿路径 | 尺寸 | 状态 |
| --- | --- | --- | --- |
| `qing-shu-vs-bai-ning-bing-forest-duel.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09beb38d08191b124c7c3090ad171.png` | `1672x941` | `rejected-composition-repeat` |
| `fang-yuan-vs-bai-ning-bing-second-battle.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09c76796c81918dfa874d3f60ef47.png` | `1672x941` | `rejected-composition-repeat` |
| `earthwolf-spider-third-battle.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09cf420508191b3c7b3cc64e28a90.png` | `1672x941` | `rejected-composition-repeat` |
| `blood-lake-rank-five-battle.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09d703cd08191a6d8d4a53561f27e.png` | `1672x941` | `rejected-composition-repeat` |
| `thunder-crown-wolf-village-battle.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09de86b488191bc421c932e2cc0c7.png` | `1672x941` | `rejected-composition-repeat` |
| `xiong-li-squad-vs-bai-ning-bing.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f09e678b388191a4b5e2bc0a147f5b.png` | `1672x941` | `rejected-composition-repeat` |
| `fang-yuan-monkey-king-cavern-fight.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f0a0c9995c8191955e51e2c800c783.png` | `1670x941` | `rejected-composition-repeat-and-size` |
| `first-gen-vs-tie-xue-leng-crane-chaos.png` | `C:/Users/11411/.codex/generated_images/019dd38c-f7d5-75d0-8161-b08131ab841e/ig_0d15f3dcb16e70450169f0a154c9d88191bbdc0cb7998947a6.png` | `1672x941` | `rejected-composition-repeat` |

## 蛊虫缺图清单

蛊虫图鉴目前已有 32 张正式 PNG。详细来源继续以 `docs/art/s0-qingmao-gu-atlas.md` 为准。第一卷高价值缺图或待补图包括：

- 方源路线和功能蛊：鱼鳞蛊、隐鳞蛊、掠夺蛊、石窍蛊、水罩蛊、奴熊蛊、人兽葬生蛊、清水蛊、水行防御蛊、雷翅蛊、天蓬蛊、血气蛊、血月蛊、兜率花、雷盾蛊、生铁蛊、猪铁蛊、千里地狼蛛，以及后续如果需要单独拆分的阴蛊/阳蛊。
- 白凝冰和战斗体系蛊：旋风蛊、漩涡蛊、烈风蛊、雷眼蛊，以及原文复核后确认的其他水冰道辅助蛊。
- 铁血冷路线：正气蛊、铁手擒拿蛊、油龙蛊、火龙蛊、巨山傀儡蛊、镇魔铁链蛊，以及资料足够后的侦查/战斗蛊。
- 天鹤上人路线：驭鹤蛊、血亲蛊、玉葬续命蛊、扬眉吐气蛊，需先补足外观依据。

资料不足、概念过强或译名待复核的蛊，不能直接生成。必须先在蛊虫台账里补来源和稳定视觉 seed。

## 后续生成流程

1. 从 `战斗场景补图清单` 或主线场景 backlog 选择 1 张，不同时推进第二张。
2. 复核本地蛊虫台账、现有美术 prompt、Wiki 页面和能找到的中文章节/摘要页面。
3. 填写简短 `Composition Contract`，明确这张图的 `shot_id`、前景/中景/背景、主导动线和禁止重复项。
4. prompt 中风格段保持短，并显式引用 `quality-lock-master` 的流畅块面、低碎度和连续边缘光。
5. 只生成 1 张候选；禁止连续批量摇图，禁止一次生成多张正式候选。
6. 候选图保存到 `output/imagegen/s0-qingmao/p0-scenes/`、`output/imagegen/s0-qingmao/regenerate-scenes/` 或对应蛊虫候选目录。
7. 单张验收：尺寸、叙事、设定色、构图、缩略图可读性和 `Quality Drift Watch`。
8. 通过后才复制到 `apps/desktop/src/assets/rebrng/...`；不通过则只记录拒绝原因，不立刻连抽下一张。
9. 更新本文档：候选路径、正式路径、尺寸、验收结果、拒绝原因、下一张目标。
10. 每完成 4 张正式图，额外做一次 contact sheet，只用于发现构图重复和风格漂移。

## 验收标准

文档验收：

- 本文件存在，并作为第一卷美术总台账维护。
- 资产数量与当前项目目录一致。
- 旧的固定左侧战斗构图规则已明确废止。
- 已拒绝的 8 张战斗草稿有记录，且明确不得纳入正式资产。

后续战斗图验收：

- 正式场景图必须是 PNG，尺寸必须是 `1672x941`。
- 无可读文字、水印、伪字、现代物件和过度血腥。
- 缩略图能读出战斗双方和核心蛊能力或战斗压力。
- 第一批 8 张战斗图至少使用 6 个不同 `shot_id`。
- 同一批里主视觉落在同一画面区域的图不得超过 2 张。
- 维持低饱和青茅山暗黑国风和旧纸底色；P0 战斗图以样图 04 的电影感大色块、低纹理密度、连续边缘光为准，不回到硬边厚涂/局部干笔碎细节，也不变成真人电影截图或明亮二游卡面。

## 维护记录

- 2026-04-27：建立 `s0-qingmao-image-prompts.md`，记录第一轮场景和角色 prompt。
- 2026-04-28：蛊虫图鉴 P0/P1/P2 批次完成，正式蛊虫资产达到 32 张。
- 2026-04-28：替换 `lord-sky-crane-descends.png`，天鹤上人登场图改为更贴近第一卷末压迫感的版本。
- 2026-04-28：暂停战斗图继续生成。8 张战斗草稿因构图重复被拒绝，未复制进正式场景目录。
- 2026-04-28：创建本文档。战斗图后续必须先填写 `Composition Contract`，再按不同 `shot_id` 小批量生成和验收。
- 2026-04-28：P0 Pilot 构图方向通过但风格未通过，改为先生成单张方源二战白凝冰风格校准样图，等待用户反馈后再更新 Style Bible 和批量重做。
- 2026-04-29：样图 04 通过，作为 P0 战斗图的画面流畅感定版参考。后续战斗图统一低碎度、连续边缘光和设定色优先，但不统一构图。
- 2026-04-29：发现连续生图会出现质量漂移。废止批量 smoke 方式，新增 `Single Image Cadence` 与 `Quality Drift Watch`，后续所有资产一次只生成 1 张候选；样图 04 固化为 `quality-lock-master`。
- 2026-04-29：单张慢产第 1 张入库：`fang-yuan-vs-bai-ning-bing-second-battle.png`，候选留档为 `fang-yuan-vs-bai-ning-bing-second-battle-candidate-quality-lock-master.png`。正式场景目录 active 数量更新为 1。
- 2026-04-29：单张慢产第 2 张入库：`qing-shu-vs-bai-ning-bing-forest-duel.png`，候选留档为 `qing-shu-vs-bai-ning-bing-forest-duel-candidate-01.png`。构图通过，仍需关注藤蔓/地面碎色块。正式场景目录 active 数量更新为 2。
- 2026-04-29：单张慢产第 3 张候选：`earthwolf-spider-third-battle-candidate-01.png` 被拒绝。原著复核后确认此段应为三族大比武战场上的失控坐骑冲杀，不是 S 形山道追逐；方源手中蛊虫必须是锯齿金蜈。下一张重做候选命名为 `earthwolf-spider-third-battle-candidate-02-source-corrected.png`。
- 2026-04-29：单张慢产第 3 张重做候选：`earthwolf-spider-third-battle-candidate-02-source-corrected.png` 已生成并留档，尺寸 `1672x941`，状态 `candidate-awaiting-user-review-single-3-redo`。正式目录暂不入库。
- 2026-04-29：单张慢产第 3 张入库：`earthwolf-spider-third-battle.png`，正式目录 active 场景数更新为 3。下一张进入 `blood-lake-rank-five-battle.png`，优先复核第 182-185 节血湖墓地、血河蟒、铁血冷与一代古月段落。
- 2026-04-29：单张慢产第 4 张候选：`blood-lake-rank-five-battle-candidate-01.png` 已生成并留档，尺寸校正为 `1672x941`，后因画面碎、元素平均、张力不足标记为 `rejected-style-fractured-low-tension`。正式目录未入库。
- 2026-04-29：单张慢产第 4 张重做候选：`blood-lake-rank-five-battle-candidate-02-smooth-tension.png` 已生成并留档，尺寸 `1672x941`，状态 `candidate-awaiting-user-review-single-4-redo`。构图改为 `low-bloodline-grapple`，正式目录暂不入库。
- 2026-05-13：C-035 新增 `qingmao-mortal-battlefield-generic-atmosphere.svg` 作为青茅凡战泛用棋盘底图样板；该资产不是具体人物战斗图，不替代后续 bitmap 单张慢产流程。
