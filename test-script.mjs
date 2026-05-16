/**
 * System Prompt 验证测试脚本
 * 测试 DeepSeek V4 Pro 的 JSON 合规性、记忆持久性、世界观一致性
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ====== 配置 ======
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-chat';

const TEST_RESULTS = {
  test1: { name: 'JSON合规性测试', passed: 0, failed: 0, details: [] },
  test2: { name: '5轮记忆持久性测试', passed: 0, failed: 0, details: [] },
  test3: { name: '7轮世界观一致性测试', passed: 0, failed: 0, details: [] },
  stats: { total_api_calls: 0, total_retries: 0, total_time_ms: 0 },
};

// 玩家初始状态
const INITIAL_STATE = {
  player: {
    name: '蛊界行者',
    realm: '无修为（凡人）',
    attributes: { '资质': 9, '根骨': 4, '心智': 8, '气运': 3 },
    health: { current: 100, max: 100 },
    essence: { current: 0, max: 0 },
    talents: ['春秋残响', '甲等资质', '炼道天赋'],
  },
  gu_inventory: [],
  kill_moves: [],
  flags: {
    'born_qingmao': true,
    'has_rebirth_memory': true,
  },
  faction: { '古月山寨': { standing: 0 } },
  immortal_aperture: null,
  notable_events: [],
};

// ====== System Prompt 构建 ======
function buildSystemPrompt(layer1, layer2, gameState, mode = 'canon') {
  const stateJSON = JSON.stringify(gameState, null, 2);
  const modeRules = mode === 'canon'
    ? '当前为【原著线模式】。剧情应严格贴合蛊真人原著主线事件顺序。'
    : '当前为【IF架空线模式】。你可自由发展剧情，但世界观规则必须严格遵守。';

  return `${layer1}

${modeRules}

---

## 当前玩家状态
\`\`\`json
${stateJSON}
\`\`\`

---

## 输出格式协议

${layer2}`;
}

// ====== DeepSeek API 调用 ======
async function callDeepSeek(messages, options = {}) {
  const { maxRetries = 3, timeout = 60000 } = options;
  TEST_RESULTS.stats.total_api_calls++;

  const body = {
    model: MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      TEST_RESULTS.stats.total_time_ms += elapsed;

      if (!res.ok) {
        const errText = await res.text();
        console.log(`  [Attempt ${attempt}] HTTP ${res.status}: ${errText.slice(0, 200)}`);
        if (attempt < maxRetries) {
          TEST_RESULTS.stats.total_retries++;
          await sleep(2000 * attempt);
          continue;
        }
        return { success: false, error: `HTTP ${res.status}: ${errText}` };
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.log(`  [Attempt ${attempt}] Empty response content`);
        if (attempt < maxRetries) {
          TEST_RESULTS.stats.total_retries++;
          await sleep(2000 * attempt);
          continue;
        }
        return { success: false, error: 'Empty response', raw: data };
      }

      return { success: true, content, elapsed_ms: elapsed, tokens: data.usage };

    } catch (err) {
      console.log(`  [Attempt ${attempt}] Error: ${err.message}`);
      if (attempt < maxRetries) {
        TEST_RESULTS.stats.total_retries++;
        await sleep(2000 * attempt);
        continue;
      }
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ====== JSON 解析与校验 ======
function parseAndValidate(content) {
  const result = { valid: false, data: null, errors: [] };

  try {
    const data = JSON.parse(content);
    result.data = data;

    // 1. 验证 narrative 字段
    if (!data.narrative) {
      result.errors.push('缺少 narrative 字段');
    } else {
      if (!data.narrative.text || typeof data.narrative.text !== 'string') {
        result.errors.push('narrative.text 缺失或不是字符串');
      }
      if (!Array.isArray(data.narrative.choices) || data.narrative.choices.length === 0) {
        result.errors.push('narrative.choices 缺失或为空');
      } else {
        data.narrative.choices.forEach((c, i) => {
          if (!c.id) result.errors.push(`choices[${i}].id 缺失`);
          if (!c.text) result.errors.push(`choices[${i}].text 缺失`);
          if (!c.risk_note) result.errors.push(`choices[${i}].risk_note 缺失`);
        });
      }
    }

    // 2. 验证 state_update 字段
    if (!data.state_update) {
      result.errors.push('缺少 state_update 字段');
    }

    // 3. 验证文本质量
    const text = data.narrative?.text || '';
    if (text.length < 100) {
      result.errors.push(`叙事文本过短(${text.length}字，需>=100)`);
    }
    if (text.length > 1000) {
      result.errors.push(`叙事文本过长(${text.length}字，建议<=800)`);
    }

    // 4. 检查禁止内容
    const forbidden = ['爽文', '碾压', '秒杀', '无敌'];
    forbidden.forEach(w => {
      if (text.includes(w)) result.errors.push(`包含禁词: "${w}"`);
    });

    result.valid = result.errors.length === 0;
  } catch (e) {
    result.errors.push(`JSON 解析失败: ${e.message}`);
  }

  return result;
}

// ====== 测试 1：单轮 JSON 合规性 ======
async function test1_jsonCompliance(layer1, layer2) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  测试 1: 单轮 JSON 合规性验证       ║');
  console.log('╚══════════════════════════════════════╝\n');

  const state = JSON.parse(JSON.stringify(INITIAL_STATE));
  const testCases = [
    {
      name: 'T1.1 - 开局情景',
      userMessage: '我在南疆青茅山古月山寨重生了，请开始我的蛊真人人生重来模拟器。我选择了【春秋残响】【甲等资质】【炼道天赋】三个天赋。',
    },
    {
      name: 'T1.2 - 选择后推进',
      userMessage: '我选择选项1（保守路线）。',
    },
    {
      name: 'T1.3 - 描述性输入',
      userMessage: '我小心翼翼地避开巡逻队，摸向后山石窟。我清楚记得花酒行者的传承就在里面。',
    },
  ];

  for (const tc of testCases) {
    console.log(`--- ${tc.name} ---`);
    const systemPrompt = buildSystemPrompt(layer1, layer2, state);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: tc.userMessage },
    ];

    const response = await callDeepSeek(messages);
    if (!response.success) {
      console.log(`  ❌ API 调用失败: ${response.error}`);
      TEST_RESULTS.test1.details.push({ name: tc.name, result: 'FAIL', reason: response.error });
      continue;
    }

    console.log(`  ⏱ ${response.elapsed_ms}ms | Tokens: ${JSON.stringify(response.tokens)}`);

    const validation = parseAndValidate(response.content);
    if (validation.valid) {
      console.log(`  ✅ JSON 合规，叙事 ${validation.data.narrative.text.length}字，选项 ${validation.data.narrative.choices.length}个`);
      TEST_RESULTS.test1.passed++;
      TEST_RESULTS.test1.details.push({ name: tc.name, result: 'PASS', textLen: validation.data.narrative.text.length, choiceCount: validation.data.narrative.choices.length });
    } else {
      console.log(`  ❌ 验证失败: ${validation.errors.join('; ')}`);
      TEST_RESULTS.test1.failed++;
      TEST_RESULTS.test1.details.push({ name: tc.name, result: 'FAIL', errors: validation.errors });

      // 打印原始响应截断
      const preview = response.content.slice(0, 300);
      console.log(`  📄 原始响应预览: ${preview}...`);
    }

    // 更新状态用于下一轮
    if (validation.data?.state_update) {
      applyStateUpdate(state, validation.data.state_update);
    }

    await sleep(2000);
  }
}

// ====== 测试 2：5轮记忆持久性 ======
async function test2_memoryPersistence(layer1, layer2) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  测试 2: 5轮记忆持久性验证         ║');
  console.log('╚══════════════════════════════════════╝\n');

  const state = JSON.parse(JSON.stringify(INITIAL_STATE));
  const conversationHistory = [];

  // 第1轮: 开窍大典
  const turn1Prompt = buildSystemPrompt(layer1, layer2, state);
  const turn1Messages = [
    { role: 'system', content: turn1Prompt },
    { role: 'user', content: '我在青茅山古月山寨重生，今年15岁，即将参加开窍大典。我知道方源也会参加，他会在测试中故意展现丙等资质。请开始叙事。' },
  ];

  let res1 = await callDeepSeek(turn1Messages);
  if (!res1.success) { console.log(`❌ T2.1 失败: ${res1.error}`); return; }
  let v1 = parseAndValidate(res1.content);
  if (v1.valid) {
    console.log(`✅ T2.1 开窍大典 | ${v1.data.narrative.text.length}字 | ${v1.data.narrative.choices.length}选项`);
    TEST_RESULTS.test2.passed++;

    // 存储对话
    conversationHistory.push({ role: 'user', content: turn1Messages[1].content });
    conversationHistory.push({ role: 'assistant', content: res1.content });

    if (v1.data.state_update) applyStateUpdate(state, v1.data.state_update);

    // 手动推进状态（模拟选择后果）
    state.player.realm = '一转初阶';
    state.player.essence = { current: 100, max: 100 };
    state.flags['opened_aperture'] = true;
  } else {
    console.log(`❌ T2.1 JSON失败`);
    TEST_RESULTS.test2.failed++;
    return;
  }

  await sleep(3000);

  // 第2轮: 后山石窟寻传承
  let state2 = JSON.parse(JSON.stringify(state));
  state2.player.realm = '一转初阶';
  const turn2Prompt = buildSystemPrompt(layer1, layer2, state2);
  const turn2Messages = [
    { role: 'system', content: turn2Prompt },
    ...conversationHistory.slice(-2),
    { role: 'user', content: '开窍大典结束后，我趁着夜色摸向后山石窟。我记得花酒行者的传承就在里面，里面有酒虫、炼蛊秘方和大量元石。我小心翼翼地避开机关。' },
  ];

  let res2 = await callDeepSeek(turn2Messages);
  if (!res2.success) { console.log(`❌ T2.2 失败: ${res2.error}`); return; }
  let v2 = parseAndValidate(res2.content);
  if (v2.valid) {
    console.log(`✅ T2.2 后山石窟 | ${v2.data.narrative.text.length}字 | ${v2.data.narrative.choices.length}选项`);
    TEST_RESULTS.test2.passed++;

    conversationHistory.push({ role: 'user', content: turn2Messages[turn2Messages.length - 1].content });
    conversationHistory.push({ role: 'assistant', content: res2.content });

    if (v2.data.state_update) applyStateUpdate(state, v2.data.state_update);

    // 模拟获得酒虫
    state.gu_inventory.push({ name: '酒虫', tier: 2, path: '炼道', rarity: 'rare' });
    state.flags['obtained_wine_gu'] = true;
  } else {
    console.log(`❌ T2.2 JSON失败`);
    TEST_RESULTS.test2.failed++;
    return;
  }

  await sleep(3000);

  // 第3轮: 方源闯入
  let state3 = JSON.parse(JSON.stringify(state));
  state3.player.realm = '一转初阶';
  const turn3Prompt = buildSystemPrompt(layer1, layer2, state3);
  const turn3Messages = [
    { role: 'system', content: turn3Prompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: '就在我拿到传承准备离开时，石窟入口传来极轻的脚步声——方源来了！他比原著中提前来了。我必须立刻决定怎么应对。' },
  ];

  let res3 = await callDeepSeek(turn3Messages);
  if (!res3.success) { console.log(`❌ T2.3 失败: ${res3.error}`); return; }
  let v3 = parseAndValidate(res3.content);
  if (v3.valid) {
    console.log(`✅ T2.3 方源闯入 | ${v3.data.narrative.text.length}字 | ${v3.data.narrative.choices.length}选项`);

    // 关键检查：方源是否被正确提及？
    const text = v3.data.narrative.text;
    if (text.includes('方源')) {
      console.log('  ✅ 叙事中正确引用了方源');
      TEST_RESULTS.test2.passed++;
    } else {
      console.log('  ⚠️ 叙事中未提及方源（记忆遗漏）');
      TEST_RESULTS.test2.failed++;
    }

    conversationHistory.push({ role: 'user', content: turn3Messages[turn3Messages.length - 1].content });
    conversationHistory.push({ role: 'assistant', content: res3.content });

    if (v3.data.state_update) applyStateUpdate(state, v3.data.state_update);
    state.flags['met_fangyuan_in_cave'] = true;
  } else {
    console.log(`❌ T2.3 JSON失败`);
    TEST_RESULTS.test2.failed++;
  }

  await sleep(3000);

  // 第4轮: 回寨炼蛊
  let state4 = JSON.parse(JSON.stringify(state));
  state4.player.realm = '一转中阶';
  const turn4Prompt = buildSystemPrompt(layer1, layer2, state4);
  const turn4Messages = [
    { role: 'system', content: turn4Prompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: '我悄悄回到山寨，凭借炼道天赋开始尝试炼制二转蛊虫。我手头有花酒行者的炼蛊秘方和足够的元石。' },
  ];

  let res4 = await callDeepSeek(turn4Messages);
  if (!res4.success) { console.log(`❌ T2.4 失败: ${res4.error}`); return; }
  let v4 = parseAndValidate(res4.content);
  if (v4.valid) {
    console.log(`✅ T2.4 回寨炼蛊 | ${v4.data.narrative.text.length}字 | ${v4.data.narrative.choices.length}选项`);
    TEST_RESULTS.test2.passed++;

    // 检查是否仍提及之前的酒虫和传承
    const t4 = v4.data.narrative.text;
    const remembers = [t4.includes('酒虫'), t4.includes('炼道'), t4.includes('传承') || t4.includes('花酒')];
    const recallCount = remembers.filter(Boolean).length;
    if (recallCount >= 2) {
      console.log(`  ✅ 记忆保持: ${recallCount}/3 关键元素被引用`);
    } else {
      console.log(`  ⚠️ 记忆保持不足: ${recallCount}/3`);
      TEST_RESULTS.test2.failed++;
    }
  } else {
    console.log(`❌ T2.4 JSON失败`);
    TEST_RESULTS.test2.failed++;
  }

  await sleep(3000);

  // 第5轮: 追问早期事件
  const turn5Prompt = buildSystemPrompt(layer1, layer2, state);
  const turn5Messages = [
    { role: 'system', content: turn5Prompt },
    ...conversationHistory,
    { role: 'user', content: '回想起来，开窍大典上我的选择确实影响深远。当时方源测出了什么资质？古月方正又是什么表现？接下来山寨里有什么大事将要发生？' },
  ];

  let res5 = await callDeepSeek(turn5Messages);
  if (!res5.success) { console.log(`❌ T2.5 失败: ${res5.error}`); return; }
  let v5 = parseAndValidate(res5.content);
  if (v5.valid) {
    console.log(`✅ T2.5 回溯历史 | ${v5.data.narrative.text.length}字`);
    const t5 = v5.data.narrative.text;
    const recallEarly = [t5.includes('开窍'), t5.includes('丙等') || t5.includes('方源'), t5.includes('甲等') || t5.includes('方正')];
    const earlyRecall = recallEarly.filter(Boolean).length;
    if (earlyRecall >= 2) {
      console.log(`  ✅ 早期事件记忆: ${earlyRecall}/3`);
      TEST_RESULTS.test2.passed++;
    } else {
      console.log(`  ⚠️ 早期事件记忆不足: ${earlyRecall}/3`);
      TEST_RESULTS.test2.failed++;
    }
  }
}

// ====== 测试 3：世界观一致性 ======
async function test3_worldConsistency(layer1, layer2) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  测试 3: 7轮世界观一致性验证       ║');
  console.log('╚══════════════════════════════════════╝\n');

  const state = JSON.parse(JSON.stringify(INITIAL_STATE));
  state.player.realm = '二转中阶';
  state.player.essence = { current: 500, max: 500 };
  state.gu_inventory = [
    { name: '酒虫', tier: 2, path: '炼道', rarity: 'rare' },
    { name: '月光蛊', tier: 1, path: '光道', rarity: 'common' },
  ];
  state.flags['obtained_wine_gu'] = true;

  // 世界观违规计数器
  const violations = [];

  // 场景定义
  const scenarios = [
    {
      name: '境界突破',
      msg: '我已在二转中阶修炼了半年，积累了大量赤铁真元，现在我准备冲击二转高阶。我的资质是甲等(9)，有炼道天赋加持。请生成突破场景。',
      checks: [
        { rule: '不能直接跳到三转', check: (t) => !t.includes('三转') || !t.includes('突破三转') },
        { rule: '真元颜色正确(赤铁=红)', check: (t) => t.includes('赤铁') || t.includes('红色真元') },
        { rule: '突破有失败风险', check: (t) => t.includes('风险') || t.includes('失败') || t.includes('反噬') },
      ],
    },
    {
      name: '势力接触',
      msg: '我在黑市出售自己炼制的超品蛊虫时，被商家城的管事注意到了。他想招揽我加入商家城。请叙事。',
      checks: [
        { rule: 'NPC不无条件信任', check: (t) => !t.includes('信任你') && !t.includes('无条件') },
        { rule: '有此必有代价', check: (t) => t.includes('代价') || t.includes('条件') || t.includes('约束') },
        { rule: '怀璧其罪', check: (t) => t.includes('危险') || t.includes('觊觎') || t.includes('盯上') },
      ],
    },
    {
      name: '炼蛊制蛊',
      msg: '我尝试用酒虫+月光蛊合炼新的二转蛊虫。我是炼道天赋，炼蛊成功率+25%。请叙事。',
      checks: [
        { rule: '炼蛊有失败率', check: (t) => t.includes('失败') || t.includes('概率') || t.includes('反噬') },
        { rule: '不保证成功', check: (t) => !t.includes('一定成功') && !t.includes('必定成功') },
        { rule: '消耗材料', check: (t) => t.includes('元石') || t.includes('消耗') || t.includes('材料') },
      ],
    },
    {
      name: '道痕互斥',
      msg: '我主要修行炼道，最近想兼修水道。据说炼道和水道的道痕有互斥？请根据原著规则叙事。',
      checks: [
        { rule: '道痕互斥规则', check: (t) => t.includes('互斥') || t.includes('冲突') || t.includes('排斥') },
        { rule: '不是无代价', check: (t) => !t.includes('可以轻松') && !t.includes('毫无阻碍') },
      ],
    },
    {
      name: '境界压制',
      msg: '我一个二转蛊师在黑市遇到了一个四转巅峰的魔道蛊师，他看上了我的炼蛊造诣，想强行带走我。我能反抗吗？',
      checks: [
        { rule: '越级不反杀', check: (t) => !t.includes('打败了他') && !t.includes('击败') && !t.includes('反杀') },
        { rule: '二转vs四转=绝望', check: (t) => t.includes('无力') || t.includes('无法反抗') || t.includes('逃') || t.includes('绝望') },
      ],
    },
    {
      name: '方源人设',
      msg: '方源注意到我在山寨中的异常——明明乙等资质，却总能拿出高品质蛊虫。他派了一只侦查蛊虫监视我的住处。我发现了这个监视。',
      checks: [
        { rule: '方源不降智', check: (t) => !t.includes('相信你') && !t.includes('信任') && !t.includes('朋友') },
        { rule: '方源会算计', check: (t) => t.includes('试探') || t.includes('算计') || t.includes('监视') || t.includes('怀疑') },
      ],
    },
    {
      name: '仙凡差距',
      msg: '我听寨中老人说起，六转蛊仙和五转蛊师是天壤之别。一个六转地仙的一颗仙元，抵得上五转蛊师的全部真元。这是真的吗？',
      checks: [
        { rule: '仙凡差距不可逾越', check: (t) => t.includes('天壤之别') || t.includes('十倍') || t.includes('仙元') || t.includes('碾压') },
      ],
    },
  ];

  for (const sc of scenarios) {
    console.log(`--- ${sc.name} ---`);
    const sysPrompt = buildSystemPrompt(layer1, layer2, state);
    const messages = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: sc.msg },
    ];

    const res = await callDeepSeek(messages);
    if (!res.success) {
      console.log(`  ❌ API 调用失败`);
      continue;
    }

    const v = parseAndValidate(res.content);
    if (!v.valid) {
      console.log(`  ❌ JSON 验证失败`);
      TEST_RESULTS.test3.failed++;
      continue;
    }

    const text = v.data.narrative.text;
    console.log(`  📝 ${text.slice(0, 120)}...`);

    let allPassed = true;
    for (const check of sc.checks) {
      const passed = check.check(text);
      console.log(`  ${passed ? '✅' : '❌'} ${check.rule}`);
      if (!passed) {
        allPassed = false;
        violations.push({ scenario: sc.name, rule: check.rule, text: text.slice(0, 200) });
      }
    }

    if (allPassed) {
      TEST_RESULTS.test3.passed++;
    } else {
      TEST_RESULTS.test3.failed++;
    }

    await sleep(3000);
  }

  if (violations.length > 0) {
    console.log(`\n⚠️ 世界观违规汇总 (${violations.length}项):`);
    violations.forEach((v, i) => console.log(`  ${i + 1}. [${v.scenario}] ${v.rule}`));
  }
}

// ====== 状态应用 ======
function applyStateUpdate(state, update) {
  if (!update || !update.player) return;

  const p = update.player;
  if (p.realm && p.realm.action === 'set') state.player.realm = p.realm.value;
  if (p.attributes) {
    for (const [key, val] of Object.entries(p.attributes)) {
      if (val.action === 'add') state.player.attributes[key] = (state.player.attributes[key] || 0) + val.value;
      if (val.action === 'set') state.player.attributes[key] = val.value;
    }
  }
  if (p.health) state.player.health = p.health;
  if (p.essence) state.player.essence = p.essence;

  if (update.gu_inventory?.add) {
    state.gu_inventory.push(...update.gu_inventory.add);
  }
  if (update.gu_inventory?.remove) {
    update.gu_inventory.remove.forEach(name => {
      state.gu_inventory = state.gu_inventory.filter(g => g.name !== name);
    });
  }

  if (update.flags?.set) {
    Object.assign(state.flags, update.flags.set);
  }
  if (update.flags?.remove) {
    update.flags.remove.forEach(f => delete state.flags[f]);
  }

  if (update.faction) {
    for (const [key, val] of Object.entries(update.faction)) {
      state.faction[key] = { ...(state.faction[key] || {}), standing: (state.faction[key]?.standing || 0) + (val.standing || 0) };
    }
  }
}

// ====== 主入口 ======
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  System Prompt 验证测试套件');
  console.log(`  API: DeepSeek (${MODEL})`);
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  // 加载 System Prompt
  const layer1 = readFileSync(resolve(__dirname, 'system-prompt-layer1-world-rules.md'), 'utf-8');
  const layer2 = readFileSync(resolve(__dirname, 'system-prompt-layer2-output-protocol.md'), 'utf-8');

  if (!API_KEY || API_KEY === 'your-key-here') {
    console.log('❌ 错误: 请设置 DEEPSEEK_API_KEY 环境变量');
    process.exit(1);
  }

  console.log(`\n✅ System Prompt Layer 1: ${layer1.length} 字符 (~${Math.round(layer1.length / 4)} tokens)`);
  console.log(`✅ System Prompt Layer 2: ${layer2.length} 字符 (~${Math.round(layer2.length / 4)} tokens)`);

  const startAll = Date.now();

  // 测试 1
  await test1_jsonCompliance(layer1, layer2);

  // 测试 2
  await test2_memoryPersistence(layer1, layer2);

  // 测试 3
  await test3_worldConsistency(layer1, layer2);

  const totalTime = Date.now() - startAll;

  // ====== 汇总输出 ======
  console.log('\n═══════════════════════════════════════════');
  console.log('           测试结果汇总');
  console.log('═══════════════════════════════════════════');

  const t1 = TEST_RESULTS.test1;
  const t2 = TEST_RESULTS.test2;
  const t3 = TEST_RESULTS.test3;
  const s = TEST_RESULTS.stats;

  console.log(`\n📊 测试 1 - JSON 合规性: ${t1.passed}/${t1.passed + t1.failed} 通过`);
  t1.details.forEach(d => console.log(`  ${d.result === 'PASS' ? '✅' : '❌'} ${d.name}`));

  console.log(`\n📊 测试 2 - 5轮记忆持久性: ${t2.passed}/${t2.passed + t2.failed} 通过`);
  t2.details.forEach(d => console.log(`  ${d.result === 'PASS' ? '✅' : '❌'} ${d.name}`));

  console.log(`\n📊 测试 3 - 7轮世界观一致性: ${t3.passed}/${t3.passed + t3.failed} 通过`);
  t3.details.forEach(d => console.log(`  ${d.result === 'PASS' ? '✅' : '❌'} ${d.name}`));

  const totalPassed = t1.passed + t2.passed + t3.passed;
  const totalTests = t1.passed + t1.failed + t2.passed + t2.failed + t3.passed + t3.failed;

  console.log(`\n───────────────────────────────────────────`);
  console.log(`总通过率: ${totalPassed}/${totalTests} (${Math.round(totalPassed / totalTests * 100)}%)`);
  console.log(`API 调用: ${s.total_api_calls} 次, 重试: ${s.total_retries} 次`);
  console.log(`总耗时: ${(totalTime / 1000).toFixed(1)}秒`);
  console.log(`───────────────────────────────────────────`);

  // 保存结果到文件
  const resultData = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    results: { test1: t1, test2: t2, test3: t3 },
    stats: { ...s, total_time_sec: totalTime / 1000 },
  };

  const resultPath = resolve(__dirname, 'test-results.json');
  writeFileSync(resultPath, JSON.stringify(resultData, null, 2), 'utf-8');
  console.log(`\n📁 详细结果已保存到: ${resultPath}`);
}

// Standalone write import
import { writeFileSync } from 'fs';

main().catch(console.error);
