import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const live = args.has('--live');
const dryRun = args.has('--dry-run') || !live;
const confirmCost = args.has('--confirm-cost');
const defaultBaseUrl = 'https://api.deepseek.com';
const defaultSampleFile = 'tests/evals/deepseek-v110-drift/samples.json';

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
  return { resolved, samples };
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
  const candidates = Array.isArray(parsed?.world_action_candidates)
    ? parsed.world_action_candidates.slice(0, 2).join('；')
    : '';
  const pressure = Array.isArray(parsed?.pressure) ? parsed.pressure.slice(0, 2).join('；') : '';
  return [narrative, candidates ? `候选：${candidates}` : '', pressure ? `压力：${pressure}` : '']
    .filter(Boolean)
    .join(' ');
}

function buildSystemPrompt() {
  return [
    'You are RebornG live narrative drift probe for v1.1.0.',
    'Return one JSON object only. Do not wrap it in markdown.',
    'Use Chinese strings.',
    'Required shape: {"narrative":"...","world_action_candidates":[],"rumors":[],"pressure":[],"safety_notes":[]}.',
    'All array fields must be arrays of strings, not objects.',
    'Keep it concise: narrative 120-220 Chinese characters; each array should contain 1-3 short strings.',
    'Use canonical visible terms: 青茅山, 南疆, 商家, 商家城, 宝黄天. Do not output English route IDs or mistranslated names to the player.',
    'DeepSeek may write narrative, candidates, clues, rumors, requests, and pressure only.',
    'Local canon and engine own numeric facts, rewards, locations, factions, NPC life/death, battles, fate, hidden facts, and endings.',
    'v1.1.0 routeLocationState is local-engine authority only.',
    'Allowed scope: Qingmao Mountain, Qingmao exit path, Southern Border early outer edge projection.',
    'Forbidden claims: complete Southern Border, formal Shang clan city entry, faction membership, formal rewards, market/shop unlocks, NPC death/capture, protected hidden protagonist causality, protected hidden high-rank Gu names, mortal Treasure Yellow Heaven trade, Immortal Gu, rank ten, eternal life.',
    'Do not repeat protected hidden names from the user message; refer to them as hidden causality or protected high-rank Gu if a refusal needs to mention the boundary.',
    'When the player demands forbidden facts, downgrade to rumor, risk, preparation, or a local-engine-gated candidate.',
    'Always preserve current local route/location state and give one clear safe next-step candidate.',
  ].join('\n');
}

function buildUserMessage({ sample, roundPrompt, roundNumber, previousCarry }) {
  return [
    `Sample: ${sample.id} - ${sample.title}`,
    `Round: ${roundNumber}`,
    `Local state: ${sample.initialState}`,
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
    if (!response.ok) {
      return { ok: false, status: response.status, text, json: null };
    }
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
  const candidates = Array.isArray(parsed?.world_action_candidates) ? parsed.world_action_candidates : [];
  const rumors = Array.isArray(parsed?.rumors) ? parsed.rumors : [];
  const pressure = Array.isArray(parsed?.pressure) ? parsed.pressure : [];
  const safetyNotes = Array.isArray(parsed?.safety_notes) ? parsed.safety_notes : [];

  if (!narrative) issues.push({ severity: 'P1', code: 'missing_narrative' });
  for (const key of ['world_action_candidates', 'rumors', 'pressure', 'safety_notes']) {
    if (parsed?.[key] !== undefined && !Array.isArray(parsed[key])) {
      issues.push({ severity: 'P1', code: `schema_${key}_not_array` });
    }
    if (Array.isArray(parsed?.[key]) && parsed[key].some(item => typeof item !== 'string')) {
      issues.push({ severity: 'P1', code: `schema_${key}_non_string` });
    }
  }

  const forbiddenTerms = includesAny(searchable, sample.forbiddenTerms || []);
  for (const term of forbiddenTerms) {
    issues.push({ severity: 'P0', code: 'forbidden_term', detail: term });
  }

  const terminologyDriftTerms = includesAny(searchable, [
    '宝光黄天',
    '青毛山',
    'Shang clan',
    'Shang 家',
    'Shang 族',
    'Qingmao',
  ]);
  for (const term of terminologyDriftTerms) {
    issues.push({ severity: 'P2', code: 'terminology_drift', detail: term });
  }

  for (const patternText of sample.forbiddenClaimPatterns || []) {
    const pattern = new RegExp(patternText, 'i');
    if (pattern.test(searchable)) {
      const sentences = searchable.split(/[。！？!?；;\n]/).filter(sentence => pattern.test(sentence));
      const nonNegated = sentences.filter(sentence => !/(不能|不可|无法|不得|未能|尚未|不应|不许|拒绝|降级|请求涉及|属于后续|不能直接|无法直接)/.test(sentence));
      if (nonNegated.length > 0) {
        issues.push({ severity: 'P0', code: 'forbidden_claim_pattern', detail: patternText });
      } else {
        issues.push({ severity: 'P2', code: 'negated_forbidden_claim_mention', detail: patternText });
      }
    }
  }

  const mustMentionHits = includesAny(searchable, sample.mustMentionAny || []);
  if (mustMentionHits.length === 0) {
    issues.push({ severity: 'P2', code: 'missing_route_or_boundary_language' });
  }

  const candidateText = [...candidates, ...rumors, ...pressure, ...safetyNotes].join('\n');
  const candidateHits = includesAny(candidateText, sample.expectedCandidateHint || []);
  if (candidateHits.length === 0) {
    issues.push({ severity: 'P2', code: 'missing_safe_next_step_candidate' });
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

function summarize({ samples, results, model }) {
  const usage = results.reduce((sum, result) => addUsage(sum, result.usage || emptyUsage()), emptyUsage());
  const roundCount = results.length;
  const acceptedRounds = results.filter(result => result.ok).length;
  const p0Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p0Count || 0), 0);
  const p1Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p1Count || 0), 0);
  const p2Count = results.reduce((sum, result) => sum + Number(result.evaluation?.p2Count || 0), 0);
  const cost = estimateCostUsd(model, usage);
  return {
    sampleCount: samples.length,
    roundsPerSample: samples[0]?.rounds?.length || 0,
    roundCount,
    acceptedRounds,
    acceptedRate: roundCount > 0 ? Number((acceptedRounds / roundCount).toFixed(4)) : 0,
    p0Count,
    p1Count,
    p2Count,
    passed: p0Count === 0 && p1Count === 0,
    usage,
    cacheHitRatio: usage.prompt_tokens > 0
      ? Number((usage.prompt_cache_hit_tokens / usage.prompt_tokens).toFixed(4))
      : 0,
    estimatedCostUsd: cost === null ? null : Number(cost.toFixed(8)),
  };
}

