# RebornG v0.7.1 音频清单说明

本文件只描述音频策略；运行时真相源为 `src/canon/audio-source-manifest.json`，`public/audio/audio-source-manifest.json` 是发布查看用镜像。

## 发布策略

- `free_public_pack`：保留免费可核验素材，作为公开包 fallback。
- `nonprofit_fan_pack` / `user_supplied`：用户人工核对并本地提供的角色曲与名场面曲，已复制到 `public/audio/bgm/...` 后启用。
- 不从 B 站、网易云或其他平台自动抓取商业/社区曲；旧版 `yt-dlp` 下载说明仍废弃。
- 多曲角色通过 `character-bgm-manifest` 多条 entry 触发，运行时按 turn/seed 可复现轮换。

## 当前已启用用户曲

- 方源/大爱仙尊：年轮位，当前由 `仙尊の小曲.mP3` 暂映射。
- 龙公：春泥。
- 白凝冰：山山而川 征途漫漫。
- 商心慈：天若有情。
- 黑楼兰：长安姑娘。
- 盗天魔尊：无名的人。
- 红莲魔尊：若梦 / 平生不晚、美丽的神话 DJ。
- 幽魂魔尊：紫荆花盛开。
- 薄青：牵丝戏。
- 古月药乐：青衣；小熊饼干等待独立文件。
- 凤九歌：知我。
- 吴帅：虞美人。
- 太白云生/逆流河被刺：Cry For Me。
- 三王山炼制定仙游：精卫琵琶版。
- 墨瑶：唯一。
- 马鸿运：ZOOD 丁真版、I Got Smoke。
- 定场诗通用：boss area。

## 当前免费运行时资源

- 五域 BGM：`public/audio/bgm/domain/`
- 战斗 BGM：`public/audio/bgm/combat/`
- 名场面/定场诗 fallback：`public/audio/bgm/scene/`
- 打击、成就、UI、环境音效：`public/audio/sfx/`

## 仍缺资源

- 柳贯一：Lightning Moment dj。
- 无极魔尊：Lightning Moment dj。
- 古月药乐：小熊饼干独立文件。

这些缺失项不启用 runtime，后续补文件后只需复制到目标路径并更新 manifest。
