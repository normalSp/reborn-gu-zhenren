# S0 青茅山第一卷美术生成台账

状态：single-image-quality-lock-master
日期：2026-04-29
用途：记录《蛊真人》第一卷 / RebrnG S0 青茅山美术资产的生成约束、prompt、文件名和验收状态。

蛊虫图鉴资料索引已拆分到 `docs/art/s0-qingmao-gu-atlas.md`；本文档继续只维护场景、角色与既有美术资产台账，避免场景/角色台账被蛊虫资料撑大。

## 风格母版

用户参考目标为 Osot-酒保公开作品的审美方向。生成 prompt 不直接要求复刻某一位仍在活动画师的个人风格，而是使用可复用的高层视觉语言：

- 冷峻国风暗黑幻想，构图压迫但不浮夸；角色和普通叙事场景可保留手绘厚重感。
- 低饱和青灰、旧纸、黑土、暗铜、少量朱砂；避免明艳仙侠和二游卡面高饱和。
- 人物五官略有不对称，眼神内收，表情克制；避免完美网红脸和同质化美型脸。
- 角色和普通场景可用硬边明暗分组、粗细不均的边缘线、局部干笔和留白；P0 战斗图不再主打干笔厚涂。
- 服装厚重朴素，有青茅山家族制度感；布料、腰带、袖口和发束可以有磨损。
- 场景冷、旧、脏、潮，服务“青茅山秩序下求活”，而不是热血修仙封面。

## P0 战斗图画面流畅感母版

`quality-lock-master` 是后续 P0 战斗图和新场景重生的画面流畅感基准：`output/imagegen/s0-qingmao/style-calibration/fang-yuan-vs-bai-ning-bing-quality-lock-master.png`。它由样图 04 固化而来。这里参考的是画面组织方式，不是固定构图；每张图仍按自己的 `Composition Contract` 决定镜头、景别、前中后景和动线。

战斗图 prompt 风格段优先使用：

```text
cinematic broad value masses, low texture density, smooth silhouettes, continuous rim light bands, details only at focal points, grey-green cold mist, grouped dark shapes, old-paper muted palette, restrained cinnabar accents
```

中文执行要点：

- “电影感”只指画面流畅、明暗组织和雾中层次，不等于真人电影截图、写实 matte painting 或统一海报构图。
- 暗部成组，地面成大面，衣袍成大折影，蛊虫或武器成少量清晰大段，背景用灰雾和大轮廓拉开空间。
- 边缘光必须是连续带状或大片反光，不做点状高光、喷溅亮点、砂砾噪声、碎石纹理、满屏小色块、刮痕式厚涂或脏 grunge。
- 设定色优先：蛊虫本体颜色必须服从 `docs/art/s0-qingmao-gu-atlas.md`；朱砂橙、暗金、血月余光只能作为动线、边缘光或气氛色，不能污染主体设定色。

## Single Image Cadence / Quality Drift Watch

后续所有场景图、战斗图、蛊虫图都一次只生成 1 张正式候选。禁止连续批量摇图，禁止一次生成多张候选再挑；只有用户明确要求探索多个方向时才例外。

每轮流程固定为：选 1 个资产，复核资料，写简短 `Composition Contract` 和 prompt，生成 1 张候选，按 `quality-lock-master` 做视觉验收，通过后才复制进正式目录并更新台账。不通过时只记录拒绝原因，不立刻连抽下一张。

Quality Drift 检查项：
- 暗部是否成组，还是被碎纹理打散。
- 地面、水面、衣袍是否是大面和大折影，还是出现满屏碎石、砂砾和刮痕小笔触。
- 边缘光是否是连续带状，还是变成点状火花和喷溅亮点。
- 焦点外细节是否收束，灰绿冷雾空间是否还在。
- 蛊虫和角色设定色是否被气氛暖色污染。

2026-04-29 中断前连续生成的 smoke batch 统一标记为 `batch-aborted-not-adopted`，不复制进项目，也不作为后续批量生成依据。后续宁可慢，也不靠连续抽图赌质量。

