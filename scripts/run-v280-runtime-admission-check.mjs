#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const targetVersion = 'v2.8.0';
const gate = 'v2.8.0-b1-runtime-admission-report-only-checker';
const checkerVersion = 'v280_b1_runtime_admission_report_checker_v1';
const a1CriteriaVersion = 'v280_a1_runtime_agent_admission_criteria_v1';
const a2MatrixVersion = 'v280_a2_agent_capability_classification_matrix_v1';
const defaultSampleFile = 'tests/evals/v280-runtime-admission/samples.json';

const classifications = new Set(['admissible_candidate', 'lab_only', 'rejected']);
const caseTypes = new Set(['positive', 'lab_only', 'negative']);
const agentLayers = new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'SELF_LEARNING']);
const admissibleLayers = new Set(['L2', 'L3']);
const admissibleScopes = new Set(['candidate_only', 'expression_only', 'intent_only']);
const labOnlyLayers = new Set(['L1', 'L5', 'SELF_LEARNING']);
const labOnlyScopes = new Set(['local_rule_only', 'report_only']);
const requiredNegativeFamilies = [
  'formal_authority_drift',
  'runtime_or_save_write',
  'deepseek_visible_leak',
  'backend_service_boundary',
  'external_framework_boundary',
  'l4_lore_boundary',
  'l5_overreach',
  'self_learning_direct_write',
];

const familySeverity = {
  schema: 'P0',
  runtime_or_save_write: 'P0',
  deepseek_visible_leak: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  mirofish_boundary: 'P0',
  knowledge_body_write: 'P0',
  canon_promotion: 'P0',
  hidden_private_body: 'P0',
  prompt_body: 'P0',
  original_text: 'P0',
  formal_authority_drift: 'P0',
  npc_life_death: 'P0',
  l4_lore_boundary: 'P0',
  l5_overreach: 'P0',
  self_learning_direct_write: 'P0',
  worldcore_postcheck_missing: 'P1',
  audit_gap: 'P2',
  ttl_gap: 'P2',
  classification_mismatch: 'P1',
  coverage: 'P1',
  determinism: 'P1',
  execution_boundary: 'P1',
};

const forbiddenKeyFamilies = {
  savePatch: 'runtime_or_save_write',
  stateUpdate: 'runtime_or_save_write',
  runtimePatch: 'runtime_or_save_write',
  storePatch: 'runtime_or_save_write',
  canonPatch: 'runtime_or_save_write',
  inventoryPatch: 'runtime_or_save_write',
  locationUnlock: 'formal_authority_drift',
  rewardGrant: 'formal_authority_drift',
  formalCredential: 'formal_authority_drift',
  officialPass: 'formal_authority_drift',
  factionStateWrite: 'formal_authority_drift',
  relationScoreWrite: 'formal_authority_drift',
  npcDeath: 'npc_life_death',
  npcLifeDeath: 'npc_life_death',
  knowledgeIndexBody: 'knowledge_body_write',
  runtimeCanonBody: 'canon_promotion',
  canonPromotion: 'canon_promotion',
  deepSeekVisibleLore: 'deepseek_visible_leak',
  deepSeekVisibleRag: 'deepseek_visible_leak',
  deepseekVisibleContext: 'deepseek_visible_leak',
  deepseekContextPatch: 'deepseek_visible_leak',
  hiddenBody: 'hidden_private_body',
  privateBody: 'hidden_private_body',
  hiddenPrivateBody: 'hidden_private_body',
  promptBody: 'prompt_body',
  systemPrompt: 'prompt_body',
  userPrompt: 'prompt_body',
  rawPrompt: 'prompt_body',
  originalText: 'original_text',
  rawOriginalText: 'original_text',
  rawSourceText: 'original_text',
  sourceBody: 'original_text',
  quoteText: 'original_text',
  mirofishRawOutput: 'mirofish_boundary',
  mirofishExportBody: 'mirofish_boundary',
  backendService: 'backend_service_boundary',
  bffService: 'backend_service_boundary',
  serviceEndpoint: 'backend_service_boundary',
  jobQueueService: 'backend_service_boundary',
  evalArchiveService: 'backend_service_boundary',
  privateCanonService: 'backend_service_boundary',
  externalFrameworkPoC: 'external_framework_boundary',
  externalFrameworkDependency: 'external_framework_boundary',
  dependencyInstall: 'external_framework_boundary',
  vendoredSubset: 'external_framework_boundary',
  readOnlyScan: 'external_framework_boundary',
  patchArtifact: 'external_framework_boundary',
  subagentUsed: 'external_framework_boundary',
  fileWrite: 'external_framework_boundary',
  commandExecution: 'external_framework_boundary',
  gitOperation: 'external_framework_boundary',
  selfLearningDirectWrite: 'self_learning_direct_write',
  directSkillPatch: 'self_learning_direct_write',
  directPromptPatch: 'self_learning_direct_write',
  directCanonPatch: 'self_learning_direct_write',
  directRuntimePatch: 'self_learning_direct_write',
};

