#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targetVersion = 'v2.6.0';
const schemaVersion = 'v260_private_canon_archive_boundary_report_v1';
const boundaryModelVersion = 'v260_a1_job_replay_archive_boundary_model_v1';
const classifierModelVersion = 'v260_a2_private_canon_classifier_interface_v1';
const checkerVersion = 'v260_b1_private_canon_archive_boundary_checker_v1';
const negativeFixtureVersion = 'v260_b2_negative_fixture_manual_review_queue_v1';
const scenarioId = 'v260_private_canon_archive_boundary_synthetic_v1';
const defaultSampleFile = 'tests/evals/v260-private-canon-archive-boundary/samples.json';

const allowedCaseTypes = new Set(['positive', 'negative', 'mutation']);
const allowedRecordKinds = new Set([
  'job_envelope',
  'replay_envelope',
  'archive_envelope',
  'classifier_decision',
  'manual_review_item',
  'self_learning_candidate',
]);
const allowedDispositions = new Set([
  'accepted_for_gate',
  'accepted_with_warning',
  'needs_manual_review',
  'needs_user_decision',
  'rejected_violation',
]);
const allowedSeverities = ['Info', 'P2', 'P1', 'P0'];
const allowedFailureFamilies = new Set([
  'hidden_private_body_archival',
  'prompt_body_archival',
  'original_text_archival',
  'deepseek_visible_leak',
  'runtime_or_save_write',
  'backend_service_boundary',
  'external_framework_boundary',
  'mirofish_boundary',
  'formal_authority_drift',
  'self_learning_direct_write',
  'worldcore_postcheck_missing',
  'source_pointer_misuse',
  'manual_review_required',
  'metadata_gap',
  'memory_contamination',
  'l5_overreach',
]);
const familySeverity = {
  hidden_private_body_archival: 'P0',
  prompt_body_archival: 'P0',
  original_text_archival: 'P0',
  deepseek_visible_leak: 'P0',
  runtime_or_save_write: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  mirofish_boundary: 'P0',
  formal_authority_drift: 'P0',
  self_learning_direct_write: 'P0',
  worldcore_postcheck_missing: 'P0',
  source_pointer_misuse: 'P2',
  manual_review_required: 'P2',
  metadata_gap: 'P2',
  memory_contamination: 'P1',
  l5_overreach: 'P0',
};
const forbiddenKeyFamilies = {
  hiddenBody: 'hidden_private_body_archival',
  privateBody: 'hidden_private_body_archival',
  hiddenPrivateBody: 'hidden_private_body_archival',
  protectedBody: 'hidden_private_body_archival',
  promptBody: 'prompt_body_archival',
  systemPrompt: 'prompt_body_archival',
  userPrompt: 'prompt_body_archival',
  rawPrompt: 'prompt_body_archival',
  originalText: 'original_text_archival',
  rawOriginalText: 'original_text_archival',
  sourceBody: 'original_text_archival',
  rawSourceText: 'original_text_archival',
  quoteText: 'original_text_archival',
  fullBookText: 'original_text_archival',
  deepSeekVisibleLore: 'deepseek_visible_leak',
  deepSeekVisibleRag: 'deepseek_visible_leak',
  deepseekVisibleContext: 'deepseek_visible_leak',
  deepseekContextPatch: 'deepseek_visible_leak',
  savePatch: 'runtime_or_save_write',
  stateUpdate: 'runtime_or_save_write',
  storePatch: 'runtime_or_save_write',
  runtimePatch: 'runtime_or_save_write',
  canonPatch: 'runtime_or_save_write',
  knowledgeIndexBody: 'runtime_or_save_write',
  runtimeCanonBody: 'runtime_or_save_write',
  privateCanonService: 'backend_service_boundary',
  evalArchiveService: 'backend_service_boundary',
  backendService: 'backend_service_boundary',
  serviceEndpoint: 'backend_service_boundary',
  jobQueueService: 'backend_service_boundary',
  cloudSave: 'backend_service_boundary',
  externalFrameworkPoC: 'external_framework_boundary',
  externalFrameworkDependency: 'external_framework_boundary',
  vendoredSubset: 'external_framework_boundary',
  readOnlyScan: 'external_framework_boundary',
  patchArtifact: 'external_framework_boundary',
  subagentUsed: 'external_framework_boundary',
  fileWrite: 'external_framework_boundary',
  commandExecution: 'external_framework_boundary',
  gitOperation: 'external_framework_boundary',
  mirofishRawOutput: 'mirofish_boundary',
  mirofishExportBody: 'mirofish_boundary',
  formalLocation: 'formal_authority_drift',
  formalFaction: 'formal_authority_drift',
  formalIdentity: 'formal_authority_drift',
  formalCredential: 'formal_authority_drift',
  rewardGrant: 'formal_authority_drift',
  npcDeath: 'formal_authority_drift',
  npcLifeDeath: 'formal_authority_drift',
  canonPromotion: 'formal_authority_drift',
  selfLearningDirectWrite: 'self_learning_direct_write',
  directSkillPatch: 'self_learning_direct_write',
  directPromptPatch: 'self_learning_direct_write',
  directCanonPatch: 'self_learning_direct_write',
  directRuntimePatch: 'self_learning_direct_write',
};
const forbiddenEffectFamilies = {
  hidden_body_archive: 'hidden_private_body_archival',
  private_body_archive: 'hidden_private_body_archival',
  prompt_body_archive: 'prompt_body_archival',
  original_text_archive: 'original_text_archival',
  source_body_archive: 'original_text_archival',
  deepseek_visible_lore: 'deepseek_visible_leak',
  deepseek_visible_rag: 'deepseek_visible_leak',
  save_write: 'runtime_or_save_write',
  runtime_write: 'runtime_or_save_write',
  canon_write: 'runtime_or_save_write',
  knowledge_body_write: 'runtime_or_save_write',
  backend_service: 'backend_service_boundary',
  eval_archive_service: 'backend_service_boundary',
  job_queue_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  dependency_install: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  mirofish_export: 'mirofish_boundary',
  formal_location: 'formal_authority_drift',
  formal_faction: 'formal_authority_drift',
  formal_identity: 'formal_authority_drift',
  reward_grant: 'formal_authority_drift',
  npc_life_death: 'formal_authority_drift',
  self_learning_direct_write: 'self_learning_direct_write',
  l5_verdict: 'l5_overreach',
};
const hardForbiddenText = [
  { pattern: /SYNTHETIC_(HIDDEN|PRIVATE|PROMPT|ORIGINAL)_BODY/i, family: 'hidden_private_body_archival' },
  { pattern: /DeepSeek\s+visible\s+(lore|RAG|context)\s+enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /writes?\s+to\s+(save|runtime|canon|prompt|skill)/i, family: 'runtime_or_save_write' },
  { pattern: /service\s+is\s+implemented/i, family: 'backend_service_boundary' },
  { pattern: /officially\s+(joins|unlocks|grants)/i, family: 'formal_authority_drift' },
  { pattern: /fate\s+is\s+(sealed|decided)/i, family: 'l5_overreach' },
];
const boundaryAssertions = {
  runtimeModified: false,
  saveFormatModified: false,
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
  saveFieldAdded: false,
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

function severityRank(severity) {
  return allowedSeverities.indexOf(severity);
}

function maxSeverity(severities) {
  return severities.reduce((max, severity) => (
    severityRank(severity) > severityRank(max) ? severity : max
  ), 'Info');
}

function addFinding(findings, severity, family, code, message, ref = undefined) {
  findings.push({ severity, family, code, message, ...(ref ? { ref } : {}) });
}

function summarizeBy(items, getKey) {
  const result = {};
  for (const item of items) {
    const key = getKey(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function summarizeSeverity(findings) {
  return {
    P0: findings.filter(item => item.severity === 'P0').length,
    P1: findings.filter(item => item.severity === 'P1').length,
    P2: findings.filter(item => item.severity === 'P2').length,
    Info: findings.filter(item => item.severity === 'Info').length,
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

function validateCaseShape(testCase) {
  const findings = [];
  for (const key of ['caseId', 'caseType', 'scenarioId', 'recordKind', 'expectedDisposition', 'expectedSeverity']) {
    if (typeof testCase[key] !== 'string' || !testCase[key].trim()) {
      addFinding(findings, 'P0', 'metadata_gap', 'case_schema_missing_string', `${key} must be a non-empty string.`);
    }
  }
  if (testCase.scenarioId !== scenarioId) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_wrong_scenario', `scenarioId must be ${scenarioId}.`);
  }
  if (!allowedCaseTypes.has(testCase.caseType)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_type', `Invalid caseType: ${testCase.caseType}`);
  }
  if (!allowedRecordKinds.has(testCase.recordKind)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_record_kind', `Invalid recordKind: ${testCase.recordKind}`);
  }
  if (!allowedDispositions.has(testCase.expectedDisposition)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_disposition', `Invalid expectedDisposition: ${testCase.expectedDisposition}`);
  }
  if (!allowedSeverities.includes(testCase.expectedSeverity)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_severity', `Invalid expectedSeverity: ${testCase.expectedSeverity}`);
  }
  if (!isStringArray(testCase.expectedFailureFamilies)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_families', 'expectedFailureFamilies must be a string array.');
  } else {
    for (const family of testCase.expectedFailureFamilies) {
      if (!allowedFailureFamilies.has(family)) {
        addFinding(findings, 'P0', 'metadata_gap', 'case_schema_unknown_family', `Unknown failureFamily: ${family}`);
      }
    }
  }
  if (!isStringArray(testCase.inputRefs)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_input_refs', 'inputRefs must be a string array.');
  }
  if (!testCase.archiveEnvelope || typeof testCase.archiveEnvelope !== 'object' || Array.isArray(testCase.archiveEnvelope)) {
    addFinding(findings, 'P0', 'metadata_gap', 'case_schema_invalid_envelope', 'archiveEnvelope must be an object.');
  }
  if (!testCase.worldCorePostCheck || typeof testCase.worldCorePostCheck !== 'object' || Array.isArray(testCase.worldCorePostCheck)) {
    addFinding(findings, 'P0', 'worldcore_postcheck_missing', 'case_schema_invalid_worldcore', 'worldCorePostCheck must be an object.');
  }
  return findings;
}

function validateEnvelopeMetadata(testCase, findings) {
  const envelope = testCase.archiveEnvelope || {};
  const metadata = envelope.metadata || {};
  const redaction = envelope.redaction || {};
  if (envelope.executionMode !== 'dry_run_report_only') {
    addFinding(findings, 'P2', 'metadata_gap', 'execution_mode_not_dry_run', 'executionMode must be dry_run_report_only.');
  }
  if (envelope.dataMode !== 'synthetic_redacted_only') {
    addFinding(findings, 'P1', 'source_pointer_misuse', 'data_mode_not_synthetic_redacted', 'dataMode must be synthetic_redacted_only.');
  }
  if (!isStringArray(envelope.sourcePointerRefs)) {
    addFinding(findings, 'P2', 'metadata_gap', 'source_pointer_refs_invalid', 'sourcePointerRefs must be a string array.');
  }
  if (!metadata.promptHash || typeof metadata.promptHash !== 'string') {
    addFinding(findings, 'P2', 'metadata_gap', 'prompt_hash_missing', 'metadata.promptHash must be present.');
  }
  if (!metadata.evaluatorVersion || typeof metadata.evaluatorVersion !== 'string') {
    addFinding(findings, 'P2', 'metadata_gap', 'evaluator_version_missing', 'metadata.evaluatorVersion must be present.');
  }
  for (const [key, expected] of [
    ['containsHiddenPrivateBody', false],
    ['containsPromptBody', false],
    ['containsOriginalText', false],
    ['containsMiroFishRawOutput', false],
    ['containsDeepSeekVisibleLore', false],
  ]) {
    if (redaction[key] !== expected) {
      const family = key === 'containsPromptBody'
        ? 'prompt_body_archival'
        : key === 'containsOriginalText' || key === 'containsMiroFishRawOutput'
          ? 'original_text_archival'
          : key === 'containsDeepSeekVisibleLore'
            ? 'deepseek_visible_leak'
            : 'hidden_private_body_archival';
      addFinding(findings, familySeverity[family], family, `redaction_${key}_true`, `redaction.${key} must be false.`);
    }
  }
}

function detectFamilies(testCase) {
  const findings = validateCaseShape(testCase);
  validateEnvelopeMetadata(testCase, findings);

  const worldCore = testCase.worldCorePostCheck || {};
  if (worldCore.present !== true || worldCore.finalAuthority !== 'WorldCore') {
    addFinding(findings, 'P0', 'worldcore_postcheck_missing', 'worldcore_missing', 'WorldCore post-check must be present and finalAuthority must be WorldCore.');
  }

  walk(testCase, (key, child, pathParts) => {
    const family = forbiddenKeyFamilies[key];
    if (family) {
      addFinding(findings, familySeverity[family], family, 'forbidden_key_detected', `Forbidden key detected at ${pathParts.join('.')}.`, { path: pathParts.join('.') });
    }
    if ((key === 'effectType' || key === 'effect') && typeof child === 'string') {
      const effectFamily = forbiddenEffectFamilies[child];
      if (effectFamily) {
        addFinding(findings, familySeverity[effectFamily], effectFamily, 'forbidden_effect_detected', `Forbidden effect detected at ${pathParts.join('.')}.`, { path: pathParts.join('.') });
      }
    }
  });

  const text = textOf(testCase);
  for (const { pattern, family } of hardForbiddenText) {
    if (pattern.test(text)) {
      addFinding(findings, familySeverity[family], family, 'forbidden_text_pattern', `Forbidden text pattern matched: ${pattern.source}.`);
    }
  }

  const classifier = testCase.classifierDecision || {};
  if (classifier.visibility === 'deepseek_visible' || classifier.visibility === 'runtime_canon') {
    addFinding(findings, 'P0', 'deepseek_visible_leak', 'classifier_visibility_forbidden', 'classifier visibility cannot be deepseek_visible or runtime_canon in v2.6.');
  }
  if (classifier.requiresManualReview === true && testCase.expectedDisposition !== 'rejected_violation') {
    addFinding(findings, 'P2', 'manual_review_required', 'classifier_manual_review', 'Manual review is required before any future promotion.');
  }
  if (classifier.sourcePointerUse === 'ambiguous_visible_summary') {
    addFinding(findings, 'P2', 'source_pointer_misuse', 'ambiguous_source_pointer_use', 'Ambiguous source-pointer use cannot auto-accept.');
  }
  const memory = testCase.memoryCandidate || testCase.selfLearningCandidate || {};
  if (memory.promotionStatus === 'confirmed_fact' || memory.memoryStatus === 'canon_memory') {
    addFinding(findings, 'P1', 'memory_contamination', 'memory_candidate_promoted', 'Candidate memory cannot become canon or confirmed fact.');
  }
  if (testCase.macroDirector?.declaresVerdict === true) {
    addFinding(findings, 'P0', 'l5_overreach', 'l5_declares_verdict', 'L5 macro pressure cannot declare verdicts.');
  }

  const detectedFamilies = [...new Set(findings.map(item => item.family))];
  const detectedSeverity = maxSeverity(findings.map(item => item.severity));
  const disposition = detectedSeverity === 'P0' || detectedSeverity === 'P1'
    ? 'rejected_violation'
    : detectedSeverity === 'P2'
      ? 'needs_manual_review'
      : 'accepted_for_gate';

  return { findings, detectedFamilies, detectedSeverity, disposition };
}

function evaluateCase(testCase) {
  const detection = detectFamilies(testCase);
  const expectedFamilies = new Set(testCase.expectedFailureFamilies || []);
  const detectedFamilies = new Set(detection.detectedFamilies);
  const missingExpectedFamilies = [...expectedFamilies].filter(family => !detectedFamilies.has(family));
  const unexpectedFamilies = [...detectedFamilies].filter(family => !expectedFamilies.has(family));
  const expectedNegative = testCase.expectedDisposition === 'rejected_violation';
  const expectedManual = testCase.expectedDisposition === 'needs_manual_review';
  const isFalseNegative = expectedNegative && detection.disposition !== 'rejected_violation';
  const isManualReviewMiss = expectedManual && detection.disposition === 'accepted_for_gate';
  const dispositionMatches = testCase.expectedDisposition === detection.disposition
    || (testCase.expectedDisposition === 'accepted_with_warning' && detection.disposition === 'needs_manual_review');
  const severityMatches = severityRank(detection.detectedSeverity) >= severityRank(testCase.expectedSeverity);
  const accepted = missingExpectedFamilies.length === 0
    && !isFalseNegative
    && !isManualReviewMiss
    && dispositionMatches
    && severityMatches;
  return {
    caseId: testCase.caseId,
    caseType: testCase.caseType,
    recordKind: testCase.recordKind,
    caseHash: hashJson(testCase),
    expectedDisposition: testCase.expectedDisposition,
    detectedDisposition: detection.disposition,
    expectedSeverity: testCase.expectedSeverity,
    detectedSeverity: detection.detectedSeverity,
    expectedFailureFamilies: testCase.expectedFailureFamilies || [],
    detectedFailureFamilies: detection.detectedFamilies,
    missingExpectedFamilies,
    unexpectedFamilies,
    falseNegative: isFalseNegative || isManualReviewMiss || missingExpectedFamilies.some(family => severityRank(familySeverity[family]) >= severityRank('P1')),
    accepted,
    findings: detection.findings,
  };
}

function reportContainsBodyLeak(report) {
  const text = JSON.stringify(report);
  return {
    syntheticHiddenPrivateBodyMarkerPresent: /SYNTHETIC_(HIDDEN|PRIVATE)_BODY/i.test(text),
    syntheticPromptBodyMarkerPresent: /SYNTHETIC_PROMPT_BODY/i.test(text),
    syntheticOriginalBodyMarkerPresent: /SYNTHETIC_ORIGINAL_BODY/i.test(text),
    syntheticMiroFishBodyMarkerPresent: /SYNTHETIC_MIROFISH_RAW/i.test(text),
  };
}

function main() {
  const sampleFile = resolve(rootDir, getOption('sample-file', defaultSampleFile));
  const outputRoot = resolve(rootDir, getOption('out-dir', 'artifacts/v2.6.0/private-canon-archive-boundary'));
  if (!existsSync(sampleFile)) throw new Error(`Sample file not found: ${sampleFile}`);
  const samples = JSON.parse(readFileSync(sampleFile, 'utf8'));
  if (!Array.isArray(samples)) throw new Error('Sample file must contain a JSON array.');

  const caseResults = samples.map(evaluateCase);
  const allFindings = caseResults.flatMap(result => result.findings);
  const positiveCases = caseResults.filter(result => result.caseType === 'positive');
  const negativeCases = caseResults.filter(result => result.caseType === 'negative');
  const mutationCases = caseResults.filter(result => result.caseType === 'mutation');
  const p0FalseNegativeCount = caseResults.filter(result => result.expectedSeverity === 'P0' && result.falseNegative).length;
  const p1FalseNegativeCount = caseResults.filter(result => result.expectedSeverity === 'P1' && result.falseNegative).length;
  const acceptedPositiveCount = positiveCases.filter(result => result.accepted).length;
  const acceptedNegativeCount = negativeCases.filter(result => result.accepted).length;
  const acceptedMutationCount = mutationCases.filter(result => result.accepted).length;
  const boundaryAssertionFailures = Object.entries(boundaryAssertions).filter(([, value]) => value !== false);

  const report = {
    schemaVersion,
    targetVersion,
    executionMode: 'dry_run_report_only',
    dataMode: 'synthetic_redacted_only',
    scenarioId,
    boundaryModelVersion,
    classifierModelVersion,
    checkerVersion,
    negativeFixtureVersion,
    generatedAt: new Date().toISOString(),
    dryRun: hasOption('dry-run') || true,
    input: {
      sampleFile: repoPath(sampleFile),
      sampleHash: hashJson(samples),
      sampleCount: samples.length,
    },
    summary: {
      totalCaseCount: samples.length,
      schemaValidCount: caseResults.filter(result => !result.findings.some(item => item.code.startsWith('case_schema'))).length,
      positiveCount: positiveCases.length,
      acceptedPositiveCount,
      negativeCount: negativeCases.length,
      acceptedNegativeCount,
      mutationCount: mutationCases.length,
      acceptedMutationCount,
      acceptedForGateCount: caseResults.filter(result => result.accepted).length,
      p0FalseNegativeCount,
      p1FalseNegativeCount,
      manualReviewCount: caseResults.filter(result => result.detectedDisposition === 'needs_manual_review').length,
      rejectedViolationCount: caseResults.filter(result => result.detectedDisposition === 'rejected_violation').length,
      severityCounts: summarizeSeverity(allFindings),
      failureFamilyCounts: summarizeBy(allFindings, item => item.family),
    },
    boundaryAssertions,
    boundaryAssertionFailures,
    caseResults,
  };

  report.reportBodyLeakFlags = reportContainsBodyLeak(report);
  report.acceptedForGate = report.summary.schemaValidCount === samples.length
    && acceptedPositiveCount === positiveCases.length
    && acceptedNegativeCount === negativeCases.length
    && acceptedMutationCount === mutationCases.length
    && p0FalseNegativeCount === 0
    && p1FalseNegativeCount === 0
    && boundaryAssertionFailures.length === 0
    && Object.values(report.reportBodyLeakFlags).every(value => value === false);

  const timestamp = report.generatedAt.replace(/[:.]/g, '-');
  const outputDir = join(outputRoot, timestamp);
  mkdirSync(outputDir, { recursive: true });
  const reportFile = join(outputDir, 'report.json');
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`v2.6 private canon archive boundary report: ${repoPath(reportFile)}`);
  console.log(`acceptedForGate=${report.acceptedForGate}`);
  console.log(`cases=${samples.length}, accepted=${report.summary.acceptedForGateCount}, P0FN=${p0FalseNegativeCount}, P1FN=${p1FalseNegativeCount}`);
  if (!report.acceptedForGate) process.exitCode = 1;
}

main();
