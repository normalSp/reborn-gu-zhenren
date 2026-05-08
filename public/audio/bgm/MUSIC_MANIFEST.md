# RebornG v0.7.0 音频清单说明

本文件只描述音频策略；运行时真相源为 `src/canon/audio-source-manifest.json`，`public/audio/audio-source-manifest.json` 是发布查看用镜像。

## 发布策略

- `free_public_pack`：默认运行时包，只启用免费可核验素材。
- `nonprofit_fan_pack` / `user_supplied`：记录用户人工核对的角色曲与名场面曲，但需要用户本地提供文件后才能启用。
- 不从 B 站、网易云或其他平台自动抓取商业/社区曲；旧的 `yt-dlp` 下载说明已废弃。

## 用户人工核对曲目

这些曲目已经登记到 manifest，但默认 `runtimeEnabled=false`：

- 方源：年轮
- 龙公：春泥
- 白凝冰：山山而川 征途漫漫
- 商心慈：天若有情
- 黑楼兰：长安姑娘
- 盗天魔尊：无名的人
- 红莲魔尊：若梦 / 平生不晚
- 幽魂魔尊：紫荆花盛开
- 薄青：牵丝戏
- 古月药乐：青衣
- 凤九歌：知我
- 吴帅：虞美人
- 太白云生/逆流河被刺：Cry For Me
- 三王山炼制定仙游：精卫琵琶版
- 墨瑶：唯一
- 马鸿运：zood 丁真版
- 柳贯一：Lightning Moment dj
- 无极魔尊：Lightning Moment dj
- 定场诗通用：boss area

这些用户确认曲目均作为 `user_supplied_reference`，不进入免费公布包。

## 当前免费运行时资源

- 五域 BGM：`public/audio/bgm/domain/`
- 战斗 BGM：`public/audio/bgm/combat/`
- 名场面/定场诗 fallback：`public/audio/bgm/scene/`
- 打击、成就、UI 音效：`public/audio/sfx/`

所有已启用资源必须在 manifest 中具备来源 URL、许可、文件路径和用途说明。
