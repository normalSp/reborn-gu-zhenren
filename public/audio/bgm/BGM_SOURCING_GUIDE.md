# 蛊真人模拟器 - BGM素材来源指南

**生成日期**: 2026-05-03
**用途**: 替换五域背景音乐为高质量古风/暗黑氛围曲目
**许可**: 所有推荐曲目均来自 **Pixabay**（CC0 / 免费商用，无需署名）

---

## 一、五域 BGM 推荐 (Pixabay 直链 - 浏览器打开自动下载)

### 南疆 - 山岚丛林·竹笛古琴

| 序号 | 曲名 | 时长 | 风格 | 下载链接 |
|------|------|------|------|----------|
| 1 | Rain drops on banana leaves | 4:47 | 竹笛、雨声、南中国民乐 | [下载](https://pixabay.com/music/china-rain-drops-on-the-banana-leaves-south-china-folk-music-167331/) |
| 2 | Whispers of the Jade Court | 3:24 | 古筝、宫廷、优雅 | [下载](https://pixabay.com/music/world-whispers-of-the-jade-court-443400/) |
| 3 | 墨雨 Ink Rain | 3:27 | 古风、意境 | [下载](https://pixabay.com/music/world-%E5%A2%A8%E9%9B%A8-ink-rain-ancient-433071/) |

### 中洲 - 庄严秩序·编钟古筝

| 序号 | 曲名 | 时长 | 风格 | 下载链接 |
|------|------|------|------|----------|
| 1 | Ancient History | 2:19 | 史诗、庄重、中古风 | [下载](https://pixabay.com/music/main-title-ancient-history-289201/) |
| 2 | Chinese ancient style music | 1:06 | 古筝、抒情 | [下载](https://pixabay.com/music/world-chinese-ancient-style-music-love-247345/) |

### 东海 - 海岛空灵·自由漂泊

| 序号 | 曲名 | 时长 | 风格 | 下载链接 |
|------|------|------|------|----------|
| 1 | Hoi An Ancient Charm | 2:28 | 古筝、钢琴、空灵 | [下载](https://pixabay.com/music/world-hoi-an-ancient-charm-147064/) |
| 2 | Ripple Chinese ancient | 0:59 | 涟漪、抒情 | [下载](https://pixabay.com/music/china-ripple-chinese-ancient-style-music-155927/) |

### 西漠 - 大漠孤烟·西域神秘

| 序号 | 曲名 | 时长 | 风格 | 下载链接 |
|------|------|------|------|----------|
| 1 | Ancient Chinese Dali | 3:31 | 冥想、古风 | [下载](https://pixabay.com/music/meditationspiritual-ancient-chinese-dali-448882/) |
| 2 | Desert Caravan | - | 沙漠、中东 | [搜索](https://pixabay.com/music/search/desert%20caravan/) |

### 北原 - 草原苍茫·暗黑肃杀

| 序号 | 曲名 | 时长 | 风格 | 下载链接 |
|------|------|------|------|----------|
| 1 | Dark Ambient | 4:08 | 暗黑氛围 | [下载](https://pixabay.com/music/suspense-dark-ambient-509934/) |
| 2 | Dark Ambient Soundscape | 3:09 | 暗黑、神秘 | [下载](https://pixabay.com/music/mystery-dark-ambient-soundscape-505384/) |
| 3 | Cinematic Dark Ambient | 7:24 | 电影感暗黑 | [下载](https://pixabay.com/music/horror-scene-cinematic-dark-ambient-503450/) |

### 特殊 BGM

| 用途 | 曲名 | 下载链接 |
|------|------|----------|
| 战斗 | Epic Battle | [搜索](https://pixabay.com/music/search/epic%20battle/) |
| 主菜单 | Cinematic Intro | [搜索](https://pixabay.com/music/search/cinematic%20intro/) |
| 死亡画面 | Sad Tragedy | [搜索](https://pixabay.com/music/search/sad%20tragedy/) |

---

## 二、使用步骤

1. 从上方列表中点击每个域的**第一个推荐链接**（或自行挑选）
2. 在打开的 Pixabay 页面上点击 **"Free Download"** 按钮下载 MP3
3. 将下载的文件重命名并放入对应目录:
   ```
   public/audio/bgm/nanjiang/nanjiang.mp3   ← 南疆 BGM
   public/audio/bgm/zhongzhou/zhongzhou.mp3  ← 中洲 BGM
   public/audio/bgm/donghai/donghai.mp3      ← 东海 BGM
   public/audio/bgm/ximo/ximo.mp3            ← 西漠 BGM
   public/audio/bgm/beiyuan/beiyuan.mp3      ← 北原 BGM
   public/audio/bgm/combat.mp3               ← 战斗 BGM
   public/audio/bgm/menu.mp3                 ← 主菜单 BGM
   public/audio/bgm/death.mp3                ← 死亡 BGM
   ```

## 三、备选方案

如果 Pixabay 速度慢或找不到满意的曲目，可尝试以下平台（均免费可商用）:

1. **Freesound.cn** (飞声): https://www.freesound.cn/ - 中国古风BGM
2. **Chosic**: https://www.chosic.com/free-music/chinese/ - 中国乐器
3. **FesliyanStudios**: https://www.fesliyanstudios.com/ - 暗黑氛围
4. **爱给网**: https://www.aigei.com/music/ - 武侠/古风配乐

---

## 四、BGM 音效设计建议（来自 game-dev-text 技能）

- **南疆**: 以竹笛、古琴为主，配雨声/虫鸣等环境音，节奏舒缓偏神秘
- **北原**: 以马头琴风格+低沉弦乐为主，暗黑氛围叠加部落鼓点
- **东海**: 空灵古筝为主，柔和的弦乐和声，有海潮起落感
- **西漠**: 西域乐器（胡琴/琵琶）为主，偶尔插入风声和驼铃
- **中洲**: 编钟+古筝为主，节奏规整，音量适中不过分渲染情绪
- **所有 BGM 需循环播放，建议 2-5 分钟长度**
