#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const targetVersion = 'v4.2.0';
const checkerVersion = 'v420_b1_auto_theater_lite_mortal_mapping_checker_v1';
const reportSchemaVersion = 'v420_b1_auto_theater_lite_mortal_mapping_report_v1';
const defaultSampleFile = 'tests/evals/v420-auto-theater-lite-mortal-mapping/samples.json';

const caseTypes = new Set(['positive', 'future_gate', 'negative']);
const decisions = new Set(['lite_mapping_ready', 'future_gate_required', 'no_go_blocked']);

const requiredFamilies = [
  'mortal_action_mapping',
  'preparation_cue',
  'lite_transcript',
  'combat_ledger_lite',
  'facts_lane',
  'support_lane',
  'defense_lane',
  'failure_reason_lane',
  'candidate_lane',
  'rejected_lane',
  'needs_user_decision_lane',
  'expression_authority',
  'worldcore_combatcore_evidence',
  'mobile_readability',
  'reduced_motion',
  'deepseek_boundary',
  'ui_motion_boundary',
  'hidden_lore_boundary',
  'save_runtime_boundary',
  'deterministic_mapping_stability',
  'player_advocate_boundary',
  'old_save_rollback',
  'system_continuity',
  'mirofish_boundary',
  'backend_service_boundary',
  'external_framework_boundary',
  'formal_authority_boundary',
  'mortal_combat_runtime',
  'high_rank_combat_runtime',
  'theater_ui_runtime',
  'auto_theater_asset_runtime',
  'l4_l5_boundary',
  'heavenwill_fate_runtime',
  'mainline_boundary',
];

const familySeverity = {
  schema: 'P0',
  mortal_action_mapping: 'P1',
  preparation_cue: 'P1',
  lite_transcript: 'P1',
  combat_ledger_lite: 'P1',
  facts_lane: 'P1',
  support_lane: 'P1',
  defense_lane: 'P1',
  failure_reason_lane: 'P1',
  candidate_lane: 'P1',
  rejected_lane: 'P1',
  needs_user_decision_lane: 'P1',
  expression_authority: 'P1',
  worldcore_combatcore_evidence: 'P0',
  mobile_readability: 'P1',
  reduced_motion: 'P1',
  deterministic_mapping_stability: 'P1',
  player_advocate_boundary: 'P1',
  old_save_rollback: 'P1',
  system_continuity: 'P1',
  deepseek_boundary: 'P0',
  ui_motion_boundary: 'P0',
  hidden_lore_boundary: 'P0',
  save_runtime_boundary: 'P0',
  mirofish_boundary: 'P0',
  backend_service_boundary: 'P0',
  external_framework_boundary: 'P0',
  formal_authority_boundary: 'P0',
  mortal_combat_runtime: 'P0',
  high_rank_combat_runtime: 'P0',
  theater_ui_runtime: 'P0',
  auto_theater_asset_runtime: 'P0',
  l4_l5_boundary: 'P0',
  heavenwill_fate_runtime: 'P0',
  mainline_boundary: 'P0',
  evidence_gap: 'P1',
  coverage: 'P1',
  classification_mismatch: 'P1',
};

const boundaryAssertionTemplate = {
  runtimeModified: false,
  mortalCombatRuntimeMigrated: false,
  autoTheaterLiteRuntimeOpened: false,
  pureAutoBattlerRuntimeOpened: false,
  highRankCombatRuntimeOpened: false,
  theaterUiImplemented: false,
  autoTheaterAssetsGenerated: false,
  animationAssetRuntimePromoted: false,
  uiCalculatesOutcome: false,
  deepSeekAdjudicatesOutcome: false,
  supportLaneAsAttack: false,
  candidateAsFact: false,
  preparationAsFact: false,
  failureReasonAsReward: false,
  hiddenPrivateBodyRead: false,
  saveFieldAdded: false,
  saveFormatModified: false,
  migrationAdded: false,
  runFingerprintAdded: false,
  liveDeepSeekCalled: false,
  deepSeekAuthorityExpanded: false,
  deepSeekVisibleLoreEnabled: false,
  mirofishExportUsed: false,
  mirofishIntakeUsed: false,
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
  formalLocationOpened: false,
  formalFactionOpened: false,
  formalIdentityOpened: false,
  formalRewardOpened: false,
  npcLifeDeathOpened: false,
  knowledgeIndexBodyWritten: false,
  runtimeCanonPromoted: false,
  publicReleaseChanged: false,
  edgeOneDeployed: false,
  mainAutoMerged: false,
};

