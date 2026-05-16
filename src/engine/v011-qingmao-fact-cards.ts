import qingmaoCanonFactCardsRaw from '../canon/qingmao-canon-fact-cards.json';
import type {
  HiddenFactRefState,
  LivingFactScope,
  LivingFactConfidence,
  PlayerKnownFact,
} from '../types';

export interface QingmaoCanonFactSourcePointer {
  path: string;
  locator: string;
  keywords: string[];
  note?: string;
}

export interface QingmaoCanonFactCard {
  id: string;
  scope: LivingFactScope;
  classification: 'hard_fact' | 'hidden_fact' | 'player_visible_fact' | string;
  v012Category?: 'canon_hard_fact' | 'player_visible_fact' | 'hidden_fact_ref' | 'if_deviation_point' | string;
  visibility: 'player_visible' | 'rumor' | 'discovered_or_rumor' | 'hidden' | string;
  confidence: LivingFactConfidence | string;
  summary: string;
  playerVisibleSummary?: string;
  anchorRefs?: string[];
  ifAxes?: string[];
  sourcePointers: QingmaoCanonFactSourcePointer[];
  runtimeExposure?: string;
  revealPolicyId?: string;
  designBoundary: string;
}

export interface QingmaoFactReferenceSet {
  visibleFactCardIds: string[];
  hiddenFactCardIds: string[];
  sourcePointerRefs: string[];
}

export interface QingmaoFactPromptContext {
  visibleFacts: Array<{
    id: string;
    scope: LivingFactScope;
    confidence: string;
    summary: string;
    sourcePointerRefs: string[];
    designBoundary: string;
  }>;
  hiddenFactRefs: Array<{
    id: string;
    scope: LivingFactScope;
    guard: 'hidden';
    runtimeExposure: 'hidden_ref_only';
    revealPolicyId: string;
    sourcePointerRefs: string[];
  }>;
}

interface QingmaoCanonFactCardsFile {
  cards: QingmaoCanonFactCard[];
}

const qingmaoCanonFactCards = qingmaoCanonFactCardsRaw as QingmaoCanonFactCardsFile;

function cloneSourcePointer(pointer: QingmaoCanonFactSourcePointer): QingmaoCanonFactSourcePointer {
  return {
    path: pointer.path,
    locator: pointer.locator,
    keywords: [...pointer.keywords],
  };
}

function cloneCard(card: QingmaoCanonFactCard): QingmaoCanonFactCard {
  return {
    ...card,
    anchorRefs: card.anchorRefs ? [...card.anchorRefs] : undefined,
    ifAxes: card.ifAxes ? [...card.ifAxes] : undefined,
    sourcePointers: card.sourcePointers.map(cloneSourcePointer),
  };
}

const cardsById = new Map<string, QingmaoCanonFactCard>(
  qingmaoCanonFactCards.cards.map(card => [card.id, card]),
);

function uniqueExisting(ids: string[]): string[] {
  return [...new Set(ids)].filter(id => cardsById.has(id));
}

function normalizedText(value: string | undefined): string {
  return (value || '').replace(/\s+/g, '');
}

function sourcePointerRefsFor(card: QingmaoCanonFactCard): string[] {
  return card.sourcePointers.map(pointer => `${pointer.path}#${pointer.locator}`);
}

function addExisting(target: Set<string>, id: string): void {
  if (cardsById.has(id)) target.add(id);
}

export function isHiddenQingmaoCanonFactCard(card: QingmaoCanonFactCard): boolean {
  return card.visibility === 'hidden' || card.classification === 'hidden_fact' || card.runtimeExposure === 'hidden_ref_only';
}

export function listQingmaoCanonFactCards(): QingmaoCanonFactCard[] {
  return qingmaoCanonFactCards.cards.map(cloneCard);
}

export function getQingmaoCanonFactCard(id: string): QingmaoCanonFactCard | null {
  const card = cardsById.get(id);
  return card ? cloneCard(card) : null;
}

export function listVisibleQingmaoCanonFactCards(): QingmaoCanonFactCard[] {
  return qingmaoCanonFactCards.cards
    .filter(card => !isHiddenQingmaoCanonFactCard(card))
    .map(cloneCard);
}

