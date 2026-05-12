import sceneSpecsRaw from '../canon/v080-calamity-scene-specs.json';
import type {
  CalamityPreview,
  CalamitySceneKind,
  CalamitySceneSpec,
  CombatEncounterScale,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
  WorldActionResolutionMode,
  WorldActionRisk,
} from '../types';
import { buildCalamityPreview } from './v080-cultivation-calamity-engine';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';

interface SceneTemplate {
  kind: CalamitySceneKind;
  label: string;
  omen: string;
  entry: string;
  responses: CalamitySceneSpec['allowedResponses'];
  consequences: string[];
  combatScale?: CombatEncounterScale;
  tags: string[];
}

const sceneTemplates = (sceneSpecsRaw as { entries: SceneTemplate[] }).entries;

export type CalamityWorldActionPhase = 'omen' | 'consequence';

export interface CalamityWorldActionBridge {
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
}

export function listCalamitySceneTemplates(): SceneTemplate[] {
  return sceneTemplates.slice();
}

function lowerTags(preview: CalamityPreview): Set<string> {
  return new Set((preview.tags || []).map(tag => String(tag).toLowerCase()));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(store: any): number {
  return Number(store?.turn || 1);
}

function currentLocationId(store: any): string {
  return String(store?.currentLocationId || store?.currentDomain || store?.sceneSessionState?.locationId || '');
}

function calamityRisk(spec: CalamitySceneSpec): WorldActionRisk {
  if (spec.severity >= 4 || spec.category === 'heavenly_tribulation') return 'high';
  if (spec.severity >= 2) return 'medium';
  return 'low';
}

function defaultCalamityFacts(spec: CalamitySceneSpec, phase: CalamityWorldActionPhase): string[] {
  const affected = spec.affectedResourceNodeIds.length > 0 ? spec.affectedResourceNodeIds.join('、') : '暂未锁定';
  const facts = [
    phase === 'omen'
      ? `灾劫预兆已由本地引擎登记：${spec.name}。`
      : `灾劫结算已进入本地行动协议：${spec.name}。`,
    `灾劫类型：${spec.kind}；流派：${spec.path}；严重度：${spec.severity}；倒计时：${spec.countdown}；影响资源点：${affected}。`,
  ];
  if (spec.combatScale) facts.push(`灾劫战斗候选规模：${spec.combatScale}；战斗胜负仍等待战斗引擎结算。`);
  facts.push('灾劫面积损失、资源点损伤、道痕变化、蛊虫损坏和奖励不得由 DeepSeek 判定。');
  return facts;
}

export function selectCalamitySceneKind(preview: CalamityPreview, store: any = {}): CalamitySceneKind {
  const tags = lowerTags(preview);
  const name = String(preview.name || '');
  const resourceCount = Array.isArray(store?.aperture?.resource_nodes) ? store.aperture.resource_nodes.length : 0;

  if (tags.has('beast') || tags.has('desolate_beast') || name.includes('荒兽')) return 'desolate_beast_invasion';
  if (tags.has('human_calamity') || tags.has('enemy') || name.includes('人劫') || name.includes('敌袭')) return 'human_calamity';
  if (tags.has('killer_move') || tags.has('killer_move_pressure') || tags.has('formation') || preview.category === 'heavenly_tribulation') {
    return 'immortal_killer_pressure';
  }
  if (resourceCount >= 3 && preview.affectedResourceNodeIds.length >= 2) return 'resource_node_imbalance';
  if (preview.severity >= 4) return 'dao_mark_manifestation';
  return 'natural_disaster';
}

export function buildCalamitySceneSpec(input: {
  store: any;
  preview?: CalamityPreview | null;
  kind?: CalamitySceneKind;
  sceneId?: string;
}): CalamitySceneSpec | null {
  const preview = input.preview || buildCalamityPreview({ store: input.store });
  if (!preview) return null;

  const kind = input.kind || selectCalamitySceneKind(preview, input.store);
  const template = sceneTemplates.find(item => item.kind === kind) || sceneTemplates[0];
  const realmGrand = Number(input.store?.profile?.realm?.grand || 6);
  const sceneId = input.sceneId || input.store?.sceneSessionState?.sceneId || input.store?.currentChapterId || 'calamity_scene';
  const affected = preview.affectedResourceNodeIds || [];
  const combatScale = template.combatScale || (kind === 'human_calamity' ? 'group_5x3' : undefined);

  return {
    id: `calamity_scene_${preview.id}_${kind}_${Number(input.store?.turn || 1)}`,
    previewId: preview.id,
    name: `${preview.name} - ${template.label}`,
    kind,
    category: preview.category,
    path: preview.path,
    severity: preview.severity,
    sceneId,
    realmGrand,
    countdown: preview.countdown,
    affectedResourceNodeIds: affected,
    omenText: `${template.omen} 路 ${preview.path}，严重度 ${preview.severity}。`,
    entryText: template.entry,
    allowedResponses: template.responses,
    possibleConsequences: template.consequences,
    combatScale,
    tags: [...new Set([...preview.tags, ...template.tags, kind])],
  };
}

export function buildCalamityWorldActionBridge(input: {
  spec: CalamitySceneSpec;
  store?: any;
  phase: CalamityWorldActionPhase;
  summary?: string;
  status?: WorldActionResolution['status'];
  localFacts?: string[];
  risks?: string[];
  blockedReasons?: string[];
  mode?: WorldActionResolutionMode;
  chargeAp?: boolean;
  metadata?: Record<string, unknown>;
}): CalamityWorldActionBridge {
  const store = input.store || {};
  const spec = input.spec;
  const turn = currentTurn(store);
  const summary = input.summary || (input.phase === 'omen'
    ? `灾劫预兆入场：${spec.name}`
    : `灾劫结算：${spec.name}`);
  const risks = uniqueStrings([
    ...spec.possibleConsequences,
    'DeepSeek 只能写预兆、压力和选择描述；灾劫后果必须由本地引擎结算。',
    ...(input.risks || []),
  ]);
  const candidate = createWorldActionCandidate({
    domain: 'calamity',
    sourceId: spec.previewId,
    title: spec.name,
    summary,
    source: 'engine',
    sceneId: spec.sceneId,
    locationId: currentLocationId(store),
    risk: calamityRisk(spec),
    apCost: 1,
    blockers: input.blockedReasons,
    warnings: risks,
    tags: uniqueStrings(['calamity', input.phase, spec.kind, spec.path, ...spec.tags]),
    createdTurn: turn,
    metadata: {
      specId: spec.id,
      previewId: spec.previewId,
      category: spec.category,
      path: spec.path,
      kind: spec.kind,
      severity: spec.severity,
      countdown: spec.countdown,
      affectedResourceNodeIds: spec.affectedResourceNodeIds,
      combatScale: spec.combatScale,
      phase: input.phase,
      ...input.metadata,
    },
  });
  const status = input.status || (input.blockedReasons?.length ? 'blocked' : input.phase === 'omen' ? 'pending_narrative' : 'resolved');
  const mode = input.mode || (status === 'blocked' ? 'blocked' : input.phase === 'omen' ? 'narrative_return' : 'local_resolution');
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode,
    chargeAp: input.chargeAp ?? status !== 'blocked',
    summary,
    blockers: input.blockedReasons,
    warnings: risks,
    metadata: {
      specId: spec.id,
      previewId: spec.previewId,
      phase: input.phase,
    },
  });
  const worldResolution = createWorldActionResolution({
    departure,
    status,
    summary,
    localFacts: input.localFacts || defaultCalamityFacts(spec, input.phase),
    risks,
    blockedReasons: input.blockedReasons,
    rewardPolicy: 'local_engine_only',
    metadata: {
      specId: spec.id,
      previewId: spec.previewId,
      phase: input.phase,
      ...input.metadata,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution: worldResolution,
    source: `calamity:${spec.id}:${input.phase}`,
  });
  return {
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: worldResolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext: buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn,
      ledgerEntries: [ledger],
      resolutions: [worldResolution],
    }),
  };
}

export function formatCalamitySceneForPrompt(spec: CalamitySceneSpec | null | undefined): string {
  if (!spec) return '';
  const affected = spec.affectedResourceNodeIds.length > 0 ? spec.affectedResourceNodeIds.join('、') : '暂未锁定';
  return [
    '【灾劫场景规格】',
    `${spec.name}：${spec.omenText}`,
    `类型：${spec.kind}；倒计时：${spec.countdown}；影响资源点：${affected}。`,
    `可写入剧情的处理方向：${spec.allowedResponses.join(' / ')}。`,
    `可能后果：${spec.possibleConsequences.join('；')}。`,
    'DeepSeek 只能写预兆、压迫和选择描述；面积、资源、道痕、伤势、蛊虫损伤和战斗胜负必须等本地引擎结算。',
  ].join('\n');
}
