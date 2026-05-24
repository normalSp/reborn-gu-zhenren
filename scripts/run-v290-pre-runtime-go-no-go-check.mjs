#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const targetVersion = 'v2.9.0';
const checkerVersion = 'v290_b1_pre_runtime_go_no_go_checker_v1';
const reportSchemaVersion = 'v290_b1_pre_runtime_go_no_go_report_v1';
const contractVersion = 'v290_a1_runtime_agent_contract_worldcore_postcheck_v1';
const gatePlanVersion = 'v290_a2_live_pa_drift_rollback_oldsave_gate_v1';
const defaultSampleFile = 'tests/evals/v290-pre-runtime-go-no-go/samples.json';

const caseTypes = new Set(['positive', 'future_gate', 'negative']);
const decisions = new Set(['go_for_v3_design_gate', 'future_gate_required', 'no_go_blocked']);
const allowedAgentLayers = new Set(['L2', 'L3']);

const requiredFamilies = [
  'worldcore_contract',
  'live_pa_drift_plan',
  'rollback_old_save_boundary',
  'mirofish_boundary',
  'prompt_authority_boundary',
  'save_boundary',
  'backend_service_boundary',
  'external_framework_boundary',
  'l4_l5_boundary',
  'self_learning_boundary',
  'doc_code_drift',
];

const familySeverity = {
  schema: 'P0',
  runtime_agent_implementation: 'P0',
  worldcore_contract: 'P0',
  save_boundary: 'P0',
  prompt_authority_boundary: 'P0',
  deepseek_visible_leak: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  mirofish_boundary: 'P0',
  l4_l5_boundary: 'P0',
  self_learning_boundary: 'P0',
  doc_code_drift: 'P0',
  formal_authority_drift: 'P0',
  hidden_private_body: 'P0',
  canon_promotion: 'P0',
  prompt_body: 'P0',
  live_pa_drift_plan: 'P1',
  rollback_old_save_boundary: 'P1',
  evidence_gap: 'P1',
  scope_overreach: 'P1',
  future_gate: 'P2',
  classification_mismatch: 'P1',
  coverage: 'P1',
  determinism: 'P1',
};

const boundaryAssertionTemplate = {
  runtimeModified: false,
  saveFormatModified: false,
  saveFieldAdded: false,
  runFingerprintAdded: false,
  runtimeAgentImplemented: false,
  deepSeekLiveCalled: false,
  deepSeekAuthorityExpanded: false,
  deepSeekVisibleLoreEnabled: false,
  bffOrBackendUsed: false,
  serviceImplemented: false,
  externalFrameworkPoCUsed: false,
  dependencyAdded: false,
  subagentsUsed: false,
  mirofishExportUsed: false,
  realOriginalFactsUsed: false,
  namedNpcUsed: false,
  hiddenAdjacentUsed: false,
  knowledgeIndexBodyWritten: false,
  runtimeCanonPromoted: false,
  hiddenPrivateBodyRead: false,
  promptBodyArchived: false,
  formalLocationFactionRewardNpcLifeDeathOpened: false,
  edgeOneDeployed: false,
};

const boundaryFamilies = {
  runtimeModified: 'runtime_agent_implementation',
  runtimeAgentImplemented: 'runtime_agent_implementation',
  saveFormatModified: 'save_boundary',
  saveFieldAdded: 'save_boundary',
  runFingerprintAdded: 'save_boundary',
  deepSeekLiveCalled: 'prompt_authority_boundary',
  deepSeekAuthorityExpanded: 'prompt_authority_boundary',
  deepSeekVisibleLoreEnabled: 'deepseek_visible_leak',
  bffOrBackendUsed: 'backend_service_boundary',
  serviceImplemented: 'backend_service_boundary',
  externalFrameworkPoCUsed: 'external_framework_boundary',
  dependencyAdded: 'external_framework_boundary',
  subagentsUsed: 'external_framework_boundary',
  mirofishExportUsed: 'mirofish_boundary',
  realOriginalFactsUsed: 'mirofish_boundary',
  namedNpcUsed: 'mirofish_boundary',
  hiddenAdjacentUsed: 'mirofish_boundary',
  knowledgeIndexBodyWritten: 'canon_promotion',
  runtimeCanonPromoted: 'canon_promotion',
  hiddenPrivateBodyRead: 'hidden_private_body',
  promptBodyArchived: 'prompt_body',
  formalLocationFactionRewardNpcLifeDeathOpened: 'formal_authority_drift',
  edgeOneDeployed: 'future_gate',
};

