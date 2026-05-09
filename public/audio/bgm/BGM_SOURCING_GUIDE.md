# RebornG BGM 素材来源指南

## 当前口径

v0.7.1 私用二创包启用用户本地提供的角色曲和名场面曲；免费公布包仍保留 `free_public_pack` fallback。根目录 `bgm/` 只是素材暂存区，运行时必须引用 `public/audio/...`。

不要使用自动抓取 B 站、网易云或其他平台音频的脚本。用户提供的文件可以复制到 runtime 目录并在 manifest 中标注为 `user_supplied_local_fan_pack`。

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
| 定场诗 fallback | `public/audio/bgm/scene/death_poem.ogg` | OpenGameArt: Cave Theme | CC0/OGA-BY |
| 逆流河 fallback | `public/audio/bgm/scene/reverse_flow_river.ogg` | OpenGameArt: Ancient Power Of Serpents | CC0 |

## 已启用用户曲规则

1. 新音频必须先登记到 `src/canon/audio-source-manifest.json`。
2. `runtimeEnabled=true` 的条目必须有文件、来源、许可/使用口径、用途说明。
3. 同一角色有多曲时，新增多条 track/entry，不在代码里写随机表。
4. 多曲选择由 `character-bgm-trigger` 按 turn/seed 可复现轮换。
5. 战斗和成就音效不允许 AI/合成占位。

## 推荐免费素材站点

- Kenney Audio：适合 UI、按钮、确认、轻提示。
- OpenGameArt：适合 CC0/OGA 明确的 BGM、战斗音效、环境音。
- Pixabay：适合环境声和短音效，但需要逐条确认许可摘要。
- Freesound：只使用 CC0 或许可明确、可归档来源的条目。
