# RebornG BGM 素材来源指南

## 当前口径

v0.7.0 发布包默认使用 `free_public_pack`，只启用免费可核验素材。用户人工核对的角色曲和名场面曲作为 `user_supplied_reference` 登记，等待本地文件后再进入私用二创包。

不要再使用自动抓取 B 站、网易云或其他商业平台音频的脚本。旧版 `yt-dlp` 方案已经废弃。

## 已启用免费素材

| 用途 | 文件 | 来源 | 许可 |
| --- | --- | --- | --- |
| 南疆 | `public/audio/bgm/domain/nanjiang.mp3` | OpenGameArt: Forest Ambience | CC0 |
| 北原 | `public/audio/bgm/domain/beiyuan.ogg` | OpenGameArt: From Here to Where? | CC0 |
| 东海 | `public/audio/bgm/domain/donghai.mp3` | OpenGameArt: The Field Of Dreams | CC0 |
| 西漠 | `public/audio/bgm/domain/ximo.ogg` | OpenGameArt: Ancient Power Of Serpents | CC0 |
| 中州 | `public/audio/bgm/domain/zhongzhou.mp3` | OpenGameArt: Town Theme RPG | CC0 |
| 小队/普通战 | `public/audio/bgm/combat/squad_battle.mp3` | OpenGameArt: Battle Theme A | CC0 |
| Boss 战 | `public/audio/bgm/combat/boss_battle.mp3` | OpenGameArt: Battle Theme | CC0 |
| 定场诗 | `public/audio/bgm/scene/death_poem.ogg` | OpenGameArt: Cave Theme | CC0/OGA-BY |
| 逆流河 fallback | `public/audio/bgm/scene/reverse_flow_river.ogg` | OpenGameArt: Ancient Power Of Serpents | CC0 |

## 后续替换规则

1. 新音频必须先登记到 `src/canon/audio-source-manifest.json`。
2. `runtimeEnabled=true` 的条目必须有文件、来源 URL、许可、用途说明。
3. 免费公布包不启用 `localFileRequired=true` 的角色曲。
4. 战斗和成就音效不允许 AI/合成占位。
5. 如果用户提供私用包角色曲文件，只改 manifest 与本地文件，不改战斗、经济或剧情逻辑。