单张慢产记录：
- 2026-04-29：`fang-yuan-vs-bai-ning-bing-second-battle.png` 使用 `quality-lock-master` 入库；候选留档为 `output/imagegen/s0-qingmao/p0-scenes/fang-yuan-vs-bai-ning-bing-second-battle-candidate-quality-lock-master.png`。下一张优先 `qing-shu-vs-bai-ning-bing-forest-duel.png`。
- 2026-04-29：`qing-shu-vs-bai-ning-bing-forest-duel.png` 已使用单张候选 `output/imagegen/s0-qingmao/p0-scenes/qing-shu-vs-bai-ning-bing-forest-duel-candidate-01.png` 入库，状态 `generated-pass-single-2-with-notes`。构图采用 `overhead-crossfire`，斜俯视破碎林道、藤蔓与冰锥交叉成网；构图通过，仍需关注藤蔓和地面碎色块。
- 2026-04-29：`earthwolf-spider-third-battle.png` 单张候选 01 `output/imagegen/s0-qingmao/p0-scenes/earthwolf-spider-third-battle-candidate-01.png` 已拒绝，状态 `rejected-composition-lore-mismatch`。S 形山道不符合原著此段场地，方源手中蛊虫也未稳定读成锯齿金蜈；正式目录不得入库。
- 2026-04-29：重做候选 `output/imagegen/s0-qingmao/p0-scenes/earthwolf-spider-third-battle-candidate-02-source-corrected.png` 已入库为 `apps/desktop/src/assets/rebrng/scenes/s0-qingmao/earthwolf-spider-third-battle.png`，状态 `generated-pass-single-3`，尺寸 `1672x941`。构图为 `battlefield-beast-charge`：三族大比武后的开阔战场，残阳如血、冰霜压场，黑色金属千里地狼蛛失控冲向白凝冰，方源伏在蛛背并持蜈蚣状多节银边锯齿金蜈。
- 2026-04-29：下一张候选为 `blood-lake-rank-five-battle.png`，状态 `candidate-needed-single-4`。原著锚点为第 182-185 节血湖墓地：血湖、血河蟒、铁血冷的黑铁巨手/油龙/火龙/山石巨傀、一代古月血鬼飞僵苏醒、血滴子与刀翅血蝠群。
- 2026-04-29：`blood-lake-rank-five-battle.png` 单张候选 01 `output/imagegen/s0-qingmao/p0-scenes/blood-lake-rank-five-battle-candidate-01.png` 标记为 `rejected-style-fractured-low-tension`。原因：画面元素太平均，红水、碎石、蝠群、鳞片同时抢细节，色块撕裂且张力不足；正式目录未入库。
- 2026-04-29：`blood-lake-rank-five-battle.png` 已按 `low-bloodline-grapple` 重做单张候选 02 `output/imagegen/s0-qingmao/p0-scenes/blood-lake-rank-five-battle-candidate-02-smooth-tension.png`，状态 `candidate-awaiting-user-review-single-4-redo`。尺寸 `1672x941`；正式目录暂不入库。后续若重做，需要继续压低巨傀裂纹、蟒身鳞片和血湖水花的碎度。

## 统一反 AI 约束

每张图都追加：

```text
Avoid generic AI fantasy polish, plastic skin, over-smoothed faces, perfect facial symmetry, glossy mobile-game rendering, bright cyber lighting, cheap gradients, excessive glow effects, card-game splash composition, modern objects, text, watermark, signature, logo, cute oversized anime eyes, idol-like styling, duplicated faces, overly clean clothing, ornate immortal-world spectacle, heavy blood or gore.
```

## 场景母版 v2

2026-04-29 之后，场景重生也遵守 `Single Image Cadence`。旧文档里“not cinematic”的含义只保留为“不要真人电影截图、不要写实 matte painting、不要过度摄影化”，不再禁止 `quality-lock-master` 所代表的电影感大色块和流畅明暗组织。

本轮场景不沿用第二版学堂门前。场景 prompt 采用“第一版低 AI 感 + 大场面恢弘尺度 + 更克制干净的画师笔触”的方向：

- 媒介：`illustrated epic plate` / `narrative painting plate`，不使用 cinematic、matte painting、screenshot、photoreal。
- 构图：大留白、层叠远山、极小人物、压迫性建筑剪影、少量朱砂旗/灯/血色标记。
- 细节：集中在视觉锚点，远景只保留形体、气势和明暗节奏。
- 笔触：干净但不光滑的手绘厚涂，允许纸感、笔触和边缘取舍，不允许 dirty texture、muddy noise、grunge overlay。
- 角色锚点：方源小样保留为角色方向锚点；后续角色要继续拉开脸型，避免同一套少年脸。

场景专用反目标：

```text
Avoid photorealism, CG render, cinematic still, matte painting screenshot, HDR fog, uniform sharpening, noisy grunge overlay, muddy dirty texture, over-detailed wallpaper, AI landscape prettiness, glowing fantasy portal, ornate immortal spectacle, modern objects, readable text, watermark, logo, heavy gore.
```

## 输出目录

- 场景：`apps/desktop/src/assets/rebrng/scenes/s0-qingmao/`
- 原著角色：`apps/desktop/src/assets/rebrng/characters/canon/`
- 原创角色：`apps/desktop/src/assets/rebrng/characters/original/`

## 风格小样 prompt

### 本轮场景候选 prompt

#### A. 学堂门前低机位制度压迫版

目标文件：`apps/desktop/src/assets/rebrng/scenes/s0-qingmao/qingmao-academy-gate-candidate-01-low-angle-order.png`

