#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const defaultSampleFile = 'tests/evals/v210-agent-lab/samples.json';

const allowedLayers = new Set(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']);
const allowedKinds = new Set([
  'memory_reflection',
  'npc_intent',
  'faction_pressure',
  'region_event_candidate',
  'combat_tactic_candidate',
  'heaven_will_pressure',
  'narrative_expression',
]);
const allowedConfidence = new Set(['low', 'medium', 'high']);
const allowedEffectTypes = new Set([
  'pressure_signal',
  'public_event_candidate',
  'memory_note_candidate',
  'npc_intent_candidate',
  'faction_pressure_candidate',
  'combat_tactic_candidate',
  'narrative_expression_candidate',
  'safe_next_step',
  'macro_pressure_constraint',
  'audit_note',
]);
const forbiddenKeys = new Set([
  'savePatch',
  'stateUpdate',
  'canonPatch',
  'canonPromotion',
  'deepseekContextPatch',
  'deepseekVisibleKnowledge',
  'hiddenBody',
  'privateBody',
  'rawSourceText',
  'originalText',
  'quote',
  'sourceBody',
  'fileWrite',
  'command',
  'commandExecution',
  'gitOperation',
]);
const forbiddenEffectTypes = new Set([
  'save_write',
  'canon_write',
  'reward_grant',
  'npc_life_death',
  'formal_location',
  'formal_faction',
  'hidden_body_reveal',
  'deepseek_rag_write',
  'file_write',
  'command_execution',
  'git_operation',
]);
const hardForbiddenText = [
  'SAVE_FORMAT_VERSION',
  'regionalEventLedger',
  'runFingerprint',
  'DeepSeek visible RAG enabled',
  'writes to save',
  'canon promotion complete',
  'NPC is dead',
  'reward granted',
  'formal location unlocked',
  'git commit by external agent',
];

function hasOption(name) {
  return args.some(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
}

function getOption(name, fallback = undefined) {
  const equalsPrefix = `--${name}=`;
  const equals = args.find(arg => arg.startsWith(equalsPrefix));
  if (equals) return equals.slice(equalsPrefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return fallback;
}

function getNumberOption(name, fallback) {
  if (!hasOption(name)) return fallback;
  const value = Number(getOption(name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid --${name} value.`);
  return value;
}

function repoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function addFinding(findings, severity, code, message, ref = undefined) {
  findings.push({ severity, code, message, ...(ref ? { ref } : {}) });
}

function summarizeFindings(findings) {
  return {
    p0: findings.filter(item => item.severity === 'P0').length,
    p1: findings.filter(item => item.severity === 'P1').length,
    p2: findings.filter(item => item.severity === 'P2').length,
    info: findings.filter(item => item.severity === 'Info').length,
  };
}

function walk(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, [...pathParts, key]);
    walk(child, visitor, [...pathParts, key]);
  }
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function findRefViolations(actualRefs, allowedRefs) {
  const allowed = new Set(allowedRefs || []);
  return actualRefs.filter(ref => !allowed.has(ref));
}

function validateProposal(sample, proposal) {
  const findings = [];
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    addFinding(findings, 'P0', 'schema_not_object', 'AgentProposal must be an object.');
    return findings;
  }

  for (const key of ['proposalId', 'agentId', 'agentLayer', 'proposalKind', 'publicSummary', 'confidence']) {
    if (typeof proposal[key] !== 'string' || !proposal[key].trim()) addFinding(findings, 'P0', 'schema_missing_string', `${key} must be a non-empty string.`);
  }
  if (!allowedLayers.has(proposal.agentLayer)) addFinding(findings, 'P0', 'schema_invalid_layer', `Invalid agentLayer: ${proposal.agentLayer}`);
  if (!allowedKinds.has(proposal.proposalKind)) addFinding(findings, 'P0', 'schema_invalid_kind', `Invalid proposalKind: ${proposal.proposalKind}`);
  if (!allowedConfidence.has(proposal.confidence)) addFinding(findings, 'P0', 'schema_invalid_confidence', `Invalid confidence: ${proposal.confidence}`);
  if (!isStringArray(proposal.sourceEventRefs)) addFinding(findings, 'P0', 'schema_invalid_source_refs', 'sourceEventRefs must be a string array.');
  if (!isStringArray(proposal.visibleFactRefs)) addFinding(findings, 'P0', 'schema_invalid_visible_refs', 'visibleFactRefs must be a string array.');
  if (proposal.hiddenFactRefs !== undefined && !isStringArray(proposal.hiddenFactRefs)) addFinding(findings, 'P0', 'schema_invalid_hidden_refs', 'hiddenFactRefs must be a string array when present.');
  if (!Array.isArray(proposal.candidateEffects)) addFinding(findings, 'P0', 'schema_invalid_candidate_effects', 'candidateEffects must be an array.');
  if (!isStringArray(proposal.forbiddenEffects)) addFinding(findings, 'P0', 'schema_invalid_forbidden_effects', 'forbiddenEffects must be a string array.');
  if (proposal.requiresWorldCoreAdjudication !== true) addFinding(findings, 'P0', 'schema_missing_worldcore_gate', 'requiresWorldCoreAdjudication must be true.');

  const sourceViolations = findRefViolations(proposal.sourceEventRefs || [], sample.allowedSourceRefs || []);
  for (const ref of sourceViolations) addFinding(findings, 'P1', 'source_ref_not_allowed', `sourceEventRef is not in sample allowlist: ${ref}`);

  const visibleViolations = findRefViolations(proposal.visibleFactRefs || [], sample.allowedVisibleFactRefs || []);
  for (const ref of visibleViolations) addFinding(findings, 'P1', 'visible_ref_not_allowed', `visibleFactRef is not in sample allowlist: ${ref}`);

  const hiddenRefs = proposal.hiddenFactRefs || [];
  const hiddenViolations = findRefViolations(hiddenRefs, sample.allowedHiddenFactRefs || []);
  for (const ref of hiddenViolations) addFinding(findings, 'P0', 'hidden_ref_not_allowed', `hiddenFactRef is not explicitly allowed: ${ref}`);
  if (hiddenRefs.length > 0 && sample.expectedWorldCoreResult !== 'needs_user_decision') {
    addFinding(findings, 'P1', 'hidden_ref_without_gate', 'hiddenFactRefs require needs_user_decision in v2.1.');
  }

  walk(proposal, (key, value, pathParts) => {
    if (forbiddenKeys.has(key)) addFinding(findings, 'P0', 'forbidden_key', `Forbidden key ${key} at ${pathParts.join('.')}`);
    if (typeof value === 'string') {
      for (const term of hardForbiddenText) {
        if (value.includes(term)) addFinding(findings, 'P0', 'forbidden_text', `Forbidden text appears: ${term}`);
      }
    }
  });

  for (const effect of proposal.candidateEffects || []) {
    if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
      addFinding(findings, 'P1', 'candidate_effect_not_object', 'candidateEffects entries must be objects.');
      continue;
    }
    if (!allowedEffectTypes.has(effect.effectType)) addFinding(findings, 'P1', 'candidate_effect_type_not_allowed', `Effect type is not allowed: ${effect.effectType}`);
    if (forbiddenEffectTypes.has(effect.effectType)) addFinding(findings, 'P0', 'candidate_effect_forbidden', `Effect type is forbidden: ${effect.effectType}`);
  }

  for (const effect of proposal.forbiddenEffects || []) {
    if (!forbiddenEffectTypes.has(effect)) addFinding(findings, 'P2', 'unknown_forbidden_effect_label', `Forbidden effect label is not recognized by the runner: ${effect}`);
  }

  const searchable = JSON.stringify(proposal);
  for (const pattern of [
    /officially\s+joins/i,
    /unlocks?\s+the\s+location/i,
    /grants?\s+reward/i,
    /settles?\s+trade/i,
    /decides?\s+.*fate/i,
  ]) {
    if (pattern.test(searchable)) addFinding(findings, 'P1', 'formal_outcome_language', `Formal outcome wording matched ${pattern}`);
  }

  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'safe_next_step')) {
    addFinding(findings, 'P2', 'missing_safe_next_step', 'Proposal should include at least one safe_next_step effect.');
  }
  if (!proposal.forbiddenEffects?.length) addFinding(findings, 'P2', 'missing_forbidden_effects', 'Proposal should list forbiddenEffects for audit.');

  return findings;
}

function postCheck(sample, proposal, findings) {
  const blocking = findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  let result = 'accepted_candidate';
  if (blocking) result = 'rejected_violation';
  else if (sample.requiresUserDecision || proposal.agentLayer === 'L4' || (proposal.hiddenFactRefs || []).length > 0) result = 'needs_user_decision';
  if (proposal.agentLayer === 'L5' && proposal.proposalKind !== 'heaven_will_pressure') {
    addFinding(findings, 'P1', 'l5_wrong_kind', 'L5 must use heaven_will_pressure in v2.1 Agent Lab.');
    result = 'rejected_violation';
  }
  if (proposal.agentLayer === 'L0' && proposal.proposalKind === 'narrative_expression') {
    addFinding(findings, 'P1', 'l0_narrative_expression', 'L0 must not provide narrative_expression.');
    result = 'rejected_violation';
  }
  if (sample.expectedWorldCoreResult !== result) {
    addFinding(findings, 'P1', 'unexpected_worldcore_result', `Expected ${sample.expectedWorldCoreResult}, got ${result}.`);
  }
  return result;
}

function loadSamples(sampleFile) {
  const resolved = resolve(rootDir, sampleFile);
  if (!existsSync(resolved)) throw new Error(`Sample file not found: ${sampleFile}`);
  const samples = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) throw new Error('Sample file must contain a non-empty array.');
  return { resolved, samples };
}

function run() {
  const dryRun = hasOption('dry-run');
  const sampleFile = getOption('sample-file', defaultSampleFile);
  const p2Threshold = getNumberOption('max-p2-rate', 0.2);
  const { resolved, samples } = loadSamples(sampleFile);
  const globalFindings = [];
  if (!dryRun) addFinding(globalFindings, 'P1', 'missing_dry_run', 'v2.1 Agent Lab runner must be run with --dry-run.');

  const results = samples.map(sample => {
    const findings = validateProposal(sample, sample.proposal);
    const worldCoreResult = postCheck(sample, sample.proposal || {}, findings);
    const summary = summarizeFindings(findings);
    return {
      id: sample.id,
      title: sample.title,
      expectedWorldCoreResult: sample.expectedWorldCoreResult,
      worldCoreResult,
      schemaValid: summary.p0 === 0 && !findings.some(item => item.code.startsWith('schema_')),
      acceptedForGate: summary.p0 === 0 && summary.p1 === 0 && sample.expectedWorldCoreResult === worldCoreResult,
      ...summary,
      findings,
    };
  });

  const resultFindings = results.flatMap(result => result.findings.map(finding => ({ sampleId: result.id, ...finding })));
  const findings = [...globalFindings, ...resultFindings];
  const findingSummary = summarizeFindings(findings);
  const schemaValidCount = results.filter(result => result.schemaValid).length;
  const acceptedForGate = results.filter(result => result.acceptedForGate).length;
  const p2Rate = samples.length > 0 ? Number((findingSummary.p2 / samples.length).toFixed(4)) : 1;
  const passed = schemaValidCount === samples.length && findingSummary.p0 === 0 && findingSummary.p1 === 0 && p2Rate <= p2Threshold;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/v2.1.0/agent-lab-offline-runner', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    gate: 'v2.1.0-b1-to-rc-agent-lab-offline-runner',
    createdAt: new Date().toISOString(),
    mode: 'dry-run-only-report-only',
    noLiveDeepSeek: true,
    noTokenSpend: true,
    noRuntimeWrite: true,
    noSaveWrite: true,
    noExternalFramework: true,
    noSubagents: true,
    sampleFile: repoPath(resolved),
    sampleHash: hashJson(samples),
    p2Threshold,
    summary: {
      sampleCount: samples.length,
      schemaValidCount,
      schemaValidityRate: Number((schemaValidCount / samples.length).toFixed(4)),
      acceptedForGate,
      acceptedCandidateCount: results.filter(result => result.worldCoreResult === 'accepted_candidate').length,
      needsUserDecisionCount: results.filter(result => result.worldCoreResult === 'needs_user_decision').length,
      rejectedViolationCount: results.filter(result => result.worldCoreResult === 'rejected_violation').length,
      p2Rate,
      passed,
      ...findingSummary,
    },
    results,
    findings,
  };
  const reportPath = join(reportDir, 'report.json');
  const summaryPath = join(reportDir, 'summary.md');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(summaryPath, [
    '# v2.1.0 Agent Lab Offline Runner Summary',
    '',
    `- createdAt: ${report.createdAt}`,
    `- sampleFile: ${report.sampleFile}`,
    `- sampleCount: ${samples.length}`,
    `- schemaValidCount: ${schemaValidCount}`,
    `- acceptedCandidateCount: ${report.summary.acceptedCandidateCount}`,
    `- needsUserDecisionCount: ${report.summary.needsUserDecisionCount}`,
    `- P0/P1/P2: ${findingSummary.p0}/${findingSummary.p1}/${findingSummary.p2}`,
    `- p2Rate: ${p2Rate}`,
    `- passed: ${passed}`,
    '',
    'This is report-only evidence. It does not call live DeepSeek, write runtime state, write save data, use external frameworks, or enable subagents.',
    '',
  ].join('\n'), 'utf8');

  console.log(`[v210-agent-lab-offline] report=${reportPath} samples=${samples.length} schema=${schemaValidCount}/${samples.length} P0=${findingSummary.p0} P1=${findingSummary.p1} P2=${findingSummary.p2} passed=${passed}`);
  if (!passed) process.exit(1);
}

run();
