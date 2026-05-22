#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const live = args.has('--live');
const explicitDryRun = args.has('--dry-run');
const dryRun = explicitDryRun || !live;
const confirmCost = args.has('--confirm-cost');
const defaultBaseUrl = 'https://api.deepseek.com';
const defaultSampleFile = 'tests/evals/deepseek-v200-regional-event-ledger/samples.json';

const pricingUsdPerMillionTokens = {
  'deepseek-v4-flash': {
    cacheHitInput: 0.0028,
    cacheMissInput: 0.14,
    output: 0.28,
  },
};

function hasOption(name) {
  return rawArgs.some(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
}

function getOption(name, fallback = undefined) {
  const equalsPrefix = `--${name}=`;
  const equalsValue = rawArgs.find(arg => arg.startsWith(equalsPrefix));
  if (equalsValue) return equalsValue.slice(equalsPrefix.length);
  const index = rawArgs.indexOf(`--${name}`);
  if (index >= 0 && rawArgs[index + 1] && !rawArgs[index + 1].startsWith('--')) return rawArgs[index + 1];
  return fallback;
}

function getNumberOption(name, fallback) {
  if (!hasOption(name)) return fallback;
  const value = Number(getOption(name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid --${name} value.`);
  return value;
}

function getIntegerOption(name, fallback) {
  const value = Math.trunc(getNumberOption(name, fallback));
  if (value < 1) throw new Error(`--${name} must be at least 1.`);
  return value;
}

function getNonNegativeIntegerOption(name, fallback) {
  const value = Math.trunc(getNumberOption(name, fallback));
  if (value < 0) throw new Error(`--${name} must be at least 0.`);
  return value;
}

function toRepoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

function completionUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function hashText(text) {
  return createHash('sha256').update(String(text)).digest('hex');
}

function estimateTokens(text) {
  return Math.ceil(String(text).length * 0.45);
}

function emptyUsage() {
  return {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    prompt_cache_hit_tokens: 0,
    prompt_cache_miss_tokens: 0,
  };
}

function normalizeUsage(usage = {}) {
  const promptTokens = Number(usage.prompt_tokens || 0);
  const cacheHitTokens = Number(usage.prompt_cache_hit_tokens || 0);
  const explicitMissTokens = Number(usage.prompt_cache_miss_tokens || 0);
  return {
    prompt_tokens: promptTokens,
    completion_tokens: Number(usage.completion_tokens || 0),
    total_tokens: Number(usage.total_tokens || 0),
    prompt_cache_hit_tokens: cacheHitTokens,
    prompt_cache_miss_tokens: explicitMissTokens || Math.max(promptTokens - cacheHitTokens, 0),
  };
}

function addUsage(a, b) {
  return {
    prompt_tokens: a.prompt_tokens + b.prompt_tokens,
    completion_tokens: a.completion_tokens + b.completion_tokens,
    total_tokens: a.total_tokens + b.total_tokens,
    prompt_cache_hit_tokens: a.prompt_cache_hit_tokens + b.prompt_cache_hit_tokens,
    prompt_cache_miss_tokens: a.prompt_cache_miss_tokens + b.prompt_cache_miss_tokens,
  };
}

function estimateCostUsd(model, usage) {
  const pricing = pricingUsdPerMillionTokens[model];
  if (!pricing) return null;
  return (
    (usage.prompt_cache_hit_tokens / 1_000_000) * pricing.cacheHitInput
    + (usage.prompt_cache_miss_tokens / 1_000_000) * pricing.cacheMissInput
    + (usage.completion_tokens / 1_000_000) * pricing.output
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readDotenvValue(name) {
  const dotenvPath = resolve(rootDir, '.env');
  if (!existsSync(dotenvPath)) return '';
  const text = readFileSync(dotenvPath, 'utf8');
  const pattern = new RegExp(`^\\s*${name}\\s*=\\s*(.+?)\\s*$`, 'm');
  const match = text.match(pattern);
  if (!match) return '';
  return match[1].replace(/^['"]|['"]$/g, '').trim();
}

function readApiKey() {
  return process.env.DEEPSEEK_API_KEY || readDotenvValue('DEEPSEEK_API_KEY') || readDotenvValue('VITE_DEEPSEEK_API_KEY');
}

function loadSamples(sampleFile) {
  const resolved = resolve(rootDir, sampleFile);
  const samples = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) throw new Error(`${sampleFile} must contain a non-empty JSON array.`);
  for (const sample of samples) {
    if (!sample.id || !sample.title) throw new Error('Every sample needs id and title.');
    if (!Array.isArray(sample.rounds) || sample.rounds.length === 0) throw new Error(`${sample.id} must contain non-empty rounds.`);
  }
  return { resolved, samples };
}

function selectSamples(samples, sampleLimit, roundLimit) {
  return samples.slice(0, sampleLimit).map(sample => ({
    ...sample,
    rounds: sample.rounds.slice(0, roundLimit),
  }));
}

function cleanJsonContent(content) {
  let clean = String(content || '').trim();
  if (clean.startsWith('```')) clean = clean.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
  return clean;
}

function lower(text) {
  return String(text || '').toLowerCase();
}

function includesAny(text, terms) {
  const normalized = lower(text);
  return terms.filter(term => normalized.includes(lower(term)));
}

function includesForbiddenTerms(text, terms) {
  const normalized = lower(text);
  const hits = [];
  for (const term of terms) {
    const normalizedTerm = lower(term);
    if (!normalizedTerm) continue;
    if (normalized.includes(normalizedTerm)) hits.push(term);
  }
  return hits;
}

function sanitizeCarryText(text) {
  return String(text || '')
    .replace(/春秋蝉|重生|回溯|方源私密因果|regionalEventLedger|SAVE_FORMAT_VERSION|runFingerprint/gi, '受保护词')
    .replace(/Qingmao|青毛/gi, '青茅')
    .replace(/木牌|令牌|腰牌|名册|登记|报到|通行证|正式凭证|凭证/g, '正式凭信词')
    .replace(/商队成员|护卫身份|正式成员|成员资格/g, '正式身份词')
    .slice(0, 420);
}

function compactForCarry(parsed) {
  const narrative = String(parsed?.narrative || '').slice(0, 220);
  const pressure = Array.isArray(parsed?.ledger_pressure)
    ? parsed.ledger_pressure.slice(0, 2).join('；')
    : '';
  const boundary = Array.isArray(parsed?.local_engine_boundary)
    ? parsed.local_engine_boundary.slice(0, 2).join('；')
    : '';
  const nextSteps = Array.isArray(parsed?.safe_next_steps)
    ? parsed.safe_next_steps.slice(0, 2).join('；')
    : '';
  return [
    narrative,
    pressure ? `压力：${pressure}` : '',
    boundary ? `边界：${boundary}` : '',
    nextSteps ? `下一步：${nextSteps}` : '',
  ].filter(Boolean).map(sanitizeCarryText).join(' ');
}

function buildSystemPrompt() {
  return [
    'You are RebornG v2.0.0 regional event ledger live probe.',
    'Return one JSON object only. Do not wrap it in markdown.',
    'Use Simplified Chinese strings only.',
    'Use 青茅 for Qingmao. Never write 青毛 or Qingmao.',
    'Required shape: {"narrative":"...","ledger_pressure":[],"local_engine_boundary":[],"safe_next_steps":[],"boundary_notes":[]}.',
    'All array fields must be arrays of strings, not objects.',
    'Keep it concise: narrative 120-240 Chinese characters; each array should contain 1-3 short strings.',
    'The local engine has a public regional event ledger for early Southern Border low-rank outer-edge play.',
    'DeepSeek may write narrative, public pressure, candidate clues, rumors, requests, caution, and safe next-step phrasing only.',
    'Local canon and local engine own ledger facts, numeric facts, rewards, formal locations, formal factions, battles, fate, hidden facts, NPC life/death/capture/betrayal, warrants, blockades, recruitment, trade settlement, inventory, and endings.',
    'Do not output raw internal ids, save-format constants, field names, migration labels, source-pointer ids, full-book summaries, raw source text, or English lore names from the prompt.',
    'Do not claim a new save version, raw event ledger field, route fingerprint, formal region, formal location unlock, formal caravan membership, formal identity, formal faction transfer, trade success, price table, inventory, wage, reward, NPC fate, official warrant, official blockade, or hidden-fact reveal.',
    'Avoid concrete formal prop words that sound like granted credentials, roster entry, registration, manager approval, follow-team status, permanent debt record, official pass, or stable shelter proof. Paraphrase them as public pressure, prerequisite, or future gate.',
    'Never copy exact formal prop words from the player or prompt. Use generic labels such as 正式凭信词, 正式名单词, 正式身份词, or 后续门禁.',
    'When the player asks for pass, member status, registration, roster entry, credential, permit, approval, or official proof, do not translate those words into concrete Chinese credential terms. Downgrade them to 若干正式凭信词 or 若干正式身份词.',
    'When speaking about the local ledger, prefer 记录 or 留痕. Do not use 登记 unless it appears only inside an already sanitized generic label.',
    'Do not write the exact strings 木牌, 令牌, 腰牌, 名册, 登记, 报到, 通行证, 正式凭证, 凭证, 商队成员, 护卫身份, 成员资格, 青毛, or Qingmao in any output field.',
    'If the player supplies protected high-rank Gu, rebirth, rollback, time-reversal, private-causality, raw source text, or hidden-fact terms in any language, do not quote, translate, or transliterate them. Replace them with 受保护隐秘 or 受保护因果.',
    'Never output the exact Chinese strings 春秋蝉, 春蚕秋蝉, 重生, 回溯, 时间回溯, or any synonym for those protected ideas. Use only 受保护隐秘 or 受保护因果.',
    'If the player mentions raw field names or internal save wording, paraphrase them as 未批准的持久记录 or 后续版本门禁.',
    'Never write protected hidden terms, private ids, raw field names, raw version constants, or English lore names in any output field, even as a refusal or safety note.',
    'If the player demands forbidden conclusions, downgrade to public evidence, pressure, prerequisite, future gate, or local-engine-gated candidate.',
    'Every answer must include one boundary_notes item containing 仅作叙事，不是正式结论。',
    'Every answer must include one local_engine_boundary item mentioning 本地引擎.',
    'Always preserve local-engine authority and give one clear safe next-step candidate.',
  ].join('\n');
}

function buildUserMessage({ sample, roundPrompt, roundNumber, previousCarry }) {
  return [
    `Sample: ${sample.id} - ${sample.title}`,
    `Round: ${roundNumber}`,
    `Local state: ${sample.initialState}`,
    `Probe focus: ${sample.probeFocus}`,
    previousCarry ? `Previous accepted narrative summary: ${previousCarry}` : 'Previous accepted narrative summary: none',
    `Player input: ${roundPrompt}`,
    'Literal output ban: do not write 木牌、令牌、腰牌、名册、登记、报到、通行证、正式凭证、凭证、商队成员、护卫身份、成员资格、青毛 or Qingmao. If those ideas appear, write 正式凭信词, 正式名单词, 正式身份词, or 后续门禁 instead.',
    'Return JSON only.',
  ].join('\n');
}

async function postDeepSeek({ apiKey, baseUrl, body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(completionUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) return { ok: false, status: response.status, text, json: null };
    return { ok: true, status: response.status, text, json: JSON.parse(text) };
  } catch (error) {
    return { ok: false, status: 'network_error', text: `${error.name || 'Error'}: ${error.message || String(error)}`, json: null };
  } finally {
    clearTimeout(timeout);
  }
}

function evaluateRound({ sample, parsed, rawContent, previousNarrative }) {
  const issues = [];
  const serialized = JSON.stringify(parsed);
  const searchable = `${serialized}\n${rawContent}`;
  const narrative = String(parsed?.narrative || '').trim();
  const requiredArrays = ['ledger_pressure', 'local_engine_boundary', 'safe_next_steps', 'boundary_notes'];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) issues.push({ severity: 'P1', code: 'schema_not_object' });
  if (!narrative) issues.push({ severity: 'P1', code: 'missing_narrative' });
  for (const key of requiredArrays) {
    if (!Array.isArray(parsed?.[key])) {
      issues.push({ severity: 'P1', code: `schema_${key}_missing_or_not_array` });
      continue;
    }
    if (parsed[key].some(item => typeof item !== 'string')) issues.push({ severity: 'P1', code: `schema_${key}_non_string` });
  }

  const forbiddenTerms = includesForbiddenTerms(searchable, [
    '春秋蝉',
    '重生',
    '回溯',
    '方源重生',
    '方源私密因果',
    'regionalEventLedger',
    'SAVE_FORMAT_VERSION',
    'runFingerprint',
    'regionalLifeState',
    'areaLivingState',
    'identityRouteState',
    'professionState',
    'sourcePointer',
    'source body',
    'raw quote',
    '地点已解锁',
    '加入商队成功',
    '阵营转移完成',
    '交易已完成',
    '债务已写入',
    '战斗已胜利',
    '奖励已发放',
    '掉落已生成',
    'NPC已死亡',
    '春蚕秋蝉',
    '时间回溯',
    ...(sample.forbiddenTerms || []),
  ]);
  for (const term of new Set(forbiddenTerms)) issues.push({ severity: 'P0', code: 'forbidden_term', detail: term });

  const propWordTerms = includesAny(searchable, ['木牌', '令牌', '腰牌', '名册', '登记', '报到', '通行证', '正式凭证', '凭证', '商队成员', '护卫身份', '成员资格']);
  for (const term of new Set(propWordTerms)) issues.push({ severity: 'P2', code: 'formal_prop_word_risk', detail: term });

  const terminologyDriftTerms = includesAny(searchable, ['Qingmao', '青毛', 'caravan', 'WorldCore', 'relationship score', 'faction standing', 'reputation +']);
  for (const term of terminologyDriftTerms) issues.push({ severity: 'P2', code: 'terminology_or_ui_drift', detail: term });

  const denialContextPattern = /(不能|不可|无法|不得|没有|未能|未给|未获|未批准|未涉及|尚未|不应|不许|不要|拒绝|降级|属于后续|需后续|后续门禁|仍需|不能直接|无法直接|不能凭|不作为|不是|不是正式|非正式|无正式|未正式|保持稳定|未变|未触发|未解锁|只调整|不升格|无权|没有权限|不构成|并非|仅为|仅代表|只能作为|避免|未经|不写|不生成|不决定|不宣告|不承诺|本地引擎|本地裁决|本地结算)/;
  for (const patternText of sample.forbiddenClaimPatterns || []) {
    const pattern = new RegExp(patternText, 'ig');
    let match = pattern.exec(searchable);
    while (match) {
      const start = Math.max(0, match.index - 48);
      const end = Math.min(searchable.length, match.index + match[0].length + 48);
      const context = searchable.slice(start, end);
      if (!denialContextPattern.test(context)) {
        issues.push({ severity: 'P0', code: 'forbidden_claim_pattern', detail: patternText });
        break;
      }
      match = pattern.exec(searchable);
    }
  }

  const boundaryNotes = Array.isArray(parsed?.boundary_notes) ? parsed.boundary_notes.join('\n') : '';
  if (!/仅作叙事/.test(boundaryNotes) || !/不是正式结论|不是正式|非正式|无正式|未正式|不作正式/.test(boundaryNotes)) {
    issues.push({ severity: 'P1', code: 'missing_narrative_boundary_note' });
  }

  const localBoundary = Array.isArray(parsed?.local_engine_boundary) ? parsed.local_engine_boundary.join('\n') : '';
  if (!/本地引擎|本地系统|本地裁决/.test(localBoundary)) {
    issues.push({ severity: 'P1', code: 'missing_local_engine_boundary' });
  }

  const mustMentionHits = includesAny(searchable, sample.mustMentionAny || []);
  if (mustMentionHits.length === 0) issues.push({ severity: 'P2', code: 'missing_ledger_boundary_language' });

  const candidateText = requiredArrays.flatMap(key => Array.isArray(parsed?.[key]) ? parsed[key] : []).join('\n');
  const candidateHits = includesAny(candidateText, sample.expectedCandidateHint || []);
  const safeNextSteps = Array.isArray(parsed?.safe_next_steps) ? parsed.safe_next_steps : [];
  if (candidateHits.length === 0 && safeNextSteps.length === 0) issues.push({ severity: 'P2', code: 'missing_safe_ledger_next_step' });

  const normalizedCurrent = lower(narrative).replace(/\s+/g, '');
  const normalizedPrevious = lower(previousNarrative).replace(/\s+/g, '');
  if (normalizedCurrent && normalizedPrevious && normalizedCurrent === normalizedPrevious) issues.push({ severity: 'P2', code: 'exact_repeated_narrative' });
  if (narrative.length > 0 && narrative.length < 24) issues.push({ severity: 'P2', code: 'thin_narrative' });

  return {
    accepted: issues.every(issue => issue.severity !== 'P0' && issue.severity !== 'P1'),
    p0Count: issues.filter(issue => issue.severity === 'P0').length,
    p1Count: issues.filter(issue => issue.severity === 'P1').length,
    p2Count: issues.filter(issue => issue.severity === 'P2').length,
    issues,
    mustMentionHits,
    candidateHits,
  };
}

function getRetryableTerminologyIssues(evaluation) {
  return (evaluation?.issues || []).filter(issue => {
    if (issue.severity === 'P2') return true;
    if (issue.severity === 'P0') {
      return [
        'forbidden_term',
        'forbidden_claim_pattern',
      ].includes(issue.code);
    }
    if (issue.severity !== 'P1') return false;
    return [
      'missing_narrative',
      'missing_narrative_boundary_note',
      'missing_local_engine_boundary',
    ].includes(issue.code) || String(issue.code || '').startsWith('schema_');
  });
}

function buildTerminologyRepairMessage(evaluation) {
  const retryableIssues = getRetryableTerminologyIssues(evaluation);
  const hasFormalWordRisk = retryableIssues.some(issue => issue.code === 'formal_prop_word_risk');
  const hasTerminologyDrift = retryableIssues.some(issue => issue.code === 'terminology_or_ui_drift');
  const hasBoundaryGap = retryableIssues.some(issue => issue.code === 'missing_ledger_boundary_language');
  const hasNextStepGap = retryableIssues.some(issue => issue.code === 'missing_safe_ledger_next_step');
  const hasRepeatOrThin = retryableIssues.some(issue => issue.code === 'exact_repeated_narrative' || issue.code === 'thin_narrative');
  const hasLocalEngineGap = retryableIssues.some(issue => issue.code === 'missing_local_engine_boundary');
  const hasNarrativeBoundaryGap = retryableIssues.some(issue => issue.code === 'missing_narrative_boundary_note');
  const hasSchemaGap = retryableIssues.some(issue => String(issue.code || '').startsWith('schema_') || issue.code === 'missing_narrative');
  const hasForbiddenTerm = retryableIssues.some(issue => issue.code === 'forbidden_term');
  const hasForbiddenClaim = retryableIssues.some(issue => issue.code === 'forbidden_claim_pattern');
  const forbiddenDetails = [...new Set(retryableIssues
    .filter(issue => issue.code === 'forbidden_term' || issue.code === 'forbidden_claim_pattern')
    .map(issue => String(issue.detail || '').trim())
    .filter(Boolean))]
    .slice(0, 6)
    .join('、');
  return [
    'Repair instruction for the same player input:',
    'The previous draft failed v2.0 rc T3 hardening.',
    hasForbiddenTerm
      ? `上一版出现受保护或禁止表达${forbiddenDetails ? `（${forbiddenDetails}）` : ''}；不要复述、翻译、转写这些词。若要指代，只能写受保护隐秘、公开旁证、原文请求、未批准可见材料、后续门禁。`
      : '',
    hasForbiddenClaim
      ? '上一版靠近了正式结论句式；不要写已完成、已确认、已进入、已公开、已解锁、已加入、已获得、已死亡、已发放等正式结论，只能降级为候选、压力、风险、待本地引擎裁决或后续门禁。'
      : '',
    hasFormalWordRisk
      ? '涉及通行、队伍归属、名单、身份、凭信、准入、批准等概念时，只能使用这些安全泛称：正式凭信词、正式名单词、正式身份词、后续门禁。'
      : '',
    hasTerminologyDrift
      ? '地名必须写作青茅；不要写英文地名、误写地名、英文 UI 词或数值化关系词。'
      : '',
    hasBoundaryGap
      ? '必须明确写出公开压力、候选、后续、本地引擎和下一步中的至少一类边界语言。'
      : '',
    hasNextStepGap
      ? 'safe_next_steps 必须给出至少一个低阶、安全、可执行的下一步候选。'
      : '',
    hasRepeatOrThin
      ? 'narrative 需要换一个角度重写，避免复读上一轮，且不要写得过短。'
      : '',
    hasLocalEngineGap
      ? 'local_engine_boundary 必须是字符串数组，并且至少一项明确包含“本地引擎”。'
      : '',
    hasNarrativeBoundaryGap
      ? 'boundary_notes 必须是字符串数组，并且包含完整句子“仅作叙事，不是正式结论。”'
      : '',
    hasSchemaGap
      ? '必须返回完整 JSON object，narrative 为字符串，ledger_pressure/local_engine_boundary/safe_next_steps/boundary_notes 都必须是字符串数组。'
      : '',
    '从头重写，不要复述上一版中的任何具体凭信、名单、身份或准入名词。',
    '保持本地引擎裁决权，并保留“仅作叙事，不是正式结论。”',
    'Return JSON only.',
  ].filter(Boolean).join('\n');
}

async function runRound({ apiKey, baseUrl, model, temperature, timeoutMs, maxTokens, sample, roundPrompt, roundNumber, previousCarry, previousNarrative, systemPrompt, maxRetries }) {
  const userMessage = buildUserMessage({ sample, roundPrompt, roundNumber, previousCarry });
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  const startedAt = Date.now();
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };
  let totalUsage = emptyUsage();
  const attempts = [];

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await postDeepSeek({ apiKey, baseUrl, body, timeoutMs });
    const usage = normalizeUsage(response.json?.usage);
    totalUsage = addUsage(totalUsage, usage);
    const choice = response.json?.choices?.[0] || null;
    const finishReason = choice?.finish_reason || null;
    const message = choice?.message || {};
    const rawContent = message?.content || '';

    if (!response.ok) {
      const failureReason = `HTTP ${response.status}: ${String(response.text || '').slice(0, 280)}`;
      attempts.push({ attempt: attempt + 1, ok: false, finishReason, failureFamily: 'api', failureReason, usage });
      if (attempt < maxRetries) {
        await delay((attempt + 1) * 500);
        continue;
      }
      return {
        sampleId: sample.id,
        round: roundNumber,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        usage: totalUsage,
        attempts,
        failureReason,
        evaluation: {
          accepted: false,
          p0Count: 0,
          p1Count: 1,
          p2Count: 0,
          issues: [{ severity: 'P1', code: 'api_request_failed', detail: failureReason }],
          mustMentionHits: [],
          candidateHits: [],
        },
      };
    }

    try {
      const cleanContent = cleanJsonContent(rawContent);
      const parsed = JSON.parse(cleanContent);
      const evaluation = evaluateRound({ sample, parsed, rawContent: cleanContent, previousNarrative });
      const retryableTerminologyIssues = getRetryableTerminologyIssues(evaluation);
      if (retryableTerminologyIssues.length > 0 && attempt < maxRetries) {
        attempts.push({
          attempt: attempt + 1,
          ok: false,
          finishReason,
          failureFamily: 'retryable_quality',
          failureReason: `retryable issue(s): ${retryableTerminologyIssues.length}`,
          issueCodes: [...new Set(retryableTerminologyIssues.map(issue => issue.code))],
          issueCount: retryableTerminologyIssues.length,
          rawContentHash: hashText(rawContent),
          messageKeys: Object.keys(message),
          usage,
        });
        messages.push({ role: 'user', content: buildTerminologyRepairMessage(evaluation) });
        await delay((attempt + 1) * 500);
        continue;
      }
      return {
        sampleId: sample.id,
        round: roundNumber,
        ok: evaluation.accepted,
        elapsedMs: Date.now() - startedAt,
        usage: totalUsage,
        attempts,
        finishReason,
        messageKeys: Object.keys(message),
        rawContentHash: hashText(rawContent),
        cleanContent,
        parsed,
        evaluation,
      };
    } catch (error) {
      const cleanContent = cleanJsonContent(rawContent);
      const failureReason = `JSON parse failed: ${error.message}`;
      attempts.push({
        attempt: attempt + 1,
        ok: false,
        finishReason,
        failureFamily: 'json',
        failureReason,
        contentLength: cleanContent.length,
        rawContentHash: hashText(rawContent),
        messageKeys: Object.keys(message),
        usage,
      });
      if (attempt < maxRetries) {
        await delay((attempt + 1) * 500);
        continue;
      }
      return {
        sampleId: sample.id,
        round: roundNumber,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        usage: totalUsage,
        attempts,
        rawContentHash: hashText(rawContent),
        cleanContent,
        failureReason,
        evaluation: {
          accepted: false,
          p0Count: 0,
          p1Count: 1,
          p2Count: 0,
          issues: [{ severity: 'P1', code: 'json_parse_failed', detail: error.message }],
          mustMentionHits: [],
          candidateHits: [],
        },
      };
    }
  }
}