```text
Asset type: 16:9 scene background for a Chinese dark fantasy survival game, designed as an illustrated epic plate with quiet space on the left for UI overlay.
Scene style: clean but not smooth hand-painted thick illustration, restrained brushwork, large value shapes, visible painterly edges, muted blue-gray and old paper palette, dark earth, aged wood, tiny cinnabar accents. Human illustration plate, not cinematic, not photoreal, not matte painting.
Subject: Gu Yue clan academy gate on Qingmao Mountain at cold dawn. Low camera near wet stone steps, the gate rises like an institution, students are tiny dark figures under the lintel, bamboo and mountain layers behind. The mood is clan order measuring young people as resources.
Composition: left third remains misty and low-detail for ledger UI; right third holds the gate silhouette and steps; a few cinnabar hanging strips lead the eye. Details concentrate on gate beams, steps, and silhouettes; far mountains are simplified masses.
Setting anchors: Qingmao Mountain, Gu Yue clan academy, opening node, early mortal Gu Master world, no immortal grandeur.
Avoid photorealism, CG render, cinematic still, matte painting screenshot, HDR fog, uniform sharpening, noisy grunge overlay, muddy dirty texture, over-detailed wallpaper, AI landscape prettiness, glowing fantasy portal, ornate immortal spectacle, modern objects, readable text, watermark, logo, heavy gore.
```

#### B. 青茅山远景 + 学堂小尺度恢弘版

目标文件：`apps/desktop/src/assets/rebrng/scenes/s0-qingmao/qingmao-academy-gate-candidate-02-mountain-scale.png`

```text
Asset type: 16:9 scene background for a Chinese dark fantasy survival game, designed as an illustrated epic plate with quiet space on the left for UI overlay.
Scene style: clean but not smooth hand-painted thick illustration, restrained brushwork, large value shapes, visible painterly edges, muted blue-gray and old paper palette, dark earth, aged wood, tiny cinnabar accents. Human illustration plate, not cinematic, not photoreal, not matte painting.
Subject: Qingmao Mountain as a vast layered silhouette at dawn, with the Gu Yue academy gate and clan buildings small but severe on a ridge. Tiny students climb the path in a thin line. The mountain feels older and larger than the clan, but the clan order still feels suffocating.
Composition: broad empty mist and paper-toned sky on the left half for UI; academy ridge and gate occupy the lower-right third; layered mountains rise behind with restrained scale. Use two or three tiny cinnabar flags or lanterns, not glowing magic.
Setting anchors: Qingmao Mountain, academy approach, institutional pressure, early first-volume mortal setting.
Avoid photorealism, CG render, cinematic still, matte painting screenshot, HDR fog, uniform sharpening, noisy grunge overlay, muddy dirty texture, over-detailed wallpaper, AI landscape prettiness, glowing fantasy portal, ornate immortal spectacle, modern objects, readable text, watermark, logo, heavy gore.
```

#### C. 开窍大典广场群像版

目标文件：`apps/desktop/src/assets/rebrng/scenes/s0-qingmao/aperture-ceremony-candidate-03-crowd-rite.png`

```text
Asset type: 16:9 scene background for a Chinese dark fantasy survival game, designed as a narrative painting plate with quiet space on the left for UI overlay.
Scene style: clean but not smooth hand-painted thick illustration, restrained brushwork, large value shapes, visible painterly edges, muted blue-gray and old paper palette, dark earth, aged stone, tiny cinnabar ritual accents. Human illustration plate, not cinematic, not photoreal, not matte painting.
Subject: Gu Yue clan aperture awakening ceremony in the academy courtyard. Rows of young clan students stand as small tense figures; elders and stewards form a dark institutional line near the ritual platform. No heroic blessing: the ceremony feels like entry into a ledger of aptitude, debt, and expectation.
Composition: left third remains quiet mist and old-paper negative space for UI; ritual platform and elders sit right of center; students form measured rows leading into depth; mountains and academy roofs are simplified silhouettes. Use restrained cinnabar ribbons and lamps only.
Setting anchors: opening ceremony, Gu Yue clan, Fang Yuan and Fang Zheng era, first-volume mortal stage, no immortal grandeur.
Avoid photorealism, CG render, cinematic still, matte painting screenshot, HDR fog, uniform sharpening, noisy grunge overlay, muddy dirty texture, over-detailed wallpaper, AI landscape prettiness, glowing fantasy portal, ornate immortal spectacle, modern objects, readable text, watermark, logo, heavy gore.
```

### 1. 方源基准立绘

目标文件：`apps/desktop/src/assets/rebrng/characters/canon/fang-yuan-style-sample.png`

