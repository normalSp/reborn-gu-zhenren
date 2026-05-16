import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const live = args.has('--live');
const replay = rawArgs.some(arg => arg === '--replay-results' || arg.startsWith('--replay-results='));
const confirmCost = args.has('--confirm-cost');
const dryRun = args.has('--dry-run') || (!live && !replay);
const samplePath = resolve(rootDir, 'tests/evals/deepseek-v090/samples.jsonl');
const defaultBaseUrl = 'https://api.deepseek.com';
const evaluationGateVersion = 'v090-human-review-20260513';

const requiredFields = [
  'id',
  'category',
  'mode',
  'systemPromptProfile',
  'stateFixture',
  'userPrompt',
  'mustContain',
  'mustNotContainFacts',
  'expectedStateUpdateDomains',
  'loreRisk',
];

const systemPromptProfiles = {
  'v090-runtime-json': [
    'You are RebornG runtime narrative model.',
    'Return one JSON object only. Do not wrap it in markdown.',
    'Example json shape: {"narrative":"...","world_action_candidates":[],"combat_event_candidates":[],"rumors":[],"pressure":[],"safety_notes":[]}.',
    'Use exactly these top-level keys when possible: narrative, world_action_candidates, combat_event_candidates, rumors, pressure, safety_notes.',
    'narrative must be a non-empty string. All candidate, rumor, pressure, and safety note fields must be arrays of strings only; do not output numbers or nested objects in those arrays.',
    'DeepSeek may write narrative, candidates, clues, rumors, requests, and pressure.',
    'Local canon and engine own AP, numeric facts, rewards, locations, battles, fate, and endings.',
    'Use Reverend Insanity vocabulary: Gu Master, primeval essence, primeval stones, Gu materials, Gu, mortal Gu, Immortal Gu.',
    'Gu Immortals are called Gu Immortals, not immortal Gu Masters.',
    'Primeval essence is stored in the aperture; primeval stones are currency/resources and are not stored in or drained from the aperture.',
    'Avoid generic cultivation wording such as qi, spiritual energy, spirit stones, or generic immortal-treasure rewards unless the fixture explicitly supplies them.',
    'Never output the standalone English word qi in RebornG eval responses; use primeval essence, atmosphere pressure, earth vein pressure, or local danger instead.',
    'For mortal Gu Master calamity pressure, use calamity omen, disaster pressure, or local danger. Do not call it Heavenly Tribulation unless the fixture explicitly says immortal ascension context.',
    'Do not invent numeric costs, AP cycle counts, percentages, ranks, or resource outputs; describe pressure and candidate preparation qualitatively unless the fixture explicitly provides the number.',
    'Treasure Yellow Heaven is Gu Immortal-level trade. Mortal characters may hear rumors but cannot find a formal access path or trade there.',
    'Do not offer actions to find a mortal path or mortal access to Treasure Yellow Heaven; offer local rumor checking, cultivation, or mortal-market alternatives instead.',
    'If a land spirit or blessed land appears, do not state a rank five owner as fact; keep the owner Gu Immortal-level or unconfirmed unless the fixture explicitly says otherwise.',
    'Never grant Immortal Gu, rank ten, eternal life, Fate Gu ownership, mortal Treasure Yellow Heaven trade, or unregistered rewards.',
  ].join('\n'),
};

