#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const defaultSampleFile = 'tests/evals/v220-agent-lab/samples.json';
const scenarioId = 'outer_edge_agent_lab_synthetic_v1';

const allowedLayers = new Set(['L1', 'L2', 'L3', 'L5']);
const allowedKinds = new Set([
  'routine_hint',
  'memory_candidate',
  'reflection_candidate',
  'intent_candidate',
  'dialogue_intent_candidate',
  'faction_pressure_candidate',
  'heaven_will_pressure',
]);
const allowedConfidence = new Set(['low', 'medium', 'high']);
const allowedVisibility = new Set(['public_pressure', 'agent_private_candidate', 'ref_only', 'gated']);
const allowedMemoryStatus = new Set([
  'public_observation_candidate',
  'subjective_memory_candidate',
  'rumor_memory_candidate',
  'reflection_candidate',
  'intent_memory_candidate',
  'faction_pressure_memory_candidate',
  'l5_pressure_trace',
]);
const allowedEffectTypes = new Set([
  'pressure_signal',
  'routine_hint',
  'memory_note_candidate',
  'rumor_note_candidate',
  'reflection_note_candidate',
  'intent_candidate',
  'dialogue_intent_candidate',
  'faction_pressure_candidate',
  'macro_pressure_constraint',
  'audit_note',
  'safe_next_step',
  'idle_breaker',
  'replay_lane_marker',
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
  'formalCredential',
  'officialPass',
  'inventoryPatch',
  'factionStateWrite',
  'locationUnlock',
  'npcDeath',
  'rewardGrant',
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
  'formal_credential',
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
  'official pass granted',
  'git commit by external agent',
];
const formalOutcomePatterns = [
  /officially\s+joins/i,
  /unlocks?\s+the\s+location/i,
  /grants?\s+reward/i,
  /settles?\s+trade/i,
  /decides?\s+.*fate/i,
  /declares?\s+.*ending/i,
  /confirms?\s+.*canon/i,
];
const memoryContaminationPatterns = [
  /stored\s+relationship/i,
  /confirmed\s+fact/i,
  /canon\s+memory/i,
  /write\s+to\s+memory/i,
  /persistent\s+memory/i,
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

function textOf(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textOf).join(' ');
  return '';
}

function validateSampleShape(sample) {
  const findings = [];
  for (const key of ['id', 'title', 'scenarioId', 'roundId', 'agentSlot', 'expectedWorldCoreResult']) {
    if (typeof sample[key] !== 'string' || !sample[key].trim()) addFinding(findings, 'P0', 'sample_missing_string', `${key} must be a non-empty string.`);
  }
  if (sample.scenarioId !== scenarioId) addFinding(findings, 'P0', 'sample_wrong_scenario', `scenarioId must be ${scenarioId}.`);
  if (!isStringArray(sample.allowedSourceRefs)) addFinding(findings, 'P0', 'sample_invalid_source_allowlist', 'allowedSourceRefs must be a string array.');
  if (!isStringArray(sample.allowedVisibleFactRefs)) addFinding(findings, 'P0', 'sample_invalid_visible_allowlist', 'allowedVisibleFactRefs must be a string array.');
  if (!isStringArray(sample.factionPressureRefs)) addFinding(findings, 'P0', 'sample_invalid_faction_refs', 'factionPressureRefs must be a string array.');
  if (!['accepted_candidate', 'needs_user_decision', 'rejected_violation'].includes(sample.expectedWorldCoreResult)) {
    addFinding(findings, 'P0', 'sample_invalid_expected_result', `Invalid expectedWorldCoreResult: ${sample.expectedWorldCoreResult}`);
  }
  return findings;
}

function validateProposal(sample, proposal) {
  const findings = validateSampleShape(sample);
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    addFinding(findings, 'P0', 'schema_not_object', 'AgentProposal must be an object.');
    return findings;
  }

  for (const key of ['proposalId', 'roundId', 'agentId', 'agentLayer', 'proposalKind', 'memoryStatus', 'visibility', 'publicSummary', 'confidence', 'authority']) {
    if (typeof proposal[key] !== 'string' || !proposal[key].trim()) addFinding(findings, 'P0', 'schema_missing_string', `${key} must be a non-empty string.`);
  }
  if (proposal.roundId !== sample.roundId) addFinding(findings, 'P1', 'round_mismatch', `proposal.roundId must match sample.roundId: ${sample.roundId}`);
  if (proposal.authority !== 'proposal_only') addFinding(findings, 'P0', 'schema_invalid_authority', 'authority must be proposal_only.');
  if (!allowedLayers.has(proposal.agentLayer)) addFinding(findings, 'P0', 'schema_invalid_layer', `Invalid agentLayer: ${proposal.agentLayer}`);
  if (!allowedKinds.has(proposal.proposalKind)) addFinding(findings, 'P0', 'schema_invalid_kind', `Invalid proposalKind: ${proposal.proposalKind}`);
  if (!allowedMemoryStatus.has(proposal.memoryStatus)) addFinding(findings, 'P0', 'schema_invalid_memory_status', `Invalid memoryStatus: ${proposal.memoryStatus}`);
  if (!allowedVisibility.has(proposal.visibility)) addFinding(findings, 'P0', 'schema_invalid_visibility', `Invalid visibility: ${proposal.visibility}`);
  if (!allowedConfidence.has(proposal.confidence)) addFinding(findings, 'P0', 'schema_invalid_confidence', `Invalid confidence: ${proposal.confidence}`);
  if (!isStringArray(proposal.sourceEventRefs)) addFinding(findings, 'P0', 'schema_invalid_source_refs', 'sourceEventRefs must be a string array.');
  if (!isStringArray(proposal.visibleFactRefs)) addFinding(findings, 'P0', 'schema_invalid_visible_refs', 'visibleFactRefs must be a string array.');
  if (!isStringArray(proposal.factionPressureRefs)) addFinding(findings, 'P0', 'schema_invalid_faction_refs', 'factionPressureRefs must be a string array.');
  if (proposal.hiddenFactRefs !== undefined && !isStringArray(proposal.hiddenFactRefs)) addFinding(findings, 'P0', 'schema_invalid_hidden_refs', 'hiddenFactRefs must be a string array when present.');
  if (!Array.isArray(proposal.candidateEffects)) addFinding(findings, 'P0', 'schema_invalid_candidate_effects', 'candidateEffects must be an array.');
  if (!isStringArray(proposal.forbiddenEffects)) addFinding(findings, 'P0', 'schema_invalid_forbidden_effects', 'forbiddenEffects must be a string array.');
  if (proposal.requiresWorldCoreAdjudication !== true) addFinding(findings, 'P0', 'schema_missing_worldcore_gate', 'requiresWorldCoreAdjudication must be true.');

  const sourceViolations = findRefViolations(proposal.sourceEventRefs || [], sample.allowedSourceRefs || []);
  for (const ref of sourceViolations) addFinding(findings, 'P1', 'source_ref_not_allowed', `sourceEventRef is not in sample allowlist: ${ref}`);

  const visibleViolations = findRefViolations(proposal.visibleFactRefs || [], sample.allowedVisibleFactRefs || []);
  for (const ref of visibleViolations) addFinding(findings, 'P1', 'visible_ref_not_allowed', `visibleFactRef is not in sample allowlist: ${ref}`);

  const factionViolations = findRefViolations(proposal.factionPressureRefs || [], sample.factionPressureRefs || []);
  for (const ref of factionViolations) addFinding(findings, 'P1', 'faction_ref_not_allowed', `factionPressureRef is not in sample allowlist: ${ref}`);

  const hiddenRefs = proposal.hiddenFactRefs || [];
  const hiddenViolations = findRefViolations(hiddenRefs, sample.allowedHiddenFactRefs || []);
  for (const ref of hiddenViolations) addFinding(findings, 'P0', 'hidden_ref_not_allowed', `hiddenFactRef is not explicitly allowed: ${ref}`);
  if (hiddenRefs.length > 0 && sample.expectedWorldCoreResult !== 'needs_user_decision') {
    addFinding(findings, 'P0', 'hidden_ref_without_gate', 'hiddenFactRefs require needs_user_decision in v2.2.');
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

  const searchable = textOf(proposal);
  for (const pattern of formalOutcomePatterns) {
    if (pattern.test(searchable)) addFinding(findings, 'P1', 'formal_outcome_language', `Formal outcome wording matched ${pattern}`);
  }
  if (['subjective_memory_candidate', 'rumor_memory_candidate', 'reflection_candidate', 'intent_memory_candidate'].includes(proposal.memoryStatus)) {
    for (const pattern of memoryContaminationPatterns) {
      if (pattern.test(searchable)) addFinding(findings, 'P0', 'memory_contamination_language', `Memory contamination wording matched ${pattern}`);
    }
  }

  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'safe_next_step')) {
    addFinding(findings, 'P2', 'missing_safe_next_step', 'Proposal should include at least one safe_next_step effect.');
  }
  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'idle_breaker')) {
    addFinding(findings, 'P2', 'missing_idle_breaker', 'Proposal should include an idle_breaker to prevent looped waiting.');
  }
  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'replay_lane_marker')) {
    addFinding(findings, 'P2', 'missing_replay_lane_marker', 'Proposal should include replay_lane_marker for deterministic rescore.');
  }
  if (!proposal.forbiddenEffects?.length) addFinding(findings, 'P2', 'missing_forbidden_effects', 'Proposal should list forbiddenEffects for audit.');

  return findings;
}