```text
Asset type: vertical character portrait for a dark xianxia survival simulation game.
Style direction: original human-painted Chinese dark fantasy illustration, rough opaque brushwork, cold restrained mood, hard-edged shadow groups, visible uneven brush strokes, muted blue-gray and old paper palette with small cinnabar accents, imperfect hand-painted face structure, no direct imitation of any named artist.
Subject: Fang Yuan from Reverend Insanity first volume era, appearing as a fifteen-year-old Gu Yue clan academy youth. Slim build, calm and distant expression, dark eyes that feel older than his body, black hair tied simply, plain clan student robe in off-white and dark gray, worn belt, no heroic pose.
Composition: seven-tenths body portrait, slight three-quarter angle, shoulders relaxed, one hand half hidden in sleeve, old paper or flat muted background, enough clean edge for later cutout. Mood is quiet, calculating, and dangerous without showing violence.
Canon/setting anchors: Qingmao Mountain, Gu Yue clan academy, early mortal cultivation, no immortal grandeur.
Avoid generic AI fantasy polish, plastic skin, over-smoothed faces, perfect facial symmetry, glossy mobile-game rendering, bright cyber lighting, cheap gradients, excessive glow effects, card-game splash composition, modern objects, text, watermark, signature, logo, cute oversized anime eyes, idol-like styling, duplicated faces, overly clean clothing, ornate immortal-world spectacle, heavy blood or gore.
```

### 2. 古月方正基准立绘

目标文件：`apps/desktop/src/assets/rebrng/characters/canon/gu-yue-fang-zheng-style-sample.png`

```text
Asset type: vertical character portrait for a dark xianxia survival simulation game.
Style direction: original human-painted Chinese dark fantasy illustration, rough opaque brushwork, cold restrained mood, hard-edged shadow groups, visible uneven brush strokes, muted blue-gray and old paper palette with small cinnabar accents, imperfect hand-painted face structure, no direct imitation of any named artist.
Subject: Gu Yue Fang Zheng from Reverend Insanity first volume era, fifteen-year-old academy youth. Similar clan origin to Fang Yuan but clearly a different face: cleaner features, more open eyes, tense sincerity, shoulders held stiff from expectation, black hair tied neatly, standard Gu Yue student robe slightly newer than Fang Yuan's.
Composition: half-to-seven-tenths body portrait, front-facing with slight hesitation, hands folded near belt, old paper or flat muted background. The portrait should show a gifted boy under clan attention, not a cheerful protagonist.
Canon/setting anchors: Qingmao Mountain, Gu Yue clan academy, A-grade aptitude pressure, family and clan comparison.
Avoid generic AI fantasy polish, plastic skin, over-smoothed faces, perfect facial symmetry, glossy mobile-game rendering, bright cyber lighting, cheap gradients, excessive glow effects, card-game splash composition, modern objects, text, watermark, signature, logo, cute oversized anime eyes, idol-like styling, duplicated faces, overly clean clothing, ornate immortal-world spectacle, heavy blood or gore.
```

### 3. 青茅山学堂门前场景

目标文件：`apps/desktop/src/assets/rebrng/scenes/s0-qingmao/qingmao-academy-gate-style-sample.png`

```text
Asset type: 16:9 scene background for a dark xianxia survival simulation game, with quiet empty space on the left side for UI text overlay.
Style direction: original hand-painted Chinese dark fantasy environment illustration, painterly 2D finish, rough dry-brush texture, old paper grain, visible uneven charcoal-like edge lines, compressed values, hard-edged shadow blocks, muted blue-gray mountain mist, dark earth, aged wood, tiny restrained cinnabar accents. Make it feel like a human illustrator's painted plate, not a photoreal matte painting and not a cinematic game screenshot. No direct imitation of any named artist.
Scene: Gu Yue clan academy gate on Qingmao Mountain before dawn. Wet stone steps, bamboo shadows, old timber gate, weathered clan notice boards with no readable writing, a few small academy youth silhouettes standing apart, oppressive clan order and institutional coldness. The place measures young people as resources.
Composition: wide horizontal view. Keep the gate and steps on the right third, leave a muted misty paper-textured void on the left third for game UI. Low camera height, restrained architectural detail, less realism, more brush economy, no readable text on signs.
Canon/setting anchors: academy gate, opening node, Qingmao Mountain, clan order, early mortal Gu Master world.
Avoid generic AI fantasy polish, photoreal rendering, plastic skin, over-smoothed faces, perfect facial symmetry, glossy mobile-game rendering, bright cyber lighting, cheap gradients, excessive glow effects, card-game splash composition, modern objects, text, watermark, signature, logo, cute oversized anime eyes, idol-like styling, duplicated faces, overly clean clothing, ornate immortal-world spectacle, heavy blood or gore.
```

### 4. 原创古月旁支少年

目标文件：`apps/desktop/src/assets/rebrng/characters/original/gu-yue-branch-boy-style-sample.png`

