# S0 青茅山第一卷蛊虫图鉴台账

状态：volume-1-full-index-pass-1  
日期：2026-04-27  
用途：整理《蛊真人》第一卷（第 1-199 章）内出现、持有、使用、配方提及或传说提及的蛊虫，为后续“标本卡片”式蛊虫图鉴生图提供资料基线。

## 使用规则

- 本文档只做资料索引和后续 prompt seed，不生成 PNG。
- 图像目标目录预留：`apps/desktop/src/assets/rebrng/gu/s0-qingmao/`
- 候选留档目录预留：`output/imagegen/s0-qingmao/gu-atlas/`
- `视觉缺资料` 表示目前只确认名称、用途或持有人，缺少足够外观依据，后续不得直接生图。
- 统一标本卡片风格：old paper naturalist specimen card, single Gu worm as main subject, restrained dark xianxia hand-painted texture, subtle habitat/use hint, no readable text, no modern objects, no Pokemon/card-game/mobile-game gloss, no watermark.

## 资料源摘要

- 方源第一卷实际获得/使用基线来自 [Fang Yuan/Gu - Volume 1][src-fy-gu]，保留 Wiki 表内 42 条记录作为验收基线。
- 非方源与缺资料蛊来自 [Page List/Gu][src-gu-list]、[Page List/First][src-first-list]、[Bai Ning Bing][src-bnb]、[Tie Xue Leng][src-tie]、[First Gen Gu Yue][src-first-gen]、[Lord Sky Crane][src-sky-crane]。
- 关键外观或功能可用单页复核：[Moonlight Gu][src-moonlight]、[Liquor Worm][src-liquor]、[Hope Gu][src-hope]、[Heavenly Essence Treasure Lotus][src-lotus]。
- 中文辅助资料 [《蛊真人》蛊虫总结——第一卷（上）][src-biaojianku] 本轮无法稳定抓取，只作为待人工复核入口；高置信条目仍以 Wiki 或原文章节为准。

## 主线 / 方源实际持有与获得记录

