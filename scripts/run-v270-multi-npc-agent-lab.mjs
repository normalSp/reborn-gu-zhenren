#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targetVersion = 'v2.7.0';
const scenarioId = 'outer_edge_multi_npc_small_faction_synthetic_v1';
const runnerVersion = 'v270_b1_multi_npc_agent_lab_runner_v1';
const a1ModelVersion = 'v270_a1_multi_npc_small_faction_scenario_model_v1';
const a2GateVersion = 'v270_a2_memory_propagation_pressure_handoff_gate_v1';
const defaultSampleFile = 'tests/evals/v270-multi-npc-agent-lab/samples.json';

const allowedFamilies = new Set([
  'caravan_labor_scam_aftermath',
  'squad_rescue_sacrifice_memory',
  'loose_cultivator_settlement_suspicion',
  'small_faction_opportunism_response',
  'l1_aggregate_to_l2_handoff',
]);
const allowedLayers = new Set(['L1', 'L2', 'L3', 'L5']);
const allowedKinds = new Set([
  'routine_hint',
  'aggregate_pressure_candidate',
  'squad_memory_candidate',
  'suspicion_pressure_candidate',
  'small_faction_pressure_candidate',
  'reflection_candidate',
  'intent_candidate',
  'l1_to_l2_handoff_candidate',
  'self_learning_candidate',
  'heaven_will_pressure',
]);
const allowedConfidence = new Set(['low', 'medium', 'high']);
const allowedVisibility = new Set(['public_pressure', 'agent_private_candidate', 'ref_only', 'gated_report_only']);
const allowedMemoryStatus = new Set([
  'public_observation_candidate',
  'subjective_memory_candidate',
  'rumor_memory_candidate',
  'reflection_candidate',
  'intent_memory_candidate',
  'pressure_memory_candidate',
  'l5_pressure_trace',
  'self_learning_candidate_patch',
]);
const allowedEffectTypes = new Set([
  'pressure_signal',
  'routine_hint',
  'memory_note_candidate',
  'rumor_note_candidate',
  'reflection_note_candidate',
  'intent_candidate',
  'aggregate_handoff_candidate',
  'small_faction_pressure_candidate',
  'squad_memory_candidate',
  'macro_pressure_constraint',
  'manual_review_note',
  'safe_next_step',
  'idle_breaker',
  'replay_lane_marker',
  'self_learning_candidate_patch',
]);
const forbiddenAuditLabels = new Set([
  'save_write',
  'canon_write',
  'reward_grant',
  'npc_life_death',
  'formal_location',
  'formal_faction',
  'formal_identity',
  'formal_credential',
  'formal_relation_score',
  'deepseek_rag_write',
  'backend_service',
  'external_framework_poc',
  'subagent_use',
  'prompt_write',
  'knowledge_body_write',
  'self_learning_direct_write',
  'l5_verdict',
]);
const forbiddenKeys = {
  savePatch: 'runtime_or_save_write',
  stateUpdate: 'runtime_or_save_write',
  runtimePatch: 'runtime_or_save_write',
  storePatch: 'runtime_or_save_write',
  canonPatch: 'runtime_or_save_write',
  knowledgeIndexBody: 'knowledge_body_write',
  runtimeCanonBody: 'canon_promotion',
  deepseekContextPatch: 'deepseek_visible_leak',
  deepSeekVisibleLore: 'deepseek_visible_leak',
  hiddenBody: 'hidden_private_body',
  privateBody: 'hidden_private_body',
  promptBody: 'prompt_body',
  originalText: 'original_text',
  rawSourceText: 'original_text',
  mirofishRawOutput: 'mirofish_boundary',
  formalCredential: 'formal_authority_drift',
  officialPass: 'formal_authority_drift',
  inventoryPatch: 'runtime_or_save_write',
  factionStateWrite: 'formal_authority_drift',
  locationUnlock: 'formal_location',
  npcDeath: 'npc_life_death',
  rewardGrant: 'formal_authority_drift',
  externalFrameworkPoC: 'external_framework_boundary',
  subagentUsed: 'external_framework_boundary',
  fileWrite: 'external_framework_boundary',
  commandExecution: 'external_framework_boundary',
  gitOperation: 'external_framework_boundary',
  selfLearningDirectWrite: 'self_learning_direct_write',
};
const forbiddenEffectFamilies = {
  save_write: 'runtime_or_save_write',
  canon_write: 'canon_promotion',
  reward_grant: 'formal_authority_drift',
  npc_life_death: 'npc_life_death',
  formal_location: 'formal_location',
  formal_faction: 'formal_authority_drift',
  formal_identity: 'formal_authority_drift',
  formal_credential: 'formal_authority_drift',
  formal_relation_score: 'formal_authority_drift',
  deepseek_rag_write: 'deepseek_visible_leak',
  backend_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  prompt_write: 'prompt_body',
  knowledge_body_write: 'knowledge_body_write',
  self_learning_direct_write: 'self_learning_direct_write',
  l5_verdict: 'l5_overreach',
};
const hardForbiddenText = [
  { pattern: /SYNTHETIC_(HIDDEN|PRIVATE|PROMPT|ORIGINAL)_BODY/i, family: 'hidden_private_body' },
  { pattern: /DeepSeek\s+visible\s+(lore|RAG|context)\s+enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /writes?\s+to\s+(save|runtime|canon|prompt|skill)/i, family: 'runtime_or_save_write' },
  { pattern: /officially\s+(joins|unlocks|grants|recruits)/i, family: 'formal_authority_drift' },
  { pattern: /NPC\s+is\s+dead/i, family: 'npc_life_death' },
  { pattern: /formal\s+location\s+unlocked/i, family: 'formal_location' },
  { pattern: /fate\s+is\s+(sealed|decided)/i, family: 'l5_overreach' },
];
const boundaryAssertions = {
  runtimeModified: false,
  saveFormatModified: false,
  saveFieldAdded: false,
  deepSeekLiveCalled: false,
  deepSeekAuthorityExpanded: false,
  deepSeekVisibleLoreEnabled: false,
  bffOrBackendUsed: false,
  serviceImplemented: false,
  subagentsUsed: false,
  mirofishExportUsed: false,
  externalFrameworkPoCUsed: false,
  dependencyAdded: false,
  realHiddenPrivateBodyRead: false,
  promptBodyArchived: false,
  knowledgeIndexBodyWritten: false,
  runtimeCanonPromoted: false,
  formalLocationFactionRewardNpcLifeDeathOpened: false,
  edgeOneDeployed: false,
};

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

function repoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function addFinding(findings, severity, family, code, message, ref = undefined) {
  findings.push({ severity, family, code, message, ...(ref ? { ref } : {}) });
}

function severitySummary(findings) {
  return {
    P0: findings.filter(item => item.severity === 'P0').length,
    P1: findings.filter(item => item.severity === 'P1').length,
    P2: findings.filter(item => item.severity === 'P2').length,
    Info: findings.filter(item => item.severity === 'Info').length,
  };
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
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

function textOf(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textOf).join(' ');
  return '';
}

function findRefViolations(actualRefs, allowedRefs) {
  const allowed = new Set(allowedRefs || []);
  return actualRefs.filter(ref => !allowed.has(ref));
}

function validateSampleShape(sample) {
  const findings = [];
  for (const key of ['id', 'caseType', 'family', 'title', 'scenarioId', 'roundId', 'agentSlot', 'expectedWorldCoreResult']) {
    if (typeof sample[key] !== 'string' || !sample[key].trim()) addFinding(findings, 'P0', 'schema', 'sample_missing_string', `${key} must be a non-empty string.`);
  }
  if (sample.scenarioId !== scenarioId) addFinding(findings, 'P0', 'schema', 'sample_wrong_scenario', `scenarioId must be ${scenarioId}.`);
  if (!['positive', 'negative', 'manual_review'].includes(sample.caseType)) addFinding(findings, 'P0', 'schema', 'sample_invalid_case_type', `Invalid caseType: ${sample.caseType}`);
  if (!allowedFamilies.has(sample.family)) addFinding(findings, 'P0', 'schema', 'sample_invalid_family', `Invalid family: ${sample.family}`);
  if (!['accepted_candidate', 'needs_user_decision', 'rejected_violation'].includes(sample.expectedWorldCoreResult)) {
    addFinding(findings, 'P0', 'schema', 'sample_invalid_expected_result', `Invalid expectedWorldCoreResult: ${sample.expectedWorldCoreResult}`);
  }
  for (const key of ['allowedSourceRefs', 'allowedVisibleFactRefs', 'factionPressureRefs']) {
    if (!isStringArray(sample[key])) addFinding(findings, 'P0', 'schema', 'sample_invalid_ref_array', `${key} must be a string array.`);
  }
  if (sample.expectedViolationFamilies !== undefined && !isStringArray(sample.expectedViolationFamilies)) {
    addFinding(findings, 'P0', 'schema', 'sample_invalid_expected_families', 'expectedViolationFamilies must be a string array when present.');
  }
  return findings;
}