```text
Asset type: vertical character portrait for a dark xianxia survival simulation game.
Style direction: original human-painted Chinese dark fantasy illustration, rough opaque brushwork, cold restrained mood, hard-edged shadow groups, visible uneven brush strokes, muted blue-gray and old paper palette with small cinnabar accents, imperfect hand-painted face structure, no direct imitation of any named artist.
Subject: original sandbox_if playable Gu Yue branch-family boy, fifteen or sixteen, average aptitude implied. Lean and underfed, cautious eyes, slightly chapped lips, black hair tied with cheap cloth, plain academy robe repaired at sleeve and hem, small pouch for primeval stones, no legendary aura.
Composition: seven-tenths body portrait, slight side turn as if listening for danger in a corridor, one shoulder lower from fatigue, old paper or flat muted background. He should feel like someone trying to survive clan order, not a chosen hero.
Setting anchors: Qingmao Mountain, branch family pressure, academy system, debt and resource scarcity.
Avoid generic AI fantasy polish, plastic skin, over-smoothed faces, perfect facial symmetry, glossy mobile-game rendering, bright cyber lighting, cheap gradients, excessive glow effects, card-game splash composition, modern objects, text, watermark, signature, logo, cute oversized anime eyes, idol-like styling, duplicated faces, overly clean clothing, ornate immortal-world spectacle, heavy blood or gore.
```

## 后续资产清单

### 第一卷场景

| 状态 | 文件建议 | 画面核心 |
| --- | --- | --- |
| generated-pass-1 | `spring-autumn-cicada-rebirth-echo.png` | 重生余波只做边角风声与冷光，不做仙界奇观 |
| generated-pass-1 | `aperture-eve-branch-house.png` | 开窍前夜，旁支住处窄、旧、压抑 |
| generated-pass-3 | `aperture-ceremony.png` | 默认开窍大典图，使用方源单人涉河分镜，周围少年和家老围观评判 |
| generated-pass-3 | `aperture-ceremony-fang-yuan-walk.png` | 方源独自涉河，平静克制，希望蛊光点偏少，旁人失望与惊疑 |
| generated-pass-3 | `aperture-ceremony-fang-zheng-walk.png` | 方正独自涉河，紧张失措，希望蛊光流明显，旁人震惊转向狂喜 |
| generated-pass-3 | `aperture-ceremony-custom-player-walk.png` | 性别模糊旁支玩家独自涉河，被制度审视和冷淡算计，资质结果不画死 |
| generated-pass-1 | `fang-zheng-a-grade-attention.png` | 方正甲等资质被注视，光不是祝福而是压力 |
| generated-pass-1 | `fang-yuan-c-grade-cold-room.png` | 方源 C 等资质冷场，旁人视线和旧纸灰调 |
| generated-pass-1 | `academy-stones-pressure.png` | 学堂元石压迫，弱者被制度和同辈同时挤压 |
| generated-pass-1 | `moonlight-gu-cultivation.png` | 月光蛊修行，冷月与手中微弱刃光 |
| generated-pass-1 | `infirmary-debt-hall.png` | 药堂债务，药味、账簿、伤势和冷眼 |
| generated-pass-1 | `tavern-rumor-point.png` | 酒肆风声，传闻比酒更危险 |
| generated-pass-1 | `blackmarket-hidden-mouth.png` | 黑市暗口，窄巷、遮脸人、风险暴露 |
| generated-pass-1 | `flower-wine-inheritance-remnant.png` | 花酒行者传承残线，诱惑与危险并存 |
| generated-pass-1-extra | `qingmao-bamboo-night-road.png` | 青茅竹线夜路，跑路比硬打更有价值 |
| generated-pass-3 | `bai-ning-bing-arrival-pressure.png` | 第一卷男性白凝冰登场压迫，白衣白发、蓝眸、山崖高处冷眼旁观狼潮 |
| generated-pass-1 | `wolf-tide-omen.png` | 狼潮前兆，远山低压和村寨不安 |

### 原著角色

| 状态 | 文件建议 | 区分点 |
| --- | --- | --- |
| style-sample | `fang-yuan-style-sample.png` | 少年外表、老辣眼神、克制危险 |
| style-sample | `gu-yue-fang-zheng-style-sample.png` | 干净紧张、被期待压住 |
| generated-pass-1 | `gu-yue-mo-bei.png` | 派系少年傲气，衣饰更规整 |
| generated-pass-1 | `gu-yue-chi-cheng.png` | 外硬内虚，受家族安排痕迹明显 |
| generated-pass-1 | `gu-yue-qing-shu.png` | 温和可靠但不明亮英雄化 |
| generated-pass-1 | `gu-yue-yao-le.png` | 药堂少女，柔和中带制度遮蔽 |
| generated-pass-1 | `gu-yue-yao-ji.png` | 药堂权力感，老练、冷账 |
| generated-pass-1 | `gu-yue-bo.png` | 族长威仪，像账本上的秩序而非慈父 |
| generated-pass-3 | `bai-ning-bing.png` | 第一卷男性原始形态，银白发、蓝眸、白衣、冷漠傲慢 |
| generated-pass-1 | `xiong-li.png` | 粗粝压迫感，体格和部族差异明显 |
| generated-pass-1 | `jia-fu.png` | 商队精明，华贵但不仙气 |
| generated-pass-1 | `jia-jin-sheng.png` | 轻浮和危险短命感 |
| generated-pass-1 | `tie-xue-leng.png` | 铁面侦缉、沉重正道压力 |
| generated-pass-1 | `tie-ruo-nan.png` | 年轻锐利、规则感强 |
| generated-pass-1 | `flower-wine-monk.png` | 传承残影，放浪但败坏边缘 |