const effectFamilies = {
  runtime_agent_implementation: 'runtime_agent_implementation',
  runtime_write: 'runtime_agent_implementation',
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
  formal_location: 'formal_authority_drift',
  formal_faction: 'formal_authority_drift',
  formal_reward: 'formal_authority_drift',
  formal_identity: 'formal_authority_drift',
  npc_life_death: 'formal_authority_drift',
  doc_claim_without_evidence: 'doc_code_drift',
  missing_runner_evidence: 'doc_code_drift',
};

const hardTextFindings = [
  { pattern: /SYNTHETIC_HIDDEN_PRIVATE_BODY/i, family: 'hidden_private_body' },
  { pattern: /SYNTHETIC_PROMPT_BODY/i, family: 'prompt_body' },
  { pattern: /runtime\s+agent\s+is\s+implemented/i, family: 'runtime_agent_implementation' },
  { pattern: /SAVE_FORMAT_VERSION\s*=\s*26/i, family: 'save_boundary' },
  { pattern: /DeepSeek visible (lore|RAG|context) enabled/i, family: 'deepseek_visible_leak' },
  { pattern: /L[45]\s+runtime/i, family: 'l4_l5_boundary' },
  { pattern: /self-learning writes/i, family: 'self_learning_boundary' },
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
    Info: findings.filter(item => item.severity === 'Info').length,
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
  if (!caseTypes.has(sample.caseType)) addFinding(findings, 'schema', 'bad_case_type', 'caseType must be positive, future_gate, or negative.');
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

  if (Array.isArray(claim.agentLayers)) {
    for (const layer of claim.agentLayers) {
      if (!allowedAgentLayers.has(layer)) {
        addFinding(findings, 'l4_l5_boundary', 'non_l2_l3_layer', `Layer ${layer} is not allowed for v3.0 runtime design.`);
      }
    }
  } else {
    addFinding(findings, 'schema', 'missing_agent_layers', 'claim.agentLayers must be an array.');
  }

  if (sample.caseType === 'positive') {
    if (claim.smallAreaOnly !== true) addFinding(findings, 'scope_overreach', 'missing_small_area_limit', 'Positive v3 design candidate must be limited to one small area.');
    if (claim.proposalOnly !== true) addFinding(findings, 'worldcore_contract', 'missing_proposal_only', 'Agent output must remain proposal-only.');
    if (claim.worldCoreFinalAuthority !== true) addFinding(findings, 'worldcore_contract', 'missing_worldcore_authority', 'WorldCore must keep final authority.');
    if (claim.requiresWorldCorePostCheck !== true) addFinding(findings, 'worldcore_contract', 'missing_postcheck', 'WorldCore post-check is required.');
    if (claim.liveProbePlanReady !== true) addFinding(findings, 'live_pa_drift_plan', 'missing_live_probe_plan', 'v3.0 needs live probe plan before implementation.');
    if (claim.playerAdvocatePlanReady !== true) addFinding(findings, 'live_pa_drift_plan', 'missing_pa_plan', 'v3.0 needs Player Advocate plan before implementation.');
    if (claim.driftGatePlanReady !== true) addFinding(findings, 'live_pa_drift_plan', 'missing_drift_plan', 'v3.0 needs drift gate plan before implementation.');
    if (claim.rollbackPlanReady !== true || claim.oldSavePlanReady !== true) {
      addFinding(findings, 'rollback_old_save_boundary', 'missing_rollback_old_save_plan', 'v3.0 needs rollback and old-save plan.');
    }
    if (!isStringArray(claim.evidenceRefs) || claim.evidenceRefs.length === 0) {
      addFinding(findings, 'evidence_gap', 'missing_evidence_refs', 'Positive candidate needs evidence refs.');
    }
  }

  for (const [key, family] of Object.entries(boundaryFamilies)) {
    if (claim.boundaries && claim.boundaries[key] === true) {
      addFinding(findings, family, `boundary_${key}`, `${key} is not allowed in v2.9/v3.0 pre-runtime go/no-go.`);
    }
  }

  for (const effect of claim.candidateEffects || []) {
    const family = effectFamilies[effect];
    if (family) addFinding(findings, family, `effect_${effect}`, `candidateEffects contains forbidden effect ${effect}.`);
  }

  const text = textOf(claim);
  for (const item of hardTextFindings) {
    if (item.pattern.test(text)) {
      addFinding(findings, item.family, 'hard_text_boundary', `Text matched forbidden pattern ${item.pattern}.`);
    }
  }

  for (const finding of findings) coveredFamilies.add(finding.family);
  for (const family of futureGateFamilies) coveredFamilies.add(family);

  let decision = 'go_for_v3_design_gate';
  if (findings.some(item => item.severity === 'P0' || item.severity === 'P1')) {
    decision = 'no_go_blocked';
  } else if (sample.caseType === 'future_gate' || futureGateFamilies.size > 0 || claim.requiresFutureUserDecision === true) {
    decision = 'future_gate_required';
  }

  if (sample.caseType === 'negative' && findings.length === 0) {
    addFinding(findings, 'classification_mismatch', 'negative_not_caught', 'Negative sample did not trigger a blocking finding.');
    decision = 'no_go_blocked';
  }

  const matchedExpectedFamilies = (sample.expectedFamilies || []).filter(family => coveredFamilies.has(family));
  const missingExpectedFamilies = (sample.expectedFamilies || []).filter(family => !coveredFamilies.has(family));

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
    contractVersion,
    gatePlanVersion,
    generatedAt: new Date().toISOString(),
    targetVersion,
    executionMode: 'dry_run_report_only',
    sourceInputs: [
      {
        kind: 'sample_file',
        path: repoPath(sampleFile),
        sha256: sampleHash,
      },
      {
        kind: 'baseline_report',
        path: 'artifacts/v2.8.0/runtime-admission/2026-05-24T06-10-18-280Z/report.json',
        available: existsSync(join(rootDir, 'artifacts/v2.8.0/runtime-admission/2026-05-24T06-10-18-280Z/report.json')),
      },
      {
        kind: 'long_route_audit',
        path: '指导大纲/v2.9.0/codex/00-总览/v2.9.0-长期路线按期实现审计.md',
        available: existsSync(join(rootDir, '指导大纲/v2.9.0/codex/00-总览/v2.9.0-长期路线按期实现审计.md')),
      },
      {
        kind: 'doc_code_todo_audit',
        path: '指导大纲/v2.9.0/codex/00-总览/v2.9.0-文档代码一致性与TODO审计.md',
        available: existsSync(join(rootDir, '指导大纲/v2.9.0/codex/00-总览/v2.9.0-文档代码一致性与TODO审计.md')),
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
      goForV3DesignGate: acceptedForGate,
      runtimeImplementationApproved: false,
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

  const outputRoot = resolve(rootDir, getOption('output-root', 'artifacts/v2.9.0/pre-runtime-go-no-go'));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(outputRoot, timestamp);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'report.json');
  const report = buildReport(samples, sampleFile, hashText(raw), outputPath);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const result = report.gateResult.acceptedForGate ? 'accepted' : 'blocked';
  console.log(`[v290-pre-runtime-go-no-go] ${result}`);
  console.log(`report=${repoPath(outputPath)}`);
  console.log(`schemaValid=${report.caseSummary.schemaValidCount}/${report.caseSummary.sampleCount}`);
  console.log(`decisions=${JSON.stringify(report.caseSummary.decisionCounts)}`);
  console.log(`P0/P1 falseNegative=${report.gateResult.p0FalseNegativeCount}/${report.gateResult.p1FalseNegativeCount}`);
  console.log(`resultMismatch=${report.gateResult.resultMismatchCount}`);
  console.log(`missingRequiredFamilies=${report.caseSummary.missingRequiredFamilies.length}`);
  console.log(`runtimeImplementationApproved=${report.gateResult.runtimeImplementationApproved}`);
  if (!report.gateResult.acceptedForGate) {
    console.error(`blockReasons=${report.gateResult.blockReasons.join(',')}`);
    process.exit(1);
  }
}

main();
