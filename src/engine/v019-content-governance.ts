import rulesRaw from '../canon/v019-content-governance-rules.json';

export type V019Promotion =
  | 'candidate_pool'
  | 'fact_card_draft'
  | 'rule_draft'
  | 'test_sample'
  | 'copy_boundary'
  | 'release_manifest_check'
  | 'human_review_only'
  | 'deferred';

export interface V019ContentTemplate {
  id: string;
  label: string;
  runtimeTarget: string;
  requiredFields: string[];
  forbiddenFields: string[];
  requiredAuthority: string;
  deepSeekBoundary: string;
  requiredTests: string[];
}

export interface V019ContentDraft {
  templateId: string;
  fields: Record<string, unknown>;
  authority?: string[];
  sourcePointers?: unknown[];
  testSampleIds?: string[];
  deepSeekBoundary?: string;
}

export interface V019ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface V019PreflightInput {
  visibleCopy?: string[];
  deepSeekContextRefs?: string[];
  proposedWrites?: string[];
  releaseArtCaptions?: string[];
}

export interface V019PreflightFinding {
  scope: 'visible_copy' | 'deepseek_context' | 'write_target' | 'release_art_caption';
  value: string;
  rule: string;
}

export interface V019PreflightResult {
  ok: boolean;
  findings: V019PreflightFinding[];
}

export interface V019ReleaseArtManifestEntry {
  id: string;
  role: string;
  status: string;
  source: string;
  publicPath: string;
  usage?: string;
  boundary?: string;
  currentBinding?: string;
}

export interface V019ReleaseArtManifest {
  _meta?: {
    runtimeBinding?: string;
    boundary?: string;
  };
  entries: V019ReleaseArtManifestEntry[];
}

interface V019RulesFile {
  _meta: {
    version: string;
    status: string;
    runtimeAuthority: string;
    mirofishPolicy: string;
    saveFormatDecision: string;
  };
  sourceReviews: {
    intakeReview: string;
    sourcePackages: string[];
    coverageMatrix: string;
    forbiddenImportedFields: string[];
  };
  hardStops: string[];
  contentTemplates: V019ContentTemplate[];
  publicCanonBoundaries: Array<{
    id: string;
    category: string;
    visibility: string;
    promotedTo: V019Promotion[];
    allowedUses: string[];
    forbiddenImplications: string[];
  }>;
  playthroughAnchors: Array<{
    id: string;
    category: string;
    pathLabel: string;
    playerGoal: string;
    expectedOutcome: string;
    recommendedTestUse: string[];
    blockedOutcomes: string[];
  }>;
  releaseArtCaptionBoundaries: Array<{
    id: string;
    category: string;
    assetTheme: string;
    safeMotifs: string[];
    riskyMotifs: string[];
    safeCaptionBoundary: string;
    forbiddenVisualImplication: string;
  }>;
  releaseArtPack: V019ReleaseArtManifestEntry[];
  preflightRules: {
    bannedPlayerVisibleCopyPatterns: string[];
    bannedDeepSeekContextPatterns: string[];
    bannedWriteTargets: string[];
  };
  playerAdvocatePolicy: {
    smallVersionPlayerFacingRounds: number;
    rcRounds: number;
    v1RcSuggestedRounds: number;
    docsOnlyExemptionAllowed: boolean;
    liveDeepSeekProbe: string;
  };
}

const rules = rulesRaw as V019RulesFile;
const ALLOWED_RELEASE_ART_RUNTIME_BINDINGS = new Set(['not_bound_yet', 'approved_v1_public_release']);
const ALLOWED_RELEASE_ART_STATUSES = new Set(['selected_candidate', 'approved_release_asset']);
const ALLOWED_RELEASE_ART_BINDINGS = new Set([
  'src/components/title/TitleScreen.tsx',
  'index.html og:image',
  'public_release_docs_and_edgeone_manual_handoff',
]);

function cloneArray<T>(items: readonly T[]): T[] {
  return items.map(item => (
    Array.isArray(item)
      ? ([...item] as T)
      : typeof item === 'object' && item !== null
        ? ({ ...(item as Record<string, unknown>) } as T)
        : item
  ));
}