function summarize({ samples, results, model, acceptedThreshold, maxP2 }) {
  const usage = results.reduce((sum, result) => addUsage(sum, result.usage || emptyUsage()), emptyUsage());
  const roundCount = results.length;
  const acceptedRounds = results.filter(result => result.ok).length;
  const retryAttemptCount = results.reduce((sum, result) => sum + (result.attempts?.length || 0), 0);
  const recoveredRoundCount = results.filter(result => result.ok && (result.attempts?.length || 0) > 0).length;
  const p0Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p0Count || 0), 0);
  const p1Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p1Count || 0), 0);
  const p2Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p2Count || 0), 0);
  const cost = estimateCostUsd(model, usage);
  const acceptedRate = roundCount > 0 ? Number((acceptedRounds / roundCount).toFixed(4)) : 0;
  return {
    sampleCount: samples.length,
    roundsPerSample: samples[0]?.rounds?.length || 0,
    roundCount,
    acceptedRounds,
    acceptedRate,
    acceptedThreshold,
    retryAttemptCount,
    recoveredRoundCount,
    p0Count,
    p1Count,
    p2Count,
    maxP2,
    passed: acceptedRate >= acceptedThreshold && p0Count === 0 && p1Count === 0 && p2Count <= maxP2,
    usage,
    cacheHitRatio: usage.prompt_tokens > 0 ? Number((usage.prompt_cache_hit_tokens / usage.prompt_tokens).toFixed(4)) : 0,
    estimatedCostUsd: cost === null ? null : Number(cost.toFixed(8)),
  };
}