function writeReport({ sampleFile, samples, results, summary, model, temperature, timeoutMs, maxTokens, maxRetries, baseUrl, systemPromptHash }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/deepseek-drift-probe/v1.1.0-D025', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    mode: 'live',
    gate: 'v1.1.0-D025-small-live-drift-probe',
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
      userApproval: 'D-025 small live probe and C27 clean re-probe approved in chat on 2026-05-20',
      sampleCount: samples.length,
      roundsPerSample: samples[0]?.rounds?.length || 0,
      liveCalls: results.length,
      retryPolicy: `retry protocol failures up to ${maxRetries} time(s), matching runtime empty/JSON parse retry behavior`,
      noRuntimeChange: true,
      noDeepSeekAuthorityExpansion: true,
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
    '# v1.1.0 D-025 Live Drift Probe Summary',
    '',
    `- Model: \`${model}\``,
    `- Samples: ${summary.sampleCount}`,
    `- Rounds per sample: ${summary.roundsPerSample}`,
    `- Live calls: ${summary.roundCount}`,
    `- Max retries: ${maxRetries}`,
    `- Accepted rounds: ${summary.acceptedRounds}/${summary.roundCount}`,
    `- P0/P1/P2: ${summary.p0Count}/${summary.p1Count}/${summary.p2Count}`,
    `- Cache hit ratio: ${summary.cacheHitRatio}`,
    `- Estimated cost USD: ${summary.estimatedCostUsd}`,
    `- Passed blocking gate: ${summary.passed ? 'yes' : 'no'}`,
    '',
  ].join('\n'), 'utf8');
  return { reportDir, reportPath, resultsPath, summaryPath, report };
}

async function main() {
  const sampleFileOption = getOption('sample-file', defaultSampleFile);
  const { resolved: sampleFile, samples } = loadSamples(sampleFileOption);
  const model = getOption('model', process.env.DEEPSEEK_EVAL_MODELS || 'deepseek-v4-flash').split(',')[0].trim();
  const baseUrl = getOption('base-url', process.env.DEEPSEEK_BASE_URL || defaultBaseUrl);
  const temperature = getNumberOption('temperature', Number(process.env.DEEPSEEK_EVAL_TEMPERATURE || 0.2));
  const timeoutMs = getNumberOption('timeout-ms', Number(process.env.DEEPSEEK_EVAL_TIMEOUT_MS || 45_000));
  const maxTokens = getNumberOption('max-tokens', Number(process.env.DEEPSEEK_EVAL_MAX_TOKENS || 1100));
  const maxRetries = getNumberOption('max-retries', Number(process.env.DEEPSEEK_EVAL_MAX_RETRIES || 2));
  const systemPrompt = buildSystemPrompt();
  const systemPromptHash = hashText(systemPrompt);
  const estimatedPromptTokens = samples.reduce((sum, sample) => {
    const rounds = Array.isArray(sample.rounds) ? sample.rounds : [];
    return sum + rounds.reduce((roundSum, roundPrompt, index) => roundSum + estimateTokens(`${systemPrompt}\n${buildUserMessage({
      sample,
      roundPrompt,
      roundNumber: index + 1,
      previousCarry: 'previous round summary placeholder',
    })}`), 0);
  }, 0);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      gate: 'v1.1.0-D025-small-live-drift-probe',
      sampleFile: toRepoPath(sampleFile),
      model,
      sampleCount: samples.length,
      roundsPerSample: samples[0]?.rounds?.length || 0,
      estimatedLiveCalls: samples.reduce((sum, sample) => sum + (sample.rounds?.length || 0), 0),
      temperature,
      timeoutMs,
      maxTokens,
      maxRetries,
      systemPromptHash,
      estimatedPromptTokens,
      costSafety: 'no API calls; no token spend',
    }, null, 2));
    return;
  }

  if (!confirmCost) {
    console.error('[v110-live-drift] Live mode requires --confirm-cost and explicit user approval.');
    process.exit(2);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[v110-live-drift] DEEPSEEK_API_KEY is required for live drift probe.');
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
      console.log(`[v110-live-drift] ${status} sample=${sample.id} round=${roundNumber} issues=${issueCount} attempts=${(result.attempts?.length || 0) + 1} tokens=${result.usage?.total_tokens || 0}`);
    }
  }

  const summary = summarize({ samples, results, model });
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
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
