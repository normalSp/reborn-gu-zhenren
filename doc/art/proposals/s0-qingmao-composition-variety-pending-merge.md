# S0 Qingmao Composition Variety Proposal

状态：pending-merge proposal
日期：2026-04-29
范围：《蛊真人》第一卷 / 青茅山阶段场景图与战斗图。本文档只作为待合并构图扩展，不覆盖正式 Style Bible。

## 背景与问题

当前正式文档已经废止“固定左侧 UI 留白 + 中右主体”的战斗规则，并建立了 `Composition Contract`。现有 9 个 `shot_id` 足够支撑 P0 战斗图，但不够支撑后续 40+ 张叙事场景全量重生。

最近两张通过图都使用“前景大暗形 + 远处白色人物 + 中央道路/山道”的空间关系。它们单张成立，但连续观看会有相似感。后续需要扩大构图池，并在每次生图前写明选择理由，避免 GPT Image 2 回到最容易生成的英雄海报或斜向对峙。

本提案不改变 `quality-lock-master` 的画面流畅感：电影感大色块、低纹理密度、干净暗形、灰绿冷雾、连续边缘光仍然有效。这里扩展的是镜头与空间组织。

## 资料来源转述

- OpenAI Image generation guide：GPT Image 的指令跟随较强，但复杂布局仍需要明确主体位置、画面关系和负面约束。
- OpenAI Cookbook GPT Image prompting guide：prompt 应分层写清场景、主体、关键细节、风格和避免项；构图相关词要具体到 framing、viewpoint、angle、placement。
- Learn Prompting shot types：镜头距离、角度和视点本身就是可控变量，不应只依赖“史诗感”“电影感”等风格词。
- Backblaze `image-generation-prompt-flow`：适合借鉴“分析意图 - 生成 prompt - 记录 lineage”的流程，用于单张慢产记录。
- LayoutLLM-T2I：启发是“先写布局，再写画面”，本项目只借鉴流程，不引入依赖。
- `awesome-gpt-image-2-prompts`：适合作为 prompt 结构和案例库参考，不作为构图控制引擎。

来源链接：
- https://developers.openai.com/api/docs/guides/image-generation
- https://cookbook.openai.com/examples/multimodal/image-gen-1.5-prompting_guide
- https://learnprompting.org/docs/image_prompting/shot_type
- https://github.com/backblaze-b2-samples/image-generation-prompt-flow
- https://github.com/LayoutLLM-T2I/LayoutLLM-T2I
- https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts

## 扩展 Composition Contract

每张场景/战斗图生成前，先填写下面的短表。风格段保持短，把 prompt 注意力留给构图。

```text
asset:
story_moment:
shot_id:
camera_height:
camera_distance:
camera_angle:
main_shape:
foreground:
midground:
background:
motion_or_attention_path:
negative_space:
thumbnail_read:
avoid_repeating:
quality_lock_notes:
```

执行规则：
- `shot_id` 必须从构图库中选择，或新建一个唯一命名并写明原因。
- `main_shape` 写大形，不写细节，例如 diagonal spear, ring, vertical column, corridor wedge。
- `avoid_repeating` 必须对比最近 2 张正式图，避免重复主视觉位置、负空间位置和主要动线。
- 战斗图不默认 UI 留白；普通叙事场景如需要 UI 留白，必须写明留白位置和理由。
- 每完成 4 张正式图做一次 contact sheet，只检查构图重复和风格漂移，不作为批量生成许可。

## 构图类型库

### 战斗动作类

| shot_id | 用途 | 硬规则 | 少用/避雷 |
| --- | --- | --- | --- |
| `low-ground-clash` | 近身硬碰硬。 | 低机位，前景武器/身体压迫，敌人在纵深中读取。 | 不连续复用前景黑影 + 远处白人。 |
| `overhead-crossfire` | 林道、山道、多方向攻防。 | 斜俯视，攻击线从上方读清楚。 | 后续少用，避免和青书图相似。 |
| `side-scroll-pursuit` | 坐骑追逐、逃亡压力。 | 横向运动贯穿画面，前后速度差明显。 | 不做静态双人海报。 |
| `worm-eye-monster-gate` | 巨兽压迫人类防线。 | 虫眼仰视，人小兽大，先读尺度。 | 雷光不要变成二游技能特效。 |
| `claustrophobic-cavern-attack` | 洞窟近战、小空间突袭。 | 低顶、遮挡、非水平来袭。 | 避免满屏碎石和脏噪声。 |
| `vertical-storm-layering` | 飞行单位、高阶混战。 | 上下多层空间，风暴/铁链/鹤群分层旋动。 | 不做平面双人对峙。 |
| `diagonal-crash-entry` | 突袭、破门、撞入战场。 | 主体从画外沿对角线冲入，入画边缘必须有切断感。 | 不要把主体摆回中心站桩。 |
| `encircled-pressure-ring` | 围杀、狼群、蛊虫压迫。 | 中央目标被环形压力包围，外圈比内圈更大更暗。 | 环形不要画成仪式魔法阵。 |
| `split-level-duel` | 上下坡、台阶、崖壁对打。 | 两方位于不同高度，地形本身制造强弱关系。 | 不要回到平面左右对峙。 |