### 原创角色

| 状态 | 文件建议 | 模式 | 区分点 |
| --- | --- | --- | --- |
| style-sample | `gu-yue-branch-boy-style-sample.png` | sandbox_if | 默认男玩家，旁支求活 |
| generated-pass-1 | `gu-yue-branch-girl.png` | sandbox_if | 默认女玩家，谨慎、资源紧 |
| generated-pass-1 | `academy-clerk.png` | sandbox_if | 学堂执事，制度入口 |
| generated-pass-1 | `infirmary-accountant.png` | sandbox_if | 药堂账房，债务人格化 |
| generated-pass-1 | `merit-registrar.png` | sandbox_if | 功绩登记人，审计视线 |
| generated-pass-1 | `blackmarket-middleman.png` | sandbox_if | 黑市中间人，遮掩、试探 |
| generated-pass-1 | `branch-family-elder.png` | sandbox_if | 旁支长辈，贫弱和盘算 |
| generated-pass-1 | `mountain-herb-picker.png` | sandbox_if | 采药人，山道风险入口 |
| generated-pass-1 | `inheritance-rumor-tempter.png` | sandbox_if | 传承线诱导者，半真半假 |

## 验收记录

- 2026-04-27：建立 prompt 台账和风格小样目录，准备生成四张锁风格样图。
- 2026-04-27：生成方源、方正、青茅山学堂门前、原创古月旁支少年四张风格小样。第一版学堂门前偏电影概念图，已废弃并用更强旧纸、干笔、手绘感的第二版覆盖项目资产。
- 2026-04-27：文件校验通过：`fang-yuan-style-sample.png` 为 946x1662，`gu-yue-fang-zheng-style-sample.png` 为 1024x1536，`qingmao-academy-gate-style-sample.png` 为 1672x941，`gu-yue-branch-boy-style-sample.png` 为 852x1846。
- 2026-04-27：根据反馈修订场景方向：第二版学堂门前 AI 感偏强且画面偏脏，不再作为后续场景依据；方源立绘保留为角色锚点。新增三张场景候选 prompt，用于重新选择主场景样图。
- 2026-04-27：生成三张场景候选并保留在场景目录：`qingmao-academy-gate-candidate-01-low-angle-order.png`、`qingmao-academy-gate-candidate-02-mountain-scale.png`、`aperture-ceremony-candidate-03-crowd-rite.png`。第二版旧主图另存为 `qingmao-academy-gate-style-sample-rejected-v2.png`。
- 2026-04-27：选择候选 B `qingmao-academy-gate-candidate-02-mountain-scale.png` 覆盖为新的 `qingmao-academy-gate-style-sample.png`。原因：缩略图先读到青茅山和学堂尺度，左侧 UI 留白稳定，恢弘感强于 A，人物密度低于 C；后续学堂/山门类场景以 B 的构图尺度为主，开窍大典可另沿用 C 的群像方向。
- 2026-04-27：按用户反馈弃用最后一张群像候选，`aperture-ceremony-candidate-03-crowd-rite.png` 已移动为 `aperture-ceremony-candidate-03-crowd-rite-rejected.png`，不作为后续批量场景基准。
- 2026-04-27：完成第一卷批量生成 pass 1。项目内新增 13 张场景图、13 张原著角色立绘、8 张原创角色立绘；其中 `qingmao-bamboo-night-road.png` 是从前序 backlog 顺手保留的额外场景。原创女玩家和学堂执事首次生成出现拼贴/伪字风险，未纳入项目，已用“单人、无浮头、无可读字”约束重生后保存。
- 2026-04-27：文件校验通过：本轮目标 37 个项目文件全部存在；场景批量图为 1672x941；角色批量图主要为 941x1672、1024x1536 或相近竖幅，适合后续裁切和 UI 接入。
- 2026-04-27：按用户反馈清理三张废弃补图：`qingmao-academy-gate-opening-node.png`、`default-female-player-avatar.png`、`academy-clerk-ledger-variant.png`。使用 Codex 内置 `image_gen` 生成开窍大典地下溶洞候选 3 张，选择 `aperture-ceremony-cavern-candidate-03.png` 覆盖 `aperture-ceremony.png`；同时补齐 `bai-ning-bing-arrival-pressure.png`。本轮开窍大典不再采用广场/仪式台方向。
- 2026-04-27：按用户二次反馈重做开窍大典分镜。上一版地下溶洞图存在“多人同走、人物情绪不足”的问题，不再作为最终基准；新增方源、方正、性别模糊玩家三张单人涉河分镜，并用方源分镜覆盖默认 `aperture-ceremony.png`。同步重做第一卷男性白凝冰场景与 canon 立绘。