function hasField(fields: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(fields, key)
    && fields[key] !== undefined
    && fields[key] !== null
    && fields[key] !== '';
}

function findTemplate(id: string): V019ContentTemplate | undefined {
  return rules.contentTemplates.find(template => template.id === id);
}

function matchesAny(value: string, patterns: string[]): string | null {
  const normalized = value.toLowerCase();
  const match = patterns.find(pattern => normalized.includes(pattern.toLowerCase()));
  return match || null;
}

export function getV019GovernanceMeta() {
  return { ...rules._meta };
}

export function listV019ContentTemplates(): V019ContentTemplate[] {
  return rules.contentTemplates.map(template => ({
    ...template,
    requiredFields: [...template.requiredFields],
    forbiddenFields: [...template.forbiddenFields],
    requiredTests: [...template.requiredTests],
  }));
}

export function listV019PublicCanonBoundaries() {
  return rules.publicCanonBoundaries.map(boundary => ({
    ...boundary,
    promotedTo: [...boundary.promotedTo],
    allowedUses: [...boundary.allowedUses],
    forbiddenImplications: [...boundary.forbiddenImplications],
  }));
}

export function listV019PlaythroughAnchors() {
  return rules.playthroughAnchors.map(anchor => ({
    ...anchor,
    recommendedTestUse: [...anchor.recommendedTestUse],
    blockedOutcomes: [...anchor.blockedOutcomes],
  }));
}

export function listV019ReleaseArtCaptionBoundaries() {
  return rules.releaseArtCaptionBoundaries.map(boundary => ({
    ...boundary,
    safeMotifs: [...boundary.safeMotifs],
    riskyMotifs: [...boundary.riskyMotifs],
  }));
}

export function listV019ReleaseArtPackEntries(): V019ReleaseArtManifestEntry[] {
  return rules.releaseArtPack.map(entry => ({ ...entry }));
}

export function listV019HardStops(): string[] {
  return [...rules.hardStops];
}

