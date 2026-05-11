import narrativeGuUtilityMapRaw from '../canon/narrative-gu-scene-utility-map.json';
import type {
  Choice,
  NarrativeGuChoiceAffordance,
  NarrativeGuUtilityCategory,
  NarrativeJSON,
} from '../types';
import {
  getGuExpressionSpec,
  getKillerMoveExpressionSpec,
  listGuExpressionSpecs,
  listKillerMoveExpressionSpecs,
} from './gu-expression-registry';
import { getGuUseEntry, getGuUseRegistryEntries } from './gu-use-registry';

export const NARRATIVE_GU_AFFORDANCE_CATEGORIES = [
  'reconnaissance',
  'tracking',
  'healing',
  'detox',
  'obstacle_breaking',
  'concealment',
  'intimidation',
  'forbidden_ritual',
  'mobility',
  'protection',
  'control',
  'signal',
  'survival',
  'refinement',
] as const satisfies readonly NarrativeGuUtilityCategory[];

type NarrativeGuAffordanceStatus = NarrativeGuChoiceAffordance['status'];

interface UtilityCategoryEntry {
  id: NarrativeGuUtilityCategory;
  label: string;
  risk: 'low' | 'medium' | 'high';
  promptVerb: string;
  utilityIds: string[];
}

interface NarrativeGuUtilityMapFile {
  _meta: Record<string, unknown>;
  categories: UtilityCategoryEntry[];
}

interface NarrativeGuAffordanceRequest {
  sourceType?: 'gu' | 'killer_move';
  sourceName?: string;
  guName?: string;
  moveName?: string;
  utilityId?: string;
  category?: NarrativeGuUtilityCategory;
  riskHint?: string;
}

export interface NarrativeGuAffordanceIssue {
  kind:
    | 'unknown_gu_affordance'
    | 'missing_gu_affordance'
    | 'utility_mismatch'
    | 'forbidden_gu_gate';
  sourceName?: string;
  utilityId?: string;
  choiceId?: string;
  detail: string;
}

export interface NarrativeGuChoiceAnnotationResult {
  narrative: NarrativeJSON;
  issues: NarrativeGuAffordanceIssue[];
}

export interface NarrativeGuUseSuggestionValidation {
  allowed: boolean;
  executable: boolean;
  reason: string;
  affordance?: NarrativeGuChoiceAffordance;
}

const utilityMap = narrativeGuUtilityMapRaw as NarrativeGuUtilityMapFile;
const categoryIds = new Set<NarrativeGuUtilityCategory>(NARRATIVE_GU_AFFORDANCE_CATEGORIES);
const categoryById = new Map<NarrativeGuUtilityCategory, UtilityCategoryEntry>(
  utilityMap.categories.map(category => [category.id, category]),
);
const categoryByUtility = new Map<string, UtilityCategoryEntry>();

for (const category of utilityMap.categories) {
  for (const utilityId of category.utilityIds) {
    categoryByUtility.set(utilityId, category);
  }
}

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function addTokenNames(target: Set<string>, raw: unknown): void {
  if (!raw) return;
  if (typeof raw === 'string') {
    target.add(raw);
    return;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) addTokenNames(target, item);
    return;
  }
  if (typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (value) target.add(key);
    }
  }
}

export function getOwnedNarrativeGuNames(store: any): Set<string> {
  const names = new Set<string>();
  const inventories = [
    ...(Array.isArray(store?.inventory) ? store.inventory : []),
    ...(Array.isArray(store?.apertureInventory?.gu) ? store.apertureInventory.gu : []),
  ];
  for (const gu of inventories) {
    const name = normalizeName(gu?.name || gu?.specId);
    if (name) names.add(name);
  }

  const flags = store?.flags || {};
  addTokenNames(names, flags.temporaryGuUse);
  addTokenNames(names, flags.sceneGuTokens);
  addTokenNames(names, flags.borrowedGu);
  addTokenNames(names, flags.sceneAuthorizedGu);
  return names;
}

function getKnownKillerMoveNames(store: any): Set<string> {
  const names = new Set<string>();
  const moves = [
    ...(Array.isArray(store?.killMoves) ? store.killMoves : []),
    ...(Array.isArray(store?.killerMoves) ? store.killerMoves : []),
  ];
  for (const move of moves) {
    const name = normalizeName(move?.name || move?.moveName);
    if (name) names.add(name);
  }
  return names;
}