export function listHiddenQingmaoCanonFactCards(): QingmaoCanonFactCard[] {
  return qingmaoCanonFactCards.cards
    .filter(isHiddenQingmaoCanonFactCard)
    .map(cloneCard);
}

export function buildQingmaoFactReferenceSet(input: {
  rawText?: string;
  targetRef?: string;
  intentType?: string;
  evidenceRefIds?: string[];
}): QingmaoFactReferenceSet {
  const targetRef = input.targetRef || '';
  const text = normalizedText(input.rawText);
  const visible = new Set<string>();
  const hidden = new Set<string>();

  if (targetRef === 'faction:baijia_zhai' || text.includes('白家') || text.includes('白凝冰')) {
    addExisting(visible, 'qingmao_three_clans_layout');
    addExisting(visible, 'baijia_bai_ning_bing_public_talent');
  }

  if (targetRef === 'npc:bai_ning_bing:defeat_or_kill') {
    addExisting(visible, 'qingmao_three_clans_layout');
    addExisting(visible, 'baijia_bai_ning_bing_public_talent');
    addExisting(hidden, 'bai_ning_bing_extreme_body_hidden_risk_ref');
  }

  if (targetRef === 'region:outside_qingmao' || text.includes('青茅山')) {
    addExisting(visible, 'qingmao_location_guyue_village');
    addExisting(visible, 'qingmao_three_clans_layout');
  }

  if (text.includes('古月') || text.includes('族学') || text.includes('開竅') || text.includes('开窍')) {
    addExisting(visible, 'qingmao_location_guyue_village');
    addExisting(visible, 'guyue_aperture_ceremony_and_clan_school');
  }

  if (text.includes('资质') || text.includes('資質') || text.includes('甲等') || text.includes('乙等') || text.includes('丙等') || text.includes('丁等')) {
    addExisting(visible, 'guyue_aptitude_grade_public_order');
  }

  if (text.includes('本命蛊') || text.includes('本命蠱') || text.includes('蛊室') || text.includes('蠱室') || text.includes('炼化') || text.includes('煉化')) {
    addExisting(visible, 'guyue_lifebound_gu_first_exam');
  }

  if (text.includes('月光蛊') || text.includes('月光蠱')) {
    addExisting(visible, 'guyue_moonlight_gu_local_specialty');
  }

  if (text.includes('月兰') || text.includes('月蘭') || text.includes('食料') || text.includes('饲养') || text.includes('餵养') || text.includes('喂养')) {
    addExisting(visible, 'guyue_moon_orchid_feeding_base');
  }

  if (text.includes('酒虫') || text.includes('酒蟲')) {
    addExisting(visible, 'liquor_worm_rare_support_role');
  }

  if (text.includes('元石') || text.includes('真元') || text.includes('资源') || text.includes('資源')) {
    addExisting(visible, 'primeval_stone_mortal_currency_and_cultivation');
  }

  if (targetRef === 'route:caravan' || text.includes('商队') || text.includes('商隊') || text.includes('客栈') || text.includes('客棧') || text.includes('离开青茅') || text.includes('逃离青茅')) {
    addExisting(visible, 'qingmao_location_guyue_village');
    addExisting(visible, 'qingmao_caravan_trade_window');
  }

  if (text.includes('狼潮') || text.includes('兽潮') || text.includes('獸潮') || text.includes('电狼') || text.includes('電狼')) {
    addExisting(visible, 'qingmao_wolf_tide_recurring_pressure');
    addExisting(visible, 'qingmao_three_clan_alliance_war_merit');
  }

  if (text.includes('战功') || text.includes('戰功') || text.includes('三寨联盟') || text.includes('三寨聯盟')) {
    addExisting(visible, 'qingmao_three_clan_alliance_war_merit');
  }

  if (text.includes('玉皮蛊') || text.includes('玉皮蠱') || text.includes('白玉蛊') || text.includes('白玉蠱')) {
    addExisting(visible, 'guyue_jade_skin_white_jade_refinement_boundary');
  }

  if (text.includes('花酒')) {
    addExisting(visible, 'flower_wine_monk_public_legend');
    addExisting(hidden, 'flower_wine_inheritance_hidden_location_ref');
  }

  if (targetRef === 'npc:fang_yuan' || targetRef === 'item:spring_autumn_cicada' || text.includes('方源') || text.includes('春秋蝉') || text.includes('春秋蟬')) {
    addExisting(hidden, 'fang_yuan_private_causality_hidden_anchor');
  }

  if (text.includes('灵泉') || text.includes('靈泉')) {
    addExisting(hidden, 'guyue_spirit_spring_resource_basis');
  }

  if (text.includes('古月一代') || text.includes('一代族长') || text.includes('一代族長') || text.includes('天鹤') || text.includes('天鶴') || text.includes('血道')) {
    addExisting(hidden, 'guyue_first_gen_hidden_blood_path_ref');
  }

  if (text.includes('北冥冰魄') || text.includes('十绝') || text.includes('十絕') || text.includes('自爆') || text.includes('杀死白凝冰') || text.includes('殺死白凝冰')) {
    addExisting(visible, 'baijia_bai_ning_bing_public_talent');
    addExisting(hidden, 'bai_ning_bing_extreme_body_hidden_risk_ref');
  }

  const visibleFactCardIds = uniqueExisting([...visible]).filter((id) => {
    const card = cardsById.get(id);
    return card ? !isHiddenQingmaoCanonFactCard(card) : false;
  });
  const hiddenFactCardIds = uniqueExisting([...hidden, ...visible]).filter((id) => {
    const card = cardsById.get(id);
    return card ? isHiddenQingmaoCanonFactCard(card) : false;
  });
  const sourcePointerRefs = uniqueExisting([...visibleFactCardIds, ...hiddenFactCardIds])
    .flatMap(id => sourcePointerRefsFor(cardsById.get(id)!));

  return {
    visibleFactCardIds,
    hiddenFactCardIds,
    sourcePointerRefs: [...new Set(sourcePointerRefs)],
  };
}