## 批量生成 pass 1 prompt 记录

### 场景通用 prompt

```text
Asset type: 16:9 scene background for a Chinese dark fantasy survival simulation game, designed as an illustrated/narrative epic plate with quiet space on the left for UI overlay.
Scene style: clean but not smooth hand-painted thick illustration, restrained brushwork, large value shapes, visible painterly edges, muted blue-gray and old paper palette, dark earth/aged wood/stone, tiny cinnabar accents. Human illustration plate, not cinematic, not photoreal, not matte painting.
Composition target: left side remains lower-detail for UI, main visual anchor sits center-right or right third, far mountains and architecture use big silhouettes, details concentrate only at the narrative focus.
Avoid photorealism, CG render, cinematic still, matte painting screenshot, HDR fog, uniform sharpening, noisy grunge overlay, muddy dirty texture, over-detailed wallpaper, AI landscape prettiness, glowing fantasy portal, ornate immortal spectacle, modern objects, readable text, watermark, logo, heavy gore.
```

| 文件 | 主体 prompt 摘要 | 验收 |
| --- | --- | --- |
| `spring-autumn-cicada-rebirth-echo.png` | 春秋蝉重生余波以破碎山脊、冷水倒影、孤小少年和虫翼般微光间接表现，不做仙界奇观。 | pass |
| `aperture-eve-branch-house.png` | 开窍前夜的旁支旧屋、补纸窗、油灯、旧被褥和坐在阴影里的少年。 | pass |
| `aperture-ceremony.png` | 默认开窍大典图，复用方源单人涉河分镜，地下溶洞、膝深河水、对岸月兰花海与希望蛊光点均清晰可读。 | pass-regenerated-v2 |
| `aperture-ceremony-fang-yuan-walk.png` | 方源在约二十七步独自涉河，脸部平静克制，希望蛊光点偏少，岸边少年和家老露出失望、惊疑、冷眼评判。 | pass |
| `aperture-ceremony-fang-zheng-walk.png` | 方正独自涉河走得更深，神情紧张失措，希望蛊光流明显，岸边众人从怀疑转为震惊、狂喜和算计。 | pass |
| `aperture-ceremony-custom-player-walk.png` | 性别模糊旁支玩家独自涉河，表情克制紧绷，周围人冷淡审视，资质结果保持不确定。 | pass |
| `fang-zheng-a-grade-attention.png` | 方正甲等资质被注视，光感像账本标记而不是祝福。 | pass |
| `fang-yuan-c-grade-cold-room.png` | 方源 C 等冷场，少年站在边缘阴影里，注意力从他身上移开。 | pass |
| `academy-stones-pressure.png` | 学堂元石压迫，走廊/院落里同辈围堵弱者，避免直接暴力特写。 | pass |
| `moonlight-gu-cultivation.png` | 月光蛊夜间独练，竹影、石墙、手边克制的月刃冷光。 | pass |
| `infirmary-debt-hall.png` | 药堂债务，药架、治疗榻、伤者和正在记账的冷淡执事。 | pass |
| `tavern-rumor-point.png` | 酒肆风声，酒馆暗处交谈、门外山雾、传闻压过酒气。 | pass |
| `blackmarket-hidden-mouth.png` | 黑市暗口，竹巷、破墙、暗门、遮脸中间人与迟疑少年。 | pass |
| `flower-wine-inheritance-remnant.png` | 花酒行者传承残线，隐秘石室、旧酒坛、破损痕迹和诱惑性残影。 | pass |
| `qingmao-bamboo-night-road.png` | 青茅竹线夜路，湿冷山路、独行修士和远处危险形体。 | pass-extra |
| `wolf-tide-omen.png` | 狼潮前兆，远山低云、村寨岗楼和雾中细小狼影。 | pass |
| `bai-ning-bing-arrival-pressure.png` | 白凝冰第一卷男性出场压迫，白衣白发蓝眸少年立于山崖高处，冷眼旁观狼潮战场，不做华丽冰爆。 | pass-regenerated |

### 原著角色通用 prompt

