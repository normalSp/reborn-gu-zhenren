# 叙事质量四层防线总览

> 关联: 《Prompt 优化极限方法论手册》  
> 目标: 从 ~88% (纯 Prompt) 推至 93-97% (四层协同)

---

## 架构

```
AI 原始输出
    ↓
┌─────────────────────────────────────────┐
│ Layer 4: 金丝雀断言 (Canary Assertions)  │  ← 待实现 (4B.5)
│ 10 条确定性二值判断                       │
│ 状态感知 · ~2ms · 前置过滤                │
│ doc/canary-assertion-rules.md            │
├─────────────────────────────────────────┤
│ Layer 3: 语义规则引擎 (Semantic Rules)    │  ← ✅ 已实现
│ 7 条规则 R01-R07 · 词簇评分               │
│ 三级严重度 · ~5ms                         │
│ src/engine/semantic-validator.ts          │
├─────────────────────────────────────────┤
│ Layer 2: 双轮校验 (Dual-Round Validate)   │  ← ⚠️ 待补全 (4B.4)
│ JSON 解析重试 + Zod Schema 重试           │
│ 缺: L3 critical 反馈重试                  │
│ src/engine/response-pipeline.ts           │
├─────────────────────────────────────────┤
│ Layer 1: Prompt 工程 (Prompt Engineering) │  ← ✅ 已实现
│ LAYER1(世界观) + LAYER2(叙事铁则)         │
│ + OPENING(开局模板) · 天花板 ~88%          │
│ src/engine/context-builder.ts             │
└─────────────────────────────────────────┘
    ↓
通过 → 应用到 Store → 渲染给玩家
```

---

## 各层贡献估算

| 层级 | 贡献 | 累计 | 状态 |
|------|------|------|------|
| L1 Prompt 工程 | ~88% | 88% | ✅ |
| L2 双轮校验 (补全后) | +2-3% | 90-91% | ⚠️ |
| L3 语义规则引擎 | +2-3% | 92-94% | ✅ |
| L4 金丝雀断言 | +2-4% | **94-97%** | ❌ |

---

## 测试方案

- **单元测试**: vitest, Layer 3 (7 规则) + Layer 4 (10 断言) 的纯函数测试
- **压力测试**: `scripts/narrative-stress-test.mjs`, 100 次真实 API 调用, 20 诱惑场景
- **验收指标**: critical 违规率 < 3%, warning 违规率 < 10%

---

## 相关文档

- `doc/canary-assertion-rules.md` — Layer 4 金丝雀断言规则草案（待审核）
- `plan.md` — 完整开发计划（含阶段 4A/4B）
- `src/engine/context-builder.ts` — Layer 1 实现
- `src/engine/response-pipeline.ts` — Layer 2 实现
- `src/engine/semantic-validator.ts` — Layer 3 实现