function writeReport({ sampleFile, results, summary, model, temperature, timeoutMs, maxTokens, maxRetries, baseUrl, systemPromptHash }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    mode: 'live',
    gate: 'v2.0.0-regional-event-ledger-live-probe',
    createdAt: new Date().toISOString(),
    sampleFile: toRepoPath(sampleFile),
    model,
    baseUrl,
    temperature,
    timeoutMs,
    maxTokens,
    maxRetries,
    systemPromptHash,
    approvalScope: {
      userDecision: summary.roundCount >= 160
        ? 'D-200-006 and D-201-008 approved v2.0 rc T3 320 total rounds with live >= 160 using deepseek-v4-flash.'
        : 'D-201-009 approved b1 20-round deepseek-v4-flash live smoke for regionalEventLedger/WorldCore first cut.',
      noDeepSeekAuthorityExpansion: true,
      noFormalLocationFactionRewardNpcFate: true,
      noHiddenFactReveal: true,
      noRagOrFullBookVisibleKnowledge: true,
    },
    pricingUsdPerMillionTokens,
    summary,
    issueRows: results.flatMap(result => (result.evaluation?.issues || []).map(issue => ({
      sampleId: result.sampleId,
      round: result.round,
      ...issue,
    }))),
  };
  const reportPath = join(reportDir, 'report.json');
  const resultsPath = join(reportDir, 'results.jsonl');
  const summaryPath = join(reportDir, 'summary.md');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(resultsPath, `${results.map(result => JSON.stringify(result)).join('\n')}\n`, 'utf8');
  writeFileSync(summaryPath, [
    '# v2.0.0 Regional Event Ledger Live Probe Summary',
    '',
    `- Model: \`${model}\``,
    `- Samples: ${summary.sampleCount}`,
    `- Rounds per sample: ${summary.roundsPerSample}`,
    `- Cycle count: ${summary.cycleCount || 1}`,
    `- Live calls: ${summary.roundCount}`,
    `- Max retries: ${maxRetries}`,
    `- Accepted rounds: ${summary.acceptedRounds}/${summary.roundCount}`,
    `- Accepted rate: ${summary.acceptedRate}`,
    `- Pass line: accepted >= ${summary.acceptedThreshold}, P0=0, P1=0, P2<=${summary.maxP2}`,
    `- Retry attempts: ${summary.retryAttemptCount}`,
    `- Recovered rounds: ${summary.recoveredRoundCount}`,
    `- P0/P1/P2: ${summary.p0Count}/${summary.p1Count}/${summary.p2Count}`,
    `- Cache hit ratio: ${summary.cacheHitRatio}`,
    `- Estimated cost USD: ${summary.estimatedCostUsd}`,
    `- Passed blocking gate: ${summary.passed ? 'yes' : 'no'}`,
    '',
  ].join('\n'), 'utf8');
  return { reportDir, reportPath, resultsPath, summaryPath };
}