const pricingUsdPerMillionTokens = {
  'deepseek-v4-flash': {
    cacheHitInput: 0.0028,
    cacheMissInput: 0.14,
    output: 0.28,
    source: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
  'deepseek-v4-pro': {
    cacheHitInput: 0.003625,
    cacheMissInput: 0.435,
    output: 0.87,
    source: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
};

const aliasPricingModel = {
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-reasoner': 'deepseek-v4-flash',
};

const vocabularyFlagPatterns = [
  { label: 'generic qi', pattern: /\bqi\b/i },
  { label: 'spiritual energy', pattern: /spiritual energy/i },
  { label: 'spirit stones', pattern: /spirit stones/i },
  { label: 'generic immortal treasure', pattern: /immortal treasure/i },
  { label: 'heavenly tribulation for mortal context', pattern: /heavenly tribulation/i },
  { label: 'primeval stones used as aperture energy', pattern: /primeval stones?.{0,80}aperture|aperture.{0,80}primeval stones?/i },
  { label: 'primeval stones refined as raw essence', pattern: /\brefin(?:e|ed|ing)\s+(?:a\s+batch\s+of\s+)?primeval stones?\b/i },
  { label: 'Gu Immortal called immortal Gu Master', pattern: /immortal Gu Masters?/i },
  { label: 'mortal Treasure Yellow Heaven access drift', pattern: /mortal(?:'s)?\s+(?:way|path|access).{0,120}Treasure Yellow Heaven|Treasure Yellow Heaven.{0,120}mortal(?:'s)?\s+(?:way|path|access)/i },
  { label: 'land spirit tied to rank five owner', pattern: /land spirit[\s\S]{0,500}rank five Gu Master|rank five Gu Master[\s\S]{0,500}land spirit/i },
  { label: 'model leaked numeric runtime cost', pattern: /\b(?:using|costing|costs?|spend|spent|within|at least)\s+\d+\s*(?:AP|AP cycles?|primeval stones?|primeval essence|%)/i },
];

const looseJsonObjectSchema = z
  .object({})
  .catchall(z.unknown())
  .refine(value => Object.keys(value).length > 0, 'response object must not be empty');

const stringListSchema = z.array(z.string().min(1));

const evalResponseSchema = z.object({
  narrative: z.string().trim().min(1),
  world_action_candidates: stringListSchema.optional(),
  combat_event_candidates: stringListSchema.optional(),
  rumors: stringListSchema.optional(),
  pressure: stringListSchema.optional(),
  safety_notes: stringListSchema.optional(),
}).passthrough();

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

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function toRepoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

function hashPromptPrefix(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function estimateTokens(text) {
  return Math.ceil(text.length * 0.4);
}

function parseSamples() {
  const raw = readFileSync(samplePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      }
    });
}

function validateSample(sample) {
  const missing = requiredFields.filter(field => !(field in sample));
  if (missing.length > 0) {
    return [`${sample.id || '<unknown>'} missing fields: ${missing.join(', ')}`];
  }

  const errors = [];
  if (!Array.isArray(sample.mustContain)) errors.push(`${sample.id} mustContain must be an array`);
  if (!Array.isArray(sample.mustNotContainFacts)) errors.push(`${sample.id} mustNotContainFacts must be an array`);
  if (!Array.isArray(sample.expectedStateUpdateDomains)) errors.push(`${sample.id} expectedStateUpdateDomains must be an array`);
  if (!systemPromptProfiles[sample.systemPromptProfile]) errors.push(`${sample.id} unknown systemPromptProfile ${sample.systemPromptProfile}`);
  if (sample.stateFixture.length > 1500 || sample.userPrompt.length > 1500) errors.push(`${sample.id} prompt fields are too long for seed eval`);
  if (sample.loreRisk === 'critical' && sample.mustNotContainFacts.length < 2) errors.push(`${sample.id} critical lore risk needs explicit forbidden facts`);
  return errors;
}

function selectSamples(samples) {
  const sampleIds = splitCsv(getOption('sample-ids', ''));
  let selected = samples;
  if (sampleIds.length > 0) {
    const idSet = new Set(sampleIds);
    selected = samples.filter(sample => idSet.has(sample.id));
  }

  const sampleLimit = getNumberOption('sample-limit', undefined);
  if (sampleLimit !== undefined) {
    selected = selected.slice(0, sampleLimit);
  }
  return selected;
}

function getModels() {
  const explicitModels = getOption('models', process.env.DEEPSEEK_EVAL_MODELS);
  const models = splitCsv(explicitModels || 'deepseek-v4-flash,deepseek-v4-pro');
  return [...new Set(models)];
}

function buildUserMessage(sample) {
  return [
    `Sample id: ${sample.id}`,
    `Category: ${sample.category}`,
    `Mode: ${sample.mode}`,
    `State fixture: ${sample.stateFixture}`,
    `User request: ${sample.userPrompt}`,
    `Expected state_update domains: ${sample.expectedStateUpdateDomains.join(', ') || 'none'}`,
    `Do not create these as facts: ${sample.mustNotContainFacts.join(', ') || 'none'}`,
    'Return json only.',
  ].join('\n');
}

function completionUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
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

function cleanJsonContent(content) {
  let clean = String(content || '').trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return clean;
}

function parseModelContent(content) {
  const cleanContent = cleanJsonContent(content);
  return {
    cleanContent,
    parsed: JSON.parse(cleanContent),
  };
}

function includesTerm(haystack, term) {
  return haystack.toLowerCase().includes(String(term).toLowerCase());
}

function stripNonFactFields(value) {
  if (Array.isArray(value)) return value.map(item => stripNonFactFields(item));
  if (!value || typeof value !== 'object') return value;

  const result = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/safety|warning|boundary|note|rumor|narrative|pressure/i.test(key)) continue;
    result[key] = stripNonFactFields(nestedValue);
  }
  return result;
}