| # | 中文名 | 英译名 | 品阶 | 流派/类型 | 第一卷章节 | 第一卷作用 | 外观依据 | 视觉 prompt seed | 图像状态 | 来源 | 置信度 |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| 1 | 月光蛊 | Moonlight Gu | 1 | 月道/攻击 | 8/20 | 方源从族库选择并炼化的第一只战斗蛊。 | 单页可复核；偏月牙、蓝白晶质意象。 | 标本卡片，弯月形蓝白晶质小蛊，冷光边缘，旧纸背景。 | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/moonlight-gu.png` | [FY/Gu V1][src-fy-gu]; [Moonlight Gu][src-moonlight] | high |
| 2 | 酒虫 | Liquor Worm | 1 | 食道/修行辅助 | 14/20 | 花酒行者传承入口，帮助淬炼真元。 | 单页可复核；白胖蚕虫、酒气与琥珀光可作为锚点。 | 标本卡片，白胖蚕状酒虫，微琥珀酒雾，不画萌物。 | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/liquor-worm.png` | [FY/Gu V1][src-fy-gu]; [Liquor Worm][src-liquor] | high |
| 3 | 春秋蝉 | Spring Autumn Cicada | 6 | 宙道/本命 | 1/18 | 随重生进入空窍，第一卷长期沉睡恢复。 | 原作和 Wiki 均强调蝉形与时光属性；细节需再查原文。 | 标本卡片，枯叶色蝉形仙蛊，薄翼有岁月裂纹，低光。 | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/spring-autumn-cicada.png` | [FY/Gu V1][src-fy-gu]; [First List][src-first-list] | high |
| 4 | 泥皮癞蛤蟆（译名待复核） | Mudskin Toad | 2 | 土道 | 42 | 赌石获得后很快卖给贾金生。 | 视觉缺资料；只确认蟾蜍/泥皮方向。 | 标本卡片，visual-gap, muddy toad-like Gu, verify before final art. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | medium |
| 5 | 小光蛊 | Little Light Gu | 1 | 光道 | 62 | 方源选定的月光蛊发展路线材料之一。 | 视觉缺资料；只确认小型光道辅助蛊。 | 标本卡片，small pale light Gu, minimal glow, old paper, verify appearance. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 6 | 白豕蛊 | White Boar Gu | 1 | 力道 | 63 | 花酒行者第一处地藏花传承所得，提供白豕之力。 | 视觉缺资料；可锚定白野猪力量意象但需避免画成普通兽。 | 标本卡片，white boar-associated strength Gu, tusk motif, specimen not animal portrait. | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/white-boar-gu.png` | [FY/Gu V1][src-fy-gu] | high |
| 7 | 玉皮蛊 | Jade Skin Gu | 1 | 防御/变化倾向 | 79 | 第二处密室传承所得，后与白豕蛊合炼白玉蛊。 | 视觉缺资料；玉质皮膜/青白甲片可作暂定锚。 | 标本卡片，pale jade skin-like Gu, translucent shell plates, restrained. | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/jade-skin-gu.png` | [FY/Gu V1][src-fy-gu] | high |
| 8 | 小光蛊（二次） | Little Light Gu | 1 | 光道 | 91 | 学堂年终第一奖励，方源再次选择。 | 同 #5。 | 同 #5，记录为重复获得，不单独生图。 | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 9 | 白玉蛊 | White Jade Gu | 2 | 防御 | 99 | 玉皮蛊与白豕蛊合炼，成为核心防御。 | 视觉缺资料；白玉甲壳/玉光防御方向。 | 标本卡片，white jade armored Gu, milky translucence, no luxury jewel splash. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/white-jade-gu.png` | [FY/Gu V1][src-fy-gu] | high |
| 10 | 九叶生机草 | Nine Leaf Vitality Grass | 2 | 木道/治疗经济 | 102 | 父母遗产，产出生机叶，支撑资源经营。 | 草形明确；叶数与生机叶是核心视觉。 | 标本卡片，nine-leaf medicinal grass Gu, dew-like vitality leaves, old paper. | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/nine-leaf-vitality-grass.png` | [FY/Gu V1][src-fy-gu] | high |
| 11 | 小光蛊（三次） | Little Light Gu | 1 | 光道 | 106 | 合炼失败后再次购买补料。 | 同 #5。 | 同 #5，记录为重复获得，不单独生图。 | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 12 | 月芒蛊 | Moonglow Gu | 2 | 月道/攻击 | 106 | 月光蛊与两只小光蛊合炼成功。 | 视觉缺资料；可由月光蛊升级为更长月芒刃意象。 | 标本卡片，brighter crescent moon blade Gu, pale-blue glow, restrained. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/moonglow-gu.png` | [FY/Gu V1][src-fy-gu] | high |
| 13 | 酒虫（二次） | Liquor Worm | 1 | 食道/修行辅助 | 111 | 贾富商队竞拍再得一只，为四味酒虫准备。 | 同 #2。 | 同 #2，记录为重复获得，不单独生图。 | atlas-pending/no-png | [FY/Gu V1][src-fy-gu]; [Liquor Worm][src-liquor] | high |
| 14 | 黑豕蛊 | Black Boar Gu | 1 | 力道 | 111 | 商队竞拍所得，后用于交换鱼鳞蛊。 | 视觉缺资料；黑野猪力量意象。 | 标本卡片，black boar-associated strength Gu, coarse bristle motif, not a full boar. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 15 | 赤铁舍利蛊 | Red Steel Relic Gu | 2 | 人道/修为提升 | 113 | 商队竞拍所得，提升小境界。 | 视觉缺资料；舍利类可用赤铁珠核。 | 标本卡片，red steel relic Gu, dense iron-red bead carapace, plain old paper. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 16 | 隐石蛊 | Stealth Rock Gu | 1 | 土道/潜行 | 116 | 花酒行者第四处传承所得。 | 视觉缺资料；岩片伪装与潜隐是重点。 | 标本卡片，rock-camouflaged stealth Gu, cracked stone shell, subtle shadow. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 17 | 四味酒虫 | Four Flavours Liquor Worm | 2 | 食道/修行辅助 | 121 | 两只酒虫与酸甜苦辣四味酒合炼。 | 由酒虫升级，四味酒液色带可作锚。 | 标本卡片，pale liquor worm with four muted wine-color bands, not cute. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/four-flavors-liquor-worm.png` | [FY/Gu V1][src-fy-gu]; [Liquor Worm][src-liquor] | high |
| 18 | 鱼鳞蛊 | Fish Scale Gu | 1 | 防御/水生鳞甲 | 127 | 方源用黑豕蛊与青书交易所得。 | 视觉缺资料；鱼鳞片状主体。 | 标本卡片，fish-scale Gu with overlapping dull silver-blue scales, old paper. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 19 | 隐鳞蛊 | Stealth Scales Gu | 2 | 偷道/潜行防御 | 127 | 隐石蛊与鱼鳞蛊合炼，赛前炼成。 | 视觉缺资料；鳞片、半透明、潜隐。 | 标本卡片，translucent scale-covered stealth Gu, broken outline, low glow. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 20 | 地听肉耳草 | Earth Communication Ear Grass | 2 | 木道/侦察 | 128 | 第三处地藏花传承所得，用于地下/远距侦听。 | 草与肉耳意象明确但细节需原文复核。 | 标本卡片，grass Gu with small fleshy ear-shaped leaves, unsettling not gore. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/earth-communication-ear-grass.png` | [FY/Gu V1][src-fy-gu] | high |
| 21 | 掠夺蛊 | Plunder Gu | 2 | 偷道 | 138 | 白凝冰从熊战尸体得后未炼成，抛给方源，方源瞬炼。 | 视觉缺资料；偷道夺取可用钩爪/暗纹。 | 标本卡片，predatory theft Gu with hook-like limbs, restrained dark shell. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 22 | 赤铁舍利蛊（二次） | Red Steel Relic Gu | 2 | 人道/修为提升 | 143 | 方源用掠夺蛊从白凝冰身上夺得。 | 同 #15。 | 同 #15，记录为重复获得，不单独生图。 | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 23 | 石窍蛊 | Stone Aperture Gu | 3 | 空窍/封限 | 143 | 方源从白凝冰相关战斗中获得，用于压制资质/空窍风险。 | 视觉缺资料；石化空窍意象。 | 标本卡片，stone aperture Gu, hollow pebble core, sealed crack motif. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 24 | 水罩蛊 | Water Shield Gu | 2 | 水道/防御 | 143 | 战斗中获得的防御蛊，后合炼失败损毁。 | 视觉缺资料；水膜盾形方向。 | 标本卡片，water shield Gu, bead-like aquatic shell, faint ripple halo. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu]; [BNB][src-bnb] | high |
| 25 | 奴熊蛊（译名待复核） | Bear Enslavement Gu | 2 | 奴道 | 147 | 方源向熊娇嫚一行索取报酬。 | 视觉缺资料；奴道与熊纹锚点。 | 标本卡片，bear enslavement Gu, rough talon-like markings, verify Chinese name. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | medium |
| 26 | 人兽葬生蛊 | Man-Beast Life Burial Gu | 3 | 人道/牺牲仪式 | 152 | 方源借药乐牺牲仪式晋升家老的关键。 | 视觉缺资料；仪式性质强，不画血腥。 | 标本卡片, ominous burial Gu, human-beast knot motif, no gore, old paper. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu]; [Gu List][src-gu-list] | high |
| 27 | 清水蛊 | Cleansing Water Gu | 1 | 水道/净化 | 155 | 方源从赤练处“借”来。 | 视觉缺资料；净水液滴意象。 | 标本卡片，clear water cleansing Gu, glassy droplet carapace, plain. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 28 | 水行防御蛊 | Aqua Defense Gu | 2 | 水道/防御 | 155 | 水罩蛊合炼失败后，以战功换取的替代防御蛊。 | 视觉缺资料；水道防御类。 | 标本卡片，aqua defense Gu, layered water-shell plates, understated. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu]; [Gu List][src-gu-list] | high |
| 29 | 雷翼蛊 | Lightning Wings Gu | 3 | 雷道/移动 | 155 | 方源升三转成为家老后，族中赐蛊选择。 | 视觉缺资料；雷翼形态可作为锚。 | 标本卡片，lightning wing Gu, folded insect wings with faint electric veins. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 30 | 天蓬蛊 | Sky Canopy Gu | 3 | 水道/防御 | 155 | 白玉蛊与水行防御蛊合炼成功。 | 视觉缺资料；天幕/水罩组合。 | 标本卡片，sky-canopy defensive Gu, pale dome-shell carapace, old paper. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 31 | 血气蛊（译名待复核） | Blood Essence Gu | 2 | 血道/合炼材料 | 159 | 方源从赤练处勒索的血道合炼材料。 | 视觉缺资料；血色珠核但避免血腥。 | 标本卡片，blood essence Gu, dark red bead-like body, no gore. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | medium |
| 32 | 血月蛊 | Blood Moon Gu | 3 | 月道/血道攻击 | 159 | 月芒蛊与血气蛊合炼，第一次失败后成功。 | 视觉缺资料；血色月刃意象明确。 | 标本卡片，blood-moon crescent Gu, dark crimson lunar edge, restrained. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 33 | 兜率花 | Tusita Flower | 3 | 木道/储物 | 160 | 方源与赤钟交易后进入族中秘洞选得。 | 花形储物蛊，外观仍需复核。 | 标本卡片，dusky storage flower Gu, folded petals like small pouch, old paper. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 34 | 电锯金蜈 | Chainsaw Golden Centipede | 3 | 攻击 | 162 | 花酒行者传承洞中的野生蛊，方源选择炼化。 | 蜈蚣形态明确；齿刃是核心。 | 标本卡片，golden centipede Gu with serrated saw-like legs, dangerous but not splashy. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/chainsaw-golden-centipede.png` | [FY/Gu V1][src-fy-gu] | high |
| 35 | 雷盾蛊 | Lightning Shield Gu | 2 | 雷道/防御 | 167 | 雷冠狼王死后逃出的野生蛊，被方源抓住。 | 视觉缺资料；雷道护盾。 | 标本卡片，lightning shield Gu, compact insect with shield-like shell and faint arcs. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 36 | 生铁蛊 | Living Steel Gu | 2 | 金道/修复 | 177 | 方源向墨尘勒索，用于修复电锯金蜈。 | 视觉缺资料；活金属/铁液修复意象。 | 标本卡片，living steel Gu, dull iron carapace with mended seams, no chrome gloss. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 37 | 猪铁蛊（译名待复核） | Pig Iron Gu | ? mortal | 金道/交易 | 180 | 方源与墨脉婚约交易中交换得到。 | 视觉缺资料；中文名需原文复核。 | 标本卡片，pig-iron Gu, dark raw-iron lump body, verify before art. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | medium |
| 38 | 天元宝莲 | Heavenly Essence Treasure Lotus | 3 | 木道/元泉资源 | 182 | 花酒行者传承最终核心，关乎元泉和后续逃亡。 | 单页可复核；莲花形与元气/泉眼锚点。 | 标本卡片，pale lotus Gu with compact root and pearl-like essence drops, sacred but restrained. | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/heavenly-essence-treasure-lotus.png` | [FY/Gu V1][src-fy-gu]; [Heavenly Essence Treasure Lotus][src-lotus] | high |
| 39 | 千里地狼蛛 | Thousand Li Earthwolf Spider | 5 | 坐骑/移动 | 188 | 血湖墓地逃亡时获得的蛊坐骑。 | 蜘蛛/地狼复合坐骑；细节需原文复核。 | 标本卡片, earthwolf spider Gu, long travel legs and wolfish ground markings, no giant scene. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| 40 | 血颅蛊 | Blood Skull Gu | 4 | 血道/资质提升 | 197 | 方源预知局势后夺得一代血道核心蛊。 | 颅形与血道意象明确但避免血腥。 | 标本卡片，blood skull Gu, small skull-like chitin shell, dry red stains, no gore. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-skull-gu.png` | [FY/Gu V1][src-fy-gu]; [First Gen][src-first-gen] | high |
| 41 | 阴阳转身蛊 | Yin Yang Rotation Gu | 4 | 变化道 | 197 | 方源夺得后用于改变白凝冰性别/生机局势。 | 视觉缺资料；阴阳双虫或双核意象需复核。 | 标本卡片，paired yin-yang rotation Gu, twin contrasting shells, verify before art. | generated-p1: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/yin-yang-rotation-gu.png` | [FY/Gu V1][src-fy-gu]; [BNB][src-bnb] | high |
| 42 | 阳蛊 | Yang Gu | 4 | 变化道 | 199 | 阴蛊作用于白凝冰后剩余阳蛊。 | 视觉缺资料；与阴阳转身蛊同体系。 | 标本卡片，single yang Gu from paired rotation set, warm pale shell, verify before art. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |

## 青茅山三寨与他人使用

| # | 中文名 | 英译名 | 品阶 | 流派/类型 | 第一卷章节 | 第一卷作用 | 外观依据 | 视觉 prompt seed | 图像状态 | 来源 | 置信度 |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| A1 | 希望蛊 | Hope Gu | 未定/人道 | 开窍/资质测试 | 5 | 开窍大典中从月兰花海汇入少年空窍，开启修行资格。 | 单页与原著场景可复核；细小白光点是本卷视觉锚。 | 标本卡片，tiny pale-white mote Gu cluster above moon orchid petal, old paper, no giant insect. | generated-p0: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/hope-gu.png` | [Hope Gu][src-hope]; [First List][src-first-list] | high |
| A2 | 力量蛊 | Strength Gu | 未定 | 力道/任祖传说 | 5 | 任祖传说中首次出现的力道蛊。 | 视觉缺资料；传说概念型。 | 标本卡片，visual-gap, primitive strength Gu motif, do not generate before source check. | atlas-pending/no-png | [First List][src-first-list] | medium |
| A3 | 智慧蛊 | Wisdom Gu | 9/传说 | 智道/任祖传说 | 5 | 任祖传说中首次出现的智道蛊。 | 视觉缺资料；后文有成熟设定，但第一卷只作传说锚。 | 标本卡片，visual-gap, ancient wisdom Gu concept, verify later-volume appearance first. | atlas-pending/no-png | [First List][src-first-list] | medium |
| A4 | 月衣蛊 | Moon Raiment Gu | 未定 | 月道/防御路线 | 98 | 古月一族月道路线之一，由月光蛊与玉皮蛊方向相关。 | 视觉缺资料；月白衣膜方向。 | 标本卡片，moon-raiment Gu, pale folded garment-like wing shell, verify. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A5 | 月光宝王蛊 | Moonlight Treasure King Gu | 5 | 月道/巅峰配方 | 98 | 古月一族月道巅峰合炼路线提及。 | 视觉缺资料；高阶月光蛊路线，不做仙界奇观。 | 标本卡片，regal moonlight treasure king Gu, compact crescent gem shell, restrained. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A6 | 月临蛊（译名待复核） | Moon Harbringer Gu | 2 | 月道/酒虫路线材料 | 105 | 七香酒虫配方相关，由酒虫与月光蛊路线关联。 | 视觉缺资料；英文页拼写 Harbringer，中文需原文复核。 | 标本卡片，moon-harbinger Gu, moonlit feeler and wine-drop hint, verify name. | atlas-pending/no-png | [Gu List][src-gu-list] | low |
| A7 | 月霓裳/胧月蛊（译名待复核） | Moonveil Gu | 2 | 月道/可选路线 | 105 | 月光蛊可选合炼路线之一。 | 视觉缺资料；薄纱月光意象。 | 标本卡片，moonveil Gu, translucent veil-like wings, no character clothing. | atlas-pending/no-png | [Gu List][src-gu-list] | low |
| A8 | 兽语蛊 | Beast Language Gu | 未定 | 沟通/侦察 | 127 | 可与野兽交流获取情报，第一卷同盟战前后提及。 | 视觉缺资料；声纹/兽牙锚。 | 标本卡片，beast-language Gu, small insect with ear and fang motifs, verify. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A9 | 照影蛊 | Digital Shade Gu | 2 | 记录/侦察 | 156 | 记录影像类蛊，可辅助案件追查。 | 视觉缺资料；影像记录石片/镜翅方向。 | 标本卡片，image-recording Gu, smoky mirror-like wing plates, old paper. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A10 | 归空蝉 | Air Return Cicada | 2-4 | 未定/族库秘藏 | 160 | 古月族地下秘洞收藏。 | 视觉缺资料；蝉形与空返含义。 | 标本卡片，air-return cicada Gu, pale empty-wing cicada, verify. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A11 | 孔宣草 | Cave Declaration Grass | 2-4 | 未定/族库秘藏 | 160 | 古月族地下秘洞收藏。 | 草形明确但能力缺资料。 | 标本卡片，cave-declaration grass Gu, dark cave sprout with hollow stem, verify. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A12 | 枯骨蜻蜓 | Dried Bone Dragonfly | 2-4 | 未定/族库秘藏 | 160 | 古月族地下秘洞收藏。 | 蜻蜓/骨质意象明确。 | 标本卡片，dried bone dragonfly Gu, brittle bone wings, not horror gore. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A13 | 凤翼蝶 | Phoenix Wing Butterfly | 2-4 | 未定/族库秘藏 | 160 | 古月族地下秘洞收藏。 | 蝴蝶形，凤翼色纹需克制。 | 标本卡片，phoenix-wing butterfly Gu, muted ember wing marks, no bright fantasy splash. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A14 | 往生草 | Afterlife Grass | 未定 | 木道/治疗 | 176 | 治疗型蛊，狼潮后期相关。 | 草形明确；外观细节不足。 | 标本卡片，afterlife grass Gu, pale medicinal blade grass, cold old paper. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A15 | 生息草 | Life Breath Grass | 1 | 木道/治疗材料 | 75 | 王大相关；也是生离死别蛊材料。 | 草形明确；生命气息锚。 | 标本卡片，life-breath grass Gu, small breathing leaf blades, subtle vapor. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A16 | 红针蝎 | Red Needle Scorpion | 1 | 材料/毒蝎意象 | 75 | 生离死别蛊材料。 | 蝎形明确。 | 标本卡片，red-needle scorpion Gu, tiny red stinger, naturalist specimen style. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A17 | 寡妇蛛 | Widow Spider Gu | 1 | 材料/蛛形 | 75 | 生离死别蛊材料。 | 蛛形明确。 | 标本卡片，widow spider Gu, dark small spider with restrained red mark, no horror scene. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| A18 | 火油蛊 | Kerosene Gu | 未定 | 火道/合炼材料 | 152 | 人兽葬生蛊十种材料之一。 | 视觉缺资料；油液/火道但不是火焰爆炸。 | 标本卡片，kerosene Gu, oily dark amber body, faint fuel sheen, no flame burst. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |

## 白凝冰、铁血冷、一代与天鹤上人相关

| # | 中文名 | 英译名 | 品阶 | 流派/类型 | 第一卷章节 | 第一卷作用 | 外观依据 | 视觉 prompt seed | 图像状态 | 来源 | 置信度 |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| B1 | 冰魔蛊 | Frost Demon Gu | 3 | 冰道/本命 | 131+ | 白凝冰第一卷男性形态早期核心蛊之一。 | BNB 页给出手臂透明蓝冰化效果；复核后以透明蓝冰甲壳与骨线内纹作视觉锚。 | 标本卡片，frost demon Gu, blue transparent frost carapace and bone-like inner lines. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/frost-demon-gu.png` | [BNB][src-bnb] | high |
| B2 | 旋风蛊 | Whirlwind Gu | 1 | 风道/移动辅助 | 131+ | 白凝冰早期能力蛊。 | 视觉缺资料。 | 标本卡片，whirlwind Gu, small spiral-wing insect, muted wind swirl, verify. | atlas-pending/no-png | [BNB][src-bnb] | medium |
| B3 | 冰刃蛊 | Iceblade Gu | 2 | 冰道/攻击 | 134 | 白凝冰“冰刃风暴”体系核心。 | 复核为冰刃风暴体系能力蛊；以刃状冰翼和冷蓝白甲壳作功能视觉锚。 | 标本卡片，iceblade Gu, blade-like ice wing, cold blue-white, no explosion. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/iceblade-gu.png` | [BNB][src-bnb] | high |
| B4 | 青鸟冰棺蛊 | Blue Bird Ice Coffin Gu | 3 | 冰道/控制 | 131+ | 白凝冰早期能力蛊。 | 复核为青鸟/冰棺名锚与控制能力；以鸟形冰蛹、冰棺壳作推定视觉锚。 | 标本卡片，blue-bird ice-coffin Gu, bird-shaped icy chrysalis, restrained. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blue-bird-ice-coffin-gu.png` | [BNB][src-bnb] | medium |
| B5 | 冰锥蛊 | Icicle Gu | 2 | 冰道/攻击 | 131+ | 白凝冰早期能力蛊。 | 复核为冰锥攻击能力蛊；以狭长冰晶锥体、虫足贴体作视觉锚。 | 标本卡片，icicle Gu, narrow crystal spike insect, pale blue, old paper. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/icicle-gu.png` | [BNB][src-bnb] | medium |
| B6 | 漩涡蛊 | Swirl Gu | 未定 | 移动 | 131+ | 增加转向/旋转速度。 | BNB 页给功能描述，外观缺。 | 标本卡片，swirl Gu, curled shell and circular motion marks, verify. | atlas-pending/no-png | [BNB][src-bnb] | medium |
| B7 | 烈风蛊 | Fierce Wind Gu | 未定 | 风道 | 131+ | 白凝冰早期能力蛊。 | 视觉缺资料。 | 标本卡片，fierce wind Gu, sharp wind-cut wings, restrained motion marks. | atlas-pending/no-png | [BNB][src-bnb] | medium |
| B8 | 雷眼蛊 | Lightning Eye Gu | 3 | 雷道/侦察或攻击 | 131+ | 白凝冰早期能力蛊。 | 视觉缺资料；眼形雷光锚。 | 标本卡片，lightning eye Gu, eye-like shell with faint electric vein, no bright VFX. | atlas-pending/no-png | [BNB][src-bnb] | medium |
| B9 | 正气蛊 | Righteous Gu | 未定 | 正道/铁家 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；概念型，暂不生图。 | 标本卡片，visual-gap, righteous Gu concept, verify before art. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B10 | 铁手擒拿蛊 | Ironfist Grappling Gu | 5 | 金道/擒拿 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；铁拳擒拿锚。 | 标本卡片，ironfist grappling Gu, iron claw-fist shell, old paper. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B11 | 仙人掌指路蛊 | Cactus Pointer | 3 | 侦察/指路 | 170+ | 铁血冷追踪/查案相关蛊。 | 复核为指路/追踪相关；以仙人掌刺针、指针触须与灰绿甲壳作视觉锚。 | 标本卡片，cactus pointer Gu, thorny needle body like compass spine, verify. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/cactus-pointer-gu.png` | [Tie Xue Leng][src-tie] | medium |
| B12 | 天地宏音蛊 | Heaven Earth Magnificent Sound Gu | 5 | 音道/侦查或压制 | 170+ | 铁血冷能力蛊之一。 | 来源可复核音浪/宏音能力；本体外观仍属推定，以共振壳脊与耳壳甲片作用途视觉锚。 | 标本卡片，sound Gu with shell ridges like resonant horn, no text/symbols. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/heaven-earth-magnificent-sound-gu.png` | [Tie Xue Leng][src-tie] | medium |
| B13 | 同感蛊 | Shared-Sense Gu | 未定 | 感知/侦查 | 170+ | 铁血冷能力蛊之一。 | 复核为感知共享能力；以近乎无形、双触须、双眼纹与重影感作视觉锚。 | 标本卡片，shared-sense Gu, paired antennae and twin eye markings, verify. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/shared-sense-gu.png` | [Tie Xue Leng][src-tie] | medium |
| B14 | 油龙蛊 | Oil Dragon Gu | 4 | 油/火相关 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；龙形不确定，避免画成真龙。 | 标本卡片，oil-dragon Gu, dark oily serpentine insect, restrained. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B15 | 火龙蛊 | Fire Dragon Gu | 4 | 火道 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；火龙名不等于巨龙。 | 标本卡片，fire-dragon Gu, ember-scaled larva with horn-like head, no explosion. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B16 | 巨山傀儡蛊 | Giant Mountain Puppet Gu | 未定 | 土/傀儡 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料。 | 标本卡片，giant-mountain puppet Gu, stone-jointed beetle motif, verify. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B17 | 镇魔铁链蛊 | Demon Suppression Iron Chain Gu | 未定 | 金道/封锁 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；锁链封禁锚。 | 标本卡片，chain-like Gu, iron segments and suppression talon, no readable talismans. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | medium |
| B18 | 防患未然蛊 | Problem Nipped in the Bud Gu | 未定 | 未定 | 170+ | 铁血冷能力蛊之一。 | 视觉缺资料；概念型暂不生图。 | 标本卡片，visual-gap, prevention Gu concept, verify before art. | atlas-pending/no-png | [Tie Xue Leng][src-tie] | low |
| B19 | 血鬼蛊 | Blood Wight Gu | 5 | 血道/本命 | 185+ | 一代古月本命蛊，将其化为血鬼飞僵。 | 一代页有血鬼化外观，可作为间接锚；以干枯赤褐蝠形甲壳和折膜翼表现，避免血腥。 | 标本卡片，blood wight Gu, dry crimson bat-like chitin, no gore. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-wight-gu.png` | [First Gen][src-first-gen] | high |
| B20 | 刀翅血蝠蛊 | Bladewing Blood Bat Gu | 3 | 血道/群攻 | 185+ | 一代能力蛊，血蝠体系。 | 复核为血蝠体系能力蛊；以刀翅、暗红甲壳和单体蝠形蛊作视觉锚，不画群攻场景。 | 标本卡片，blood-bat Gu with blade-like wings, dark red, no swarm scene. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/bladewing-blood-bat-gu.png` | [First Gen][src-first-gen] | high |
| B21 | 血河蟒 | Blood River Python | 5 | 血道 | 185+ | 一代能力蛊。 | 复核为血道蟒形能力蛊；以盘曲蟒形蛊、干红鳞甲和虫化口器作视觉锚。 | 标本卡片，blood-river python Gu, coiled serpent-like Gu, dried crimson, no gore. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-river-python.png` | [First Gen][src-first-gen] | high |
| B22 | 血滴子 | Blood Guillotine | 5 | 血道/杀伐 | 185+ | 一代能力蛊。 | 复核为血道杀伐能力蛊；以圆环刃状甲壳、内齿和虫足表现，避免刑具与血腥场景。 | 标本卡片，blood guillotine Gu, circular blade-like chitin, restrained. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-guillotine.png` | [First Gen][src-first-gen] | high |
| B23 | 血狂蛊 | Blood Frenzy Gu | 4 | 血道/状态 | 185+ | 一代能力蛊。 | 复核为血道状态能力蛊；以紧绷弓起的赤脉虫壳和重压姿态作视觉锚，不画血液。 | 标本卡片，blood frenzy Gu, tense red-veined insect shell, no gore. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-frenzy-gu.png` | [First Gen][src-first-gen] | high |
| B24 | 血幕天华蛊 | Blood Curtain Skyflower Gu | 5 | 血道/防御封锁 | 197 | 一代与方源争夺中出现，方源借预知局势夺蛊。 | 复核为血道防御封锁能力蛊；以折叠赤色花壳、幕障膜片和中心虫核作视觉锚。 | 标本卡片，blood-curtain skyflower Gu, folded crimson petal-barrier shell, no bloody scene. | generated-p2: `apps/desktop/src/assets/rebrng/gu/s0-qingmao/blood-curtain-skyflower-gu.png` | [First Gen][src-first-gen]; [FY/Gu V1][src-fy-gu] | high |
| B25 | 驭鹤蛊 | Crane Enslavement Gu | 5 | 奴道 | 190+ | 天鹤上人核心奴道蛊，控制鹤群。 | 视觉缺资料；鹤羽/奴道锚。 | 标本卡片，crane enslavement Gu, pale feather-like antennae, no full bird army. | atlas-pending/no-png | [Lord Sky Crane][src-sky-crane] | high |
| B26 | 血亲蛊 | Kinship Bloodworm | 5 | 血道/血缘追踪 | 190+ | 天鹤上人与一代纠葛相关。 | 视觉缺资料；血缘追踪虫。 | 标本卡片，kinship bloodworm Gu, thin red worm with branching vein pattern, no gore. | atlas-pending/no-png | [Lord Sky Crane][src-sky-crane] | high |
| B27 | 玉葬续命蛊 | Life-Retaining Jade Burial Gu | 5 | 续命/封存 | 190+ | 天鹤上人借此保留残命沉睡。 | 视觉缺资料；玉葬/续命锚。 | 标本卡片，jade-burial life-retaining Gu, sealed jade cocoon shell, restrained. | atlas-pending/no-png | [Lord Sky Crane][src-sky-crane] | high |
| B28 | 扬眉吐气蛊 | Raise Eyebrows & Exhale Gu | 未定 | 未定 | 190+ | 天鹤上人能力蛊。 | 视觉缺资料；概念型暂不生图。 | 标本卡片，visual-gap, raise-eyebrows-exhale Gu concept, verify before art. | atlas-pending/no-png | [Lord Sky Crane][src-sky-crane] | low |

## 配方、融合路线与传说提及

| # | 中文名 | 英译名 | 品阶 | 流派/类型 | 第一卷章节 | 第一卷作用 | 外观依据 | 视觉 prompt seed | 图像状态 | 来源 | 置信度 |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| C1 | 地藏花 | Earth Treasury Flower Gu | 未定 | 木道/传承储藏 | 63/79/128 | 花酒行者将白豕蛊、玉皮蛊、地听肉耳草等藏于地藏花。 | 花形储藏蛊，外观细节需原文复核。 | 标本卡片，earth-treasury flower Gu, closed underground bud with soil-root pouch. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu] | high |
| C2 | 七香酒虫 | Seven Fragrances Liquor Worm | 未定 | 食道/合炼路线 | 105 | 酒虫高阶路线提及，配方与月临蛊、七种香料相关。 | 视觉缺资料；酒虫升级路线。 | 标本卡片，seven-fragrance liquor worm, pale worm with seven subtle spice-color specks, verify. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| C3 | 生离死别蛊 | Love Life Separation Gu | 未定 | 未定/配方提及 | 75 | 王大相关材料链中被提及。 | 视觉缺资料；名字强叙事但缺外观。 | 标本卡片，visual-gap, love-life-separation Gu concept, do not generate yet. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| C4 | 电齿杀人蜈 | Chainsaw Killer Centipede | 4 | 攻击/进阶路线 | 166 mentioned | 电锯金蜈进阶路线之一。 | 蜈蚣齿刃方向明确。 | 标本卡片，rank-four killer centipede Gu, harsher serrated golden body, no battle scene. | atlas-pending/no-png | [Gu List][src-gu-list] | medium |
| C5 | 阴蛊 | Yin Gu | 4 | 变化道 | 197/199 | 阴阳转身蛊使用后影响白凝冰性别；第一卷末关键状态。 | 视觉缺资料；与阳蛊成对。 | 标本卡片，single yin Gu from paired rotation set, cool dark shell, verify. | atlas-pending/no-png | [FY/Gu V1][src-fy-gu]; [BNB][src-bnb] | high |
| C6 | 蛊虫总称 / 野生蛊 | Wild Gu | 不定 | 世界观 | 1-199 | 第一卷大量涉及野生蛊捕捉、炼化和反噬风险。 | 非单一资产，不建议生图。 | no-image: taxonomy concept only. | no-image | [Gu List][src-gu-list] | high |

## 后续生图优先级

| 优先级 | 条目 | 原因 |
|---|---|---|
| P0 | 希望蛊、月光蛊、酒虫、春秋蝉、白豕蛊、玉皮蛊、九叶生机草、天元宝莲 | 第一卷辨识度最高，外观或叙事锚最清楚。 |
| P1 | 白玉蛊、月芒蛊、四味酒虫、地听肉耳草、电锯金蜈、血颅蛊、阴阳转身蛊 | 对玩法/剧情有强作用，但部分外观需要再查原文。 |
| P2 | 白凝冰冰道组、一代血道组、铁血冷侦查组 | 战斗图鉴价值高，但需分批查章节，避免把能力名画成华丽封面。 |
| 暂缓 | 概念型、译名待复核、只有配方名的蛊 | 先补资料，不直接生图。 |

## 验收记录

- 2026-04-27：建立第一卷蛊虫图鉴 full-index pass 1；未生成任何 PNG。
- 方源第一卷实际获得/使用记录保留 42 条，覆盖 [Fang Yuan/Gu - Volume 1][src-fy-gu] 的验收基线。
- 每个条目均提供至少一个来源链接；外观不足条目标注 `视觉缺资料` 或 `译名待复核`。
- 2026-04-28：使用 Codex 内置 image_gen 完成 P0 标本卡片 8 张：希望蛊、月光蛊、酒虫、春秋蝉、白豕蛊、玉皮蛊、九叶生机草、天元宝莲；候选留档于 `output/imagegen/s0-qingmao/gu-atlas/p0/`。九叶生机草首版叶数不够清晰，最终采用 `nine-leaf-vitality-grass-candidate-02.png`。
- 2026-04-28：使用 Codex 内置 image_gen 完成 P1 标本卡片 7 张：白玉蛊、月芒蛊、四味酒虫、地听肉耳草、电锯金蜈、血颅蛊、阴阳转身蛊；候选留档于 `output/imagegen/s0-qingmao/gu-atlas/p1/`。
- 2026-04-28：使用 Codex 内置 image_gen 完成 P2 标本卡片 13 张：冰魔蛊、冰刃蛊、青鸟冰棺蛊、冰锥蛊、血鬼蛊、刀翅血蝠蛊、血河蟒、血滴子、血狂蛊、血幕天华蛊、仙人掌指路蛊、天地宏音蛊、同感蛊；候选留档于 `output/imagegen/s0-qingmao/gu-atlas/p2/`。天地宏音蛊来源只确认音浪/宏音能力，本体形态仍按用途锚点推定，后续若查到原文外观应优先替换。

[src-fy-gu]: https://reverend-insanity.fandom.com/wiki/Fang_Yuan/Gu
[src-gu-list]: https://reverend-insanity.fandom.com/wiki/Page_List/Gu
[src-first-list]: https://reverend-insanity.fandom.com/wiki/Page_List/First
[src-bnb]: https://reverend-insanity.fandom.com/wiki/Bai_Ning_Bing
[src-tie]: https://reverend-insanity.fandom.com/wiki/Tie_Xue_Leng
[src-first-gen]: https://reverend-insanity.fandom.com/wiki/First_Gen_Gu_Yue
[src-sky-crane]: https://reverend-insanity.fandom.com/wiki/Lord_Sky_Crane
[src-moonlight]: https://reverend-insanity.fandom.com/wiki/Moonlight_Gu
[src-liquor]: https://reverend-insanity.fandom.com/wiki/Liquor_Worm
[src-hope]: https://reverend-insanity.fandom.com/wiki/Hope_Gu
[src-lotus]: https://reverend-insanity.fandom.com/wiki/Heavenly_Essence_Treasure_Lotus
[src-biaojianku]: https://www.biaojianku.com/archives/4533.html
