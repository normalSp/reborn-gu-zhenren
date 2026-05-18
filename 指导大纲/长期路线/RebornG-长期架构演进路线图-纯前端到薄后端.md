# RebornG 长期架构演进路线图：纯前端到薄后端

日期：2026-05-16
状态：长期架构方向；不直接等同当前版本范围。

## 一句话结论

RebornG 当前不做大规模后端重构。v1.0 前仍以纯前端、本地确定性 TypeScript 引擎、静态 canon、Zustand 存档和 DeepSeek API 为主。

但从 v0.12 开始，所有核心数据和引擎都要按 `backend-ready` 方式设计：能继续在前端跑，也能在未来被迁到薄后端、边缘函数或私有内容服务。

## 为什么现在不重构

- 当前最重要的是青茅正史锚点、IF 框架、活世界状态和测试工程化。
- 大规模后端化会打断 v0.12-a1 的事实卡和锚点建设。
- 纯前端让开发、调试、长测和 EdgeOne 部署更快。
- 我们的核心优势是确定性世界裁决和原著事实深度，不是先搭复杂服务架构。

## 纯前端当前优势

- 开发快，部署简单。
- 本地 engine 可测试、可复现。
- 没有数据库、认证、服务端部署和监控负担。
- 单机玩家体验延迟低。
- 对 v0.12 的事实卡、锚点、IF 规则和路线准备链仍然够用。

## 纯前端长期缺点

- 公开前端包无法真正保护隐藏事实。
- DeepSeek 或其他模型 API key 不能长期放在前端。
- 云存档、跨设备、回滚和账号体系会越来越难。
- 模型成本、缓存命中、失败率、prompt hash、重试成本很难集中观测。
- 玩家可改 localStorage / IndexedDB / state，未来若有排行榜、活动、共享世界就不可信。
- canon 和素材量膨胀后，bundle、初始化、内存和移动端性能会变成风险。

## 长期架构原则

1. 不为了未来想象提前重构。
2. 核心 engine/canon helper 必须保持纯 TypeScript、纯函数优先、无 DOM、无浏览器 API 强依赖。
3. UI 只能消费 engine 输出，不拥有私有公式和结算权。
4. public canon 和 hidden/private canon 从 v0.12 开始概念分离。
5. hidden fact body 不应成为公开前端长期必需数据。
6. DeepSeek 代理、API key 保护、模型成本观测、云存档和私有事实服务未来进入薄后端。
7. 后端不能接管游戏裁决权；本地/服务端都必须遵守相同 canon -> engine -> store 协议。
8. 引入后端时先做 BFF，不做重型多人服务器。

## 推荐架构层

### 前端长期保留

- React UI。
- 本地可玩 demo。
- 可见事实展示。
- 本地单机存档。
- 本地确定性 engine 的测试入口。
- reduced motion / 移动端 / UI 可读性。

### TypeScript core

必须保持可迁移：

- canon 读取和校验 helper。
- World Intent Engine。
- route / supply / pursuit engine。
- IF deviation rules。
- reaction bridge。
- combat/resource/refine 等本地结算。
- save migration / normalization。

这些 core 模块未来可以被前端直接调用，也可以被后端/BFF 调用。

### 薄后端 / BFF 未来职责

只在硬需求出现后引入：

- DeepSeek / LLM API 代理，保护 key。
- prompt hash、token、cache hit/miss、retry cost、失败原因集中记录。
- 云存档和跨设备同步。
- hidden/private canon 按权限下发。
- live eval / replay eval 归档。
- 发布版错误日志和 Sentry/等价观测桥。

### 暂不做

- 大规模可写多代理后端。
- 多人共享世界服务器。
- 服务器权威战斗结算。
- 自研向量数据库和 RAG 平台。
- 重型账号、支付、排行榜和社交系统。

## 版本拆分建议

### v0.12

不引入后端。

架构重点：

- public fact / hidden fact / IF deviation point 分类。
- hidden fact 只以 ref 和门禁存在，减少公开包中隐藏正文依赖。
- 所有事实卡、锚点表和 IF 规则添加 schema/test。
- route/supply/pursuit 和 reaction bridge 设计为纯 TS core。

### v0.13

仍不强制引入后端。

架构重点：

- NPC / faction reaction engine 不能绑 UI。
- NPC memory / faction pressure 写入必须通过受控 patch。
- 为未来云存档保留稳定 action ledger 和 migration 口径。

### v0.14

开始评估薄 BFF，但不默认开工。

触发条件：

- 青茅后续地域和路线系统需要跨设备或长档同步。
- hidden fact 保护开始影响公开版本。
- DeepSeek key 不能再由玩家本地配置。