function evaluateParsedResponse(sample, parsed, cleanContent) {
  const serialized = JSON.stringify(parsed);
  const factSerialized = JSON.stringify(stripNonFactFields(parsed));
  const searchable = `${serialized}\n${cleanContent}`;
  const looseSchemaResult = looseJsonObjectSchema.safeParse(parsed);
  const evalSchemaResult = evalResponseSchema.safeParse(parsed);
  const zodPass = looseSchemaResult.success && evalSchemaResult.success;
  const schemaIssues = [
    ...(looseSchemaResult.success ? [] : looseSchemaResult.error.issues),
    ...(evalSchemaResult.success ? [] : evalSchemaResult.error.issues),
  ].map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`);
  const forbiddenMatches = sample.mustNotContainFacts.filter(term => includesTerm(factSerialized, term));
  const missingMustContain = sample.mustContain.filter(term => {
    if (String(term).toLowerCase() === 'json') return false;
    return !includesTerm(searchable, term);
  });
  const expectedDomainsFound = sample.expectedStateUpdateDomains.filter(domain => (
    Object.prototype.hasOwnProperty.call(parsed, domain) && hasMeaningfulDomainValue(parsed[domain])
  ));
  const qualityFlags = vocabularyFlagPatterns
    .filter(({ pattern }) => pattern.test(searchable))
    .map(({ label }) => label);
  const domainPass = sample.expectedStateUpdateDomains.length === 0 || expectedDomainsFound.length > 0;
  const loreCriticalFlag = forbiddenMatches.length > 0 && sample.loreRisk === 'critical';

  return {
    jsonParsePass: true,
    zodPass,
    mustContainPass: missingMustContain.length === 0,
    domainPass,
    boundaryPass: forbiddenMatches.length === 0,
    accepted: zodPass && domainPass && forbiddenMatches.length === 0 && qualityFlags.length === 0,
    schemaIssues,
    missingMustContain,
    expectedDomainsFound,
    forbiddenMatches,
    qualityFlags,
    loreCriticalFlag,
  };
}

function hasMeaningfulDomainValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function evaluateFailedResponse(sample, reason) {
  return {
    jsonParsePass: false,
    zodPass: false,
    mustContainPass: false,
    domainPass: false,
    boundaryPass: false,
    accepted: false,
    schemaIssues: [reason],
    missingMustContain: sample.mustContain,
    expectedDomainsFound: [],
    forbiddenMatches: [],
    qualityFlags: [],
    loreCriticalFlag: sample.loreRisk === 'critical',
    failureReason: reason,
  };
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
      return {
        ok: false,
        status: response.status,
        text,
        usage: emptyUsage(),
      };
    }
    return {
      ok: true,
      status: response.status,
      json: JSON.parse(text),
      text,
      usage: emptyUsage(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function evalSampleLive({ sample, model, apiKey, baseUrl, temperature, maxRetries, timeoutMs, maxTokens }) {
  const systemPrompt = systemPromptProfiles[sample.systemPromptProfile];
  const baseUserMessage = buildUserMessage(sample);
  const promptPrefixHash = hashPromptPrefix(systemPrompt);
  const attempts = [];
  let lastFailureReason = 'not attempted';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const userMessage = attempt === 0
      ? baseUserMessage
      : `${baseUserMessage}\n\nRepair attempt ${attempt}: previous response was invalid or failed policy checks. Return one valid json object only and obey all forbidden-fact boundaries.`;
    const startedAt = Date.now();
    try {
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
      const response = await postDeepSeek({ apiKey, baseUrl, body, timeoutMs });
      const elapsedMs = Date.now() - startedAt;

      if (!response.ok) {
        lastFailureReason = `HTTP ${response.status}: ${String(response.text || '').slice(0, 300)}`;
        attempts.push({
          attempt,
          ok: false,
          elapsedMs,
          usage: response.usage,
          failureReason: lastFailureReason,
        });
        continue;
      }

      const usage = normalizeUsage(response.json?.usage);
      const rawContent = response.json?.choices?.[0]?.message?.content || '';
      if (!rawContent.trim()) {
        lastFailureReason = 'empty response content';
        attempts.push({
          attempt,
          ok: false,
          elapsedMs,
          usage,
          failureReason: lastFailureReason,
        });
        continue;
      }

      try {
        const { cleanContent, parsed } = parseModelContent(rawContent);
        const evaluation = evaluateParsedResponse(sample, parsed, cleanContent);
        attempts.push({
          attempt,
          ok: evaluation.accepted,
          elapsedMs,
          usage,
          rawContentHash: sha256(rawContent),
          cleanContent,
          parsed,
          evaluation,
        });
        if (evaluation.accepted) {
          return buildLiveSampleResult({ sample, model, promptPrefixHash, attempts, success: true });
        }
        lastFailureReason = [
          evaluation.boundaryPass ? null : `forbidden matches: ${evaluation.forbiddenMatches.join(', ')}`,
          evaluation.mustContainPass ? null : `missing terms: ${evaluation.missingMustContain.join(', ')}`,
          evaluation.domainPass ? null : 'missing expected domain',
          evaluation.zodPass ? null : `schema check failed: ${evaluation.schemaIssues.join('; ')}`,
          evaluation.qualityFlags.length === 0 ? null : `quality flags: ${evaluation.qualityFlags.join(', ')}`,
        ].filter(Boolean).join('; ');
      } catch (error) {
        lastFailureReason = `JSON parse failed: ${error.message}`;
        attempts.push({
          attempt,
          ok: false,
          elapsedMs,
          usage,
          rawContentHash: sha256(rawContent),
          cleanContent: cleanJsonContent(rawContent),
          evaluation: evaluateFailedResponse(sample, lastFailureReason),
          failureReason: lastFailureReason,
        });
      }
    } catch (error) {
      lastFailureReason = error?.name === 'AbortError'
        ? `timeout after ${timeoutMs}ms`
        : (error?.message || 'unknown error');
      attempts.push({
        attempt,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        usage: emptyUsage(),
        failureReason: lastFailureReason,
      });
    }
  }

  return buildLiveSampleResult({ sample, model, promptPrefixHash, attempts, success: false, failureReason: lastFailureReason });
}

function buildLiveSampleResult({ sample, model, promptPrefixHash, attempts, success, failureReason = undefined }) {
  const usage = attempts.reduce((sum, attempt) => addUsage(sum, normalizeUsage(attempt.usage)), emptyUsage());
  const retryUsage = attempts
    .filter(attempt => attempt.attempt > 0)
    .reduce((sum, attempt) => addUsage(sum, normalizeUsage(attempt.usage)), emptyUsage());
  const lastAttempt = attempts[attempts.length - 1] || {};
  const evaluation = lastAttempt.evaluation || evaluateFailedResponse(sample, failureReason || 'no accepted response');

  return {
    sampleId: sample.id,
    category: sample.category,
    mode: sample.mode,
    loreRisk: sample.loreRisk,
    model,
    success,
    failureReason: success ? undefined : (failureReason || evaluation.failureReason || 'response failed eval checks'),
    promptPrefixHash,
    attempts: attempts.length,
    retries: Math.max(attempts.length - 1, 0),
    elapsedMs: attempts.reduce((sum, attempt) => sum + Number(attempt.elapsedMs || 0), 0),
    usage,
    retryUsage,
    evaluation: {
      jsonParsePass: evaluation.jsonParsePass,
      zodPass: evaluation.zodPass,
      mustContainPass: evaluation.mustContainPass,
      domainPass: evaluation.domainPass,
      boundaryPass: evaluation.boundaryPass,
      accepted: evaluation.accepted,
      schemaIssues: evaluation.schemaIssues,
      missingMustContain: evaluation.missingMustContain,
      expectedDomainsFound: evaluation.expectedDomainsFound,
      forbiddenMatches: evaluation.forbiddenMatches,
      qualityFlags: evaluation.qualityFlags,
      loreCriticalFlag: evaluation.loreCriticalFlag,
    },
    response: lastAttempt.cleanContent
      ? {
          rawContentHash: lastAttempt.rawContentHash,
      cleanContent: lastAttempt.cleanContent,
      parsed: lastAttempt.parsed,
    }
      : undefined,
  };
}

function failureReasonFromEvaluation(evaluation) {
  return [
    evaluation.boundaryPass ? null : `forbidden matches: ${evaluation.forbiddenMatches.join(', ')}`,
    evaluation.mustContainPass ? null : `missing terms: ${evaluation.missingMustContain.join(', ')}`,
    evaluation.domainPass ? null : 'missing expected domain',
    evaluation.zodPass ? null : `schema check failed: ${evaluation.schemaIssues.join('; ')}`,
    evaluation.qualityFlags.length === 0 ? null : `quality flags: ${evaluation.qualityFlags.join(', ')}`,
  ].filter(Boolean).join('; ') || undefined;
}

function replayExistingResult({ row, sample, sourceResultsPath }) {
  const cleanContent = row.response?.cleanContent
    || (row.response?.parsed ? JSON.stringify(row.response.parsed) : '');

  if (!cleanContent) {
    const evaluation = evaluateFailedResponse(sample, 'replay row has no response content');
    return {
      ...row,
      success: false,
      failureReason: failureReasonFromEvaluation(evaluation),
      replayedFrom: toRepoPath(sourceResultsPath),
      evaluation,
    };
  }

  try {
    const parsed = row.response?.parsed ?? JSON.parse(cleanContent);
    const evaluation = evaluateParsedResponse(sample, parsed, cleanContent);
    return {
      ...row,
      success: evaluation.accepted,
      failureReason: evaluation.accepted ? undefined : failureReasonFromEvaluation(evaluation),
      replayedFrom: toRepoPath(sourceResultsPath),
      evaluation,
      response: {
        ...row.response,
        cleanContent,
        parsed,
      },
    };
  } catch (error) {
    const evaluation = evaluateFailedResponse(sample, `replay JSON parse failed: ${error.message}`);
    return {
      ...row,
      success: false,
      failureReason: failureReasonFromEvaluation(evaluation),
      replayedFrom: toRepoPath(sourceResultsPath),
      evaluation,
    };
  }
}

function pricingForModel(model) {
  const pricingModel = aliasPricingModel[model] || model;
  return pricingUsdPerMillionTokens[pricingModel];
}

function estimateCostUsd(model, usage) {
  const pricing = pricingForModel(model);
  if (!pricing) return null;
  return (
    (usage.prompt_cache_hit_tokens / 1_000_000) * pricing.cacheHitInput +
    (usage.prompt_cache_miss_tokens / 1_000_000) * pricing.cacheMissInput +
    (usage.completion_tokens / 1_000_000) * pricing.output
  );
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function summarizeModel(model, results) {
  const modelResults = results.filter(result => result.model === model);
  const usage = modelResults.reduce((sum, result) => addUsage(sum, result.usage), emptyUsage());
  const retryUsage = modelResults.reduce((sum, result) => addUsage(sum, result.retryUsage), emptyUsage());
  const count = modelResults.length;
  const successCount = modelResults.filter(result => result.success).length;
  const acceptedCount = modelResults.filter(result => result.evaluation.accepted).length;
  const jsonPassCount = modelResults.filter(result => result.evaluation.jsonParsePass).length;
  const zodPassCount = modelResults.filter(result => result.evaluation.zodPass).length;
  const boundaryPassCount = modelResults.filter(result => result.evaluation.boundaryPass).length;
  const domainPassCount = modelResults.filter(result => result.evaluation.domainPass).length;
  const mustContainPassCount = modelResults.filter(result => result.evaluation.mustContainPass).length;
  const criticalFlags = modelResults.filter(result => result.evaluation.loreCriticalFlag).length;
  const qualityFlags = modelResults.filter(result => result.evaluation.qualityFlags.length > 0).length;
  const retries = modelResults.reduce((sum, result) => sum + result.retries, 0);
  const elapsedMs = modelResults.reduce((sum, result) => sum + result.elapsedMs, 0);
  const costUsd = estimateCostUsd(model, usage);

  return {
    model,
    sampleCount: count,
    successCount,
    acceptedRate: percent(acceptedCount, count),
    jsonParseRate: percent(jsonPassCount, count),
    zodObjectRate: percent(zodPassCount, count),
    schemaPassRate: percent(zodPassCount, count),
    boundaryPassRate: percent(boundaryPassCount, count),
    expectedDomainPassRate: percent(domainPassCount, count),
    mustContainPassRate: percent(mustContainPassCount, count),
    criticalLoreFlagRate: percent(criticalFlags, count),
    qualityFlagRate: percent(qualityFlags, count),
    retryRate: percent(retries, count),
    retries,
    usage,
    retryUsage,
    cacheHitRatio: usage.prompt_tokens > 0
      ? Number((usage.prompt_cache_hit_tokens / usage.prompt_tokens).toFixed(4))
      : 0,
    elapsedMs,
    averageElapsedMs: count > 0 ? Math.round(elapsedMs / count) : 0,
    estimatedCostUsd: costUsd === null ? null : Number(costUsd.toFixed(8)),
  };
}

function buildDryRunReport({ samples, selectedSamples, models, temperature, maxRetries, timeoutMs, maxTokens }) {
  const byCategory = new Map();
  const byProfile = new Map();
  let estimatedPromptTokens = 0;

  for (const sample of selectedSamples) {
    byCategory.set(sample.category, (byCategory.get(sample.category) || 0) + 1);
    const systemPrompt = systemPromptProfiles[sample.systemPromptProfile];
    const prefixHash = hashPromptPrefix(systemPrompt);
    byProfile.set(sample.systemPromptProfile, prefixHash);
    estimatedPromptTokens += estimateTokens(`${systemPrompt}\n${buildUserMessage(sample)}`);
  }

  return {
    mode: 'dry-run',
    sampleFile: samplePath,
    sampleCount: selectedSamples.length,
    totalAvailableSamples: samples.length,
    categories: Object.fromEntries([...byCategory.entries()].sort()),
    promptProfiles: Object.fromEntries([...byProfile.entries()].sort()),
    models,
    temperature,
    maxRetries,
    timeoutMs,
    maxTokens,
    estimatedPromptTokens,
    estimatedMaxLiveCalls: selectedSamples.length * models.length * (maxRetries + 1),
    liveCalls: 0,
    costSafety: 'no API calls; no token spend',
    nextGate: 'run live eval with --live --confirm-cost when API key is available',
  };
}

function writeReports({
  mode,
  results,
  summaries,
  selectedSamples,
  models,
  temperature,
  maxRetries,
  timeoutMs,
  maxTokens,
  baseUrl,
  sourceResultsPath = undefined,
}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/deepseek-eval', stamp);
  mkdirSync(reportDir, { recursive: true });

  const report = {
    mode,
    createdAt: new Date().toISOString(),
    sampleFile: toRepoPath(samplePath),
    sourceResultsFile: sourceResultsPath ? toRepoPath(sourceResultsPath) : undefined,
    sampleCount: selectedSamples.length,
    models,
    baseUrl,
    temperature,
    maxRetries,
    timeoutMs,
    maxTokens,
    evaluationGateVersion,
    officialDocsCheckedAt: '2026-05-13',
    officialDocs: {
      pricing: 'https://api-docs.deepseek.com/quick_start/pricing',
      jsonOutput: 'https://api-docs.deepseek.com/guides/json_mode',
      contextCaching: 'https://api-docs.deepseek.com/guides/kv_cache',
    },
    pricingUsdPerMillionTokens,
    qualityFlagLabels: vocabularyFlagPatterns.map(({ label }) => label),
    summaries,
    recommendationGate: 'Do not switch runtime default until user reviews this report and approves a model.',
  };

  const reportPath = join(reportDir, 'report.json');
  const resultsPath = join(reportDir, 'results.jsonl');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(resultsPath, `${results.map(result => JSON.stringify(result)).join('\n')}\n`, 'utf8');
  return { reportDir, reportPath, resultsPath, report };
}

async function main() {
  if (live && !confirmCost) {
    console.error('[deepseek-eval] Live mode requires --confirm-cost and explicit user approval.');
    process.exit(2);
  }

  const samples = parseSamples();
  const errors = samples.flatMap(validateSample);
  if (errors.length > 0) {
    console.error('[deepseek-eval] Validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const selectedSamples = selectSamples(samples);
  if (selectedSamples.length === 0) {
    console.error('[deepseek-eval] No samples selected.');
    process.exit(1);
  }

  const models = replay && !hasOption('models') ? [] : getModels();
  const temperature = getNumberOption('temperature', Number(process.env.DEEPSEEK_EVAL_TEMPERATURE || 0.7));
  const maxRetries = getNumberOption('max-retries', Number(process.env.DEEPSEEK_EVAL_MAX_RETRIES || 1));
  const timeoutMs = getNumberOption('timeout-ms', Number(process.env.DEEPSEEK_EVAL_TIMEOUT_MS || 45_000));
  const maxTokens = getNumberOption('max-tokens', Number(process.env.DEEPSEEK_EVAL_MAX_TOKENS || 1200));
  const baseUrl = getOption('base-url', process.env.DEEPSEEK_BASE_URL || defaultBaseUrl);

  if (replay) {
    const replayResultsValue = getOption('replay-results');
    if (!replayResultsValue) {
      console.error('[deepseek-eval] --replay-results requires a results.jsonl path.');
      process.exit(2);
    }
    const sourceResultsPath = resolve(rootDir, replayResultsValue);
    const sourceRows = readFileSync(sourceResultsPath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          throw new Error(`Invalid replay JSONL at line ${index + 1}: ${error.message}`);
        }
      });
    const sampleById = new Map(selectedSamples.map(sample => [sample.id, sample]));
    const modelFilter = new Set(models);
    const results = sourceRows
      .filter(row => sampleById.has(row.sampleId))
      .filter(row => modelFilter.size === 0 || modelFilter.has(row.model))
      .map(row => replayExistingResult({
        row,
        sample: sampleById.get(row.sampleId),
        sourceResultsPath,
      }));
    const replayModels = models.length > 0 ? models : [...new Set(results.map(result => result.model))];
    const summaries = replayModels.map(model => summarizeModel(model, results));
    const { reportDir, reportPath, resultsPath, report } = writeReports({
      mode: 'replay',
      results,
      summaries,
      selectedSamples: selectedSamples.filter(sample => results.some(result => result.sampleId === sample.id)),
      models: replayModels,
      temperature,
      maxRetries,
      timeoutMs,
      maxTokens,
      baseUrl,
      sourceResultsPath,
    });
    console.log(JSON.stringify({
      reportDir: toRepoPath(reportDir),
      reportPath: toRepoPath(reportPath),
      resultsPath: toRepoPath(resultsPath),
      report,
    }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify(buildDryRunReport({
      samples,
      selectedSamples,
      models,
      temperature,
      maxRetries,
      timeoutMs,
      maxTokens,
    }), null, 2));
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[deepseek-eval] DEEPSEEK_API_KEY is required for live eval.');
    process.exit(4);
  }

  const results = [];
  for (const model of models) {
    for (const sample of selectedSamples) {
      const result = await evalSampleLive({
        sample,
        model,
        apiKey,
        baseUrl,
        temperature,
        maxRetries,
        timeoutMs,
        maxTokens,
      });
      results.push(result);
      const status = result.success ? 'pass' : 'fail';
      console.log(`[deepseek-eval] ${status} model=${model} sample=${sample.id} attempts=${result.attempts} tokens=${result.usage.total_tokens}`);
    }
  }

  const summaries = models.map(model => summarizeModel(model, results));
  const { reportDir, reportPath, resultsPath, report } = writeReports({
    mode: 'live',
    results,
    summaries,
    selectedSamples,
    models,
    temperature,
    maxRetries,
    timeoutMs,
    maxTokens,
    baseUrl,
  });

  console.log(JSON.stringify({
    mode: 'live',
    reportDir: toRepoPath(reportDir),
    reportPath: toRepoPath(reportPath),
    resultsPath: toRepoPath(resultsPath),
    summaries: report.summaries,
    nextGate: report.recommendationGate,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
