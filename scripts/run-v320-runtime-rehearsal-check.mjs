#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const targetVersion = 'v3.2.0';
const checkerVersion = 'v320_b1_runtime_rehearsal_report_checker_v1';
const reportSchemaVersion = 'v320_b1_runtime_rehearsal_report_v1';
const scopeVersion = 'v320_a0_runtime_rehearsal_scope_v1';
const snapshotVersion = 'v320_a1_synthetic_world_snapshot_rehearsal_envelope_v1';
const chainVersion = 'v320_a2_proposal_postcheck_expression_chain_v1';
const defaultSampleFile = 'tests/evals/v320-runtime-rehearsal/samples.json';

const caseTypes = new Set(['positive', 'manual_review', 'future_gate', 'negative']);
const decisions = new Set(['rehearsal_ok', 'manual_review_required', 'future_gate_required', 'rejected_violation', 'no_go_blocked']);
const allowedAgentLayers = new Set(['L2', 'L3']);
const allowedPostCheckOutcomes = new Set(['approved_expression', 'rejected_violation', 'manual_review', 'future_gate_required']);

const requiredFamilies = [
  'synthetic_world_snapshot',
  'rehearsal_envelope_schema',
  'l2_l3_proposal_batch',
  'worldcore_postcheck_rehearsal',
  'approved_expression_sample',
  'rejection_chain',
  'manual_review_chain',
  'future_gate_chain',
  'same_start_candidate_difference',
  'rollback_old_save_gate',
  'player_advocate_metadata',
  'live_metadata_gate',
  'drift_checkpoint',
  'visible_context_boundary',
  'transient_persistence',
  'runtime_agent_implementation',
  'save_boundary',
  'prompt_authority_boundary',
  'mirofish_boundary',
  'backend_service_boundary',
  'external_framework_boundary',
  'formal_authority_boundary',
  'l4_l5_boundary',
  'self_learning_boundary',
];

const familySeverity = {
  schema: 'P0',
  synthetic_world_snapshot: 'P0',
  rehearsal_envelope_schema: 'P0',
  l2_l3_proposal_batch: 'P0',
  worldcore_postcheck_rehearsal: 'P0',
  approved_expression_sample: 'P1',
  rejection_chain: 'P1',
  manual_review_chain: 'P1',
  future_gate_chain: 'P1',
  visible_context_boundary: 'P0',
  transient_persistence: 'P0',
  runtime_agent_implementation: 'P0',
  save_boundary: 'P0',
  prompt_authority_boundary: 'P0',
  deepseek_visible_leak: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  mirofish_boundary: 'P0',
  formal_authority_boundary: 'P0',
  l4_l5_boundary: 'P0',
  self_learning_boundary: 'P0',
  hidden_private_body: 'P0',
  canon_promotion: 'P0',
  prompt_body: 'P0',
  rollback_old_save_gate: 'P1',
  player_advocate_metadata: 'P1',
  live_metadata_gate: 'P1',
  drift_checkpoint: 'P1',
  same_start_candidate_difference: 'P1',
  evidence_gap: 'P1',
  classification_mismatch: 'P1',
  future_gate: 'P2',
};

const boundaryAssertionTemplate = {
  runtimeModified: false,
  runtimeAgentImplemented: false,
  worldCoreRuntimeConnected: false,
  saveFieldAdded: false,
  saveFormatModified: false,
  runFingerprintAdded: false,
  deepSeekLiveCalled: false,
  deepSeekAuthorityExpanded: false,
  deepSeekVisibleLoreEnabled: false,
  bffOrBackendUsed: false,
  serviceImplemented: false,
  externalFrameworkPoCUsed: false,
  dependencyAdded: false,
  readOnlyScanUsed: false,
  patchArtifactUsed: false,
  subagentsUsed: false,
  mirofishExportUsed: false,
  realOriginalFactsUsed: false,
  namedNpcUsed: false,
  hiddenAdjacentUsed: false,
  formalLoreConclusionUsed: false,
  knowledgeIndexBodyWritten: false,
  runtimeCanonPromoted: false,
  hiddenPrivateBodyRead: false,
  promptBodyArchived: false,
  formalLocationFactionIdentityRewardNpcLifeDeathOpened: false,
  l4RuntimeOpened: false,
  l5RuntimeOpened: false,
  selfLearningDirectWrite: false,
  highRankCombatRuntimeOpened: false,
  edgeOneDeployed: false,
  v33ImplementationApproved: false,
};