const forbiddenEffectFamilies = {
  save_write: 'runtime_or_save_write',
  runtime_write: 'runtime_or_save_write',
  store_write: 'runtime_or_save_write',
  canon_write: 'canon_promotion',
  knowledge_body_write: 'knowledge_body_write',
  reward_grant: 'formal_authority_drift',
  formal_location: 'formal_authority_drift',
  formal_faction: 'formal_authority_drift',
  formal_identity: 'formal_authority_drift',
  formal_credential: 'formal_authority_drift',
  formal_relation_score: 'formal_authority_drift',
  formal_blockade: 'formal_authority_drift',
  npc_life_death: 'npc_life_death',
  deepseek_visible_lore: 'deepseek_visible_leak',
  deepseek_visible_rag: 'deepseek_visible_leak',
  backend_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  dependency_install: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  mirofish_export: 'mirofish_boundary',
  l5_verdict: 'l5_overreach',
  ending_decision: 'l5_overreach',
  canon_anchor_change: 'l5_overreach',
  self_learning_direct_write: 'self_learning_direct_write',
  prompt_write: 'prompt_body',
  skill_write: 'self_learning_direct_write',
};

const hardForbiddenText = [
  { pattern: /SYNTHETIC_(HIDDEN|PRIVATE)_BODY/i, family: 'hidden_private_body' },
  { pattern: /SYNTHETIC_PROMPT_BODY/i, family: 'prompt_body' },
  { pattern: /SYNTHETIC_ORIGINAL_BODY/i, family: 'original_text' },
  { pattern: /DeepSeek\s+visible\s+(lore|RAG|context)\s+enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /writes?\s+to\s+(save|runtime|canon|prompt|skill)/i, family: 'runtime_or_save_write' },
  { pattern: /officially\s+(joins|unlocks|grants|recruits)/i, family: 'formal_authority_drift' },
  { pattern: /NPC\s+is\s+dead/i, family: 'npc_life_death' },
  { pattern: /fate\s+is\s+(sealed|decided)/i, family: 'l5_overreach' },
  { pattern: /ending\s+is\s+(sealed|decided)/i, family: 'l5_overreach' },
];

const boundaryAssertions = {
  runtimeModified: false,
  saveFormatModified: false,
  saveFieldAdded: false,
  runFingerprintAdded: false,
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

function validateShape(sample) {
  const findings = [];
  for (const key of ['id', 'caseType', 'expectedClassification', 'title']) {
    if (typeof sample[key] !== 'string' || !sample[key].trim()) {
      addFinding(findings, 'schema', 'sample_missing_string', `${key} must be a non-empty string.`);
    }
  }
  if (!caseTypes.has(sample.caseType)) addFinding(findings, 'schema', 'invalid_case_type', `Invalid caseType: ${sample.caseType}.`);
  if (!classifications.has(sample.expectedClassification)) {
    addFinding(findings, 'schema', 'invalid_expected_classification', `Invalid expectedClassification: ${sample.expectedClassification}.`);
  }
  if (!isStringArray(sample.expectedViolationFamilies)) {
    addFinding(findings, 'schema', 'invalid_expected_violation_families', 'expectedViolationFamilies must be a string array.');
  }

  const proposal = sample.proposal;
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    addFinding(findings, 'schema', 'proposal_not_object', 'proposal must be an object.');
    return findings;
  }
  for (const key of ['proposalId', 'agentLayer', 'capabilityType', 'admissionScope', 'authority']) {
    if (typeof proposal[key] !== 'string' || !proposal[key].trim()) {
      addFinding(findings, 'schema', 'proposal_missing_string', `proposal.${key} must be a non-empty string.`);
    }
  }
  if (!agentLayers.has(proposal.agentLayer)) addFinding(findings, 'schema', 'invalid_agent_layer', `Invalid agentLayer: ${proposal.agentLayer}.`);
  for (const key of ['sourceRefs', 'visibleFactRefs', 'auditRefs', 'allowedOutputs', 'prohibitedOutputs']) {
    if (!isStringArray(proposal[key])) addFinding(findings, 'schema', 'proposal_invalid_array', `proposal.${key} must be a string array.`);
  }
  if (typeof proposal.requiresWorldCorePostCheck !== 'boolean') {
    addFinding(findings, 'schema', 'proposal_invalid_postcheck', 'proposal.requiresWorldCorePostCheck must be boolean.');
  }
  if (typeof proposal.reversible !== 'boolean') {
    addFinding(findings, 'schema', 'proposal_invalid_reversible', 'proposal.reversible must be boolean.');
  }
  if (!Number.isInteger(proposal.ttlTurns) || proposal.ttlTurns < 0) {
    addFinding(findings, 'schema', 'proposal_invalid_ttl', 'proposal.ttlTurns must be a non-negative integer.');
  }
  return findings;
}

