# 蛊真人世界 · 人生重来模拟器 v0.5.0

基于 DeepSeek AI 的蛊真人世界观文字 RPG。你扮演一名刚开窍的蛊师学徒，在南疆古月山寨开始你的修行之路。AI 主持人根据你的选择生成叙事、管理状态、推动剧情。

## 技术栈

- React 18 + TypeScript + Vite 8
- Zustand 5（状态管理）+ Zod 4（Schema 校验）
- Tailwind CSS 3.4（账簿式暗黑 UI）
- DeepSeek API（AI 叙事生成）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# 或双击 start.bat（Windows）
```

### 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com) 注册并获取 API Key
2. 启动后在标题界面输入密钥 → 点击"测试连通" → "进入蛊界"

密钥仅存储在浏览器 localStorage，不会上传到任何服务器。

## 功能

- **角色创建**：四维属性掷骰 + 52 种天赋（白/蓝/紫/橙/红/金）+ 五域出身选择
- **AI 叙事**：每次选择触发 AI 生成 ~200-500 字叙事 + 3-4 个风险选项
- **经济系统**：元石货币 + 商会购买/出售蛊虫 + 炼蛊合成 + 蛊虫喂养
- **四层防线**：Prompt 约束 + 反馈修正 + 语义规则 + 金丝雀断言，防 AI 违规
- **知识库**：62 种凡蛊 + 33 种仙蛊 + 21 种杀招 + 11 个天地秘境
- **存档系统**：localStorage 持久化，支持多档位

## 项目结构

```
src/
├── api/deepseek.ts          # DeepSeek API 调用
├── engine/                  # 核心引擎
│   ├── response-pipeline.ts # AI 响应管道（4层校验）
│   ├── semantic-validator.ts# Layer 3 语义规则
│   ├── canary-assertions.ts # Layer 4 金丝雀断言
│   ├── context-builder.ts   # System Prompt 构建
│   └── state-update-applier.ts # 游戏状态更新
├── components/game/         # 26 个游戏 UI 组件
├── store/slices/            # 12 个 Zustand Slice
├── canon/                   # 13 个 JSON 知识库
└── schemas/                 # Zod Schema 定义
```

## 开发

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm test             # 运行 41 个测试用例
```

## 免责声明

本项目为 AI 生成的内容，仅供娱乐和学习用途。蛊真人原著版权归原作者所有。