const boundaryFamilies = {
  runtimeModified: 'runtime_agent_implementation',
  runtimeAgentImplemented: 'runtime_agent_implementation',
  worldCoreRuntimeConnected: 'runtime_agent_implementation',
  saveFieldAdded: 'save_boundary',
  saveFormatModified: 'save_boundary',
  runFingerprintAdded: 'save_boundary',
  deepSeekLiveCalled: 'prompt_authority_boundary',
  deepSeekAuthorityExpanded: 'prompt_authority_boundary',
  deepSeekVisibleLoreEnabled: 'deepseek_visible_leak',
  bffOrBackendUsed: 'backend_service_boundary',
  serviceImplemented: 'backend_service_boundary',
  externalFrameworkPoCUsed: 'external_framework_boundary',
  dependencyAdded: 'external_framework_boundary',
  readOnlyScanUsed: 'external_framework_boundary',
  patchArtifactUsed: 'external_framework_boundary',
  subagentsUsed: 'external_framework_boundary',
  mirofishExportUsed: 'mirofish_boundary',
  realOriginalFactsUsed: 'mirofish_boundary',
  namedNpcUsed: 'mirofish_boundary',
  hiddenAdjacentUsed: 'mirofish_boundary',
  formalLoreConclusionUsed: 'mirofish_boundary',
  knowledgeIndexBodyWritten: 'canon_promotion',
  runtimeCanonPromoted: 'canon_promotion',
  hiddenPrivateBodyRead: 'hidden_private_body',
  promptBodyArchived: 'prompt_body',
  formalLocationFactionIdentityRewardNpcLifeDeathOpened: 'formal_authority_boundary',
  l4RuntimeOpened: 'l4_l5_boundary',
  l5RuntimeOpened: 'l4_l5_boundary',
  selfLearningDirectWrite: 'self_learning_boundary',
  highRankCombatRuntimeOpened: 'future_gate',
  edgeOneDeployed: 'future_gate',
  v33ImplementationApproved: 'runtime_agent_implementation',
};

const effectFamilies = {
  runtime_agent_implementation: 'runtime_agent_implementation',
  runtime_write: 'runtime_agent_implementation',
  worldcore_runtime_connect: 'runtime_agent_implementation',
  save_write: 'save_boundary',
  save_field_add: 'save_boundary',
  save_format_bump: 'save_boundary',
  run_fingerprint: 'save_boundary',
  prompt_change: 'prompt_authority_boundary',
  context_expansion: 'prompt_authority_boundary',
  live_deepseek_call: 'prompt_authority_boundary',
  deepseek_visible_lore: 'deepseek_visible_leak',
  deepseek_visible_rag: 'deepseek_visible_leak',
  backend_service: 'backend_service_boundary',
  bff_service: 'backend_service_boundary',
  job_queue_service: 'backend_service_boundary',
  eval_archive_service: 'backend_service_boundary',
  private_canon_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  dependency_install: 'external_framework_boundary',
  vendored_subset: 'external_framework_boundary',
  read_only_scan: 'external_framework_boundary',
  patch_artifact: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  mirofish_export: 'mirofish_boundary',
  named_npc: 'mirofish_boundary',
  hidden_adjacent: 'mirofish_boundary',
  formal_lore_conclusion: 'mirofish_boundary',
  l4_runtime: 'l4_l5_boundary',
  l5_runtime: 'l4_l5_boundary',
  fate_verdict: 'l4_l5_boundary',
  heaven_will_verdict: 'l4_l5_boundary',
  self_learning_direct_write: 'self_learning_boundary',
  canon_write: 'canon_promotion',
  knowledge_body_write: 'canon_promotion',
  hidden_private_body: 'hidden_private_body',
  prompt_body: 'prompt_body',
  formal_location: 'formal_authority_boundary',
  formal_faction: 'formal_authority_boundary',
  formal_identity: 'formal_authority_boundary',
  formal_reward: 'formal_authority_boundary',
  npc_life_death: 'formal_authority_boundary',
  formal_warrant: 'formal_authority_boundary',
  formal_recruitment: 'formal_authority_boundary',
  high_rank_combat_runtime: 'future_gate',
  v33_implementation_approval: 'runtime_agent_implementation',
};