### 叙事场景类

| shot_id | 用途 | 硬规则 | 少用/避雷 |
| --- | --- | --- | --- |
| `tiny-figure-vast-place` | 青茅山、学堂、山门、祠堂。 | 极小人物 + 巨大环境，先读地点权力感。 | 不连续使用左侧固定留白。 |
| `threshold-entry` | 传承洞窟、地下密室、门槛发现。 | 洞口/门框/裂缝做前景框，内部空间是视觉目标。 | 不要把人物放成旅游照。 |
| `corridor-depth` | 调查、追踪、寨门纵深。 | 走廊/山道/木栅形成一条深透视路径。 | 中央路不能每张都一样。 |
| `tableau-ritual-circle` | 开窍大典、祭祀、血湖。 | 环形人群或器物围绕一个危险中心。 | 不要变成整齐舞台剧。 |
| `foreground-witness` | 方源旁观、铁家调查、族人见证。 | 前景只露背影/肩部，事件在中远景。 | 前景人物不要抢成主角海报。 |
| `object-first-story` | 贾金生、赌石、传承遗物、蛊虫发现。 | 物件在前景最大，人物和空间解释后果。 | 避免静物卡牌感。 |
| `aftermath-wide-silence` | 战后空场、牺牲、毁灭余波。 | 大面积空场和残迹，人物极少或没有。 | 不要用满屏烟尘遮住叙事。 |

### 限用类型

- `central-void-standoff`：只少量用于真正的心理对峙。空白在双方之间，不固定在左侧。
- `left-ui-negative-space`：只用于需要 UI 容纳的普通背景场景，不用于战斗图。
- `poster-duel-symmetry`：默认禁用，除非目标就是仪式化对峙。

## P0/P1 推荐分配

| 资产 | 推荐 shot_id | 理由 |
| --- | --- | --- |
| `earthwolf-spider-third-battle.png` | `side-scroll-pursuit` + S 形山道 | 地狼蛛横穿画面，方源伏低，白凝冰在后方弯道追杀，和前两张拉开。 |
| `blood-lake-rank-five-battle.png` | `tableau-ritual-circle` 或 `triangular-ritual-battle` | 血湖墓地天然适合危险中心，三方压力围绕中心读取。 |
| `thunder-crown-wolf-village-battle.png` | `worm-eye-monster-gate` | 巨狼压过寨门，人类防线在低处，重点是尺度差。 |
| `xiong-li-squad-vs-bai-ning-bing.png` | `over-shoulder-squad-threat` | 前景小队背影框住远处白凝冰，表现压倒性差距。 |
| `fang-yuan-monkey-king-cavern-fight.png` | `claustrophobic-cavern-attack` | 洞窟低顶和遮挡可以自然制造压迫。 |
| `first-gen-vs-tie-xue-leng-crane-chaos.png` | `vertical-storm-layering` | 一代、铁血冷、鹤群、血蝠适合上下分层风暴。 |
| 学堂/山门重生 | `tiny-figure-vast-place` | 先读制度建筑和青茅山尺度。 |
| 花酒传承探索 | `threshold-entry` | 洞口、裂缝、地下空间能避免普通站景。 |
| 贾金生死亡/赌石 | `object-first-story` | 用尸体、赌石或遗留物做叙事前景，避免单纯人物对峙。 |
| 铁家调查 | `foreground-witness` 或 `corridor-depth` | 用旁观/审讯视角强化压迫和调查感。 |
| 青茅山毁灭 | `aftermath-wide-silence` | 用空场和残迹表现结束，不做满屏爆炸。 |

## 单张生成记录格式

```text
date:
asset:
selected_shot_id:
selection_reason:
candidate_path:
official_path:
status:
dimension:
quality_check:
composition_check:
drift_notes:
next_asset:
```

状态建议：
- `candidate-awaiting-user-review`
- `generated-pass-single-N`
- `generated-pass-single-N-with-notes`
- `rejected-quality-drift`
- `rejected-composition-repeat`
- `queued-redo-after-user-feedback`

## 合并建议

如果本提案通过，只合并三部分到 `s0-qingmao-art-roadmap.md`：
- 扩展 `Composition Contract` 模板。
- 构图类型库。
- 每张生成前写 `selected_shot_id` 与 `selection_reason` 的流程规则。

暂不把所有来源说明和长表全部塞进主文档；主文档保留精简版，proposal 作为详细档案长期保存。