### v0.15

内容和经济系统膨胀后，重点是 schema 和内容校验。

架构重点：

- canon schema pilot 扩大。
- 资源、蛊材、食料、残方、坊市和黑市分包。
- 内容校验进入 CI。

### v0.16

战斗 core 和 UI 分离。

架构重点：

- 战斗回放数据结构稳定。
- 可重放 battle trace。
- UI 动效不能改变战斗事实。

### v0.17

多区域正史锚点网络出现后，开始认真评估 private canon service。

触发条件：

- 多区域隐藏事实不能全部打进公开包。
- 需要按玩家可见范围下发事实上下文。
- IF 模式需要长期账本校验。

### v0.18

蛊仙期和高阶世界需要更强服务边界。

架构重点：

- 宝黄天、高阶仙材、仙蛊、尊者线索等不应完全依赖前端保护。
- 若接近公开测试，至少要有 LLM proxy 和 hidden fact 服务设计。

### v0.19

内容生产、长测和公开测试工具集中补强。

架构重点：

- GitHub Actions / CI。
- canon schema。
- 长测、旧档迁移、production preview。
- public/private canon 分包检查。
- 技术文档和发布前风险审查。

### v1.0

最低要求：

- API key 不直接暴露在公开前端包。
- hidden fact 不以玩家可直接阅读的形式完整下发。
- 关键 action ledger 可导出、回放或云端备份。
- 发布版有最小错误观测和版本回滚预案。

## 外部项目参照

### AI人生引擎

定位：AI 驱动的无限叙事/跑团式文字 RPG，广度和自由输入展示较强。

参考：

- B 站公开演示：`https://www.bilibili.com/video/BV1aprxBZEAc/`
- 游玩链接：`https://ailifeengine.zeabur.app/`
- 海外备用：`https://ailifeengine.netlify.app/`
- 当前未确认公开源码仓库；不能作为代码依赖或源码参考。

可借鉴：

- 自由输入到叙事反馈的体验节奏。
- 类跑团的行动选择和开放目标表达。
- 对外演示、快速试玩入口和用户反馈组织。
- 广度优先的 AI 叙事产品形态，作为 RebornG 的竞品/体验参照。

不照搬：

- RebornG 不是通用 AI 跑团壳，而是确定性 RPG 活世界。
- RebornG 不能让 LLM/RAG 直接拥有正史、奖励、地点、NPC 生死和 IF 结论。
- RebornG 当前不处理从出生到多年人生的完整生命周期模拟，近期重点是青茅山蛊师阶段连续行动不崩。

### AI Town / Generative Agents

可借鉴：

- 共享状态、记忆、反思、计划、模拟循环。
- 后端/数据库承载 agent 状态和长期记忆。

不照搬：

- RebornG 当前不是多人小镇或 agent 社会模拟平台。
- 先做青茅蛊师阶段深度，不急着做大规模 agent 群体。

### SillyTavern / WebLLM

可借鉴：

- 世界书/提示管理/扩展生态。
- 浏览器本地模型作为离线辅助和低成本工具。

不照搬：

- RebornG 不能退化成通用聊天前端。
- WebLLM 不替代当前 `deepseek-v4-flash` 运行时叙事策略，除非用户重新批准模型策略。

## 架构门禁

出现以下情况，必须停下来做后端/BFF 评审：

- 公开版本需要隐藏 API key。
- hidden fact body 不能再打进前端包。
- 需要云存档或跨设备同步。
- DeepSeek 成本和 cache hit/miss 需要集中观测。
- 玩家行为需要防篡改。
- 多区域正史锚点网络导致 bundle 明显膨胀。
- 用户决定进入公开测试或 v1.0 发布准备。

## 当前行动

当前只写长期路线，不启动后端。

`v0.12.0` 至 `v0.15.0` 已完成，`v0.16` 已批准作为系统收束、UI 减法与权威归并专项，前置文档已建立。

下一步架构重点不是上后端，而是先把前端内的入口和权威收稳：

- `行动 + 自由目标` 归并时，不改变本地裁决权。
- 调试/演示入口迁出正式底栏，不改变 engine 事实。
- `蛊道` 工作台归并时，不让 UI 拥有炼蛊、材料、杀招结算权。
- 旧 NPC/势力系统与 `livingWorldState` 必须有权威归并表。
- 旧 material/shop/refine/economy 系统与 v0.15 低阶经济必须有权威归并表。
- 若后续 v0.18 打开正式路线/地域状态，再重新评审 save-format、hidden fact、BFF 和云存档需要。

架构要求是：继续保持 core 模块 backend-ready，但在 v0.16 不做大规模后端重构。