const hardTextFindings = [
  { pattern: /SYNTHETIC_HIDDEN_PRIVATE_BODY/i, family: 'hidden_private_body' },
  { pattern: /SYNTHETIC_PROMPT_BODY/i, family: 'prompt_body' },
  { pattern: /runtime\s+agent\s+is\s+implemented/i, family: 'runtime_agent_implementation' },
  { pattern: /SAVE_FORMAT_VERSION\s*=\s*26/i, family: 'save_boundary' },
  { pattern: /DeepSeek visible (lore|RAG|context) enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /L[45]\s+runtime/i, family: 'l4_l5_boundary' },
  { pattern: /self-learning writes/i, family: 'self_learning_boundary' },
  { pattern: /F-300.*approved.*implementation/i, family: 'runtime_agent_implementation' },
];

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

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

function severityForFamily(family) {
  return familySeverity[family] || 'P2';
}

function addFinding(findings, family, code, message, ref = undefined) {
  findings.push({
    severity: severityForFamily(family),
    family,
    code,
    message,
    ...(ref ? { ref } : {}),
  });
}

function textOf(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textOf).join(' ');
  return '';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function severitySummary(findings) {
  return {
    P0: findings.filter(item => item.severity === 'P0').length,
    P1: findings.filter(item => item.severity === 'P1').length,
    P2: findings.filter(item => item.severity === 'P2').length,
  };
}

function unique(values) {
  return [...new Set(values)].sort();
}

function validateSample(sample, findings) {
  if (!sample || typeof sample !== 'object') {
    addFinding(findings, 'schema', 'sample_not_object', 'Sample must be an object.');
    return false;
  }
  if (!sample.id || typeof sample.id !== 'string') addFinding(findings, 'schema', 'missing_id', 'Sample id is required.');
  if (!caseTypes.has(sample.caseType)) addFinding(findings, 'schema', 'bad_case_type', 'caseType must be positive, manual_review, future_gate, or negative.');
  if (!decisions.has(sample.expectedDecision)) addFinding(findings, 'schema', 'bad_expected_decision', 'expectedDecision is invalid.');
  if (!isStringArray(sample.expectedFamilies)) addFinding(findings, 'schema', 'bad_expected_families', 'expectedFamilies must be a string array.');
  if (!sample.claim || typeof sample.claim !== 'object') addFinding(findings, 'schema', 'missing_claim', 'claim object is required.');
  return findings.length === 0;
}

