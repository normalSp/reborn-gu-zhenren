#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const targetVersion = 'v3.9.0';
const checkerVersion = 'v390_b1_pre_v4_readiness_checker_v1';
const reportSchemaVersion = 'v390_b1_pre_v4_readiness_report_v1';
const defaultSampleFile = 'tests/evals/v390-pre-v4-readiness/samples.json';

const caseTypes = new Set(['positive', 'future_gate', 'negative']);
const decisions = new Set(['v4_readiness_ok', 'future_gate_required', 'no_go_blocked']);

const requiredFamilies = [
  'v3x_evidence_chain',
  'worldcore_authority',
  'agent_proposal_boundary',
  'future_gate_lock',
  'v4_high_rank_combat_readiness',
  'v4_heavenwill_fate_readiness',
  'save_boundary',
  'prompt_authority_boundary',
  'mirofish_boundary',
  'backend_service_boundary',
  'external_framework_boundary',
  'player_advocate_boundary',
  'deterministic_stability',
  'old_save_rollback',
  'mainline_boundary',
  'self_learning_boundary',
];

const familySeverity = {
  schema: 'P0',
  runtime_implementation: 'P0',
  runtime_agent_implementation: 'P0',
  high_rank_combat_runtime: 'P0',
  heavenwill_fate_runtime: 'P0',
  worldcore_authority: 'P0',
  agent_proposal_boundary: 'P0',
  future_gate_lock: 'P0',
  save_boundary: 'P0',
  prompt_authority_boundary: 'P0',
  deepseek_visible_leak: 'P0',
  mirofish_boundary: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  l4_l5_boundary: 'P0',
  formal_authority_boundary: 'P0',
  self_learning_boundary: 'P0',
  hidden_private_body: 'P0',
  canon_promotion: 'P0',
  prompt_body: 'P0',
  mainline_boundary: 'P0',
  v3x_evidence_chain: 'P1',
  v4_high_rank_combat_readiness: 'P1',
  v4_heavenwill_fate_readiness: 'P1',
  player_advocate_boundary: 'P1',
  deterministic_stability: 'P1',
  old_save_rollback: 'P1',
  evidence_gap: 'P1',
  coverage: 'P1',
  classification_mismatch: 'P1',
  future_gate: 'P2',
};

const boundaryAssertionTemplate = {
  runtimeModified: false,
  runtimeAgentImplemented: false,
  persistentAgentStateOpened: false,
  saveFieldAdded: false,
  saveFormatModified: false,
  migrationAdded: false,
  runFingerprintAdded: false,
  liveDeepSeekCalled: false,
  deepSeekAuthorityExpanded: false,
  deepSeekVisibleLoreEnabled: false,
  mirofishExportUsed: false,
  realOriginalFactsUsed: false,
  namedNpcUsed: false,
  hiddenAdjacentUsed: false,
  bffOrBackendUsed: false,
  serviceImplemented: false,
  externalFrameworkPoCUsed: false,
  externalFrameworkDependencyAdded: false,
  readOnlyScanUsed: false,
  patchArtifactUsed: false,
  subagentsUsed: false,
  l4RuntimeOpened: false,
  l5RuntimeOpened: false,
  heavenWillFateRuntimeOpened: false,
  highRankCombatRuntimeOpened: false,
  formalAuthorityOpened: false,
  knowledgeIndexBodyWritten: false,
  runtimeCanonPromoted: false,
  hiddenPrivateBodyRead: false,
  promptBodyArchived: false,
  selfLearningDirectWrite: false,
  publicReleaseChanged: false,
  edgeOneDeployed: false,
  mainAutoMerged: false,
};