function postCheck(sample, proposal, findings) {
  const blocking = findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  let result = 'accepted_candidate';
  if (blocking) result = 'rejected_violation';
  else if (sample.requiresUserDecision || proposal.visibility === 'gated' || (proposal.hiddenFactRefs || []).length > 0) result = 'needs_user_decision';

  if (proposal.agentLayer === 'L5') {
    if (proposal.proposalKind !== 'heaven_will_pressure') {
      addFinding(findings, 'P1', 'l5_wrong_kind', 'L5 must use heaven_will_pressure in v2.2 Agent Lab.');
      result = 'rejected_violation';
    }
    if (!proposal.candidateEffects?.some(effect => effect.effectType === 'macro_pressure_constraint')) {
      addFinding(findings, 'P1', 'l5_missing_macro_constraint', 'L5 must only add macro pressure constraints.');
      result = 'rejected_violation';
    }
  }

  if (sample.expectedWorldCoreResult !== result) {
    addFinding(findings, 'P1', 'unexpected_worldcore_result', `Expected ${sample.expectedWorldCoreResult}, got ${result}.`);
  }
  return result;
}

function countCodes(findings, code) {
  return findings.filter(item => item.code === code).length;
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function addCoverageFindings(samples, findings) {
  const proposals = samples.map(sample => sample.proposal).filter(Boolean);
  const npcAgentIds = new Set(proposals.filter(proposal => proposal.agentLayer !== 'L5').map(proposal => proposal.agentId));
  const l5AgentIds = new Set(proposals.filter(proposal => proposal.agentLayer === 'L5').map(proposal => proposal.agentId));
  const factions = new Set(samples.flatMap(sample => sample.factionPressureRefs || []));
  const rounds = new Set(samples.map(sample => sample.roundId));
  const layers = countBy(proposals, proposal => proposal.agentLayer);

  if (npcAgentIds.size !== 20) addFinding(findings, 'P1', 'coverage_npc_count', `Expected 20 unique non-L5 agents, got ${npcAgentIds.size}.`);
  if (l5AgentIds.size !== 1) addFinding(findings, 'P1', 'coverage_l5_count', `Expected 1 L5 macro director, got ${l5AgentIds.size}.`);
  if (factions.size !== 3) addFinding(findings, 'P1', 'coverage_faction_count', `Expected 3 abstract faction pressure refs, got ${factions.size}.`);
  if (rounds.size < 6) addFinding(findings, 'P2', 'coverage_round_count', `Expected at least 6 offline rounds, got ${rounds.size}.`);
  for (const layer of ['L1', 'L2', 'L3', 'L5']) {
    if (!layers[layer]) addFinding(findings, 'P1', 'coverage_layer_missing', `Missing layer ${layer}.`);
  }

  return {
    npcAgentCount: npcAgentIds.size,
    l5AgentCount: l5AgentIds.size,
    factionCount: factions.size,
    roundCount: rounds.size,
    layerCounts: layers,
    memoryStatusCounts: countBy(proposals, proposal => proposal.memoryStatus),
    visibilityCounts: countBy(proposals, proposal => proposal.visibility),
  };
}

function loadSamples(sampleFile) {
  const resolved = resolve(rootDir, sampleFile);
  if (!existsSync(resolved)) throw new Error(`Sample file not found: ${sampleFile}`);
  const samples = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) throw new Error('Sample file must contain a non-empty array.');
  return { resolved, samples };
}