export function buildQingmaoFactPromptContext(refs: Partial<QingmaoFactReferenceSet>): QingmaoFactPromptContext {
  const requestedIds = uniqueExisting([
    ...(refs.visibleFactCardIds || []),
    ...(refs.hiddenFactCardIds || []),
  ]);
  const visibleFacts: QingmaoFactPromptContext['visibleFacts'] = [];
  const hiddenFactRefs: QingmaoFactPromptContext['hiddenFactRefs'] = [];

  for (const id of requestedIds) {
    const card = cardsById.get(id);
    if (!card) continue;

    if (isHiddenQingmaoCanonFactCard(card)) {
      hiddenFactRefs.push({
        id: card.id,
        scope: card.scope,
        guard: 'hidden',
        runtimeExposure: 'hidden_ref_only',
        revealPolicyId: card.revealPolicyId || 'hidden_fact_requires_engine_gate',
        sourcePointerRefs: sourcePointerRefsFor(card),
      });
      continue;
    }

    visibleFacts.push({
      id: card.id,
      scope: card.scope,
      confidence: card.confidence,
      summary: card.playerVisibleSummary || card.summary,
      sourcePointerRefs: sourcePointerRefsFor(card),
      designBoundary: card.designBoundary,
    });
  }

  return { visibleFacts, hiddenFactRefs };
}

export function buildPlayerKnownFactFromQingmaoCard(
  id: string,
  turn = 0,
): PlayerKnownFact | null {
  const card = cardsById.get(id);
  if (!card || isHiddenQingmaoCanonFactCard(card)) return null;

  return {
    id: card.id,
    scope: card.scope,
    source: 'canon_summary',
    summary: card.playerVisibleSummary || card.summary,
    learnedTurn: Math.max(0, Math.floor(turn)),
    confidence: card.confidence === 'confirmed' ? 'confirmed' : 'rumor',
    tags: [...new Set(card.sourcePointers.flatMap(pointer => pointer.keywords))],
  };
}

export function buildHiddenFactRefFromQingmaoCard(
  id: string,
  turn: number | null = null,
): HiddenFactRefState | null {
  const card = cardsById.get(id);
  if (!card || !isHiddenQingmaoCanonFactCard(card)) return null;

  return {
    id: card.id,
    scope: card.scope,
    sourcePointer: sourcePointerRefsFor(card).join(';'),
    revealPolicyId: card.revealPolicyId || 'hidden_fact_requires_engine_gate',
    guard: 'hidden',
    lastCheckedTurn: turn === null ? null : Math.max(0, Math.floor(turn)),
  };
}