export function getNarrativeGuUtilityCategory(utilityId: string): UtilityCategoryEntry | undefined {
  return categoryByUtility.get(utilityId);
}

export function validateNarrativeGuUtilityMap(): string[] {
  const issues: string[] = [];
  const seenUtilities = new Set<string>();

  for (const category of utilityMap.categories) {
    if (!categoryIds.has(category.id)) {
      issues.push(`unknown category id: ${category.id}`);
    }
    if (!category.label) issues.push(`${category.id}: missing label`);
    if (!category.promptVerb) issues.push(`${category.id}: missing promptVerb`);
    for (const utilityId of category.utilityIds) {
      if (seenUtilities.has(utilityId)) issues.push(`duplicate utility id: ${utilityId}`);
      seenUtilities.add(utilityId);
    }
  }

  for (const spec of listGuExpressionSpecs()) {
    for (const utilityId of spec.sceneUtilities) {
      if (!seenUtilities.has(utilityId)) issues.push(`${spec.guName}: missing utility ${utilityId}`);
    }
  }
  for (const move of listKillerMoveExpressionSpecs()) {
    for (const utilityId of move.sceneUtilities) {
      if (!seenUtilities.has(utilityId)) issues.push(`${move.moveName}: missing utility ${utilityId}`);
    }
  }

  return issues;
}

function resolveRequestSource(request: NarrativeGuAffordanceRequest): {
  sourceType: 'gu' | 'killer_move';
  sourceName: string;
  sceneUtilities: string[];
  path?: string;
  availability?: string;
  realmScope?: string;
  uniqueness?: string;
} | null {
  const sourceName = normalizeName(request.sourceName || request.guName || request.moveName);
  if (!sourceName) return null;

  const preferredType = request.sourceType;
  if (preferredType !== 'killer_move') {
    const gu = getGuExpressionSpec(sourceName);
    if (gu) {
      return {
        sourceType: 'gu',
        sourceName,
        sceneUtilities: gu.sceneUtilities,
        path: gu.path,
        availability: gu.availability,
        realmScope: gu.realmScope,
        uniqueness: gu.uniqueness,
      };
    }
  }

  const move = getKillerMoveExpressionSpec(sourceName);
  if (move) {
    return {
      sourceType: 'killer_move',
      sourceName,
      sceneUtilities: move.sceneUtilities,
      path: move.path,
      availability: 'killer_move',
      realmScope: 'mortal',
      uniqueness: move.failureMode,
    };
  }

  return null;
}

function chooseUtility(
  source: NonNullable<ReturnType<typeof resolveRequestSource>>,
  request: NarrativeGuAffordanceRequest,
): { utilityId: string; category: UtilityCategoryEntry } | null {
  const candidates = request.category
    ? source.sceneUtilities.filter(utilityId => categoryByUtility.get(utilityId)?.id === request.category)
    : source.sceneUtilities;
  const utilityId = request.utilityId || candidates[0] || source.sceneUtilities[0];
  if (!utilityId || !source.sceneUtilities.includes(utilityId)) return null;
  const category = categoryByUtility.get(utilityId);
  if (!category) return null;
  if (request.category && category.id !== request.category) return null;
  return { utilityId, category };
}

function makeAffordance(
  source: NonNullable<ReturnType<typeof resolveRequestSource>>,
  request: NarrativeGuAffordanceRequest,
  status: NarrativeGuAffordanceStatus,
  reason: string,
  owned: boolean,
): NarrativeGuChoiceAffordance | null {
  const resolvedUtility = chooseUtility(source, request);
  if (!resolvedUtility) return null;
  const forbidden = source.realmScope === 'mortal_forbidden' || resolvedUtility.category.id === 'forbidden_ritual';
  const sceneGated = source.availability === 'scene_gated' || forbidden;
  const risk = request.riskHint
    ? resolvedUtility.category.risk
    : forbidden
      ? 'high'
      : resolvedUtility.category.risk;
  return {
    sourceType: source.sourceType,
    sourceName: source.sourceName,
    utilityId: resolvedUtility.utilityId,
    category: resolvedUtility.category.id,
    categoryLabel: resolvedUtility.category.label,
    label: `${source.sourceName} · ${resolvedUtility.category.label}`,
    status,
    reason,
    risk,
    riskHint: request.riskHint || (forbidden ? '需要强剧情门槛，可能引发反噬或声名风险。' : `可用于${resolvedUtility.category.promptVerb}，结果仍由本地规则校验。`),
    owned,
    sceneGated,
    forbidden,
    promptHint: source.uniqueness,
  };
}