function boundaryFindings(proposal) {
  const findings = [];

  walk(proposal, (key, value, pathParts) => {
    if (Object.prototype.hasOwnProperty.call(forbiddenKeyFamilies, key)) {
      addFinding(findings, forbiddenKeyFamilies[key], 'forbidden_key', `Forbidden key ${key} appears.`, pathParts.join('.'));
    }
    if (typeof value === 'string') {
      for (const rule of hardForbiddenText) {
        if (rule.pattern.test(value)) {
          addFinding(findings, rule.family, 'forbidden_text', `Forbidden text pattern ${rule.pattern} appears.`, pathParts.join('.'));
        }
      }
    }
  });

  const effectValues = [
    ...(Array.isArray(proposal.candidateEffects) ? proposal.candidateEffects : []),
    ...(Array.isArray(proposal.riskFlags) ? proposal.riskFlags : []),
    ...(Array.isArray(proposal.allowedOutputs) ? proposal.allowedOutputs : []),
  ];
  for (const effect of effectValues) {
    const raw = typeof effect === 'string' ? effect : textOf(effect);
    const normalized = raw.trim();
    if (Object.prototype.hasOwnProperty.call(forbiddenEffectFamilies, normalized)) {
      addFinding(findings, forbiddenEffectFamilies[normalized], 'forbidden_effect', `Forbidden effect ${normalized} appears.`);
    }
  }

  if (proposal.agentLayer === 'L4') {
    addFinding(findings, 'l4_lore_boundary', 'l4_runtime_candidate', 'L4 original key character live/runtime agent remains a future gate.');
  }

  if (proposal.agentLayer === 'L5' && proposal.admissionScope !== 'report_only') {
    addFinding(findings, 'l5_overreach', 'l5_runtime_or_outcome_scope', 'L5 Heaven/Fate can only be report-only in v2.8.');
  }

  if (proposal.agentLayer === 'L5' && /verdict|ending|fate/i.test(`${proposal.capabilityType} ${proposal.publicSummary || ''}`)) {
    addFinding(findings, 'l5_overreach', 'l5_verdict_language', 'L5 verdict or ending language remains future-gated.');
  }

  if (proposal.agentLayer === 'SELF_LEARNING' && proposal.admissionScope !== 'report_only') {
    addFinding(findings, 'self_learning_direct_write', 'self_learning_not_report_only', 'Self-learning must remain report-only in v2.8.');
  }

  return findings;
}

