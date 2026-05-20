import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const defaultSampleFile = 'tests/evals/deepseek-v130-social/samples.json';

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
  if (index >= 0 && rawArgs[index + 1] && !rawArgs[index + 1].startsWith('--')) {
    return rawArgs[index + 1];
  }
  return fallback;
}

function getNumberOption(name, fallback) {
  if (!hasOption(name)) return fallback;
  const value = Number(getOption(name));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid --${name} value.`);
  }
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function loadSamples(sampleFile) {
  const resolved = resolve(rootDir, sampleFile);
  const samples = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error(`${sampleFile} must contain a non-empty JSON array.`);
  }

  for (const sample of samples) {
    if (!sample.id || !sample.title) throw new Error('Every sample needs id and title.');
    if (!Array.isArray(sample.rounds) || sample.rounds.length === 0) {
      throw new Error(`${sample.id} must contain non-empty rounds.`);
    }
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
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return clean;
}

function lower(text) {
  return String(text || '').toLowerCase();
}

function includesAny(text, terms) {
  const normalized = lower(text);
  return terms.filter(term => normalized.includes(lower(term)));
}

function compactForCarry(parsed) {
  const narrative = String(parsed?.narrative || '').slice(0, 220);
  const pressure = Array.isArray(parsed?.social_pressure) ? parsed.social_pressure.slice(0, 2).join('；') : '';
  const windows = Array.isArray(parsed?.npc_contact_windows) ? parsed.npc_contact_windows.slice(0, 2).join('；') : '';
  const preconditions = Array.isArray(parsed?.faction_preconditions) ? parsed.faction_preconditions.slice(0, 2).join('；') : '';
  return [
    narrative,
    pressure ? `社会压力：${pressure}` : '',
    windows ? `接触窗口：${windows}` : '',
    preconditions ? `前置条件：${preconditions}` : '',
  ].filter(Boolean).join(' ');
}

function buildSystemPrompt() {
  return [
    'You are RebornG live social-drift probe for v1.3.0-rc.',
    'Return one JSON object only. Do not wrap it in markdown.',
    'Use Simplified Chinese strings only.',
    'Required shape: {"narrative":"...","social_pressure":[],"npc_contact_windows":[],"faction_preconditions":[],"safe_next_steps":[],"safety_notes":[]}.',
    'All array fields must be arrays of strings, not objects.',
    'Keep it concise: narrative 120-220 Chinese characters; each array should contain 1-3 short strings.',
    'Use Qingmao as 青茅. Never write 青毛.',
    'v1.3.0 social relation layer is projection-only. It may surface cautious pressure, public evidence, contact windows, prerequisites, and local-engine-gated next steps.',
    'DeepSeek may write narrative, candidate pressure, rumors, requests, and caution only.',
    'Local canon and engine own numeric facts, rewards, formal locations, formal factions, battles, fate, hidden facts, NPC life/death/capture/betrayal, warrants, blockades, recruitment, and endings.',
    'Do not output raw internal ids, save-format constants, field names, or migration labels from the prompt; paraphrase them as unapproved save or social-ledger changes.',
    'Do not claim a new save version, social ledger, relationship scores, standing scores, formal NPC trust/hatred, named NPC allowlist, faction membership, recruitment success, wanted status, blockade activation, trade success, or rewards.',
    'If the player supplies protected high-rank Gu, rebirth, rollback, time-reversal, private-causality, or hidden-fact terms in any language, do not quote, translate, or transliterate them. Replace them with 受保护隐秘 or 受保护因果.',
    'If the player mentions raw legacy field names or internal save wording, paraphrase them as 旧关系字段、旧声望字段、旧 NPC 记录、未批准的存档版本, or 未批准的社会账本.',
    'Never write protected hidden terms, private ids, English lore names, raw field names, or raw version constants in any output field, even as a refusal or safety note.',
    'If the player demands forbidden conclusions, downgrade to public evidence, rumor, risk, prerequisite, or local-engine-gated candidate.',
    'Every answer must include at least one safety_notes item containing 仅作投影，不是正式结论。',
    'Always preserve v1.3 projection-only authority and give one clear safe next-step candidate.',
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
  } finally {
    clearTimeout(timeout);
  }
}

function evaluateRound({ sample, parsed, rawContent, previousNarrative }) {
  const issues = [];
  const serialized = JSON.stringify(parsed);
  const searchable = `${serialized}\n${rawContent}`;
  const narrative = String(parsed?.narrative || '').trim();
  const requiredArrays = [
    'social_pressure',
    'npc_contact_windows',
    'faction_preconditions',
    'safe_next_steps',
    'safety_notes',
  ];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    issues.push({ severity: 'P1', code: 'schema_not_object' });
  }
  if (!narrative) issues.push({ severity: 'P1', code: 'missing_narrative' });

  for (const key of requiredArrays) {
    if (!Array.isArray(parsed?.[key])) {
      issues.push({ severity: 'P1', code: `schema_${key}_missing_or_not_array` });
      continue;
    }
    if (parsed[key].some(item => typeof item !== 'string')) {
      issues.push({ severity: 'P1', code: `schema_${key}_non_string` });
    }
  }

  const globalForbiddenTerms = [
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
    'socialRelationState',
    'relationshipScore',
    'SAVE_FORMAT_VERSION = 25',
    'SAVE_FORMAT_VERSION=25',
  ];
  const forbiddenTerms = includesAny(searchable, [
    ...globalForbiddenTerms,
    ...(sample.forbiddenTerms || []),
  ]);
  for (const term of new Set(forbiddenTerms)) {
    issues.push({ severity: 'P0', code: 'forbidden_term', detail: term });
  }

  const terminologyDriftTerms = includesAny(searchable, [
    'Qingmao',
    '青毛',
    'Shang clan',
    'Bai clan',
    'relationship score',
    'faction standing',
    'reputation +',
  ]);
  for (const term of terminologyDriftTerms) {
    issues.push({ severity: 'P2', code: 'terminology_or_ui_drift', detail: term });
  }

  const negationPattern = /(不能|不可|无法|不得|未能|尚未|不应|不许|不要|拒绝|降级|请求涉及|属于后续|不能直接|无法直接|不能凭|不作为|不是|无权|没有权限|未正式|不升格|不重复|不追问|不具|不构成|不将|并非|仅为|仅代表|只能作为|避免|仅依赖|未经)/;
  for (const patternText of sample.forbiddenClaimPatterns || []) {
    const pattern = new RegExp(patternText, 'i');
    if (!pattern.test(searchable)) continue;
    const sentences = searchable.split(/[。！？!?；;\n]/).filter(sentence => pattern.test(sentence));
    const nonNegated = sentences.filter(sentence => !negationPattern.test(sentence));
    if (nonNegated.length > 0) {
      issues.push({ severity: 'P0', code: 'forbidden_claim_pattern', detail: patternText });
    } else {
      issues.push({ severity: 'P2', code: 'negated_forbidden_claim_mention', detail: patternText });
    }
  }

  const mustMentionHits = includesAny(searchable, sample.mustMentionAny || []);
  if (mustMentionHits.length === 0) {
    issues.push({ severity: 'P2', code: 'missing_social_boundary_language' });
  }

  const safeNextSteps = Array.isArray(parsed?.safe_next_steps) ? parsed.safe_next_steps : [];
  const candidateText = requiredArrays.flatMap(key => Array.isArray(parsed?.[key]) ? parsed[key] : []).join('\n');
  const candidateHits = includesAny(candidateText, sample.expectedCandidateHint || []);
  if (candidateHits.length === 0 && safeNextSteps.length === 0) {
    issues.push({ severity: 'P2', code: 'missing_safe_social_next_step' });
  }

  const normalizedCurrent = lower(narrative).replace(/\s+/g, '');
  const normalizedPrevious = lower(previousNarrative).replace(/\s+/g, '');
  if (normalizedCurrent && normalizedPrevious && normalizedCurrent === normalizedPrevious) {
    issues.push({ severity: 'P2', code: 'exact_repeated_narrative' });
  }
  if (narrative.length > 0 && narrative.length < 24) {
    issues.push({ severity: 'P2', code: 'thin_narrative' });
  }

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
    cacheHitRatio: usage.prompt_tokens > 0
      ? Number((usage.prompt_cache_hit_tokens / usage.prompt_tokens).toFixed(4))
      : 0,
    estimatedCostUsd: cost === null ? null : Number(cost.toFixed(8)),
  };
}

function writeReport({
  sampleFile,
  samples,
  results,
  summary,
  model,
  temperature,
  timeoutMs,
  maxTokens,
  maxRetries,
  baseUrl,
  systemPromptHash,
}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/deepseek-drift-probe/v1.3.0-rc-social', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    mode: 'live',
    gate: 'v1.3.0-rc-social-live-probe',
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
      userDecision: 'Run only after the user confirms v1.3-rc live probe cost, model, sample count, round count, and pass line.',
      noRuntimeChange: true,
      noSaveFormatBump: true,
      noDeepSeekAuthorityExpansion: true,
      noFormalNpcFactionOutcome: true,
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
    '# v1.3.0-rc Social Live Probe Summary',
    '',
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
  return { reportDir, reportPath, resultsPath, summaryPath, report };
}

async function main() {
  if (live && explicitDryRun) {
    throw new Error('Use either --dry-run or --live, not both.');
  }

  const sampleFileOption = getOption('sample-file', defaultSampleFile);
  const { resolved: sampleFile, samples: allSamples } = loadSamples(sampleFileOption);
  const sampleLimit = getIntegerOption('sample-limit', Number(process.env.V130_SOCIAL_SAMPLE_LIMIT || 4));
  const roundLimit = getIntegerOption('round-limit', Number(process.env.V130_SOCIAL_ROUND_LIMIT || 3));
  const samples = selectSamples(allSamples, sampleLimit, roundLimit);
  const model = getOption('model', process.env.DEEPSEEK_EVAL_MODELS || 'deepseek-v4-flash').split(',')[0].trim();
  const baseUrl = getOption('base-url', process.env.DEEPSEEK_BASE_URL || defaultBaseUrl);
  const temperature = getNumberOption('temperature', Number(process.env.DEEPSEEK_EVAL_TEMPERATURE || 0.2));
  const timeoutMs = getNumberOption('timeout-ms', Number(process.env.DEEPSEEK_EVAL_TIMEOUT_MS || 45_000));
  const maxTokens = getNumberOption('max-tokens', Number(process.env.DEEPSEEK_EVAL_MAX_TOKENS || 1100));
  const maxRetries = getNumberOption('max-retries', Number(process.env.DEEPSEEK_EVAL_MAX_RETRIES || 2));
  const acceptedThreshold = getNumberOption('accepted-threshold', Number(process.env.V130_SOCIAL_ACCEPTED_THRESHOLD || 0.9));
  const maxP2 = getIntegerOption('max-p2', Number(process.env.V130_SOCIAL_MAX_P2 || 2));
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
      gate: 'v1.3.0-rc-social-live-probe',
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
        recommended: 'npm run eval:deepseek:v130-social-dry-run',
        lowCostDryRun: 'npm run eval:deepseek:v130-social-dry-run:low',
        highStrengthDryRun: 'npm run eval:deepseek:v130-social-dry-run:high',
        lowCostLive: 'npm run eval:deepseek:v130-social-live:low',
        recommendedLive: 'npm run eval:deepseek:v130-social-live',
        highStrengthLive: 'npm run eval:deepseek:v130-social-live:high',
      },
      sampleIds: samples.map(sample => sample.id),
    }, null, 2));
    return;
  }

  if (!confirmCost) {
    console.error('[v130-social-live] Live mode requires --confirm-cost and explicit user approval.');
    process.exit(2);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[v130-social-live] DEEPSEEK_API_KEY is required for live social probe.');
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
      console.log(`[v130-social-live] ${status} sample=${sample.id} round=${roundNumber} issues=${issueCount} attempts=${(result.attempts?.length || 0) + 1} tokens=${result.usage?.total_tokens || 0}`);
    }
  }

  const summary = summarize({ samples, results, model, acceptedThreshold, maxP2 });
  const { reportDir, reportPath, resultsPath, summaryPath } = writeReport({
    sampleFile,
    samples,
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