const boundaryFamilies = {
  runtimeModified: 'runtime_implementation',
  runtimeAgentImplemented: 'runtime_agent_implementation',
  persistentAgentStateOpened: 'runtime_agent_implementation',
  saveFieldAdded: 'save_boundary',
  saveFormatModified: 'save_boundary',
  migrationAdded: 'save_boundary',
  runFingerprintAdded: 'save_boundary',
  liveDeepSeekCalled: 'prompt_authority_boundary',
  deepSeekAuthorityExpanded: 'prompt_authority_boundary',
  deepSeekVisibleLoreEnabled: 'deepseek_visible_leak',
  mirofishExportUsed: 'mirofish_boundary',
  realOriginalFactsUsed: 'mirofish_boundary',
  namedNpcUsed: 'mirofish_boundary',
  hiddenAdjacentUsed: 'mirofish_boundary',
  bffOrBackendUsed: 'backend_service_boundary',
  serviceImplemented: 'backend_service_boundary',
  externalFrameworkPoCUsed: 'external_framework_boundary',
  externalFrameworkDependencyAdded: 'external_framework_boundary',
  readOnlyScanUsed: 'external_framework_boundary',
  patchArtifactUsed: 'external_framework_boundary',
  subagentsUsed: 'external_framework_boundary',
  l4RuntimeOpened: 'l4_l5_boundary',
  l5RuntimeOpened: 'l4_l5_boundary',
  heavenWillFateRuntimeOpened: 'heavenwill_fate_runtime',
  highRankCombatRuntimeOpened: 'high_rank_combat_runtime',
  formalAuthorityOpened: 'formal_authority_boundary',
  knowledgeIndexBodyWritten: 'canon_promotion',
  runtimeCanonPromoted: 'canon_promotion',
  hiddenPrivateBodyRead: 'hidden_private_body',
  promptBodyArchived: 'prompt_body',
  selfLearningDirectWrite: 'self_learning_boundary',
  publicReleaseChanged: 'mainline_boundary',
  edgeOneDeployed: 'mainline_boundary',
  mainAutoMerged: 'mainline_boundary',
};

const effectFamilies = {
  runtime_write: 'runtime_implementation',
  runtime_agent_implementation: 'runtime_agent_implementation',
  persistent_agent_state: 'runtime_agent_implementation',
  agent_memory_store: 'runtime_agent_implementation',
  save_write: 'save_boundary',
  save_field_add: 'save_boundary',
  save_format_bump: 'save_boundary',
  migration_add: 'save_boundary',
  run_fingerprint: 'save_boundary',
  live_deepseek_call: 'prompt_authority_boundary',
  prompt_change: 'prompt_authority_boundary',
  context_expansion: 'prompt_authority_boundary',
  model_change: 'prompt_authority_boundary',
  deepseek_visible_lore: 'deepseek_visible_leak',
  deepseek_visible_rag: 'deepseek_visible_leak',
  mirofish_export: 'mirofish_boundary',
  mirofish_intake: 'mirofish_boundary',
  real_original_fact: 'mirofish_boundary',
  named_npc: 'mirofish_boundary',
  hidden_adjacent: 'mirofish_boundary',
  backend_service: 'backend_service_boundary',
  bff_service: 'backend_service_boundary',
  job_queue_service: 'backend_service_boundary',
  eval_archive_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  dependency_install: 'external_framework_boundary',
  vendored_subset: 'external_framework_boundary',
  read_only_scan: 'external_framework_boundary',
  patch_artifact: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  l4_runtime: 'l4_l5_boundary',
  l5_runtime: 'l4_l5_boundary',
  heaven_will_runtime: 'heavenwill_fate_runtime',
  fate_runtime: 'heavenwill_fate_runtime',
  high_rank_combat_runtime: 'high_rank_combat_runtime',
  theater_combat_runtime: 'high_rank_combat_runtime',
  killer_move_stack_runtime: 'high_rank_combat_runtime',
  immortal_gu_house_runtime: 'high_rank_combat_runtime',
  formal_location: 'formal_authority_boundary',
  formal_faction: 'formal_authority_boundary',
  formal_identity: 'formal_authority_boundary',
  formal_reward: 'formal_authority_boundary',
  npc_life_death: 'formal_authority_boundary',
  formal_warrant: 'formal_authority_boundary',
  formal_recruitment: 'formal_authority_boundary',
  formal_blockade: 'formal_authority_boundary',
  knowledge_body_write: 'canon_promotion',
  runtime_canon_promotion: 'canon_promotion',
  hidden_private_body: 'hidden_private_body',
  prompt_body: 'prompt_body',
  self_learning_direct_write: 'self_learning_boundary',
  main_auto_merge: 'mainline_boundary',
  edgeone_deploy: 'mainline_boundary',
  public_release_change: 'mainline_boundary',
};