function validateProposal(sample, proposal) {
  const findings = validateSampleShape(sample);
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    addFinding(findings, 'P0', 'schema', 'proposal_not_object', 'AgentProposal must be an object.');
    return findings;
  }
  for (const key of ['proposalId', 'roundId', 'agentId', 'agentLayer', 'proposalKind', 'memoryStatus', 'visibility', 'publicSummary', 'confidence', 'authority']) {
    if (typeof proposal[key] !== 'string' || !proposal[key].trim()) addFinding(findings, 'P0', 'schema', 'proposal_missing_string', `${key} must be a non-empty string.`);
  }
  if (proposal.roundId !== sample.roundId) addFinding(findings, 'P1', 'schema', 'round_mismatch', `proposal.roundId must match sample.roundId: ${sample.roundId}`);
  if (proposal.authority !== 'proposal_only') addFinding(findings, 'P0', 'schema', 'invalid_authority', 'authority must be proposal_only.');
  if (!allowedLayers.has(proposal.agentLayer)) addFinding(findings, 'P0', 'schema', 'invalid_layer', `Invalid agentLayer: ${proposal.agentLayer}`);
  if (!allowedKinds.has(proposal.proposalKind)) addFinding(findings, 'P0', 'schema', 'invalid_kind', `Invalid proposalKind: ${proposal.proposalKind}`);
  if (!allowedMemoryStatus.has(proposal.memoryStatus)) addFinding(findings, 'P0', 'schema', 'invalid_memory_status', `Invalid memoryStatus: ${proposal.memoryStatus}`);
  if (!allowedVisibility.has(proposal.visibility)) addFinding(findings, 'P0', 'schema', 'invalid_visibility', `Invalid visibility: ${proposal.visibility}`);
  if (!allowedConfidence.has(proposal.confidence)) addFinding(findings, 'P0', 'schema', 'invalid_confidence', `Invalid confidence: ${proposal.confidence}`);
  for (const key of ['sourceEventRefs', 'visibleFactRefs', 'factionPressureRefs', 'forbiddenEffects']) {
    if (!isStringArray(proposal[key])) addFinding(findings, 'P0', 'schema', 'proposal_invalid_ref_array', `${key} must be a string array.`);
  }
  if (proposal.hiddenFactRefs !== undefined && !isStringArray(proposal.hiddenFactRefs)) {
    addFinding(findings, 'P0', 'schema', 'proposal_invalid_hidden_refs', 'hiddenFactRefs must be a string array when present.');
  }
  if (!Array.isArray(proposal.candidateEffects)) addFinding(findings, 'P0', 'schema', 'proposal_invalid_candidate_effects', 'candidateEffects must be an array.');
  if (proposal.requiresWorldCoreAdjudication !== true) addFinding(findings, 'P0', 'worldcore_postcheck_missing', 'missing_worldcore_gate', 'requiresWorldCoreAdjudication must be true.');

  for (const ref of findRefViolations(proposal.sourceEventRefs || [], sample.allowedSourceRefs || [])) {
    addFinding(findings, 'P1', 'source_pointer_misuse', 'source_ref_not_allowed', `sourceEventRef is not in sample allowlist: ${ref}`);
  }
  for (const ref of findRefViolations(proposal.visibleFactRefs || [], sample.allowedVisibleFactRefs || [])) {
    addFinding(findings, 'P1', 'source_pointer_misuse', 'visible_ref_not_allowed', `visibleFactRef is not in sample allowlist: ${ref}`);
  }
  for (const ref of findRefViolations(proposal.factionPressureRefs || [], sample.factionPressureRefs || [])) {
    addFinding(findings, 'P1', 'source_pointer_misuse', 'faction_ref_not_allowed', `factionPressureRef is not in sample allowlist: ${ref}`);
  }
  if ((proposal.hiddenFactRefs || []).length > 0) {
    addFinding(findings, 'P0', 'hidden_private_body', 'hidden_refs_not_allowed_v270', 'v2.7 samples must stay synthetic and avoid hiddenFactRefs.');
  }

  walk(proposal, (key, value, pathParts) => {
    if (forbiddenKeys[key]) addFinding(findings, 'P0', forbiddenKeys[key], 'forbidden_key', `Forbidden key ${key} at ${pathParts.join('.')}`);
    if (typeof value === 'string') {
      for (const item of hardForbiddenText) {
        if (item.pattern.test(value)) addFinding(findings, 'P0', item.family, 'forbidden_text', `Forbidden text matched ${item.pattern}`);
      }
    }
  });

  for (const effect of proposal.candidateEffects || []) {
    if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
      addFinding(findings, 'P1', 'schema', 'candidate_effect_not_object', 'candidateEffects entries must be objects.');
      continue;
    }
    if (forbiddenEffectFamilies[effect.effectType]) {
      addFinding(findings, 'P0', forbiddenEffectFamilies[effect.effectType], 'candidate_effect_forbidden', `Effect type is forbidden: ${effect.effectType}`);
    } else if (!allowedEffectTypes.has(effect.effectType)) {
      addFinding(findings, 'P1', 'schema', 'candidate_effect_type_not_allowed', `Effect type is not allowed: ${effect.effectType}`);
    }
  }

  for (const effect of proposal.forbiddenEffects || []) {
    if (!forbiddenAuditLabels.has(effect)) addFinding(findings, 'P2', 'metadata_gap', 'unknown_forbidden_effect_label', `Forbidden effect label is not recognized by the runner: ${effect}`);
  }

  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'safe_next_step')) {
    addFinding(findings, 'P2', 'metadata_gap', 'missing_safe_next_step', 'Proposal should include safe_next_step.');
  }
  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'idle_breaker')) {
    addFinding(findings, 'P2', 'metadata_gap', 'missing_idle_breaker', 'Proposal should include idle_breaker.');
  }
  if (!proposal.candidateEffects?.some(effect => effect.effectType === 'replay_lane_marker')) {
    addFinding(findings, 'P2', 'metadata_gap', 'missing_replay_lane_marker', 'Proposal should include replay_lane_marker.');
  }
  if (['subjective_memory_candidate', 'rumor_memory_candidate', 'reflection_candidate', 'intent_memory_candidate', 'self_learning_candidate_patch'].includes(proposal.memoryStatus)
    && !proposal.candidateEffects?.some(effect => effect.effectType === 'manual_review_note')) {
    addFinding(findings, 'P2', 'manual_review_required', 'memory_candidate_without_manual_review', 'Private/reflection/self-learning memory candidates should include manual_review_note.');
  }

  if (proposal.agentLayer === 'L5') {
    if (proposal.proposalKind !== 'heaven_will_pressure') addFinding(findings, 'P1', 'l5_overreach', 'l5_wrong_kind', 'L5 must use heaven_will_pressure.');
    if (!proposal.candidateEffects?.some(effect => effect.effectType === 'macro_pressure_constraint')) {
      addFinding(findings, 'P1', 'l5_overreach', 'l5_missing_macro_constraint', 'L5 must only add macro pressure constraints.');
    }
  }

  const searchable = textOf(proposal);
  if (/confirmed\s+(memory|relationship|fact)/i.test(searchable) || /persistent\s+memory/i.test(searchable)) {
    addFinding(findings, 'P0', 'memory_contamination', 'memory_contamination_language', 'Memory wording must stay candidate-only.');
  }

  return findings;
}