function evaluateSample(sample) {
  const findings = [];
  const schemaValid = validateSample(sample, findings);
  if (!schemaValid) {
    return {
      id: sample?.id || 'unknown',
      caseType: sample?.caseType || 'invalid',
      expectedDecision: sample?.expectedDecision || 'invalid',
      expectedFamilies: sample?.expectedFamilies || [],
      decision: 'no_go_blocked',
      schemaValid: false,
      findings,
      coveredFamilies: unique(findings.map(item => item.family)),
      matchedExpectedFamilies: [],
      missingExpectedFamilies: sample?.expectedFamilies || [],
    };
  }

  const claim = sample.claim;
  const coveredFamilies = new Set(sample.coverageFamilies || []);
  const futureGateFamilies = new Set(sample.futureGateFamilies || []);
  const shouldCheckContract = sample.caseType === 'positive' || sample.caseType === 'manual_review' || sample.caseType === 'negative';

  if (shouldCheckContract && Array.isArray(claim.agentLayers)) {
    for (const layer of claim.agentLayers) {
      if (!allowedAgentLayers.has(layer)) addFinding(findings, 'l4_l5_boundary', 'non_l2_l3_layer', `Layer ${layer} is not allowed for v3.2 rehearsal.`);
    }
  } else if (shouldCheckContract) {
    addFinding(findings, 'schema', 'missing_agent_layers', 'claim.agentLayers must be an array.');
  }

  if (shouldCheckContract) {
    if (claim.proposalOnly === false) addFinding(findings, 'l2_l3_proposal_batch', 'not_proposal_only', 'Agent output cannot leave proposal-only mode.');
    if (claim.expressionOnly === false) addFinding(findings, 'approved_expression_sample', 'not_expression_only', 'Approved output must stay expression-only.');
    if (claim.worldCoreFinalAuthority === false) addFinding(findings, 'worldcore_postcheck_rehearsal', 'worldcore_not_final_authority', 'WorldCore final authority cannot be disabled.');
    if (claim.requiresWorldCorePostCheck === false) addFinding(findings, 'worldcore_postcheck_rehearsal', 'postcheck_disabled', 'WorldCore post-check cannot be disabled.');
    if (claim.persistenceMode && claim.persistenceMode !== 'transient_candidate_only') addFinding(findings, 'transient_persistence', 'bad_persistence_mode', 'v3.2 rehearsal cannot use persistent agent state.');
    if (claim.postCheckOutcome && !allowedPostCheckOutcomes.has(claim.postCheckOutcome)) addFinding(findings, 'worldcore_postcheck_rehearsal', 'bad_postcheck_outcome', 'postCheckOutcome is invalid.');
  }

  if (sample.caseType === 'positive') {
    if (claim.syntheticWorldSnapshot !== true) addFinding(findings, 'synthetic_world_snapshot', 'missing_synthetic_snapshot', 'Positive rehearsal needs a synthetic world snapshot.');
    if (claim.rehearsalEnvelopeVersion !== snapshotVersion) addFinding(findings, 'rehearsal_envelope_schema', 'bad_envelope_version', 'Unexpected rehearsal envelope version.');
    if (claim.proposalBatch !== true) addFinding(findings, 'l2_l3_proposal_batch', 'missing_proposal_batch', 'Positive rehearsal needs a proposal batch.');
    if (claim.smallAreaOnly !== true) addFinding(findings, 'l2_l3_proposal_batch', 'missing_small_area_limit', 'Positive rehearsal must be limited to one small area.');
    if (claim.proposalOnly !== true) addFinding(findings, 'l2_l3_proposal_batch', 'missing_proposal_only', 'Agent output must remain proposal-only.');
    if (claim.expressionOnly !== true) addFinding(findings, 'approved_expression_sample', 'missing_expression_only', 'Approved sample must be expression-only.');
    if (claim.noUiSurface !== true) addFinding(findings, 'approved_expression_sample', 'missing_no_ui_surface', 'Approved sample must not enter UI.');
    if (claim.visibleContextLimited !== true || claim.visibilityClass !== 'synthetic_redacted') addFinding(findings, 'visible_context_boundary', 'missing_visible_context_limit', 'Visible context must be synthetic_redacted and bounded.');
    if (claim.worldCoreFinalAuthority !== true || claim.requiresWorldCorePostCheck !== true) addFinding(findings, 'worldcore_postcheck_rehearsal', 'missing_worldcore_postcheck', 'WorldCore final authority and post-check are required.');
    if (claim.postCheckOutcome !== 'approved_expression') addFinding(findings, 'approved_expression_sample', 'missing_approved_expression', 'Positive rehearsal must end in approved_expression.');
    if (claim.persistenceMode !== 'transient_candidate_only') addFinding(findings, 'transient_persistence', 'missing_transient_persistence_mode', 'v3.2 requires transient candidates only.');
    if (claim.noSaveFieldAdded !== true) addFinding(findings, 'save_boundary', 'missing_no_save_field_assertion', 'Positive rehearsal must assert no new save field.');
    if (claim.rollbackPlanReady !== true || claim.oldSavePlanReady !== true) addFinding(findings, 'rollback_old_save_gate', 'missing_rollback_old_save_plan', 'v3.2 needs rollback and old-save gates.');
    if (!claim.playerAdvocateMetadata || claim.playerAdvocateMetadata.liveDeepSeekCalled !== false) addFinding(findings, 'player_advocate_metadata', 'missing_pa_live_deepseek_no', 'Player Advocate metadata must record live DeepSeek: no.');
    if (!claim.liveMetadata || claim.liveMetadata.liveDeepSeekCalled !== false) addFinding(findings, 'live_metadata_gate', 'missing_live_metadata_no', 'Live metadata must record live DeepSeek: no.');
    if (!Array.isArray(claim.driftCheckpoints) || claim.driftCheckpoints.length < 2) addFinding(findings, 'drift_checkpoint', 'missing_drift_checkpoints', 'v3.2 rehearsal needs at least two drift checkpoints.');
    if (!isStringArray(claim.evidenceRefs) || claim.evidenceRefs.length < 2) addFinding(findings, 'evidence_gap', 'missing_evidence_refs', 'Positive rehearsal needs at least two evidence refs.');
    if (claim.v33DecisionPackageOnly !== undefined && claim.v33DecisionPackageOnly !== true) addFinding(findings, 'future_gate_chain', 'v33_not_decision_only', 'v3.3 package must remain decision-only.');
    if (claim.runtimeImplementationApproved === true) addFinding(findings, 'runtime_agent_implementation', 'runtime_implementation_approved', 'v3.2 cannot approve runtime implementation.');
  }

  if (sample.caseType === 'manual_review') {
    if (!['manual_review'].includes(claim.postCheckOutcome)) addFinding(findings, 'manual_review_chain', 'missing_manual_review_outcome', 'Manual review samples must route to manual_review.');
    if (claim.manualReviewRoute !== true && claim.needsUserDecision !== true) addFinding(findings, 'manual_review_chain', 'missing_manual_review_route', 'Manual review samples must preserve the human review chain.');
  }

  for (const [key, family] of Object.entries(boundaryFamilies)) {
    if (claim.boundaries && claim.boundaries[key] === true) addFinding(findings, family, `boundary_${key}`, `${key} is not allowed in v3.2 rehearsal.`);
  }

  for (const effect of claim.candidateEffects || []) {
    const family = effectFamilies[effect];
    if (family) addFinding(findings, family, `effect_${effect}`, `candidateEffects contains forbidden effect ${effect}.`);
  }

  const text = textOf(claim);
  for (const item of hardTextFindings) {
    if (item.pattern.test(text)) addFinding(findings, item.family, 'hard_text_boundary', `Text matched forbidden pattern ${item.pattern}.`);
  }

  for (const finding of findings) coveredFamilies.add(finding.family);
  for (const family of futureGateFamilies) coveredFamilies.add(family);

  let decision = 'rehearsal_ok';
  if (sample.caseType === 'negative' && findings.some(item => item.severity === 'P0' || item.severity === 'P1')) {
    decision = 'rejected_violation';
  } else if (findings.some(item => item.severity === 'P0' || item.severity === 'P1')) {
    decision = 'no_go_blocked';
  } else if (sample.caseType === 'future_gate' || futureGateFamilies.size > 0 || claim.requiresFutureUserDecision === true) {
    decision = 'future_gate_required';
  } else if (sample.caseType === 'manual_review' || claim.postCheckOutcome === 'manual_review' || claim.needsUserDecision === true) {
    decision = 'manual_review_required';
  }

  if (sample.caseType === 'negative' && findings.length === 0) {
    addFinding(findings, 'classification_mismatch', 'negative_not_caught', 'Negative sample did not trigger a blocking finding.');
    coveredFamilies.add('classification_mismatch');
    decision = 'no_go_blocked';
  }

  const matchedExpectedFamilies = sample.expectedFamilies.filter(family => coveredFamilies.has(family));
  const missingExpectedFamilies = sample.expectedFamilies.filter(family => !coveredFamilies.has(family));

  return {
    id: sample.id,
    caseType: sample.caseType,
    expectedDecision: sample.expectedDecision,
    expectedFamilies: sample.expectedFamilies,
    decision,
    schemaValid: findings.every(item => item.family !== 'schema'),
    findings,
    coveredFamilies: unique([...coveredFamilies]),
    matchedExpectedFamilies,
    missingExpectedFamilies,
  };
}