function classifyProposal(proposal, findings) {
  const blockingFindings = findings.filter(item => item.severity === 'P0' || item.severity === 'P1');
  if (blockingFindings.some(item => item.family !== 'worldcore_postcheck_missing' && item.family !== 'audit_gap' && item.family !== 'ttl_gap')) {
    return 'rejected';
  }

  if (admissibleLayers.has(proposal.agentLayer) && admissibleScopes.has(proposal.admissionScope)) {
    if (proposal.authority !== 'proposal_only') {
      addFinding(findings, 'formal_authority_drift', 'authority_not_proposal_only', 'Admissible candidates must remain proposal_only.');
      return 'rejected';
    }
    if (!proposal.requiresWorldCorePostCheck) {
      addFinding(findings, 'worldcore_postcheck_missing', 'missing_worldcore_postcheck', 'Admissible candidates require WorldCore post-check.');
      return 'rejected';
    }
    if (!proposal.reversible) {
      addFinding(findings, 'formal_authority_drift', 'candidate_not_reversible', 'Admissible candidates must be reversible.');
      return 'rejected';
    }
    if (proposal.ttlTurns < 1) {
      addFinding(findings, 'ttl_gap', 'candidate_missing_ttl', 'Admissible candidates need a TTL.');
    }
    if (!proposal.auditRefs?.length) {
      addFinding(findings, 'audit_gap', 'candidate_missing_audit_refs', 'Admissible candidates need audit refs.');
    }
    return 'admissible_candidate';
  }

  if (labOnlyLayers.has(proposal.agentLayer) || labOnlyScopes.has(proposal.admissionScope)) {
    return 'lab_only';
  }

  return 'lab_only';
}

function scoreSample(sample) {
  const findings = validateShape(sample);
  const proposal = sample.proposal || {};
  findings.push(...boundaryFindings(proposal));

  const classification = findings.some(item => item.family === 'schema')
    ? 'rejected'
    : classifyProposal(proposal, findings);

  const foundFamilies = new Set(findings.map(item => item.family));
  const missingExpectedFamilies = (sample.expectedViolationFamilies || []).filter(family => !foundFamilies.has(family));
  const resultMatchesExpected = classification === sample.expectedClassification;
  const schemaValid = !findings.some(item => item.family === 'schema');
  const unexpectedBlockingFinding = sample.expectedClassification !== 'rejected'
    && findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  const falseNegative = sample.expectedClassification === 'rejected' && classification !== 'rejected';
  const acceptedForGate = schemaValid
    && resultMatchesExpected
    && !unexpectedBlockingFinding
    && missingExpectedFamilies.length === 0
    && !falseNegative;

  return {
    id: sample.id,
    title: sample.title,
    caseType: sample.caseType,
    expectedClassification: sample.expectedClassification,
    classification,
    schemaValid,
    resultMatchesExpected,
    missingExpectedFamilies,
    falseNegative,
    unexpectedBlockingFinding,
    acceptedForGate,
    findings,
  };
}