function expectedFamiliesSatisfied(sample, findings) {
  const expected = sample.expectedViolationFamilies || [];
  const present = new Set(findings.filter(item => item.severity === 'P0' || item.severity === 'P1').map(item => item.family));
  return expected.filter(family => !present.has(family));
}

function scoreSample(sample) {
  const findings = validateProposal(sample, sample.proposal);
  const blocking = findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  let worldCoreResult = 'accepted_candidate';
  if (blocking) worldCoreResult = 'rejected_violation';
  else if (sample.requiresUserDecision || sample.proposal?.proposalKind === 'self_learning_candidate' || sample.proposal?.visibility === 'gated_report_only') {
    worldCoreResult = 'needs_user_decision';
  }

  const schemaValid = !findings.some(item => item.family === 'schema');
  const missingExpectedFamilies = expectedFamiliesSatisfied(sample, findings);
  const unexpectedBlockingFinding = sample.expectedWorldCoreResult !== 'rejected_violation'
    && findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  const falseNegative = sample.expectedWorldCoreResult === 'rejected_violation' && worldCoreResult !== 'rejected_violation';
  const resultMatchesExpected = sample.expectedWorldCoreResult === worldCoreResult;
  const acceptedForGate = schemaValid
    && resultMatchesExpected
    && missingExpectedFamilies.length === 0
    && !unexpectedBlockingFinding
    && !falseNegative;
  const summary = severitySummary(findings);

  return {
    id: sample.id,
    caseType: sample.caseType,
    family: sample.family,
    title: sample.title,
    roundId: sample.roundId,
    agentId: sample.proposal?.agentId,
    agentLayer: sample.proposal?.agentLayer,
    proposalKind: sample.proposal?.proposalKind,
    memoryStatus: sample.proposal?.memoryStatus,
    visibility: sample.proposal?.visibility,
    expectedWorldCoreResult: sample.expectedWorldCoreResult,
    worldCoreResult,
    schemaValid,
    resultMatchesExpected,
    missingExpectedFamilies,
    unexpectedBlockingFinding,
    falseNegative,
    acceptedForGate,
    ...summary,
    findings,
  };
}