function buildReport(samples, sampleFile, sampleHash, outputPath) {
  const results = samples.map(evaluateSample);
  const resultFingerprints = results.map(result => ({
    id: result.id,
    decision: result.decision,
    findings: result.findings.map(item => `${item.severity}:${item.family}:${item.code}`).sort(),
  }));
  const secondPass = samples.map(evaluateSample).map(result => ({
    id: result.id,
    decision: result.decision,
    findings: result.findings.map(item => `${item.severity}:${item.family}:${item.code}`).sort(),
  }));

  const allFindings = results.flatMap(result => result.findings.map(finding => ({ ...finding, caseId: result.id })));
  const p0FalseNegativeCount = results.filter(result =>
    result.caseType === 'negative' &&
    result.expectedFamilies.some(family => severityForFamily(family) === 'P0') &&
    !result.findings.some(finding => finding.severity === 'P0')
  ).length;
  const p1FalseNegativeCount = results.filter(result =>
    result.caseType === 'negative' &&
    result.expectedFamilies.some(family => severityForFamily(family) === 'P1') &&
    !result.findings.some(finding => finding.severity === 'P1' || finding.severity === 'P0')
  ).length;
  const resultMismatchCount = results.filter(result => result.decision !== result.expectedDecision).length;
  const missingExpectedFamilyCount = results.reduce((sum, result) => sum + result.missingExpectedFamilies.length, 0);
  const coveredFamilies = unique(results.flatMap(result => result.coveredFamilies));
  const missingRequiredFamilies = requiredFamilies.filter(family => !coveredFamilies.includes(family));
  const boundaryAssertions = { ...boundaryAssertionTemplate };
  const boundaryAssertionFailed = Object.values(boundaryAssertions).some(Boolean);
  const rescoreStable = JSON.stringify(resultFingerprints) === JSON.stringify(secondPass);
  const schemaValidCount = results.filter(result => result.schemaValid).length;
  const acceptedForGate =
    schemaValidCount === samples.length &&
    p0FalseNegativeCount === 0 &&
    p1FalseNegativeCount === 0 &&
    resultMismatchCount === 0 &&
    missingExpectedFamilyCount === 0 &&
    missingRequiredFamilies.length === 0 &&
    rescoreStable &&
    !boundaryAssertionFailed;

  return {
    schemaVersion: reportSchemaVersion,
    checkerVersion,
    scopeVersion,
    snapshotVersion,
    chainVersion,
    generatedAt: new Date().toISOString(),
    targetVersion,
    executionMode: 'dry_run_report_only',
    sourceInputs: [
      { kind: 'sample_file', path: repoPath(sampleFile), sha256: sampleHash },
      {
        kind: 'v3_1_gate_hardening_report',
        path: 'artifacts/v3.1.0/runtime-agent-gate-hardening/2026-05-24T12-05-40-329Z/report.json',
        available: existsSync(join(rootDir, 'artifacts/v3.1.0/runtime-agent-gate-hardening/2026-05-24T12-05-40-329Z/report.json')),
      },
      {
        kind: 'v3_2_frontloaded_pack',
        path: '指导大纲/v3.2.0/codex/00-总览/v3.2.0-前置授权包.md',
        available: existsSync(join(rootDir, '指导大纲/v3.2.0/codex/00-总览/v3.2.0-前置授权包.md')),
      },
    ],
    caseSummary: {
      sampleCount: samples.length,
      schemaValidCount,
      decisionCounts: countBy(results, result => result.decision),
      caseTypeCounts: countBy(results, result => result.caseType),
      coveredFamilies,
      missingRequiredFamilies,
    },
    severitySummary: severitySummary(allFindings),
    familySummary: countBy(allFindings, finding => finding.family),
    gateResult: {
      acceptedForGate,
      rehearsalComplete: acceptedForGate,
      v33DecisionPackageReady: acceptedForGate,
      reportOnlyCompletion: true,
      runtimeImplementationApproved: false,
      liveDeepSeekCalled: false,
      p0FalseNegativeCount,
      p1FalseNegativeCount,
      resultMismatchCount,
      missingExpectedFamilyCount,
      missingRequiredFamilyCount: missingRequiredFamilies.length,
      rescoreStable,
      boundaryAssertionFailed,
      blockReasons: acceptedForGate
        ? []
        : [
          ...(schemaValidCount !== samples.length ? ['schema_invalid'] : []),
          ...(p0FalseNegativeCount > 0 ? ['p0_false_negative'] : []),
          ...(p1FalseNegativeCount > 0 ? ['p1_false_negative'] : []),
          ...(resultMismatchCount > 0 ? ['result_mismatch'] : []),
          ...(missingExpectedFamilyCount > 0 ? ['missing_expected_family'] : []),
          ...(missingRequiredFamilies.length > 0 ? ['missing_required_family'] : []),
          ...(!rescoreStable ? ['rescore_unstable'] : []),
          ...(boundaryAssertionFailed ? ['boundary_assertion_failed'] : []),
        ],
    },
    boundaryAssertions,
    results,
    outputPath: repoPath(outputPath),
  };
}