export function validateV019ContentDraft(draft: V019ContentDraft): V019ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const template = findTemplate(draft.templateId);

  if (!template) {
    return {
      ok: false,
      errors: [`unknown_template:${draft.templateId}`],
      warnings,
    };
  }

  for (const field of template.requiredFields) {
    const fieldPresent = hasField(draft.fields, field)
      || (field === 'sourcePointers' && Boolean(draft.sourcePointers?.length))
      || (field === 'testSampleIds' && Boolean(draft.testSampleIds?.length))
      || (field === 'deepSeekBoundary' && Boolean(draft.deepSeekBoundary));
    if (!fieldPresent) errors.push(`missing_required_field:${template.id}:${field}`);
  }

  for (const field of template.forbiddenFields) {
    if (hasField(draft.fields, field)) errors.push(`forbidden_field:${template.id}:${field}`);
  }

  const authorityText = [
    ...(draft.authority || []),
    String(draft.fields.authority || ''),
    String(draft.fields.runtimeAuthority || ''),
  ].join('|');
  const blockedAuthority = matchesAny(authorityText, rules.preflightRules.bannedWriteTargets);
  if (blockedAuthority) errors.push(`forbidden_authority:${blockedAuthority}`);

  if (!draft.sourcePointers?.length && !hasField(draft.fields, 'sourcePointers')) {
    errors.push(`missing_source_pointers:${template.id}`);
  }

  if (!draft.testSampleIds?.length && !hasField(draft.fields, 'testSampleIds')) {
    warnings.push(`missing_explicit_test_sample_list:${template.id}`);
  }

  if (!draft.deepSeekBoundary && !hasField(draft.fields, 'deepSeekBoundary')) {
    warnings.push(`missing_deepseek_boundary:${template.id}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function runV019PublicSafetyPreflight(input: V019PreflightInput): V019PreflightResult {
  const findings: V019PreflightFinding[] = [];

  for (const value of input.visibleCopy || []) {
    const rule = matchesAny(value, rules.preflightRules.bannedPlayerVisibleCopyPatterns);
    if (rule) findings.push({ scope: 'visible_copy', value, rule });
  }

  for (const value of input.deepSeekContextRefs || []) {
    const rule = matchesAny(value, rules.preflightRules.bannedDeepSeekContextPatterns);
    if (rule) findings.push({ scope: 'deepseek_context', value, rule });
  }

  for (const value of input.proposedWrites || []) {
    const rule = matchesAny(value, rules.preflightRules.bannedWriteTargets);
    if (rule) findings.push({ scope: 'write_target', value, rule });
  }

  for (const value of input.releaseArtCaptions || []) {
    const publicCopyRule = matchesAny(value, rules.preflightRules.bannedPlayerVisibleCopyPatterns);
    const hiddenRule = matchesAny(value, rules.preflightRules.bannedDeepSeekContextPatterns);
    const rule = publicCopyRule || hiddenRule;
    if (rule) findings.push({ scope: 'release_art_caption', value, rule });
  }

  return {
    ok: findings.length === 0,
    findings,
  };
}

export function buildV019LongPlaythroughMatrix() {
  const anchors = listV019PlaythroughAnchors();
  const categoryCounts = anchors.reduce<Record<string, number>>((acc, anchor) => {
    acc[anchor.category] = (acc[anchor.category] || 0) + 1;
    return acc;
  }, {});

  return {
    status: 'deterministic_matrix',
    smallVersionPlayerFacingRounds: rules.playerAdvocatePolicy.smallVersionPlayerFacingRounds,
    rcRounds: rules.playerAdvocatePolicy.rcRounds,
    v1RcSuggestedRounds: rules.playerAdvocatePolicy.v1RcSuggestedRounds,
    liveDeepSeekProbe: rules.playerAdvocatePolicy.liveDeepSeekProbe,
    anchors,
    categoryCounts,
    requiredBlockedOutcomes: [...new Set(anchors.flatMap(anchor => anchor.blockedOutcomes))],
  };
}

export function validateV019ReleaseArtManifest(manifest: V019ReleaseArtManifest): V019ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredIds = new Set(rules.releaseArtPack.map(entry => entry.id));
  const entries = manifest.entries || [];

  if (manifest._meta?.runtimeBinding && !ALLOWED_RELEASE_ART_RUNTIME_BINDINGS.has(manifest._meta.runtimeBinding)) {
    errors.push(`release_art_runtime_binding_not_allowed:${manifest._meta.runtimeBinding}`);
  }

  for (const expectedId of requiredIds) {
    if (!entries.some(entry => entry.id === expectedId)) errors.push(`missing_release_art_entry:${expectedId}`);
  }

  for (const entry of entries) {
    if (!requiredIds.has(entry.id)) {
      warnings.push(`unexpected_release_art_entry:${entry.id}`);
      continue;
    }
    if (!ALLOWED_RELEASE_ART_STATUSES.has(entry.status)) errors.push(`invalid_release_art_status:${entry.id}:${entry.status}`);
    if (!entry.source) errors.push(`missing_release_art_source:${entry.id}`);
    if (!entry.publicPath) errors.push(`missing_release_art_public_path:${entry.id}`);
    if (!entry.boundary) errors.push(`missing_release_art_boundary:${entry.id}`);
    const currentBinding = entry.currentBinding || (entry as any).binding;
    if (entry.status === 'approved_release_asset' && (!currentBinding || currentBinding === 'not_bound')) {
      errors.push(`approved_release_art_missing_binding:${entry.id}`);
    }
    if (currentBinding && currentBinding !== 'not_bound') {
      if (entry.status !== 'approved_release_asset') {
        errors.push(`release_art_entry_binding_requires_approval:${entry.id}:${currentBinding}`);
      } else if (!ALLOWED_RELEASE_ART_BINDINGS.has(currentBinding)) {
        errors.push(`release_art_entry_binding_not_allowed:${entry.id}:${currentBinding}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function getV019PlayerAdvocatePolicy() {
  return { ...rules.playerAdvocatePolicy };
}

export function listV019MiroFishSourcePackages(): string[] {
  return cloneArray(rules.sourceReviews.sourcePackages);
}