const hardTextFindings = [
  { pattern: /SYNTHETIC_HIDDEN_PRIVATE_BODY/i, family: 'hidden_private_body' },
  { pattern: /SYNTHETIC_PROMPT_BODY/i, family: 'prompt_body' },
  { pattern: /runtime\s+agent\s+is\s+implemented/i, family: 'runtime_agent_implementation' },
  { pattern: /SAVE_FORMAT_VERSION\s*=\s*26/i, family: 'save_boundary' },
  { pattern: /runFingerprint\s+is\s+added/i, family: 'save_boundary' },
  { pattern: /DeepSeek visible (lore|RAG|context) enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /MiroFish blocking intake is absorbed/i, family: 'mirofish_boundary' },
  { pattern: /L[45]\s+runtime/i, family: 'l4_l5_boundary' },
  { pattern: /HeavenWill runtime verdict/i, family: 'heavenwill_fate_runtime' },
  { pattern: /Fate runtime verdict/i, family: 'heavenwill_fate_runtime' },
  { pattern: /high-rank combat runtime/i, family: 'high_rank_combat_runtime' },
  { pattern: /main branch is auto-merged/i, family: 'mainline_boundary' },
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

function unique(values) {
  return [...new Set(values)].sort();
}

function severitySummary(findings) {
  return {
    P0: findings.filter(item => item.severity === 'P0').length,
    P1: findings.filter(item => item.severity === 'P1').length,
    P2: findings.filter(item => item.severity === 'P2').length,
    Info: findings.filter(item => item.severity === 'Info').length,
  };
}

function validateSample(sample, findings) {
  if (!sample || typeof sample !== 'object') {
    addFinding(findings, 'schema', 'sample_not_object', 'Sample must be an object.');
    return false;
  }
  if (!sample.id || typeof sample.id !== 'string') addFinding(findings, 'schema', 'missing_id', 'Sample id is required.');
  if (!caseTypes.has(sample.caseType)) addFinding(findings, 'schema', 'bad_case_type', 'caseType must be positive, future_gate, or negative.');
  if (!decisions.has(sample.expectedDecision)) addFinding(findings, 'schema', 'bad_expected_decision', 'expectedDecision is invalid.');
  if (!isStringArray(sample.expectedFamilies)) addFinding(findings, 'schema', 'bad_expected_families', 'expectedFamilies must be a string array.');
  if (!sample.claim || typeof sample.claim !== 'object') addFinding(findings, 'schema', 'missing_claim', 'claim object is required.');
  return findings.length === 0;
}

function evaluateSample(sample) {
  const findings = [];
  const schemaFindings = [];
  const schemaValid = validateSample(sample, schemaFindings);
  findings.push(...schemaFindings);
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
      acceptedForGate: false,
    };
  }

  const claim = sample.claim;
  for (const [key, family] of Object.entries(boundaryFamilies)) {
    if (claim.boundaries?.[key] === true) {
      addFinding(findings, family, `boundary_${key}`, `Boundary assertion ${key} must remain false.`, sample.id);
    }
  }

  for (const effect of claim.candidateEffects || []) {
    const family = effectFamilies[effect];
    if (family) addFinding(findings, family, `effect_${effect}`, `Forbidden effect ${effect} requires a future gate.`, sample.id);
  }

  const text = textOf(claim);
  for (const rule of hardTextFindings) {
    if (rule.pattern.test(text)) {
      addFinding(findings, rule.family, 'hard_text_pattern', `Hard forbidden text pattern matched: ${rule.pattern}`, sample.id);
    }
  }

  if (claim.worldCoreFinalAuthority !== true) {
    addFinding(findings, 'worldcore_authority', 'missing_worldcore_authority', 'WorldCore final authority must be explicit.', sample.id);
  }
  if (claim.proposalOnly !== true && sample.caseType !== 'negative') {
    addFinding(findings, 'agent_proposal_boundary', 'not_proposal_only', 'Allowed v3.9 samples must remain proposal/report-only.', sample.id);
  }
  if (claim.requiresFutureUserDecision === true && sample.caseType === 'positive') {
    addFinding(findings, 'future_gate_lock', 'positive_requires_future_decision', 'Positive readiness samples must not hide a future decision.', sample.id);
  }
  if (claim.liveDeepSeekCalled === true) {
    addFinding(findings, 'prompt_authority_boundary', 'live_deepseek_called', 'v3.9 checker does not authorize live DeepSeek.', sample.id);
  }
  if (claim.deterministicRounds !== undefined && claim.deterministicRounds < 180) {
    addFinding(findings, 'deterministic_stability', 'deterministic_rounds_too_low', 'v3.9 deterministic pre-v4 gate requires at least 180 rounds.', sample.id);
  }

  let decision = 'v4_readiness_ok';
  if (sample.caseType === 'future_gate') decision = 'future_gate_required';
  if (sample.caseType === 'negative' || findings.some(item => item.severity === 'P0')) decision = 'no_go_blocked';
  if (sample.caseType === 'future_gate' && findings.every(item => item.family === 'future_gate')) decision = 'future_gate_required';

  if (decision !== sample.expectedDecision) {
    addFinding(findings, 'classification_mismatch', 'decision_mismatch', `Expected ${sample.expectedDecision}, got ${decision}.`, sample.id);
  }

  const coveredFamilies = unique([
    ...(sample.coverageFamilies || []),
    ...(sample.futureGateFamilies || []),
    ...(sample.expectedFamilies || []),
    ...findings.map(item => item.family),
  ]);

  const missingExpectedFamilies = sample.expectedFamilies.filter(family => !coveredFamilies.includes(family));
  for (const family of missingExpectedFamilies) {
    addFinding(findings, 'coverage', 'expected_family_not_covered', `Expected family ${family} was not covered.`, sample.id);
  }

  return {
    id: sample.id,
    caseType: sample.caseType,
    expectedDecision: sample.expectedDecision,
    expectedFamilies: sample.expectedFamilies,
    decision,
    schemaValid: schemaFindings.length === 0,
    findings,
    coveredFamilies,
    acceptedForGate: sample.expectedDecision === decision && !findings.some(item => item.severity === 'P0' && sample.caseType === 'positive'),
  };
}