function validateChoiceAffordanceRequest(
  request: NarrativeGuAffordanceRequest,
  store: any,
): { affordance?: NarrativeGuChoiceAffordance; issue?: NarrativeGuAffordanceIssue } {
  const sourceName = normalizeName(request.sourceName || request.guName || request.moveName);
  const source = resolveRequestSource(request);
  if (!source) {
    return {
      issue: {
        kind: 'unknown_gu_affordance',
        sourceName,
        utilityId: request.utilityId,
        detail: `${sourceName || '未知蛊虫'} 尚未登记为 GuExpressionSpec 或 KillerMoveExpressionSpec，只能作为传闻线索。`,
      },
    };
  }

  const ownedGu = getOwnedNarrativeGuNames(store);
  const knownMoves = getKnownKillerMoveNames(store);
  const owned = source.sourceType === 'gu'
    ? ownedGu.has(source.sourceName)
    : knownMoves.has(source.sourceName);
  const resolvedUtility = chooseUtility(source, request);
  if (!resolvedUtility) {
    const affordance = makeAffordance(source, request, 'blocked', '用途未登记或与该蛊虫不匹配，已降级为线索。', owned);
    return {
      affordance: affordance || undefined,
      issue: {
        kind: 'utility_mismatch',
        sourceName: source.sourceName,
        utilityId: request.utilityId,
        detail: `${source.sourceName} 不具备 ${request.utilityId || request.category || '该'} 剧情用途。`,
      },
    };
  }

  if (!owned) {
    return {
      affordance: makeAffordance(source, request, 'missing', `你尚未持有或学会 ${source.sourceName}，此选项只能作为线索。`, false) || undefined,
      issue: {
        kind: 'missing_gu_affordance',
        sourceName: source.sourceName,
        utilityId: resolvedUtility.utilityId,
        detail: `玩家没有 ${source.sourceName}，不能显示为可执行蛊虫解法。`,
      },
    };
  }

  const forbidden = source.realmScope === 'mortal_forbidden' || resolvedUtility.category.id === 'forbidden_ritual';
  if (forbidden) {
    return {
      affordance: makeAffordance(source, request, 'forbidden', `${source.sourceName} 属于禁忌/强场景门槛，只能在明确场景授权后候选执行。`, true) || undefined,
      issue: {
        kind: 'forbidden_gu_gate',
        sourceName: source.sourceName,
        utilityId: resolvedUtility.utilityId,
        detail: `${source.sourceName} 需要禁忌场景门槛，不能当普通安全解法展示。`,
      },
    };
  }

  return {
    affordance: makeAffordance(source, request, 'available', `${source.sourceName} 可作为剧情解法候选，正式结果仍由本地规则校验。`, true) || undefined,
  };
}

export function collectNarrativeGuAffordances(store: any): NarrativeGuChoiceAffordance[] {
  const ownedGu = getOwnedNarrativeGuNames(store);
  const knownMoves = getKnownKillerMoveNames(store);
  const affordances: NarrativeGuChoiceAffordance[] = [];

  for (const guName of ownedGu) {
    const spec = getGuExpressionSpec(guName);
    if (!spec) continue;
    for (const utilityId of spec.sceneUtilities) {
      const result = validateChoiceAffordanceRequest({
        sourceType: 'gu',
        sourceName: guName,
        utilityId,
      }, store);
      if (result.affordance) affordances.push(result.affordance);
    }
  }

  for (const moveName of knownMoves) {
    const move = getKillerMoveExpressionSpec(moveName);
    if (!move) continue;
    for (const utilityId of move.sceneUtilities) {
      const result = validateChoiceAffordanceRequest({
        sourceType: 'killer_move',
        sourceName: moveName,
        utilityId,
      }, store);
      if (result.affordance) affordances.push(result.affordance);
    }
  }

  return affordances.sort((a, b) => `${a.category}:${a.sourceName}:${a.utilityId}`.localeCompare(`${b.category}:${b.sourceName}:${b.utilityId}`));
}