function main() {
  const sampleFile = resolve(rootDir, getOption('sample-file', defaultSampleFile));
  if (!existsSync(sampleFile)) throw new Error(`Sample file not found: ${sampleFile}`);
  const raw = readFileSync(sampleFile, 'utf8');
  const samples = JSON.parse(raw);
  if (!Array.isArray(samples) || samples.length === 0) throw new Error('Sample file must contain a non-empty array.');

  const outputRoot = resolve(rootDir, getOption('output-root', 'artifacts/v3.2.0/runtime-rehearsal'));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(outputRoot, timestamp);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'report.json');
  const report = buildReport(samples, sampleFile, hashText(raw), outputPath);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const result = report.gateResult.acceptedForGate ? 'accepted' : 'blocked';
  console.log(`[v320-runtime-rehearsal] ${result}`);
  console.log(`report=${repoPath(outputPath)}`);
  console.log(`schemaValid=${report.caseSummary.schemaValidCount}/${report.caseSummary.sampleCount}`);
  console.log(`decisions=${JSON.stringify(report.caseSummary.decisionCounts)}`);
  console.log(`P0/P1 falseNegative=${report.gateResult.p0FalseNegativeCount}/${report.gateResult.p1FalseNegativeCount}`);
  console.log(`resultMismatch=${report.gateResult.resultMismatchCount}`);
  console.log(`missingRequiredFamilies=${report.caseSummary.missingRequiredFamilies.length}`);
  console.log(`v33DecisionPackageReady=${report.gateResult.v33DecisionPackageReady}`);
  console.log(`runtimeImplementationApproved=${report.gateResult.runtimeImplementationApproved}`);
  if (!report.gateResult.acceptedForGate) {
    console.error(`blockReasons=${report.gateResult.blockReasons.join(',')}`);
    process.exit(1);
  }
}

main();