function addCoverageFindings(samples, findings) {
  const proposals = samples.map(sample => sample.proposal || {});
  const layerCounts = countBy(proposals, proposal => proposal.agentLayer || 'missing');
  const classificationCounts = countBy(samples, sample => sample.expectedClassification || 'missing');
  const negativeFamilies = new Set(samples.flatMap(sample => sample.expectedViolationFamilies || []));

  for (const classification of classifications) {
    if (!classificationCounts[classification]) {
      addFinding(findings, 'coverage', 'missing_classification_coverage', `Missing expected ${classification} sample.`);
    }
  }
  for (const layer of ['L1', 'L2', 'L3', 'L4', 'L5', 'SELF_LEARNING']) {
    if (!layerCounts[layer]) addFinding(findings, 'coverage', 'missing_layer_coverage', `Missing ${layer} sample.`);
  }
  for (const family of requiredNegativeFamilies) {
    if (!negativeFamilies.has(family)) addFinding(findings, 'coverage', 'missing_negative_family_coverage', `Missing negative family ${family}.`);
  }
  if (samples.length < 12) addFinding(findings, 'coverage', 'sample_count_low', `Expected at least 12 samples, got ${samples.length}.`);

  return {
    layerCounts,
    expectedClassificationCounts: classificationCounts,
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
  if (!dryRun) addFinding(globalFindings, 'execution_boundary', 'missing_dry_run', 'v2.8 runtime admission checker must run with --dry-run.');

  const coverage = addCoverageFindings(samples, globalFindings);
  const results = samples.map(scoreSample);
  const rescoreResults = samples.map(scoreSample);
  const resultDigest = value => hashJson(value.map(result => ({
    id: result.id,
    classification: result.classification,
    findingCodes: result.findings.map(finding => `${finding.severity}:${finding.family}:${finding.code}`).sort(),
  })));
  const rescoreStable = resultDigest(results) === resultDigest(rescoreResults);
  if (!rescoreStable) addFinding(globalFindings, 'determinism', 'rescore_not_stable', 'Deterministic rescore changed results.');

  const resultFindings = results.flatMap(result => result.findings.map(finding => ({ sampleId: result.id, ...finding })));
  const findings = [...globalFindings, ...resultFindings];
  const schemaValidCount = results.filter(result => result.schemaValid).length;
  const acceptedForGateCount = results.filter(result => result.acceptedForGate).length;
  const falseNegativeCount = results.filter(result => result.falseNegative).length;
  const unexpectedBlockingCount = results.filter(result => result.unexpectedBlockingFinding).length;
  const resultMismatchCount = results.filter(result => !result.resultMatchesExpected).length;
  const missingExpectedFamilyCount = results.filter(result => result.missingExpectedFamilies.length > 0).length;
  const globalBlockingCount = globalFindings.filter(item => item.severity === 'P0' || item.severity === 'P1').length;
  const classificationCounts = countBy(results, result => result.classification);

  const passed = dryRun
    && schemaValidCount === samples.length
    && acceptedForGateCount === samples.length
    && falseNegativeCount === 0
    && unexpectedBlockingCount === 0
    && resultMismatchCount === 0
    && missingExpectedFamilyCount === 0
    && globalBlockingCount === 0
    && rescoreStable
    && Object.values(boundaryAssertions).every(value => value === false);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/v2.8.0/runtime-admission', stamp);
  mkdirSync(reportDir, { recursive: true });

  const report = {
    gate,
    targetVersion,
    checkerVersion,
    a1CriteriaVersion,
    a2MatrixVersion,
    createdAt: new Date().toISOString(),
    mode: 'dry-run-only-report-only',
    noLiveDeepSeek: true,
    noTokenSpend: true,
    noRuntimeWrite: true,
    noSaveWrite: true,
    noBackendService: true,
    noExternalFramework: true,
    noSubagents: true,
    noMiroFishExport: true,
    sampleFile: repoPath(resolved),
    sampleHash: hashJson(samples),
    coverage,
    boundaryAssertions,
    summary: {
      sampleCount: samples.length,
      schemaValidCount,
      acceptedForGateCount,
      admissibleCandidateCount: classificationCounts.admissible_candidate || 0,
      labOnlyCount: classificationCounts.lab_only || 0,
      rejectedCount: classificationCounts.rejected || 0,
      falseNegativeCount,
      unexpectedBlockingCount,
      resultMismatchCount,
      missingExpectedFamilyCount,
      globalBlockingCount,
      rescoreStable,
      acceptedForGate: passed,
      ...severitySummary(findings),
    },
    results,
    findings,
  };

  const reportPath = join(reportDir, 'report.json');
  const summaryPath = join(reportDir, 'summary.md');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(summaryPath, [
    '# v2.8.0 Runtime Admission Summary',
    '',
    `- createdAt: ${report.createdAt}`,
    `- checkerVersion: ${checkerVersion}`,
    `- sampleFile: ${report.sampleFile}`,
    `- sampleCount: ${samples.length}`,
    `- schemaValidCount: ${schemaValidCount}`,
    `- admissibleCandidateCount: ${report.summary.admissibleCandidateCount}`,
    `- labOnlyCount: ${report.summary.labOnlyCount}`,
    `- rejectedCount: ${report.summary.rejectedCount}`,
    `- falseNegativeCount: ${falseNegativeCount}`,
    `- unexpectedBlockingCount: ${unexpectedBlockingCount}`,
    `- resultMismatchCount: ${resultMismatchCount}`,
    `- missingExpectedFamilyCount: ${missingExpectedFamilyCount}`,
    `- rescoreStable: ${rescoreStable}`,
    `- acceptedForGate: ${passed}`,
    '',
    'This is synthetic, dry-run, report-only evidence. It does not call live DeepSeek, write runtime state, write save data, use external frameworks, enable subagents, export MiroFish material, implement backend services, or approve runtime agents.',
    '',
  ].join('\n'), 'utf8');

  console.log(`[v280-runtime-admission] report=${reportPath} samples=${samples.length} schema=${schemaValidCount}/${samples.length} acceptedForGate=${acceptedForGateCount}/${samples.length} admissible=${report.summary.admissibleCandidateCount} labOnly=${report.summary.labOnlyCount} rejected=${report.summary.rejectedCount} falseNegative=${falseNegativeCount} unexpectedBlocking=${unexpectedBlockingCount} mismatch=${resultMismatchCount} rescoreStable=${rescoreStable} passed=${passed}`);
  if (!passed) process.exit(1);
}

run();