export function buildNarrativeGuAffordancePromptInject(store: any): string {
  const affordances = collectNarrativeGuAffordances(store);
  if (affordances.length === 0) {
    return [
      '【v0.8蛊虫剧情表现化】',
      '玩家当前没有可调用的已登记剧情蛊虫解法。若叙事需要蛊虫能力，只能写寻找线索或传闻，不能显示为可执行使用。',
    ].join('\n');
  }

  const visible = affordances.slice(0, 18);
  const lines = visible.map(affordance => (
    `- ${affordance.categoryLabel}: ${affordance.sourceName}/${affordance.utilityId} [${affordance.status}] ${affordance.reason}`
  ));
  return [
    '【v0.8蛊虫剧情表现化】',
    '可把下列已登记能力写入 choices[].gu_affordance，字段形如 {sourceType:"gu",sourceName:"月光蛊",utilityId:"cut_rope",category:"obstacle_breaking"}。',
    '若要写 state_update.gu_use_suggestions.add，必须同时写 utilityId/category/sceneValidated/sceneTags/reason；建议不等于执行，本地引擎会校验持有、用途、禁忌门槛、目标和代价。',
    '禁止把蛊虫剧情用途直接写成 HP、真元、资源、掉落、战斗胜负或正式奖励变化。',
    ...lines,
  ].join('\n');
}