const boundaryFamilies = {
  runtimeModified: 'save_runtime_boundary',
  mortalCombatRuntimeMigrated: 'mortal_combat_runtime',
  autoTheaterLiteRuntimeOpened: 'mortal_combat_runtime',
  pureAutoBattlerRuntimeOpened: 'mortal_combat_runtime',
  highRankCombatRuntimeOpened: 'high_rank_combat_runtime',
  theaterUiImplemented: 'theater_ui_runtime',
  autoTheaterAssetsGenerated: 'auto_theater_asset_runtime',
  animationAssetRuntimePromoted: 'auto_theater_asset_runtime',
  uiCalculatesOutcome: 'ui_motion_boundary',
  deepSeekAdjudicatesOutcome: 'deepseek_boundary',
  supportLaneAsAttack: 'support_lane',
  candidateAsFact: 'candidate_lane',
  preparationAsFact: 'preparation_cue',
  failureReasonAsReward: 'failure_reason_lane',
  hiddenPrivateBodyRead: 'hidden_lore_boundary',
  saveFieldAdded: 'save_runtime_boundary',
  saveFormatModified: 'save_runtime_boundary',
  migrationAdded: 'save_runtime_boundary',
  runFingerprintAdded: 'save_runtime_boundary',
  liveDeepSeekCalled: 'deepseek_boundary',
  deepSeekAuthorityExpanded: 'deepseek_boundary',
  deepSeekVisibleLoreEnabled: 'deepseek_boundary',
  mirofishExportUsed: 'mirofish_boundary',
  mirofishIntakeUsed: 'mirofish_boundary',
  realOriginalFactsUsed: 'mirofish_boundary',
  namedNpcUsed: 'mirofish_boundary',
  hiddenAdjacentUsed: 'hidden_lore_boundary',
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
  formalLocationOpened: 'formal_authority_boundary',
  formalFactionOpened: 'formal_authority_boundary',
  formalIdentityOpened: 'formal_authority_boundary',
  formalRewardOpened: 'formal_authority_boundary',
  npcLifeDeathOpened: 'formal_authority_boundary',
  knowledgeIndexBodyWritten: 'hidden_lore_boundary',
  runtimeCanonPromoted: 'hidden_lore_boundary',
  publicReleaseChanged: 'mainline_boundary',
  edgeOneDeployed: 'mainline_boundary',
  mainAutoMerged: 'mainline_boundary',
};

const effectFamilies = {
  runtime_write: 'save_runtime_boundary',
  save_field: 'save_runtime_boundary',
  save_format_bump: 'save_runtime_boundary',
  migration_add: 'save_runtime_boundary',
  run_fingerprint: 'save_runtime_boundary',
  mortal_combat_runtime_migration: 'mortal_combat_runtime',
  auto_theater_lite_runtime: 'mortal_combat_runtime',
  pure_auto_battler_runtime: 'mortal_combat_runtime',
  high_rank_combat_runtime: 'high_rank_combat_runtime',
  theater_ui_implementation: 'theater_ui_runtime',
  auto_theater_asset_generation: 'auto_theater_asset_runtime',
  animation_asset_runtime_promotion: 'auto_theater_asset_runtime',
  hit_resolution: 'formal_authority_boundary',
  damage_write: 'formal_authority_boundary',
  npc_life_death: 'formal_authority_boundary',
  formal_reward: 'formal_authority_boundary',
  formal_location: 'formal_authority_boundary',
  support_as_attack: 'support_lane',
  candidate_as_fact: 'candidate_lane',
  preparation_as_fact: 'preparation_cue',
  failure_reason_as_reward: 'failure_reason_lane',
  deepseek_outcome_adjudication: 'deepseek_boundary',
  live_deepseek_call: 'deepseek_boundary',
  prompt_change: 'deepseek_boundary',
  context_expansion: 'deepseek_boundary',
  deepseek_visible_lore: 'deepseek_boundary',
  mirofish_export: 'mirofish_boundary',
  mirofish_intake: 'mirofish_boundary',
  real_original_fact: 'mirofish_boundary',
  named_npc: 'mirofish_boundary',
  hidden_adjacent: 'hidden_lore_boundary',
  backend_service: 'backend_service_boundary',
  external_framework_poc: 'external_framework_boundary',
  dependency_install: 'external_framework_boundary',
  read_only_scan: 'external_framework_boundary',
  patch_artifact: 'external_framework_boundary',
  subagent_use: 'external_framework_boundary',
  l4_runtime: 'l4_l5_boundary',
  l5_runtime: 'l4_l5_boundary',
  heavenwill_fate_runtime: 'heavenwill_fate_runtime',
  main_auto_merge: 'mainline_boundary',
  edgeone_deploy: 'mainline_boundary',
};

