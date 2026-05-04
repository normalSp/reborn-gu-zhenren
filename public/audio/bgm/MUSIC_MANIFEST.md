# 蛊真人角色曲 BGM 配置 — P3 M3

## 下载方式
使用 yt-dlp 或 bilibili-dl 下载 B站音频：
```
pip install yt-dlp
yt-dlp -f ba -x --audio-format mp3 -o "public/audio/bgm/character/%(title)s.%(ext)s" "https://www.bilibili.com/video/BV1khRLBUEpk/"
```

## 角色曲 → 五域/BGM 映射

| 角色曲 | 对应角色 | 触发场景 | 存放路径 | B站时间戳/ID |
|--------|---------|---------|---------|-------------|
| 方源小曲 | 古月方源 | 方源出场/春秋蝉/关键剧情 | character/fangyuan.mp3 | BV1khRLBUEpk |
| 红莲小曲 | 红莲魔尊 | 红莲传承相关/春秋蝉共鸣 | character/honglian.mp3 | BV1khRLBUEpk |
| 商心慈小曲 | 商心慈 | 商队/商业交易相关 | character/shangxinci.mp3 | BV1khRLBUEpk |
| 白凝冰小曲 | 白凝冰 | 背刺事件/冰道场景 | character/bainingbing.mp3 | BV1khRLBUEpk |

## soundSlice 扩展 (src/store/slices/soundSlice.ts)
```typescript
export const CHARACTER_BGM: Record<string, string> = {
  'fangyuan': 'bgm/character/fangyuan.mp3',
  'honglian': 'bgm/character/honglian.mp3',
  'shangxinci': 'bgm/character/shangxinci.mp3',
  'bainingbing': 'bgm/character/bainingbing.mp3',
};
```

## 名场面 BGM 触发规则
- 方源出场/春秋蝉波动 → fangyuan
- 红莲传承/逆流河时间异常 → honglian
- 商业交易大额 → shangxinci
- 白凝冰背刺/冰道战斗 → bainingbing

## 已有域BGM (Pixabay CC0)
- 南疆: Ancient Chinese Dali
- 北原: Chinese traditional song 1
- 东海: Ambient Asia
- 西漠: World Spirits
- 中洲: Forbidden City Track 01