function normalizeChoiceRequests(choice: Choice): NarrativeGuAffordanceRequest[] {
  const direct = (choice as any).guAffordances ?? (choice as any).gu_affordance;
  const rawItems = Array.isArray(direct) ? direct : direct ? [direct] : [];
  const requests = rawItems
    .map(item => ({
      sourceType: item?.sourceType,
      sourceName: item?.sourceName || item?.guName || item?.moveName,
      utilityId: item?.utilityId,
      category: item?.category,
      riskHint: item?.riskHint,
    }))
    .filter(item => item.sourceName);

  if (requests.length > 0) return requests;

  const text = String(choice.text || '');
  const match = text.match(/使用[「『《]?([\u4e00-\u9fa5]{1,12}蛊|月霓裳|爱生离)[」』》]?/);
  if (!match?.[1]) return [];
  return [{ sourceType: 'gu', sourceName: match[1] }];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function downgradeUnavailableChoiceText(text: string, sourceName: string): string {
  const pattern = new RegExp(`使用[「『《]?${escapeRegExp(sourceName)}[」』》]?`, 'g');
  const next = text.replace(pattern, `寻找「${sourceName}」线索`);
  return next === text ? `${text}（改为寻找${sourceName}相关线索）` : next;
}

export function annotateNarrativeGuChoices(narrative: NarrativeJSON, store: any): NarrativeGuChoiceAnnotationResult {
  const issues: NarrativeGuAffordanceIssue[] = [];
  const choices = (narrative.narrative.choices || []).map(choice => {
    const requests = normalizeChoiceRequests(choice);
    if (requests.length === 0) return choice;

    const affordances: NarrativeGuChoiceAffordance[] = [];
    let text = choice.text;
    let riskNote = choice.risk_note || '';

    for (const request of requests) {
      const result = validateChoiceAffordanceRequest(request, store);
      if (result.affordance) affordances.push(result.affordance);
      if (result.issue) {
        issues.push({ ...result.issue, choiceId: choice.id });
        if (result.affordance?.status === 'missing' || result.affordance?.status === 'blocked') {
          text = downgradeUnavailableChoiceText(text, result.affordance.sourceName);
        } else if (result.issue.kind === 'unknown_gu_affordance' && result.issue.sourceName) {
          text = downgradeUnavailableChoiceText(text, result.issue.sourceName);
        }
        riskNote = `${riskNote}${riskNote ? '；' : ''}系统校验：${result.issue.detail}`;
      }
    }

    return {
      ...choice,
      text,
      risk_note: riskNote,
      guAffordances: affordances,
      gu_affordance: undefined,
    };
  });

  return {
    narrative: {
      ...narrative,
      narrative: {
        ...narrative.narrative,
        choices,
      },
    },
    issues,
  };
}

export function buildSelectedChoiceNarrativeGuContext(store: any, choiceId: string | null): string {
  if (!choiceId) return '';
  const choice = (store?.currentNarrative?.narrative?.choices || []).find((item: Choice) => item.id === choiceId);
  if (!choice) return '';
  const requests = normalizeChoiceRequests(choice);
  const affordances = requests
    .map(request => validateChoiceAffordanceRequest(request, store).affordance)
    .filter(Boolean) as NarrativeGuChoiceAffordance[];
  const guLines = affordances.length > 0
    ? affordances.map(affordance => `- ${affordance.label}: ${affordance.status}; ${affordance.reason}; risk=${affordance.risk}`).join('\n')
    : '- 本次选择未绑定已登记蛊虫剧情用途。';
  const rawAnchorTags = (choice as any).anchorTags ?? (choice as any).anchor_tags ?? [];
  const anchorTags = Array.isArray(rawAnchorTags) ? rawAnchorTags : [rawAnchorTags].filter(Boolean);
  const anchorLines = anchorTags.length > 0
    ? anchorTags.map((tag: any) => `- ${tag.label || tag.kind}: ${tag.anchorId || 'free'}; ${tag.reason || '等待本地 storyAnchorState 校验'}; severity=${tag.severity || 'medium'}`).join('\n')
    : '- 本次选择未绑定剧情锚点标签。';
  return [
    '【玩家本轮选择详情】',
    `choiceId=${choice.id}`,
    `choiceText=${choice.text}`,
    `choiceRisk=${choice.risk}`,
    `choiceRiskNote=${choice.risk_note}`,
    '绑定蛊虫剧情用途：',
    guLines,
    '绑定剧情锚点/IF 信息：',
    anchorLines,
    '下一轮叙事必须承认玩家选择内容；若蛊虫用途不可执行，只能写为寻找线索、尝试失败或引发风险，不能直接给正式收益。',
  ].join('\n');
}

function hasCombatOnlyEffects(guName: string): boolean {
  const entry = getGuUseEntry(guName);
  return entry.effects.some(effect => effect.type === 'combat_attack');
}

export function validateNarrativeGuUseSuggestion(suggestion: any, store: any): NarrativeGuUseSuggestionValidation {
  const guName = normalizeName(suggestion?.guName);
  const result = validateChoiceAffordanceRequest({
    sourceType: 'gu',
    sourceName: guName,
    utilityId: suggestion?.utilityId,
    category: suggestion?.category,
    riskHint: suggestion?.riskHint,
  }, store);

  if (!result.affordance) {
    return {
      allowed: false,
      executable: false,
      reason: result.issue?.detail || `${guName || '未知蛊虫'} 未通过剧情用途校验。`,
    };
  }

  if (result.affordance.status === 'missing' || result.affordance.status === 'blocked') {
    return {
      allowed: false,
      executable: false,
      affordance: result.affordance,
      reason: result.issue?.detail || result.affordance.reason,
    };
  }

  const registryEntry = getGuUseRegistryEntries().find(entry => entry.guName === guName);
  if (!registryEntry) {
    return {
      allowed: true,
      executable: false,
      affordance: result.affordance,
      reason: `${guName} 尚未登记 gu-use-registry，保留为剧情选择表现，不执行正式效果。`,
    };
  }

  if (registryEntry.useMode === 'lore_only') {
    return {
      allowed: false,
      executable: false,
      affordance: result.affordance,
      reason: `${guName} 是 lore_only 锚点，不能由剧情候选执行。`,
    };
  }

  if (hasCombatOnlyEffects(guName)) {
    return {
      allowed: true,
      executable: false,
      affordance: result.affordance,
      reason: `${guName} 的正式战斗效果必须进入本地战斗引擎，剧情候选不直接执行。`,
    };
  }

  if (suggestion?.sceneValidated !== true) {
    return {
      allowed: true,
      executable: false,
      affordance: result.affordance,
      reason: `${guName} 缺少 sceneValidated=true，仅作为剧情候选记录。`,
    };
  }

  if (result.affordance.forbidden && (!Array.isArray(suggestion?.sceneTags) || suggestion.sceneTags.length === 0)) {
    return {
      allowed: true,
      executable: false,
      affordance: result.affordance,
      reason: `${guName} 属于禁忌蛊，缺少 sceneTags 说明强场景门槛，仅保留为剧情候选。`,
    };
  }

  return {
    allowed: true,
    executable: true,
    affordance: result.affordance,
    reason: `${guName} 通过剧情用途与 gu-use-registry 双重校验。`,
  };
}