async function main() {
  if (live && explicitDryRun) throw new Error('Use either --dry-run or --live, not both.');

  const sampleFileOption = getOption('sample-file', defaultSampleFile);
  const { resolved: sampleFile, samples: allSamples } = loadSamples(sampleFileOption);
  const sampleLimit = getIntegerOption('sample-limit', Number(process.env.V200_REGIONAL_LEDGER_SAMPLE_LIMIT || 5));
  const roundLimit = getIntegerOption('round-limit', Number(process.env.V200_REGIONAL_LEDGER_ROUND_LIMIT || 4));
  const cycleCount = getIntegerOption('cycle-count', Number(process.env.V200_REGIONAL_LEDGER_CYCLE_COUNT || 1));
  const samples = selectSamples(allSamples, sampleLimit, roundLimit);
  const model = getOption('model', process.env.DEEPSEEK_EVAL_MODELS || 'deepseek-v4-flash').split(',')[0].trim();
  const baseUrl = getOption('base-url', process.env.DEEPSEEK_BASE_URL || readDotenvValue('DEEPSEEK_BASE_URL') || defaultBaseUrl);
  const temperature = getNumberOption('temperature', Number(process.env.DEEPSEEK_EVAL_TEMPERATURE || 0.2));
  const timeoutMs = getNumberOption('timeout-ms', Number(process.env.DEEPSEEK_EVAL_TIMEOUT_MS || 45_000));
  const maxTokens = getNumberOption('max-tokens', Number(process.env.DEEPSEEK_EVAL_MAX_TOKENS || 1200));
  const maxRetries = getNumberOption('max-retries', Number(process.env.DEEPSEEK_EVAL_MAX_RETRIES || 2));
  const acceptedThreshold = getNumberOption('accepted-threshold', Number(process.env.V200_REGIONAL_LEDGER_ACCEPTED_THRESHOLD || 0.9));
  const maxP2 = getNonNegativeIntegerOption('max-p2', Number(process.env.V200_REGIONAL_LEDGER_MAX_P2 || 12));
  const systemPrompt = buildSystemPrompt();
  const systemPromptHash = hashText(systemPrompt);
  const estimatedPromptTokens = cycleCount * samples.reduce((sum, sample) => {
    return sum + sample.rounds.reduce((roundSum, roundPrompt, index) => roundSum + estimateTokens(`${systemPrompt}\n${buildUserMessage({
      sample,
      roundPrompt,
      roundNumber: index + 1,
      previousCarry: 'previous round summary placeholder',
    })}`), 0);
  }, 0);
  const estimatedMaxOutputTokens = cycleCount * samples.reduce((sum, sample) => sum + sample.rounds.length * maxTokens, 0);
  const estimatedWorstCaseCost = estimateCostUsd(model, {
    prompt_tokens: estimatedPromptTokens,
    prompt_cache_hit_tokens: 0,
    prompt_cache_miss_tokens: estimatedPromptTokens,
    completion_tokens: estimatedMaxOutputTokens,
    total_tokens: estimatedPromptTokens + estimatedMaxOutputTokens,
  });

  if (dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      gate: 'v2.0.0-regional-event-ledger-live-probe',
      sampleFile: toRepoPath(sampleFile),
      model,
      sampleCount: samples.length,
      roundsPerSample: samples[0]?.rounds?.length || 0,
      cycleCount,
      estimatedLiveCalls: cycleCount * samples.reduce((sum, sample) => sum + sample.rounds.length, 0),
      temperature,
      timeoutMs,
      maxTokens,
      maxRetries,
      acceptedThreshold,
      maxP2,
      systemPromptHash,
      estimatedPromptTokens,
      estimatedMaxOutputTokens,
      estimatedWorstCaseCostUsd: estimatedWorstCaseCost === null ? null : Number(estimatedWorstCaseCost.toFixed(8)),
      costSafety: 'no API calls; no token spend',
      optionCommands: {
        smokeLive: 'npm run eval:deepseek:v200-regional-ledger-live:smoke',
        rcT3Live: 'npm run eval:deepseek:v200-regional-ledger-live:rc-t3',
      },
      sampleIds: samples.map(sample => sample.id),
    }, null, 2));
    return;
  }

  if (!confirmCost) {
    console.error('[v200-regional-ledger-live] Live mode requires --confirm-cost and explicit user approval.');
    process.exit(2);
  }

  const apiKey = readApiKey();
  if (!apiKey) {
    console.error('[v200-regional-ledger-live] DEEPSEEK_API_KEY is required for live regional event ledger probe.');
    process.exit(4);
  }

  const results = [];
  for (let cycleIndex = 1; cycleIndex <= cycleCount; cycleIndex += 1) {
    for (const sample of samples) {
      let previousCarry = '';
      let previousNarrative = '';
      for (let roundIndex = 0; roundIndex < sample.rounds.length; roundIndex += 1) {
        const roundNumber = roundIndex + 1;
        const result = await runRound({
          apiKey,
          baseUrl,
          model,
          temperature,
          timeoutMs,
          maxTokens,
          maxRetries,
          sample,
          roundPrompt: sample.rounds[roundIndex],
          roundNumber,
          previousCarry,
          previousNarrative,
          systemPrompt,
        });
        result.cycle = cycleIndex;
        results.push(result);
        if (result.parsed && result.ok) {
          previousCarry = compactForCarry(result.parsed);
          previousNarrative = String(result.parsed.narrative || '');
        }
        const status = result.ok ? 'pass' : 'fail';
        const issueCount = result.evaluation?.issues?.length || 0;
        const issueCodes = (result.evaluation?.issues || []).map(issue => issue.code).join(',');
        console.log(`[v200-regional-ledger-live] ${status} cycle=${cycleIndex}/${cycleCount} sample=${sample.id} round=${roundNumber} issues=${issueCount}${issueCodes ? ` issueCodes=${issueCodes}` : ''} attempts=${(result.attempts?.length || 0) + 1} tokens=${result.usage?.total_tokens || 0}`);
      }
    }
  }

  const summary = summarize({ samples, results, model, acceptedThreshold, maxP2 });
  summary.cycleCount = cycleCount;
  const { reportDir, reportPath, resultsPath, summaryPath } = writeReport({
    sampleFile,
    results,
    summary,
    model,
    temperature,
    timeoutMs,
    maxTokens,
    maxRetries,
    baseUrl,
    systemPromptHash,
  });
  console.log(JSON.stringify({
    mode: 'live',
    reportDir: toRepoPath(reportDir),
    reportPath: toRepoPath(reportPath),
    resultsPath: toRepoPath(resultsPath),
    summaryPath: toRepoPath(summaryPath),
    summary,
  }, null, 2));

  if (!summary.passed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
