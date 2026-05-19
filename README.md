# RebornG · 蛊真人世界人生重来模拟器 v1.0.0

基于 React、TypeScript、Vite 与 DeepSeek 的蛊真人二创文字 RPG。v1.0.0《青茅之后，活世界初成》把青茅山后续压力、南疆早期路线候选、低阶蛊师 life loop、NPC/势力回流和自由目标裁决收束成一段可连续体验的活世界早期正式版。

## 技术栈

- React 18 + TypeScript + Vite 8
- Zustand 5（状态管理）+ Zod 4（Schema 校验）
- Tailwind CSS 3.4（账簿式暗黑 UI）
- GSAP + Framer Motion（战斗演出与 UI 状态）
- DeepSeek API（AI 叙事生成，默认 `deepseek-v4-flash`）

## 快速开始

```bash
# 1. 安装依赖
npm ci

# 2. 启动开发服务器
npm run dev
# 或双击 start.bat（Windows）
```

### 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com) 注册并获取 API Key
2. 启动后在标题界面输入密钥 → 点击"测试连通" → "进入蛊界"

密钥仅存储在浏览器 localStorage，不会上传到任何服务器。

## v1.0.0 功能

- **统一行动协议**：道场、传承/福地、灾劫、野外行动统一接入“线索 -> 出发 -> 本地结算 -> 行动账本 -> 回流文本”。
- **青茅之后的连续体验**：从青茅山后续压力承接到南疆早期路线候选，展示补给、追踪、身份和路线风险。
- **低阶蛊师 life loop**：修行、蛊虫维护、炼养用、交易窗口、市场/委托边界和路线压力形成释出版闭环。
- **自由目标本地裁决**：极端目标会被拒绝、降级、转长期目标或要求前置，不让一句话改坏世界。
- **NPC/势力回流**：公开事件摘要、关系压力、后续候选和行动账本让玩家看见自己的影响。
- **战斗入口收束**：新正式战斗只登记候选并走本地 route policy / battlefield 引擎，旧 duel/squad 入口保留兼容和调试。
- **青茅山凡战视觉竖切**：5x3 棋盘、月光蛊、白玉蛊、酒虫支持提示、禁忌门槛、入场演出、reduced motion 与移动端验收。
- **DeepSeek 成本观测**：调用记录模型名、temperature、tokens、缓存命中/未命中、重试成本、耗时和 prompt 前缀 hash。
- **公开测试存档**：`public/test-saves/` 提供 10 个 `formatVersion 22` 存档镜像，用于快速检查主要路线。

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
npm test             # 运行单元测试
npm run check:runtime-assets
npm run check:qingmao-assets
npm run test:e2e:long
```

## EdgeOne Pages 部署

仓库包含 `edgeone.json`。CodeBuddy 或 EdgeOne Pages 连接仓库后可使用：

- 安装命令：`npm ci`
- 构建命令：`npm run build`
- 输出目录：`./dist`
- Node 版本：`22.11.0`

## 免责声明

本项目为 AI 生成的内容，仅供娱乐和学习用途。蛊真人原著版权归原作者所有。
