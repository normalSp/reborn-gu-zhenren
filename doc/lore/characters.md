# Character Index

## Core Cast

| Character | Development Summary | Source Anchors |
| --- | --- | --- |
| 方源 | 极端理性、利己、长期主义。AI叙事不得把他写成无条件友善导师；与玩家互动应带有试探、利用、交易或冷眼旁观。 | `original work/reverend-insanity.txt` search: `方源`, `春秋蝉`; canon: `src/canon/npcs.json` |
| 古月方正 | 方源血亲与对照角色，适合承担正道秩序、家族期待、命运反差叙事。 | search: `方正`, `古月山寨`; canon: `src/canon/npcs.json` |
| 白凝冰 | 北冥冰魄体代表，冷酷、危险、与十绝体压迫/觉醒线强相关。 | search: `白凝冰`, `北冥冰魄体`; canon: `src/canon/npcs.json` |
| 商心慈 | 商家城与商道/正道温和路线锚点，可作为交易、名望、人情债剧情入口。 | search: `商心慈`, `商家城`; canon: `src/canon/npcs.json`, `src/canon/economy.json` |
| 铁若男 | 正道执法、追凶、家族责任锚点，适合约束玩家魔道行为后果。 | search: `铁若男`, `铁家`; canon: `src/canon/npcs.json` |
| 黑楼兰 | 北原权力、部族、力道/野心线锚点，适合势力争夺和小队合作的高风险样例。 | search: `黑楼兰`, `北原`; canon: `src/canon/npcs.json` |
| 太白云生 | 治疗、宙道、人情与牺牲议题锚点，适合小队支援和道心事件。 | search: `太白云生`; canon: `src/canon/npcs.json` |
| 凤九歌 | 中洲天才、音道、正魔边界复杂性的代表。 | search: `凤九歌`, `中洲`; canon: `src/canon/npcs.json` |
| 龙公 | 天庭、气道、宿命大战压迫感锚点，不能在低转阶段轻易正面介入。 | search: `龙公`, `天庭`; canon: `src/canon/npcs.json` |
| 人祖 | 世界观寓言源头，用于价值观、宿命、十子/十绝体等设定锚定。 | search: `人祖`, `十子`; canon: `src/canon/terminology.json` |

## NPC Implementation Notes

- 动态NPC默认境界应限制在1-2转，除非章节/canon明确允许。
- 队友不是纯数值卡牌：`adventureTrust` 表示是否愿意把命交给玩家，`interestDrive` 表示是否因收益而行动。
- 原著核心人物与玩家互动时，应优先遵循既有人设；不能为了奖励或教学强行降智。