function scoreSample(sample) {
  const findings = validateProposal(sample, sample.proposal);
  const worldCoreResult = postCheck(sample, sample.proposal || {}, findings);
  const summary = summarizeFindings(findings);
  return {
    id: sample.id,
    title: sample.title,
    roundId: sample.roundId,
    agentId: sample.proposal?.agentId,
    agentLayer: sample.proposal?.agentLayer,
    memoryStatus: sample.proposal?.memoryStatus,
    visibility: sample.proposal?.visibility,
    expectedWorldCoreResult: sample.expectedWorldCoreResult,
    worldCoreResult,
    schemaValid: summary.p0 === 0 && !findings.some(item => item.code.startsWith('schema_') || item.code.startsWith('sample_')),
    acceptedForGate: summary.p0 === 0 && summary.p1 === 0 && sample.expectedWorldCoreResult === worldCoreResult,
    ...summary,
    findings,
  };
}

function run() {
  const dryRun = hasOption('dry-run');
  const sampleFile = getOption('sample-file', defaultSampleFile);
  const p2Threshold = getNumberOption('max-p2-rate', 0.2);
  const { resolved, samples } = loadSamples(sampleFile);
  const globalFindings = [];
  if (!dryRun) addFinding(globalFindings, 'P1', 'missing_dry_run', 'v2.2 Agent Lab expanded runner must be run with --dry-run.');

  const coverage = addCoverageFindings(samples, globalFindings);
  const results = samples.map(scoreSample);
  const rescoreResults = samples.map(scoreSample);
  const rescoreStable = hashJson(results.map(result => ({
    id: result.id,
    worldCoreResult: result.worldCoreResult,
    findingCodes: result.findings.map(finding => `${finding.severity}:${finding.code}`),
  }))) === hashJson(rescoreResults.map(result => ({
    id: result.id,
    worldCoreResult: result.worldCoreResult,
    findingCodes: result.findings.map(finding => `${finding.severity}:${finding.code}`),
  })));
  if (!rescoreStable) addFinding(globalFindings, 'P1', 'rescore_not_stable', 'Deterministic rescore changed results.');

  const resultFindings = results.flatMap(result => result.findings.map(finding => ({ sampleId: result.id, ...finding })));
  const findings = [...globalFindings, ...resultFindings];
  const findingSummary = summarizeFindings(findings);
  const schemaValidCount = results.filter(result => result.schemaValid).length;
  const acceptedForGate = results.filter(result => result.acceptedForGate).length;
  const p2Rate = samples.length > 0 ? Number((findingSummary.p2 / samples.length).toFixed(4)) : 1;
  const hiddenLeakCount = countCodes(findings, 'hidden_ref_not_allowed') + countCodes(findings, 'hidden_ref_without_gate') + countCodes(findings, 'forbidden_key') + countCodes(findings, 'forbidden_text');
  const formalAuthorityDriftCount = countCodes(findings, 'candidate_effect_forbidden') + countCodes(findings, 'formal_outcome_language');
  const memoryContaminationCount = countCodes(findings, 'memory_contamination_language');
  const passed = schemaValidCount === samples.length
    && findingSummary.p0 === 0
    && findingSummary.p1 === 0
    && p2Rate <= p2Threshold
    && hiddenLeakCount === 0
    && formalAuthorityDriftCount === 0
    && memoryContaminationCount === 0
    && rescoreStable;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/v2.2.0/agent-lab-expanded-offline-runner', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    gate: 'v2.2.0-b1-to-rc-agent-lab-expanded-offline-runner',
    createdAt: new Date().toISOString(),
    mode: 'dry-run-only-report-only',
    noLiveDeepSeek: true,
    noTokenSpend: true,
    noRuntimeWrite: true,
    noSaveWrite: true,
    noExternalFramework: true,
    noSubagents: true,
    noMiroFishExport: true,
    sampleFile: repoPath(resolved),
    sampleHash: hashJson(samples),
    p2Threshold,
    scenario: {
      scenarioId,
      ...coverage,
    },
    summary: {
      sampleCount: samples.length,
      schemaValidCount,
      schemaValidityRate: Number((schemaValidCount / samples.length).toFixed(4)),
      acceptedForGate,
      acceptedCandidateCount: results.filter(result => result.worldCoreResult === 'accepted_candidate').length,
      needsUserDecisionCount: results.filter(result => result.worldCoreResult === 'needs_user_decision').length,
      rejectedViolationCount: results.filter(result => result.worldCoreResult === 'rejected_violation').length,
      p2Rate,
      hiddenLeakCount,
      formalAuthorityDriftCount,
      memoryContaminationCount,
      rescoreStable,
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
    '# v2.2.0 Agent Lab Expanded Offline Runner Summary',
    '',
    `- createdAt: ${report.createdAt}`,
    `- sampleFile: ${report.sampleFile}`,
    `- sampleCount: ${samples.length}`,
    `- npcAgentCount: ${coverage.npcAgentCount}`,
    `- factionCount: ${coverage.factionCount}`,
    `- l5AgentCount: ${coverage.l5AgentCount}`,
    `- roundCount: ${coverage.roundCount}`,
    `- schemaValidCount: ${schemaValidCount}`,
    `- acceptedCandidateCount: ${report.summary.acceptedCandidateCount}`,
    `- needsUserDecisionCount: ${report.summary.needsUserDecisionCount}`,
    `- rejectedViolationCount: ${report.summary.rejectedViolationCount}`,
    `- P0/P1/P2: ${findingSummary.p0}/${findingSummary.p1}/${findingSummary.p2}`,
    `- hiddenLeakCount: ${hiddenLeakCount}`,
    `- formalAuthorityDriftCount: ${formalAuthorityDriftCount}`,
    `- memoryContaminationCount: ${memoryContaminationCount}`,
    `- p2Rate: ${p2Rate}`,
    `- rescoreStable: ${rescoreStable}`,
    `- passed: ${passed}`,
    '',
    'This is report-only evidence. It does not call live DeepSeek, write runtime state, write save data, use external frameworks, enable subagents, or export MiroFish material.',
    '',
  ].join('\n'), 'utf8');

  console.log(`[v220-agent-lab-expanded-offline] report=${reportPath} samples=${samples.length} schema=${schemaValidCount}/${samples.length} P0=${findingSummary.p0} P1=${findingSummary.p1} P2=${findingSummary.p2} hidden=${hiddenLeakCount} formal=${formalAuthorityDriftCount} memory=${memoryContaminationCount} passed=${passed}`);
  if (!passed) process.exit(1);
}

run();
