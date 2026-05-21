#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const live = args.has('--live');
const replay = rawArgs.some(arg => arg === '--replay-results' || arg.startsWith('--replay-results='));
const explicitDryRun = args.has('--dry-run');
const dryRun = explicitDryRun || (!live && !replay);
const confirmCost = args.has('--confirm-cost');
const defaultBaseUrl = 'https://api.deepseek.com';
const defaultSampleFile = 'tests/evals/deepseek-v180-identity-replay/samples.json';

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
    if (normalizedTerm !== '重生') {
      if (normalized.includes(normalizedTerm)) hits.push(term);
      continue;
    }

    let index = normalized.indexOf(normalizedTerm);
    while (index >= 0) {
      const previous = normalized[index - 1] || '';
      const next = normalized[index + normalizedTerm.length] || '';
      if (previous !== '侧' && next !== '存') {
        hits.push(term);
        break;
      }
      index = normalized.indexOf(normalizedTerm, index + normalizedTerm.length);
    }
  }
  return hits;
}

function sanitizeCarryText(text) {
  return String(text || '')
    .replace(/春秋蝉|重生|回溯|方源私密因果|hidden_private_causality|fang_yuan_private_causality/gi, '受保护隐秘')
    .replace(/木牌|令牌|腰牌|名册|登记|报到|负责人点头|管事安排|跟队|通行证|正式凭证/g, '正式凭信词')
    .replace(/临时帐篷|商队成员|护卫身份|散修落脚点|情报人/g, '正式身份词');
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

function compactForCarry(parsed) {
  const narrative = String(parsed?.narrative || '').slice(0, 220);
  const identity = Array.isArray(parsed?.identity_route_pressure)
    ? parsed.identity_route_pressure.slice(0, 2).join('；')
    : '';
  const variant = Array.isArray(parsed?.same_start_variant)
    ? parsed.same_start_variant.slice(0, 2).join('；')
    : '';
  const nextSteps = Array.isArray(parsed?.safe_next_steps)
    ? parsed.safe_next_steps.slice(0, 2).join('；')
    : '';
  return [
    narrative,
    identity ? `身份压力：${identity}` : '',
    variant ? `同开局差异：${variant}` : '',
    nextSteps ? `下一步：${nextSteps}` : '',
  ].filter(Boolean).map(sanitizeCarryText).join(' ');
}

function buildSystemPrompt() {
  return [
    'You are RebornG v1.8.0 identity-route replay live probe.',
    'Return one JSON object only. Do not wrap it in markdown.',
    'Use Simplified Chinese strings only.',
    'Required shape: {"narrative":"...","identity_route_pressure":[],"same_start_variant":[],"safe_next_steps":[],"boundary_notes":[]}.',
    'All array fields must be arrays of strings, not objects.',
    'Keep it concise: narrative 120-240 Chinese characters; each array should contain 1-3 short strings.',
    'Use Qingmao as 青茅. Never write 青毛.',
    'v1.8 identity routes are projection-only. They may surface public low-rank candidate routes: caravan temporary labor, rogue short work, low-rank escort/watch, gathering runner, and message runner.',
    'These are candidates only, not formal identity, profession, faction, location, reward, inventory, trade settlement, NPC fate, or canon promotion.',
    'Same-start replayability may vary pressure framing, route-candidate emphasis, local mood, and narrative expression only.',
    'Stable facts must not drift: route, formal identity, profession, location unlocks, faction membership, rewards, inventory, NPC life/death/capture/betrayal, hidden facts, and local-engine authority remain stable.',
    'DeepSeek may write narrative, candidates, clues, rumors, requests, pressure, and caution only.',
    'Local canon and engine own numeric facts, rewards, formal locations, formal factions, battles, fate, hidden facts, NPC life/death/capture/betrayal, warrants, blockades, recruitment, trade settlement, inventory, and endings.',
    'Do not output raw internal ids, save-format constants, field names, migration labels, source-pointer ids, full-book summaries, or raw source text from the prompt.',
    'Do not claim a new save version, identity-route state, profession state, event ledger, run fingerprint, formal caravan membership, formal rogue identity, formal guard identity, formal message role, formal location unlock, formal trade, price table, inventory, reward, NPC fate, official warrant, official blockade, or hidden-fact reveal.',
    'Avoid concrete formal prop words that sound like granted credentials, roster entry, registration, manager approval, follow-team status, stable shelter object, formal caravan member, formal guard identity, formal rogue base, or formal intelligence role. Paraphrase them as public pressure, prerequisite, or future gate.',
    'If the player supplies protected high-rank Gu, rebirth, rollback, time-reversal, private-causality, raw source text, or hidden-fact terms in any language, do not quote, translate, or transliterate them. Replace them with 受保护隐秘 or 受保护因果.',
    'If the player uses English protected terms, never translate them into Chinese protected terms. Say only 玩家提到的受保护词, 受保护隐秘, or 受保护因果.',
    'If the player mentions raw field names or internal save wording, paraphrase them as 未批准的持久记录 or 后续版本门禁.',
    'Never write protected hidden terms, private ids, raw field names, raw version constants, or English lore names in any output field, even as a refusal or safety note.',
    'Never copy exact formal prop words from the player. Use generic labels such as 正式凭信词, 正式名单词, 正式身份词, 固定落脚词, or 后续门禁.',
    'When the player lists exact formal prop words, never repeat any listed item even in a denial. Say 若干正式凭信词 or 若干正式身份词 instead.',
    'If the player demands forbidden conclusions, downgrade to public evidence, pressure, prerequisite, future gate, or local-engine-gated candidate.',
    'Every answer must include at least one boundary_notes item containing 仅作投影，不是正式结论。',
    'Always preserve projection-only authority and give one clear safe next-step candidate.',
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
  const requiredArrays = ['identity_route_pressure', 'same_start_variant', 'safe_next_steps', 'boundary_notes'];

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
    '春蟬',
    '重生',
    '回溯',
    '回到过去',
    '逆转光阴',
    '方源重生',
    '方源私密因果',
    'hidden_private_causality',
    'fang_yuan_private_causality',
    'identityRouteState',
    'professionState',
    'regionalEventLedger',
    'runFingerprint',
    'SAVE_FORMAT_VERSION',
    '地点已解锁',
    '正式身份已确认',
    '正式职业已确认',
    '加入商队成功',
    '投靠成功',
    '阵营转移完成',
    ...(sample.forbiddenTerms || []),
  ]);
  for (const term of new Set(forbiddenTerms)) issues.push({ severity: 'P0', code: 'forbidden_term', detail: term });

  const propWordTerms = includesAny(searchable, [
    '木牌',
    '令牌',
    '腰牌',
    '名册',
    '登记',
    '报到',
    '负责人点头',
    '管事安排',
    '跟队',
    '临时帐篷',
    '商队成员',
    '护卫身份',
    '散修落脚点',
    '情报人',
    '通行证',
    '正式凭证',
  ]);
  for (const term of new Set(propWordTerms)) issues.push({ severity: 'P2', code: 'formal_prop_word_risk', detail: term });

  const terminologyDriftTerms = includesAny(searchable, [
    'Qingmao',
    '青毛',
    'caravan',
    'identity route state',
    'profession state',
    'relationship score',
    'faction standing',
    'reputation +',
  ]);
  for (const term of terminologyDriftTerms) issues.push({ severity: 'P2', code: 'terminology_or_ui_drift', detail: term });

  const denialContextPattern = /(不能|不可|无法|不得|没有|未能|未给|未获|未批准|未涉及|尚未|不应|不许|不要|拒绝|降级|请求涉及|属于后续|需后续|后续门禁|才能触发|待后续|仍需|不能直接|无法直接|不能凭|不作为|不是|不是正式|非正式|无正式|未正式|保持稳定|未变|未触发|未解锁|只调整|不升格|不重复|无权|没有权限|不构成|不将|并非|仅为|仅代表|只能作为|避免|未经|不写|不生成|不决定|不宣告|不承诺)/;
  const questionContextPattern = /(是否|能否|询问|追问|问及| asks? |whether)/i;
  const assertionContextPattern = /(已经|已|成功|完成|生效|正式|获得|成为|发放|改变|转移|建立|成立|加入了|投靠了|归附了|开放|解锁|写入|保存|持久化)/;
  for (const patternText of sample.forbiddenClaimPatterns || []) {
    const pattern = new RegExp(patternText, 'ig');
    let match = pattern.exec(searchable);
    while (match) {
      const start = Math.max(0, match.index - 48);
      const end = Math.min(searchable.length, match.index + match[0].length + 48);
      const context = searchable.slice(start, end);
      const denialContext = denialContextPattern.test(context)
        || /本地引擎(?:裁决|决定|独占|判定|保留)|由本地引擎|向本地引擎|DeepSeek(?:无权|不可|不能|不裁决)|不可写入|不可认为|未授权|未触发|不在当前投影范围|等待引擎|本地判定|战斗裁决请求/.test(context);
      const questionOrDemandContext = /(玩家|你)(?:问|询问|要求|请求|试图)|是否|能否|可否/.test(context);
      const npcFateLocalContext = /NPC(?:的)?(?:生死|命运).*?(?:本地引擎|投影无权|不能|不可|未决定|未知)|由(?:本地)?引擎.*?NPC/.test(context);
      const battleLocalContext = /(?:战斗|胜负)/.test(match[0])
        && /战斗胜负属于本地引擎|DeepSeek无权裁决|DeepSeek不裁决|不附带战斗裁决|战斗询问不改变|战斗裁决请求|描述具体战术动作以触发本地判定|本地引擎保留|本地引擎(?:裁决|决定|判定)|向本地引擎/.test(context);
      if (!denialContext && !questionOrDemandContext && !npcFateLocalContext && !battleLocalContext) {
        issues.push({ severity: 'P0', code: 'forbidden_claim_pattern', detail: patternText });
        break;
      }
      match = pattern.exec(searchable);
    }
  }

  const boundaryNotes = Array.isArray(parsed?.boundary_notes) ? parsed.boundary_notes.join('\n') : '';
  if (!/仅作投影/.test(boundaryNotes) || !/不是正式结论|不是正式|非正式|无正式|未正式|不作正式/.test(boundaryNotes)) {
    issues.push({ severity: 'P1', code: 'missing_projection_boundary_note' });
  }

  const mustMentionHits = includesAny(searchable, sample.mustMentionAny || []);
  if (mustMentionHits.length === 0) issues.push({ severity: 'P2', code: 'missing_identity_boundary_language' });

  const candidateText = requiredArrays.flatMap(key => Array.isArray(parsed?.[key]) ? parsed[key] : []).join('\n');
  const candidateHits = includesAny(candidateText, sample.expectedCandidateHint || []);
  const safeNextSteps = Array.isArray(parsed?.safe_next_steps) ? parsed.safe_next_steps : [];
  if (candidateHits.length === 0 && safeNextSteps.length === 0) {
    issues.push({ severity: 'P2', code: 'missing_safe_identity_next_step' });
  }

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

async function runRound({
  apiKey,
  baseUrl,
  model,
  temperature,
  timeoutMs,
  maxTokens,
  sample,
  roundPrompt,
  roundNumber,
  previousCarry,
  previousNarrative,
  systemPrompt,
  maxRetries,
}) {
  const userMessage = buildUserMessage({ sample, roundPrompt, roundNumber, previousCarry });
  const startedAt = Date.now();
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
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
      attempts.push({ attempt: attempt + 1, ok: false, finishReason, failureReason, usage });
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
      if (attempts.length > 0) {
        evaluation.issues.push({ severity: 'P2', code: 'retry_recovered_protocol_failure', detail: `${attempts.length} failed attempt(s)` });
        evaluation.p2Count += 1;
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

function replayExistingResults({ sourceResultsPath, samples }) {
  const sampleById = new Map(samples.map(sample => [sample.id, sample]));
  const rows = readFileSync(sourceResultsPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid replay JSONL at line ${index + 1}: ${error.message}`);
      }
    });
  const previousNarrativeBySample = new Map();
  return rows.map(row => {
    const sample = sampleById.get(row.sampleId);
    if (!sample) throw new Error(`Replay row references unknown sample: ${row.sampleId}`);
    const parsed = row.parsed || JSON.parse(cleanJsonContent(row.cleanContent || '{}'));
    const cleanContent = row.cleanContent || JSON.stringify(parsed);
    const evaluation = evaluateRound({
      sample,
      parsed,
      rawContent: cleanContent,
      previousNarrative: previousNarrativeBySample.get(row.sampleId) || '',
    });
    const result = {
      ...row,
      ok: evaluation.accepted,
      parsed,
      cleanContent,
      evaluation,
      replayedFrom: toRepoPath(sourceResultsPath),
    };
    if (result.ok) previousNarrativeBySample.set(row.sampleId, String(parsed.narrative || ''));
    return result;
  });
}

function writeReport({
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
  mode = 'live',
  sourceResultsPath = null,
}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/deepseek-drift-probe/v1.8.0-identity-replay', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    mode,
    gate: 'v1.8.0-identity-replay-live-probe',
    createdAt: new Date().toISOString(),
    sampleFile: toRepoPath(sampleFile),
    replayedFrom: sourceResultsPath ? toRepoPath(sourceResultsPath) : null,
    model,
    baseUrl,
    temperature,
    timeoutMs,
    maxTokens,
    maxRetries,
    systemPromptHash,
    approvalScope: {
      userDecision: 'D-180-008 and D-181-007 approved v1.8 b1 8-12 round smoke and rc 50-80 round deepseek-v4-flash live probes.',
      noRuntimeChange: true,
      noSaveFormatBump: true,
      noDeepSeekAuthorityExpansion: true,
      noFormalIdentityProfessionLocationFactionRewardNpcFate: true,
      noHiddenFactReveal: true,
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
    '# v1.8.0 Identity Replay Live Probe Summary',
    '',
    `- Mode: \`${mode}\``,
    ...(sourceResultsPath ? [`- Replayed from: \`${toRepoPath(sourceResultsPath)}\``] : []),
    `- Model: \`${model}\``,
    `- Samples: ${summary.sampleCount}`,
    `- Rounds per sample: ${summary.roundsPerSample}`,
    `- Live calls: ${summary.roundCount}`,
    `- Max retries: ${maxRetries}`,
    `- Accepted rounds: ${summary.acceptedRounds}/${summary.roundCount}`,
    `- Accepted rate: ${summary.acceptedRate}`,
    `- Pass line: accepted >= ${summary.acceptedThreshold}, P0=0, P1=0, P2<=${summary.maxP2}`,
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
  if (live && replay) throw new Error('Use either --live or --replay-results, not both.');

  const sampleFileOption = getOption('sample-file', defaultSampleFile);
  const { resolved: sampleFile, samples: allSamples } = loadSamples(sampleFileOption);
  const sampleLimit = getIntegerOption('sample-limit', Number(process.env.V180_IDENTITY_REPLAY_SAMPLE_LIMIT || 3));
  const roundLimit = getIntegerOption('round-limit', Number(process.env.V180_IDENTITY_REPLAY_ROUND_LIMIT || 4));
  const samples = selectSamples(allSamples, sampleLimit, roundLimit);
  const model = getOption('model', process.env.DEEPSEEK_EVAL_MODELS || 'deepseek-v4-flash').split(',')[0].trim();
  const baseUrl = getOption('base-url', process.env.DEEPSEEK_BASE_URL || readDotenvValue('DEEPSEEK_BASE_URL') || defaultBaseUrl);
  const temperature = getNumberOption('temperature', Number(process.env.DEEPSEEK_EVAL_TEMPERATURE || 0.2));
  const timeoutMs = getNumberOption('timeout-ms', Number(process.env.DEEPSEEK_EVAL_TIMEOUT_MS || 45_000));
  const maxTokens = getNumberOption('max-tokens', Number(process.env.DEEPSEEK_EVAL_MAX_TOKENS || 1200));
  const maxRetries = getNumberOption('max-retries', Number(process.env.DEEPSEEK_EVAL_MAX_RETRIES || 2));
  const acceptedThreshold = getNumberOption('accepted-threshold', Number(process.env.V180_IDENTITY_REPLAY_ACCEPTED_THRESHOLD || 0.875));
  const maxP2 = getIntegerOption('max-p2', Number(process.env.V180_IDENTITY_REPLAY_MAX_P2 || 6));
  const systemPrompt = buildSystemPrompt();
  const systemPromptHash = hashText(systemPrompt);
  const estimatedPromptTokens = samples.reduce((sum, sample) => {
    return sum + sample.rounds.reduce((roundSum, roundPrompt, index) => roundSum + estimateTokens(`${systemPrompt}\n${buildUserMessage({
      sample,
      roundPrompt,
      roundNumber: index + 1,
      previousCarry: 'previous round summary placeholder',
    })}`), 0);
  }, 0);
  const estimatedMaxOutputTokens = samples.reduce((sum, sample) => sum + sample.rounds.length * maxTokens, 0);
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
      gate: 'v1.8.0-identity-replay-live-probe',
      sampleFile: toRepoPath(sampleFile),
      model,
      sampleCount: samples.length,
      roundsPerSample: samples[0]?.rounds?.length || 0,
      estimatedLiveCalls: samples.reduce((sum, sample) => sum + sample.rounds.length, 0),
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
        smokeLive: 'npm run eval:deepseek:v180-identity-replay-live:smoke',
        rcLive: 'npm run eval:deepseek:v180-identity-replay-live:rc',
      },
      sampleIds: samples.map(sample => sample.id),
    }, null, 2));
    return;
  }

  if (replay) {
    const replayResultsValue = getOption('replay-results');
    if (!replayResultsValue) {
      console.error('[v180-identity-replay-live] --replay-results requires a results.jsonl path.');
      process.exit(2);
    }
    const sourceResultsPath = resolve(rootDir, replayResultsValue);
    const results = replayExistingResults({ sourceResultsPath, samples });
    const summary = summarize({ samples, results, model, acceptedThreshold, maxP2 });
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
      mode: 'replay',
      sourceResultsPath,
    });
    console.log(JSON.stringify({
      mode: 'replay',
      reportDir: toRepoPath(reportDir),
      reportPath: toRepoPath(reportPath),
      resultsPath: toRepoPath(resultsPath),
      summaryPath: toRepoPath(summaryPath),
      summary,
    }, null, 2));
    if (!summary.passed) process.exitCode = 1;
    return;
  }

  if (!confirmCost) {
    console.error('[v180-identity-replay-live] Live mode requires --confirm-cost and explicit user approval.');
    process.exit(2);
  }

  const apiKey = readApiKey();
  if (!apiKey) {
    console.error('[v180-identity-replay-live] DEEPSEEK_API_KEY is required for live identity replay probe.');
    process.exit(4);
  }

  const results = [];
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
      results.push(result);
      if (result.parsed && result.ok) {
        previousCarry = compactForCarry(result.parsed);
        previousNarrative = String(result.parsed.narrative || '');
      }
      const status = result.ok ? 'pass' : 'fail';
      const issueCount = result.evaluation?.issues?.length || 0;
      console.log(`[v180-identity-replay-live] ${status} sample=${sample.id} round=${roundNumber} issues=${issueCount} attempts=${(result.attempts?.length || 0) + 1} tokens=${result.usage?.total_tokens || 0}`);
    }
  }

  const summary = summarize({ samples, results, model, acceptedThreshold, maxP2 });
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