const hardTextFindings = [
  { pattern: /PREPARATION_AS_FACT/i, family: 'preparation_cue' },
  { pattern: /CANDIDATE_AS_FACT/i, family: 'candidate_lane' },
  { pattern: /SUPPORT_AS_ATTACK/i, family: 'support_lane' },
  { pattern: /FAILURE_REASON_AS_REWARD/i, family: 'failure_reason_lane' },
  { pattern: /UI_CALCULATES_DAMAGE/i, family: 'ui_motion_boundary' },
  { pattern: /DEEPSEEK_ADJUDICATES_OUTCOME/i, family: 'deepseek_boundary' },
  { pattern: /SYNTHETIC_HIDDEN_PRIVATE_BODY/i, family: 'hidden_lore_boundary' },
  { pattern: /MORTAL_RUNTIME_MIGRATED/i, family: 'mortal_combat_runtime' },
  { pattern: /THEATER_UI_IMPLEMENTED/i, family: 'theater_ui_runtime' },
  { pattern: /AUTO_THEATER_ASSET_GENERATED/i, family: 'auto_theater_asset_runtime' },
  { pattern: /HEAVENWILL_RUNTIME_VERDICT/i, family: 'heavenwill_fate_runtime' },
  { pattern: /MAIN_AUTO_MERGED/i, family: 'mainline_boundary' },
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

function getCaseText(sample) {
  return [
    sample.id,
    sample.caseType,
    sample.expectedDecision,
    sample.claim?.summary,
    ...(sample.claim?.notes || []),
  ].filter(Boolean).join('\n');
}

function normalizeBoundaries(boundaries = {}) {
  return { ...boundaryAssertionTemplate, ...boundaries };
}

function validateSchema(sample, index) {
  const findings = [];
  if (!sample || typeof sample !== 'object') {
    addFinding(findings, 'schema', 'schema_not_object', `Sample ${index} is not an object.`);
    return findings;
  }
  if (!sample.id || typeof sample.id !== 'string') {
    addFinding(findings, 'schema', 'missing_id', `Sample ${index} has no string id.`);
  }
  if (!caseTypes.has(sample.caseType)) {
    addFinding(findings, 'schema', 'bad_case_type', `${sample.id || index} has invalid caseType.`);
  }
  if (!decisions.has(sample.expectedDecision)) {
    addFinding(findings, 'schema', 'bad_expected_decision', `${sample.id || index} has invalid expectedDecision.`);
  }
  if (!Array.isArray(sample.expectedFamilies) || sample.expectedFamilies.length === 0) {
    addFinding(findings, 'schema', 'missing_expected_families', `${sample.id || index} has no expectedFamilies.`);
  }
  if (!sample.claim || typeof sample.claim !== 'object') {
    addFinding(findings, 'schema', 'missing_claim', `${sample.id || index} has no claim.`);
    return findings;
  }
  if (typeof sample.claim.summary !== 'string' || sample.claim.summary.length < 8) {
    addFinding(findings, 'schema', 'bad_summary', `${sample.id || index} has no useful claim.summary.`);
  }
  if (!Array.isArray(sample.claim.candidateEffects)) {
    addFinding(findings, 'schema', 'missing_candidate_effects', `${sample.id || index} must define candidateEffects array.`);
  }
  if (!Array.isArray(sample.claim.evidenceRefs) || sample.claim.evidenceRefs.length === 0) {
    addFinding(findings, 'evidence_gap', 'missing_evidence_refs', `${sample.id || index} has no evidenceRefs.`);
  }
  if (sample.caseType === 'positive') {
    for (const key of ['worldCoreFinalAuthority', 'reportOnly', 'syntheticOnly', 'mappingOnly']) {
      if (sample.claim[key] !== true) {
        addFinding(findings, 'worldcore_combatcore_evidence', `positive_${key}_not_true`, `${sample.id} positive sample must keep ${key}=true.`);
      }
    }
  }
  return findings;
}

function collectBoundaryFindings(sample, findings) {
  const boundaries = normalizeBoundaries(sample.claim?.boundaries);
  for (const [key, value] of Object.entries(boundaries)) {
    if (value === true) {
      addFinding(findings, boundaryFamilies[key] || 'formal_authority_boundary', `boundary_${key}`, `${sample.id} sets forbidden boundary ${key}=true.`);
    }
  }
  for (const effect of sample.claim?.candidateEffects || []) {
    addFinding(findings, effectFamilies[effect] || 'formal_authority_boundary', `effect_${effect}`, `${sample.id} includes forbidden candidate effect ${effect}.`);
  }
  const text = getCaseText(sample);
  for (const { pattern, family } of hardTextFindings) {
    if (pattern.test(text)) {
      addFinding(findings, family, `text_${family}`, `${sample.id} contains hard-stop marker ${pattern.source}.`);
    }
  }
  return boundaries;
}

function decideSample(sample, findings) {
  const p0p1 = findings.some(finding => finding.severity === 'P0' || finding.severity === 'P1');
  if (sample.caseType === 'negative') return p0p1 ? 'no_go_blocked' : 'lite_mapping_ready';
  if (sample.caseType === 'future_gate') return 'future_gate_required';
  if (p0p1) return 'no_go_blocked';
  return 'lite_mapping_ready';
}

const sampleFile = resolve(rootDir, getOption('sample-file', defaultSampleFile));
if (!existsSync(sampleFile)) {
  console.error(`Sample file not found: ${repoPath(sampleFile)}`);
  process.exit(2);
}

const sampleText = readFileSync(sampleFile, 'utf8');
const samples = JSON.parse(sampleText);
if (!Array.isArray(samples)) {
  console.error('Sample root must be an array.');
  process.exit(2);
}

const results = [];
const coveredFamilies = new Set();
const allBoundaryAssertions = { ...boundaryAssertionTemplate };

for (const [index, sample] of samples.entries()) {
  const findings = validateSchema(sample, index);
  const boundaries = collectBoundaryFindings(sample, findings);
  if (sample.caseType !== 'negative') {
    for (const [key, value] of Object.entries(boundaries)) {
      allBoundaryAssertions[key] = Boolean(allBoundaryAssertions[key] || value);
    }
  }
  for (const family of sample.expectedFamilies || []) coveredFamilies.add(family);
  for (const finding of findings) coveredFamilies.add(finding.family);
  const actualDecision = decideSample(sample, findings);
  results.push({
    id: sample.id || `sample-${index}`,
    caseType: sample.caseType,
    expectedDecision: sample.expectedDecision,
    actualDecision,
    decisionMatches: actualDecision === sample.expectedDecision,
    expectedFamilies: sample.expectedFamilies || [],
    findingCount: findings.length,
    findings,
  });
}

const decisionCounts = Object.fromEntries([...decisions].map(decision => [decision, 0]));
for (const result of results) decisionCounts[result.actualDecision] += 1;

const missingRequiredFamilies = requiredFamilies.filter(family => !coveredFamilies.has(family));
const schemaValid = results.filter(result => !result.findings.some(finding => finding.family === 'schema')).length;
const positiveP0 = results.filter(result => result.caseType === 'positive').flatMap(result => result.findings).filter(finding => finding.severity === 'P0').length;
const negativeFalseNegative = results.filter(result => result.caseType === 'negative' && result.actualDecision !== 'no_go_blocked').length;
const resultMismatch = results.filter(result => !result.decisionMatches).length;
const boundaryAssertionTrue = Object.values(allBoundaryAssertions).filter(Boolean).length;
const deterministicRounds = Number(getOption('deterministic-rounds', '240'));
const acceptedForGate = (
  schemaValid === results.length &&
  missingRequiredFamilies.length === 0 &&
  positiveP0 === 0 &&
  negativeFalseNegative === 0 &&
  resultMismatch === 0 &&
  boundaryAssertionTrue === 0 &&
  deterministicRounds >= 240
);

const dryRun = args.includes('--dry-run');
const timestamp = new Date().toISOString().replaceAll(':', '-');
const reportDir = resolve(rootDir, 'artifacts/v4.2.0/auto-theater-lite-mortal-mapping', timestamp);
const reportPath = resolve(reportDir, 'report.json');
const report = {
  targetVersion,
  checkerVersion,
  reportSchemaVersion,
  generatedAt: new Date().toISOString(),
  mode: dryRun ? 'dry-run' : 'run',
  sampleFile: repoPath(sampleFile),
  sampleHash: hashText(sampleText),
  summary: {
    sampleCount: results.length,
    schemaValid,
    decisionCounts,
    missingRequiredFamilies,
    positiveP0,
    negativeFalseNegative,
    resultMismatch,
    boundaryAssertionTrue,
    deterministicRounds,
    acceptedForGate,
  },
  boundaryAssertions: allBoundaryAssertions,
  results,
};

mkdirSync(reportDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  checkerVersion,
  sampleCount: results.length,
  schemaValid,
  decisionCounts,
  missingRequiredFamilies,
  positiveP0,
  negativeFalseNegative,
  resultMismatch,
  boundaryAssertionTrue,
  deterministicRounds,
  acceptedForGate,
  reportPath: repoPath(reportPath),
}, null, 2));

process.exit(acceptedForGate ? 0 : 1);