```text
Asset type: vertical character portrait for a Chinese dark fantasy survival simulation game.
Style direction: original hand-painted dark xianxia character illustration, clean but not smooth thick paint, restrained brushwork, visible painterly edges, muted blue-gray and old paper palette, hard-edged shadow groups, imperfect face structure, no direct imitation of any named artist.
Composition: half-to-seven-tenths or seven-tenths body portrait, old paper background with faint setting silhouette, clean edge for later cutout.
Avoid plastic skin, over-smoothed face, perfect symmetry, idol styling, cute oversized anime eyes, glossy mobile-game rendering, bright cyber lighting, cheap gradient, excessive glow effects, card-game splash pose, duplicated face, modern objects, text, watermark, signature, ornate immortal spectacle, heavy gore.
```

| 文件 | 主体 prompt 摘要 | 验收 |
| --- | --- | --- |
| `gu-yue-mo-bei.png` | 傲气少年竞争者，削瘦颧骨、窄眼、更规整的蓝灰族服。 | pass |
| `gu-yue-chi-cheng.png` | 被家族保护的少年，外傲内虚，圆一些的脸和红褐衣饰锚点。 | pass |
| `gu-yue-qing-shu.png` | 温和疲惫的青年师兄，绿灰袍，可靠但不英雄化。 | pass |
| `gu-yue-yao-le.png` | 药堂少女，柔和但警觉，实用发辫和药囊。 | pass |
| `gu-yue-yao-ji.png` | 药堂权威老人，薄脸、锐眼、药绿衣和医案气质。 | pass |
| `gu-yue-bo.png` | 族长，克制权威、重眼皮、修整胡须和正式族袍。 | pass |
| `bai-ning-bing.png` | 白凝冰第一卷男性原始形态，银白发、蓝眸、白衣、平胸少年身形，冷漠傲慢且带无聊求战感。 | pass-regenerated |
| `xiong-li.png` | 熊力，方下颌、粗眉、厚重实战衣料和体格压迫。 | pass |
| `jia-fu.png` | 贾富，精明商队首领，细致商袍、旅披和控制过的笑。 | pass |
| `jia-jin-sheng.png` | 贾金生，年轻商家子弟，轻浮、昂贵衣服穿得不稳。 | pass |
| `tie-xue-leng.png` | 铁血冷，老练侦缉者，铁灰/黑红衣、沉重正道压力。 | pass |
| `tie-ruo-nan.png` | 铁若男，年轻调查者，束发、锐利守规矩、实用深色衣。 | pass |
| `flower-wine-monk.png` | 花酒行者，枯瘦放浪、疲惫狡黠、酒葫芦和败坏边缘。 | pass |

### 原创角色通用 prompt

```text
Asset type: vertical character portrait for a Chinese dark fantasy survival simulation game.
Style direction: original hand-painted dark xianxia character illustration, clean but not smooth thick paint, restrained brushwork, visible painterly edges, muted blue-gray and old paper palette, hard-edged shadow groups, imperfect face structure.
Composition: one single solo character only, half-to-seven-tenths or seven-tenths body portrait, old paper background with faint setting silhouette, clean edge for later cutout. No second person, no floating head, no split poster, no collage.
Avoid plastic skin, over-smoothed face, perfect symmetry, idol styling, cute oversized anime eyes, glossy mobile-game rendering, bright cyber lighting, cheap gradient, excessive glow effects, card-game splash pose, duplicated face, modern objects, readable text, pseudo calligraphy, watermark, signature, ornate immortal spectacle, heavy gore.
```

| 文件 | 主体 prompt 摘要 | 模式 | 验收 |
| --- | --- | --- | --- |
| `gu-yue-branch-girl.png` | 旁支女玩家默认形象，十五六岁，修补学院袍、廉价发带、谨慎锐眼。 | sandbox_if | pass-regenerated |
| `academy-clerk.png` | 学堂执事，中年瘦脸、疲惫官僚眼神、空白竹筹和账板。 | sandbox_if | pass-regenerated |
| `infirmary-accountant.png` | 药堂账房，中年女性、染墨手指、算盘珠/空白账板、冷淡礼貌。 | sandbox_if | pass |
| `merit-registrar.png` | 功绩登记人，老成官吏、灰铜袍、空白木牌和审计视线。 | sandbox_if | pass |
| `blackmarket-middleman.png` | 黑市中间人，半遮脸、暗色旅行衣、藏袋、试探性视线。 | sandbox_if | pass |
| `branch-family-elder.png` | 旁支长辈，贫弱旧袍、疲惫盘算、扎起的空白家账。 | sandbox_if | pass |
| `mountain-herb-picker.png` | 采药人，补丁衣、药篮、泥污衣摆和熟悉山路的警惕。 | sandbox_if | pass |
| `inheritance-rumor-tempter.png` | 传承线诱导者，半真半假笑、酒葫芦、无字地图残片。 | sandbox_if | pass |