function addCoverageFindings(samples, findings) {
  const proposals = samples.map(sample => sample.proposal).filter(Boolean);
  const nonL5AgentIds = new Set(proposals.filter(proposal => proposal.agentLayer !== 'L5').map(proposal => proposal.agentId));
  const l5AgentIds = new Set(proposals.filter(proposal => proposal.agentLayer === 'L5').map(proposal => proposal.agentId));
  const pressureRefs = new Set(samples.flatMap(sample => sample.factionPressureRefs || []));
  const rounds = new Set(samples.map(sample => sample.roundId));
  const families = new Set(samples.map(sample => sample.family));
  const layers = countBy(proposals, proposal => proposal.agentLayer);
  const negativeFamilies = new Set(samples.filter(sample => sample.caseType === 'negative').flatMap(sample => sample.expectedViolationFamilies || []));

  if (nonL5AgentIds.size < 20) addFinding(findings, 'P1', 'coverage', 'coverage_npc_count', `Expected at least 20 unique non-L5 agents, got ${nonL5AgentIds.size}.`);
  if (l5AgentIds.size !== 1) addFinding(findings, 'P1', 'coverage', 'coverage_l5_count', `Expected exactly 1 L5 macro director id, got ${l5AgentIds.size}.`);
  if (pressureRefs.size < 5) addFinding(findings, 'P1', 'coverage', 'coverage_pressure_count', `Expected at least 5 abstract pressure refs, got ${pressureRefs.size}.`);
  if (rounds.size < 8) addFinding(findings, 'P2', 'coverage', 'coverage_round_count', `Expected at least 8 offline rounds, got ${rounds.size}.`);
  for (const family of allowedFamilies) {
    if (!families.has(family)) addFinding(findings, 'P1', 'coverage', 'coverage_family_missing', `Missing sample family ${family}.`);
  }
  for (const layer of allowedLayers) {
    if (!layers[layer]) addFinding(findings, 'P1', 'coverage', 'coverage_layer_missing', `Missing layer ${layer}.`);
  }
  for (const family of ['formal_authority_drift', 'npc_life_death', 'formal_location', 'self_learning_direct_write', 'l5_overreach']) {
    if (!negativeFamilies.has(family)) addFinding(findings, 'P1', 'coverage', 'coverage_negative_family_missing', `Missing negative family ${family}.`);
  }

  return {
    nonL5AgentCount: nonL5AgentIds.size,
    l5AgentCount: l5AgentIds.size,
    pressureRefCount: pressureRefs.size,
    roundCount: rounds.size,
    familyCounts: countBy(samples, sample => sample.family),
    layerCounts: layers,
    memoryStatusCounts: countBy(proposals, proposal => proposal.memoryStatus),
    visibilityCounts: countBy(proposals, proposal => proposal.visibility),
    negativeFamilies: [...negativeFamilies].sort(),
  };
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
  const { resolved, samples } = loadSamples(sampleFile);
  const globalFindings = [];
  if (!dryRun) addFinding(globalFindings, 'P1', 'execution_boundary', 'missing_dry_run', 'v2.7 multi-NPC Agent Lab runner must be run with --dry-run.');
  const coverage = addCoverageFindings(samples, globalFindings);
  const results = samples.map(scoreSample);
  const rescoreResults = samples.map(scoreSample);
  const rescoreStable = hashJson(results.map(result => ({
    id: result.id,
    worldCoreResult: result.worldCoreResult,
    findingCodes: result.findings.map(finding => `${finding.severity}:${finding.family}:${finding.code}`),
  }))) === hashJson(rescoreResults.map(result => ({
    id: result.id,
    worldCoreResult: result.worldCoreResult,
    findingCodes: result.findings.map(finding => `${finding.severity}:${finding.family}:${finding.code}`),
  })));
  if (!rescoreStable) addFinding(globalFindings, 'P1', 'determinism', 'rescore_not_stable', 'Deterministic rescore changed results.');

  const resultFindings = results.flatMap(result => result.findings.map(finding => ({ sampleId: result.id, ...finding })));
  const findings = [...globalFindings, ...resultFindings];
  const findingSummary = severitySummary(findings);
  const schemaValidCount = results.filter(result => result.schemaValid).length;
  const acceptedForGateCount = results.filter(result => result.acceptedForGate).length;
  const positiveUnexpectedBlockingCount = results.filter(result => result.unexpectedBlockingFinding).length;
  const falseNegativeCount = results.filter(result => result.falseNegative).length;
  const resultMismatchCount = results.filter(result => !result.resultMatchesExpected).length;
  const missingExpectedFamilyCount = results.filter(result => result.missingExpectedFamilies.length > 0).length;
  const globalBlockingCount = globalFindings.filter(item => item.severity === 'P0' || item.severity === 'P1').length;
  const passed = dryRun
    && schemaValidCount === samples.length
    && acceptedForGateCount === samples.length
    && positiveUnexpectedBlockingCount === 0
    && falseNegativeCount === 0
    && resultMismatchCount === 0
    && missingExpectedFamilyCount === 0
    && globalBlockingCount === 0
    && rescoreStable
    && Object.values(boundaryAssertions).every(value => value === false);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/v2.7.0/multi-npc-agent-lab', stamp);
  mkdirSync(reportDir, { recursive: true });
  const report = {
    gate: 'v2.7.0-b1-to-rc-multi-npc-agent-lab',
    targetVersion,
    runnerVersion,
    a1ModelVersion,
    a2GateVersion,
    createdAt: new Date().toISOString(),
    mode: 'dry-run-only-report-only',
    noLiveDeepSeek: true,
    noTokenSpend: true,
    noRuntimeWrite: true,
    noSaveWrite: true,
    noExternalFramework: true,
    noSubagents: true,
    noMiroFishExport: true,
    noBackendService: true,
    sampleFile: repoPath(resolved),
    sampleHash: hashJson(samples),
    scenario: {
      scenarioId,
      ...coverage,
    },
    boundaryAssertions,
    summary: {
      sampleCount: samples.length,
      schemaValidCount,
      acceptedForGateCount,
      acceptedCandidateCount: results.filter(result => result.worldCoreResult === 'accepted_candidate').length,
      needsUserDecisionCount: results.filter(result => result.worldCoreResult === 'needs_user_decision').length,
      rejectedViolationCount: results.filter(result => result.worldCoreResult === 'rejected_violation').length,
      positiveUnexpectedBlockingCount,
      falseNegativeCount,
      resultMismatchCount,
      missingExpectedFamilyCount,
      globalBlockingCount,
      rescoreStable,
      acceptedForGate: passed,
      ...findingSummary,
    },
    results,
    findings,
  };
  const reportPath = join(reportDir, 'report.json');
  const summaryPath = join(reportDir, 'summary.md');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(summaryPath, [
    '# v2.7.0 Multi-NPC Agent Lab Summary',
    '',
    `- createdAt: ${report.createdAt}`,
    `- sampleFile: ${report.sampleFile}`,
    `- sampleCount: ${samples.length}`,
    `- nonL5AgentCount: ${coverage.nonL5AgentCount}`,
    `- pressureRefCount: ${coverage.pressureRefCount}`,
    `- l5AgentCount: ${coverage.l5AgentCount}`,
    `- roundCount: ${coverage.roundCount}`,
    `- schemaValidCount: ${schemaValidCount}`,
    `- acceptedCandidateCount: ${report.summary.acceptedCandidateCount}`,
    `- needsUserDecisionCount: ${report.summary.needsUserDecisionCount}`,
    `- rejectedViolationCount: ${report.summary.rejectedViolationCount}`,
    `- falseNegativeCount: ${falseNegativeCount}`,
    `- positiveUnexpectedBlockingCount: ${positiveUnexpectedBlockingCount}`,
    `- resultMismatchCount: ${resultMismatchCount}`,
    `- rescoreStable: ${rescoreStable}`,
    `- acceptedForGate: ${passed}`,
    '',
    'This is synthetic, dry-run, report-only evidence. It does not call live DeepSeek, write runtime state, write save data, use external frameworks, enable subagents, export MiroFish material, or implement a backend service.',
    '',
  ].join('\n'), 'utf8');

  console.log(`[v270-multi-npc-agent-lab] report=${reportPath} samples=${samples.length} schema=${schemaValidCount}/${samples.length} acceptedForGate=${acceptedForGateCount}/${samples.length} falseNegative=${falseNegativeCount} unexpectedBlocking=${positiveUnexpectedBlockingCount} mismatch=${resultMismatchCount} rescoreStable=${rescoreStable} passed=${passed}`);
  if (!passed) process.exit(1);
}

run();