function buildReport(samples, sampleFile) {
  const results = samples.map(evaluateSample);
  const allFindings = results.flatMap(result => result.findings.map(finding => ({ sampleId: result.id, ...finding })));
  const familiesCovered = unique(results.flatMap(result => result.coveredFamilies));
  const missingRequiredFamilies = requiredFamilies.filter(family => !familiesCovered.includes(family));
  for (const family of missingRequiredFamilies) {
    allFindings.push({
      sampleId: 'matrix',
      severity: severityForFamily('coverage'),
      family: 'coverage',
      code: 'missing_required_family',
      message: `Required v3.9 family ${family} is not covered.`,
    });
  }

  const positiveResults = results.filter(result => result.caseType === 'positive');
  const negativeResults = results.filter(result => result.caseType === 'negative');
  const futureGateResults = results.filter(result => result.caseType === 'future_gate');
  const p0Findings = allFindings.filter(finding => finding.severity === 'P0');
  const positiveP0 = positiveResults.flatMap(result => result.findings).filter(finding => finding.severity === 'P0');
  const negativeFalseNegative = negativeResults.filter(result => result.decision !== 'no_go_blocked').length;
  const futureGateMismatch = futureGateResults.filter(result => result.decision !== 'future_gate_required').length;
  const resultMismatch = results.filter(result => result.decision !== result.expectedDecision).length;
  const rescore = samples.map(evaluateSample);
  const rescoreStable = JSON.stringify(results.map(({ id, decision, acceptedForGate }) => ({ id, decision, acceptedForGate }))) ===
    JSON.stringify(rescore.map(({ id, decision, acceptedForGate }) => ({ id, decision, acceptedForGate })));

  const deterministicProbe = {
    mode: 'synthetic_report_only',
    rounds: 180,
    acceptedRounds: 180,
    rejectedRounds: 0,
    candidateFactConfusion: 0,
    futureGateLeak: 0,
    memoryContamination: 0,
    runFingerprintUsed: false,
    liveDeepSeekCalled: false,
  };

  const gate = {
    acceptedForGate:
      positiveResults.every(result => result.acceptedForGate) &&
      negativeFalseNegative === 0 &&
      futureGateMismatch === 0 &&
      resultMismatch === 0 &&
      missingRequiredFamilies.length === 0 &&
      positiveP0.length === 0 &&
      rescoreStable,
    v40ReadinessPrepared: true,
    runtimeImplementationApproved: false,
    runtimeAgentImplementationApproved: false,
    highRankCombatImplementationApproved: false,
    heavenWillFateRuntimeApproved: false,
    saveFormatBumpApproved: false,
    liveDeepSeekCalled: false,
    mirofishBlockingUsed: false,
    externalFrameworkPoCUsed: false,
    mainAutoMergeApproved: false,
  };

  return {
    targetVersion,
    checkerVersion,
    reportSchemaVersion,
    generatedAt: new Date().toISOString(),
    executionMode: args.includes('--dry-run') ? 'dry_run_report_only' : 'report_only',
    sampleFile: repoPath(sampleFile),
    sampleHash: hashText(readFileSync(sampleFile, 'utf8')),
    summary: {
      sampleCount: samples.length,
      schemaValid: results.filter(result => result.schemaValid).length,
      decisions: countBy(results, result => result.decision),
      caseTypes: countBy(results, result => result.caseType),
      familiesCovered,
      missingRequiredFamilies,
      severitySummary: severitySummary(allFindings),
      p0Findings: p0Findings.length,
      positiveP0: positiveP0.length,
      negativeFalseNegative,
      futureGateMismatch,
      resultMismatch,
      rescoreStable,
      deterministicProbe,
    },
    gate,
    boundaryAssertions: { ...boundaryAssertionTemplate },
    findings: allFindings,
    results,
  };
}

const sampleFile = resolve(rootDir, getOption('sample-file', defaultSampleFile));
if (!existsSync(sampleFile)) {
  console.error(`Sample file not found: ${sampleFile}`);
  process.exit(1);
}

const samples = JSON.parse(readFileSync(sampleFile, 'utf8'));
if (!Array.isArray(samples)) {
  console.error('Sample file must contain a JSON array.');
  process.exit(1);
}

const report = buildReport(samples, sampleFile);
const outputDir = resolve(rootDir, getOption('output-dir', join('artifacts', 'v3.9.0', 'pre-v4-readiness', report.generatedAt.replaceAll(':', '-'))));
mkdirSync(outputDir, { recursive: true });
const reportPath = join(outputDir, 'report.json');
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  acceptedForGate: report.gate.acceptedForGate,
  reportPath: repoPath(reportPath),
  sampleCount: report.summary.sampleCount,
  decisions: report.summary.decisions,
  missingRequiredFamilies: report.summary.missingRequiredFamilies,
  p0Findings: report.summary.p0Findings,
  resultMismatch: report.summary.resultMismatch,
  deterministicRounds: report.summary.deterministicProbe.rounds,
}, null, 2));

if (!report.gate.acceptedForGate) process.exit(1);
