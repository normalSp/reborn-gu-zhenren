/**
 * A/B 对比测试脚本
 * 对比基线 System Prompt vs Few-shot+自检增强版
 * 重点测试基线中违规的2个场景：势力接触 + 方源人设
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ====== 配置 ======
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-chat';

// ====== 加载 Prompt ======
const L1_BASELINE = readFileSync(resolve(__dirname, 'system-prompt-layer1-world-rules.md'), 'utf-8');
const L2_BASELINE = readFileSync(resolve(__dirname, 'system-prompt-layer2-output-protocol.md'), 'utf-8');

// 增强版 Layer 1：含 Few-shot 示例（已注入到 L1_BASELINE 中）
// 增强版 Layer 2：含自检协议（已注入到 L2_BASELINE 中）

// 基线版 Layer 1：去除 Few-shot 示例段
const L1_NO_FEWSHOT = L1_BASELINE.split('## 12. Few-shot 示例集【必须遵循】')[0].trim();
// 基线版 Layer 2：去除自检协议段
const L2_NO_SELFCHECK = L2_BASELINE.split('## 输出后自检协议（v1.2 新增）')[0].trim();

// ====== 工具函数 ======
async function callDeepSeek(messages, label = '') {
  const body = {
    model: MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096,
  };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}`, elapsed_ms: elapsed };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'Empty response', elapsed_ms: elapsed };
    }

    return { success: true, content, elapsed_ms: elapsed, tokens: data.usage };
  } catch (err) {
    return { success: false, error: err.message, elapsed_ms: Date.now() - startTime };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseResponse(content) {
  try {
    return { valid: true, data: JSON.parse(content) };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ====== 工具: 语义词簇评分 ======
// 返回命中的正面词数量（用于阈值判断，替代二元关键词匹配）
function semanticScore(text, positiveWords, negativeWords, minPositive = 1, maxNegative = 0) {
  let posHits = 0;
  let negHits = 0;
  const t = text.toLowerCase();
  for (const w of positiveWords) { if (t.includes(w.toLowerCase())) posHits++; }
  for (const w of negativeWords) { if (t.includes(w.toLowerCase())) negHits++; }
  return {
    passed: posHits >= minPositive && negHits <= maxNegative,
    posHits,
    negHits,
    minPositive,
    maxNegative,
  };
}

// ====== 场景定义（v1.3: 宽词簇语义评分） ======
const VIOLATION_SCENARIOS = [
  {
    id: '势力接触',
    variant: 'A', // 势力接触-变体A：商家城招揽
    state: () => {
      const s = createBaseState();
      s.player.realm = '二转中阶';
      s.gu_inventory = [{ name: '酒虫', tier: 2, path: '炼道', rarity: 'rare' }];
      return s;
    },
    userMessage: '我在黑市出售自己炼制的超品蛊虫时，被商家城的管事注意到了。他想招揽我加入商家城。请叙事。',
    checks: [
      { id: 'no_unconditional_trust', rule: 'NPC不无条件信任/友善',
        check: (t) => semanticScore(t,
          ['审视', '算计', '估量', '打量', '衡量', '贪婪', '觊觎', '猎物', '利用'],
          ['信任你', '欣赏你', '看重你', '器重', '全力栽培', '资源管够', '无偿'],
          1, 0).passed, weight: 2 },
      { id: 'cost_required', rule: '必有代价/条件/约束',
        check: (t) => semanticScore(t,
          ['代价', '条件', '约束', '每年', '每月', '必须', '上交', '换取', '回报', '付出'],
          ['免费', '赠送', '白送', '送你'],
          1, 0).passed, weight: 3 },
      { id: 'danger_hint', rule: '提示危险/觊觎/死亡',
        check: (t) => semanticScore(t,
          ['危险', '死', '杀', '威胁', '盯上', '怀璧', '盯住', '跟踪', '觊觎', '看中', '暗中', '活不过'],
          [],
          1, 0).passed, weight: 2 },
      { id: 'no_free_gift', rule: '不无偿送资源',
        check: (t) => semanticScore(t, [], ['送你', '免费', '赠送', '白给', '随手扔'], 0, 0).passed, weight: 1 },
      { id: 'dark_tone', rule: '叙事基调黑暗现实',
        check: (t) => semanticScore(t,
          ['不容', '压力', '审视', '算计', '盯上', '觊觎', '猎人', '猎物', '死', '杀', '威胁'],
          ['欣赏你', '全力栽培', '资源管够', '看好你', '前途无量'],
          1, 0).passed, weight: 2 },
    ],
  },
  {
    id: '势力接触',
    variant: 'B', // 势力接触-变体B：魔道蛊师相遇
    state: () => {
      const s = createBaseState();
      s.player.realm = '二转初阶';
      s.gu_inventory = [{ name: '炼火蛊', tier: 1, path: '炎道', rarity: 'uncommon' }];
      return s;
    },
    userMessage: '在南疆密林中采药时，我意外撞见了一个受伤的三转魔道蛊师。他失血过多，看起来命不久矣。但他身旁的储物袋鼓鼓囊囊。',
    checks: [
      { id: 'no_easy_benefit', rule: '机缘必有代价/危险',
        check: (t) => semanticScore(t,
          ['陷阱', '危险', '反噬', '代价', '假象', '圈套', '反扑', '绝非', '不能', '不可', '同归于尽', '暗红', '血蝠', '蛊虫', '毁掉', '抹杀', '残余', '同归', '搏命'],
          ['免费', '轻松', '侥幸', '走运', '捡'],
          2, 0).passed, weight: 3 },
      { id: 'no_naive_trust', rule: '魔道蛊师不降智',
        check: (t) => semanticScore(t,
          ['魔道', '血翼', '教', '杀', '死', '手', '警惕', '戒', '防'],
          ['感激你', '报答你', '信任你', '感谢你', '恩人'],
          1, 0).passed, weight: 2 },
      { id: 'risk_aware', rule: '叙事含风险评估',
        check: (t) => semanticScore(t,
          ['risk', '风险', '概率', '成功率', '可能', '死于', '击杀', '灭杀'],
          [],
          1, 0).passed, weight: 1 },
    ],
  },
  {
    id: '方源人设',
    variant: 'A', // 方源人设-变体A：方源监视
    state: () => {
      const s = createBaseState();
      s.player.realm = '二转中阶';
      if (!s.player.flags) s.player.flags = {};
      s.player.flags['met_fangyuan_in_cave'] = true;
      s.gu_inventory = [
        { name: '酒虫', tier: 2, path: '炼道', rarity: 'rare' },
        { name: '月光蛊', tier: 1, path: '光道', rarity: 'common' },
      ];
      return s;
    },
    userMessage: '方源注意到我在山寨中的异常——明明乙等资质，却总能拿出高品质蛊虫。他派了一只侦查蛊虫监视我的住处。我发现屋檐下那只诡异的荧光虫。',
    checks: [
      { id: 'fy_not_friendly', rule: '方源不可友善',
        check: (t) => semanticScore(t, [],
          ['友善', '朋友', '信任你', '合作', '欣赏', '帮助', '友好'],
          0, 0).passed, weight: 3 },
      { id: 'fy_calculates', rule: '方源会算计/布控/监视',
        check: (t) => semanticScore(t,
          ['算计', '试探', '监视', '怀疑', '布置', '眼线', '灭口', '利用', '侦查', '布局', '手段', '杀局', '不留', '活口'],
          [],
          2, 0).passed, weight: 3 },
      { id: 'fy_threat', rule: '方源有人身威胁感',
        check: (t) => semanticScore(t,
          ['杀', '死', '危险', '威胁', '冰冷', '寒意', '恐惧', '后背发凉', '脊背发凉', '猎物', '猎人', '不容', '秃鹫', '敏锐', '手段'],
          [],
          2, 0).passed, weight: 2 },
      { id: 'no_fy_downgrade', rule: '方源不降智/不疏忽',
        check: (t) => semanticScore(t, [], ['没有发现', '疏忽', '不小心', '大意', '漏过'], 0, 0).passed, weight: 2 },
    ],
  },
  {
    id: '方源人设',
    variant: 'B', // 方源人设-变体B：方源相遇后山
    state: () => {
      const s = createBaseState();
      s.player.realm = '一转初阶';
      if (!s.player.flags) s.player.flags = {};
      s.player.flags['opened_aperture'] = true;
      return s;
    },
    userMessage: '开窍大典后，我在后山石窟中偷偷炼蛊时，石窟入口传来极轻的脚步声——方源来了。他的目光扫过石窟内的炼蛊材料和我手中的半成品蛊虫。他的嘴角微微上扬。',
    checks: [
      { id: 'fy_smile_is_threat', rule: '方源微笑=威胁/算计,非友善',
        check: (t) => semanticScore(t,
          ['猎人', '猎物', '算计', '审视', '打量', '逼视', '锁定', '扫描', '算计', '评估', '猎杀', '寒光', '危险'],
          ['友善', '友好', '善意', '欣慰', '满意'],
          1, 0).passed, weight: 3 },
      { id: 'fy_dangerous', rule: '方源描写体现危险/威胁感',
        check: (t) => semanticScore(t,
          ['杀', '死', '危险', '威胁', '寒意', '恐惧', '冷汗', '脊背发凉', '后背发凉', '从容', '猎', '不容', '毫无', '绝无', '警', '戒', '骨', '冷', '凉'],
          [],
          2, 0).passed, weight: 3 },
      { id: 'fy_strategic', rule: '方源行为有策略目的',
        check: (t) => semanticScore(t,
          ['扫过', '打量', '审视', '算盘', '掌控', '测探', '心机', '城府', '计谋', '意图', '盘算', '看清', '确认', '认准', '把握', '深意'],
          [],
          1, 0).passed, weight: 2 },
    ],
  },
];

function createBaseState() {
  return JSON.parse(JSON.stringify({
    player: {
      name: '蛊界行者',
      realm: '二转中阶',
      attributes: { '资质': 9, '根骨': 4, '心智': 8, '气运': 3 },
      health: { current: 100, max: 100 },
      essence: { current: 200, max: 200 },
      talents: ['春秋残响', '甲等资质', '炼道天赋'],
      flags: {
        'born_qingmao': true,
        'has_rebirth_memory': true,
      },
    },
    gu_inventory: [],
    kill_moves: [],
    faction: { '古月山寨': { standing: 0 } },
    immortal_aperture: null,
    notable_events: [],
  }));
}

function buildSystemPrompt(l1, l2, state, mode = 'canon') {
  const stateJSON = JSON.stringify(state, null, 2);
  return `${l1}

当前为【原著线模式】。剧情应严格贴合蛊真人原著主线事件顺序。

---

## 当前玩家状态
\`\`\`json
${stateJSON}
\`\`\`

---

## 输出格式协议

${l2}`;
}

// ====== A/B 对比测试 ======
async function runABTest() {
  console.log('═══════════════════════════════════════════');
  console.log('  A/B 对比测试：基线 vs Few-shot+自检增强');
  console.log(`  模型: ${MODEL}`);
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════\n');

  console.log(`Layer 1 (基线-无Fewshot): ${L1_NO_FEWSHOT.length} 字符`);
  console.log(`Layer 1 (增强-有Fewshot): ${L1_BASELINE.length} 字符 (+${L1_BASELINE.length - L1_NO_FEWSHOT.length} 字符)`);
  console.log(`Layer 2 (基线-无自检): ${L2_NO_SELFCHECK.length} 字符`);
  console.log(`Layer 2 (增强-有自检): ${L2_BASELINE.length} 字符 (+${L2_BASELINE.length - L2_NO_SELFCHECK.length} 字符)\n`);

  const results = { baseline: {}, enhanced: {}, scenarios: {} };

  for (const scenario of VIOLATION_SCENARIOS) {
    const key = `${scenario.id}-${scenario.variant}`;
    results.scenarios[key] = { baseline: null, enhanced: null };

    const state = scenario.state();

    // ---- 基线测试 ----
    console.log(`\n┌─ 基线测试: ${key} ───────────────────────┐`);
    const sysBaseline = buildSystemPrompt(L1_NO_FEWSHOT, L2_NO_SELFCHECK, state);
    const msgBaseline = [
      { role: 'system', content: sysBaseline },
      { role: 'user', content: scenario.userMessage },
    ];

    const resB = await callDeepSeek(msgBaseline, key + '-baseline');
    if (resB.success) {
      const parsed = parseResponse(resB.content);
      if (parsed.valid) {
        const text = parsed.data.narrative?.text || '';
        const checkResults = scenario.checks.map(c => ({
          id: c.id,
          rule: c.rule,
          weight: c.weight,
          passed: c.check(text),
        }));
        const score = checkResults.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
        const maxScore = scenario.checks.reduce((s, c) => s + c.weight, 0);

        results.scenarios[key].baseline = {
          text: text.slice(0, 400),
          checks: checkResults,
          score,
          maxScore,
          ratio: Math.round(score / maxScore * 100),
          tokens: resB.tokens,
          elapsed_ms: resB.elapsed_ms,
        };

        console.log(`  📝 ${text.slice(0, 150)}...`);
        console.log(`  基线得分: ${score}/${maxScore} (${Math.round(score / maxScore * 100)}%)`);
        checkResults.forEach(c => console.log(`    ${c.passed ? '✅' : '❌'} [${c.weight}分] ${c.rule}`));
        console.log(`  ⏱ ${resB.elapsed_ms}ms | tokens: ${JSON.stringify(resB.tokens)}`);
      } else {
        results.scenarios[key].baseline = { error: 'JSON parse failed', detail: parsed.error };
        console.log(`  ❌ JSON解析失败: ${parsed.error}`);
      }
    } else {
      results.scenarios[key].baseline = { error: 'API failed', detail: resB.error };
      console.log(`  ❌ API失败: ${resB.error}`);
    }

    await sleep(3000);

    // ---- 增强测试 ----
    console.log(`\n┌─ 增强测试: ${key} ───────────────────────┐`);
    const sysEnhanced = buildSystemPrompt(L1_BASELINE, L2_BASELINE, state);
    const msgEnhanced = [
      { role: 'system', content: sysEnhanced },
      { role: 'user', content: scenario.userMessage },
    ];

    const resE = await callDeepSeek(msgEnhanced, key + '-enhanced');
    if (resE.success) {
      const parsed = parseResponse(resE.content);
      if (parsed.valid) {
        const text = parsed.data.narrative?.text || '';
        const checkResults = scenario.checks.map(c => ({
          id: c.id,
          rule: c.rule,
          weight: c.weight,
          passed: c.check(text),
        }));
        const score = checkResults.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
        const maxScore = scenario.checks.reduce((s, c) => s + c.weight, 0);

        results.scenarios[key].enhanced = {
          text: text.slice(0, 400),
          checks: checkResults,
          score,
          maxScore,
          ratio: Math.round(score / maxScore * 100),
          tokens: resE.tokens,
          elapsed_ms: resE.elapsed_ms,
        };

        console.log(`  📝 ${text.slice(0, 150)}...`);
        console.log(`  增强得分: ${score}/${maxScore} (${Math.round(score / maxScore * 100)}%)`);
        checkResults.forEach(c => console.log(`    ${c.passed ? '✅' : '❌'} [${c.weight}分] ${c.rule}`));
        console.log(`  ⏱ ${resE.elapsed_ms}ms | tokens: ${JSON.stringify(resE.tokens)}`);
      } else {
        results.scenarios[key].enhanced = { error: 'JSON parse failed', detail: parsed.error };
        console.log(`  ❌ JSON解析失败: ${parsed.error}`);
      }
    } else {
      results.scenarios[key].enhanced = { error: 'API failed', detail: resE.error };
      console.log(`  ❌ API失败: ${resE.error}`);
    }

    await sleep(4000);
  }

  // ====== 汇总 ======
  console.log('\n═══════════════════════════════════════════');
  console.log('           A/B 对比测试结果汇总');
  console.log('═══════════════════════════════════════════\n');

  let totalBaselineScore = 0, totalBaselineMax = 0;
  let totalEnhancedScore = 0, totalEnhancedMax = 0;

  console.log('| 场景 | 基线得分 | 增强得分 | 提升幅度 |');
  console.log('|------|----------|----------|----------|');

  for (const [key, data] of Object.entries(results.scenarios)) {
    const b = data.baseline;
    const e = data.enhanced;
    const bStr = b?.error ? `❌${b.error}` : `${b?.score}/${b?.maxScore} (${b?.ratio}%)`;
    const eStr = e?.error ? `❌${e.error}` : `${e?.score}/${e?.maxScore} (${e?.ratio}%)`;
    const improvement = (b?.score && e?.score) ? `+${e.ratio - b.ratio}%` : 'N/A';
    console.log(`| ${key} | ${bStr} | ${eStr} | ${improvement} |`);

    if (b?.score !== undefined) { totalBaselineScore += b.score; totalBaselineMax += b.maxScore; }
    if (e?.score !== undefined) { totalEnhancedScore += e.score; totalEnhancedMax += e.maxScore; }
  }

  const baselinePct = Math.round(totalBaselineScore / totalBaselineMax * 100);
  const enhancedPct = Math.round(totalEnhancedScore / totalEnhancedMax * 100);
  const improvement = enhancedPct - baselinePct;

  console.log(`\n───────────────────────────────────────────`);
  console.log(`  基线综合: ${totalBaselineScore}/${totalBaselineMax} (${baselinePct}%)`);
  console.log(`  增强综合: ${totalEnhancedScore}/${totalEnhancedMax} (${enhancedPct}%)`);
  console.log(`  提升幅度: +${improvement}%`);

  // 逐场景汇总
  const byCategory = {};
  for (const [key, data] of Object.entries(results.scenarios)) {
    const cat = key.split('-')[0] + '-' + key.split('-')[1];
    if (!byCategory[cat]) byCategory[cat] = { bScore: 0, bMax: 0, eScore: 0, eMax: 0 };
    if (data.baseline?.score !== undefined) { byCategory[cat].bScore += data.baseline.score; byCategory[cat].bMax += data.baseline.maxScore; }
    if (data.enhanced?.score !== undefined) { byCategory[cat].eScore += data.enhanced.score; byCategory[cat].eMax += data.enhanced.maxScore; }
  }

  console.log('\n--- 按场景类型汇总 ---');
  for (const [cat, s] of Object.entries(byCategory)) {
    const bPct = Math.round(s.bScore / s.bMax * 100);
    const ePct = Math.round(s.eScore / s.eMax * 100);
    console.log(`  ${cat}: 基线 ${bPct}% → 增强 ${ePct}% (+${ePct - bPct}%)`);
  }

  console.log(`\n───────────────────────────────────────────`);
  const target = 95;
  if (enhancedPct >= target) {
    console.log(`  ✅ 增强后世界观一致性 ${enhancedPct}% ≥ ${target}% 目标，达标！`);
    console.log(`     可以将四层策略写入可行性分析报告。`);
  } else {
    console.log(`  ⚠️ 增强后世界观一致性 ${enhancedPct}% < ${target}% 目标`);
    console.log(`     差距: ${target - enhancedPct}%，需要进一步优化（论文调研/更多策略）。`);
  }
  console.log(`───────────────────────────────────────────`);

  // 保存结果
  const output = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    prompt_sizes: {
      baseline_l1_chars: L1_NO_FEWSHOT.length,
      enhanced_l1_chars: L1_BASELINE.length,
      baseline_l2_chars: L2_NO_SELFCHECK.length,
      enhanced_l2_chars: L2_BASELINE.length,
    },
    summary: {
      baselineScore: baselinePct,
      enhancedScore: enhancedPct,
      improvement,
      target,
      passed: enhancedPct >= target,
    },
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([cat, s]) => [
        cat,
        { baselinePct: Math.round(s.bScore / s.bMax * 100), enhancedPct: Math.round(s.eScore / s.eMax * 100) },
      ])
    ),
    details: results.scenarios,
  };

  writeFileSync(resolve(__dirname, 'test-results-ab.json'), JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n📁 详细结果已保存: test-results-ab.json`);

  return { enhancedPct, passed: enhancedPct >= target, results };
}

runABTest().catch(console.error);
