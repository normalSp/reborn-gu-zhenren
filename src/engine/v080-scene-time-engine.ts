import sceneRulesRaw from '../canon/v080-scene-time-rules.json';
import { getCanonAnchor } from './v080-narrative-engine';

export type ActionTimePolicy =
  | 'dialogue'
  | 'trade'
  | 'merchant'
  | 'cultivation'
  | 'scout'
  | 'wild_gather'
  | 'hostile_combat'
  | 'ambush'
  | 'aperture_management'
  | 'calamity'
  | 'treasure_yellow_heaven'
  | 'immortal_resource_gather'
  | 'ordinary_trade'
  | 'safe_cultivation';

export type SceneLockState = 'open' | 'dialogue_locked' | 'trade_locked' | 'combat_locked';
export type CombatIntent = 'none' | 'duel' | 'squad' | 'battlefield' | 'ambush' | 'hostile_challenge';
export type SceneLocationContext = 'safe' | 'caravan' | 'field' | 'wild' | 'aperture';

export interface SceneTimeContext {
  version: 'v0.8.0-c1.1';
  currentChapterId: string | null;
  currentCanonAnchorId: string | null;
  domain: string;
  period: string;
  locationContext: SceneLocationContext;
  locationLabel: string;
  sceneLockState: SceneLockState;
  lockReasons: string[];
  combatIntent: CombatIntent;
  allowedActions: ActionTimePolicy[];
  blockedActions: ActionTimePolicy[];
  resourceWarnings: string[];
  pendingNarrativeSettlement: string[];
}

export interface SceneActionValidation {
  allowed: boolean;
  action: ActionTimePolicy;
  disposition: 'allow' | 'block' | 'downgrade_to_rumor';
  reason: string;
  context: SceneTimeContext;
}

type SceneRules = {
  anchorChapterMap?: Record<string, string>;
  locationPolicies?: Record<string, {
    label: string;
    allowedActions: ActionTimePolicy[];
    blockedActions: ActionTimePolicy[];
  }>;
  resourceEcologyGates?: Array<{
    id: string;
    matchAny: string[];
    minRealmGrand: number;
    onFail: 'block' | 'downgrade_to_rumor';
    reason: string;
  }>;
};

const RULES = sceneRulesRaw as SceneRules;
const ANCHOR_MAP = RULES.anchorChapterMap ?? {};
const LOCATION_POLICIES = RULES.locationPolicies ?? {};

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getSceneText(store: any): string {
  const flags = store?.flags || {};
  const lastMessage = Array.isArray(store?.messages) ? store.messages.slice(-1)[0]?.content : '';
  return [
    flags.currentLocation,
    flags.current_location,
    flags.currentScene,
    flags.current_scene,
    flags.currentPlace,
    flags.current_place,
    flags._start_location,
    store?.playerPosition?.region,
    store?.currentDomain,
    store?.currentChapterId,
    store?.currentNarrative?.narrative?.text,
    lastMessage,
  ].filter(Boolean).join(' ');
}

function includesAny(text: string, keywords: string[]): boolean {
  const lower = normalize(text);
  return keywords.some(keyword => lower.includes(normalize(keyword)));
}

function resolveLocationContext(store: any): SceneLocationContext {
  const text = getSceneText(store);
  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  if (realmGrand >= 6 && includesAny(text, ['仙窍', '福地', '洞天', 'aperture'])) return 'aperture';
  if (includesAny(text, ['险地', '禁地', '遗迹', '狼潮', '兽群', '战场', '天坑', 'wild'])) return 'wild';
  if (includesAny(text, ['野外', '森林', '山林', '猎场', '密林', '荒野', '溪边', 'field'])) return 'field';
  if (includesAny(text, ['商队', '商路', '驿站', '车队', 'caravan'])) return 'caravan';
  return 'safe';
}

function resolveLockState(store: any): { state: SceneLockState; reasons: string[]; blocked: ActionTimePolicy[] } {
  const reasons: string[] = [];
  const blocked = new Set<ActionTimePolicy>();
  if (store?.duelState || store?.squadCombatState || store?.battlefieldCombatState) {
    reasons.push('战斗结算中，不能并行开启对话、交易、采集或修行。');
    ['dialogue', 'trade', 'wild_gather', 'scout', 'cultivation'].forEach(action => blocked.add(action as ActionTimePolicy));
    return { state: 'combat_locked', reasons, blocked: [...blocked] };
  }
  if (store?.activeMerchant || store?.merchantPanelOpen || store?.flags?.sceneLock === 'trade') {
    reasons.push('交易场景锁定中，不能同时切出到野外战斗或采集。');
    ['wild_gather', 'ambush', 'hostile_combat'].forEach(action => blocked.add(action as ActionTimePolicy));
    return { state: 'trade_locked', reasons, blocked: [...blocked] };
  }
  if (store?.activeDialogue || store?.flags?.sceneLock === 'dialogue') {
    reasons.push('对话场景锁定中，不能直接跳到无关野外行动或伏击。');
    ['wild_gather', 'ambush', 'hostile_combat'].forEach(action => blocked.add(action as ActionTimePolicy));
    return { state: 'dialogue_locked', reasons, blocked: [...blocked] };
  }
  return { state: 'open', reasons, blocked: [] };
}

export function resolveCurrentCanonAnchorId(store: any): string | null {
  const direct = store?.storyAnchorState?.currentAnchorId || store?.flags?.currentCanonAnchorId;
  if (direct && getCanonAnchor(String(direct))) return String(direct);
  const chapter = String(store?.currentChapterId || store?.flags?._start_chapter_id || '').trim();
  if (chapter && ANCHOR_MAP[chapter] && getCanonAnchor(ANCHOR_MAP[chapter])) return ANCHOR_MAP[chapter];
  const startProfile = String(store?.flags?._start_profile || store?.startProfileId || '').trim();
  if (startProfile && ANCHOR_MAP[startProfile] && getCanonAnchor(ANCHOR_MAP[startProfile])) return ANCHOR_MAP[startProfile];
  for (const [needle, anchorId] of Object.entries(ANCHOR_MAP)) {
    if (chapter.includes(needle) && getCanonAnchor(anchorId)) return anchorId;
  }
  return null;
}

export function buildSceneTimeContext(store: any): SceneTimeContext {
  const locationContext = resolveLocationContext(store);
  const locationPolicy = LOCATION_POLICIES[locationContext] ?? LOCATION_POLICIES.safe;
  const lock = resolveLockState(store);
  const blocked = new Set<ActionTimePolicy>([...(locationPolicy?.blockedActions ?? []), ...lock.blocked]);
  const allowed = (locationPolicy?.allowedActions ?? []).filter(action => !blocked.has(action));
  const currentCanonAnchorId = resolveCurrentCanonAnchorId(store);
  const combatIntent: CombatIntent = store?.battlefieldCombatState
    ? 'battlefield'
    : store?.squadCombatState
      ? 'squad'
      : store?.duelState
        ? 'duel'
        : 'none';

  return {
    version: 'v0.8.0-c1.1',
    currentChapterId: store?.currentChapterId ?? null,
    currentCanonAnchorId,
    domain: String(store?.currentDomain || store?.playerPosition?.region || store?.flags?._start_region || ''),
    period: String(store?.gameTime?.period || 'unknown'),
    locationContext,
    locationLabel: locationPolicy?.label ?? locationContext,
    sceneLockState: lock.state,
    lockReasons: lock.reasons,
    combatIntent,
    allowedActions: allowed,
    blockedActions: [...blocked],
    resourceWarnings: buildResourceWarnings(store),
    pendingNarrativeSettlement: buildPendingSettlement(store),
  };
}

function buildPendingSettlement(store: any): string[] {
  const pending: string[] = [];
  if (Array.isArray(store?.flags?.combatEventCandidates) && store.flags.combatEventCandidates.length > 0) {
    pending.push('combat_event_candidates pending local validation');
  }
  if (Array.isArray(store?.storyAnchorState?.storyEventCandidates) && store.storyAnchorState.storyEventCandidates.some((item: any) => item?.status === 'candidate')) {
    pending.push('story_event_candidates pending story anchor engine');
  }
  return pending;
}

function buildResourceWarnings(store: any): string[] {
  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  const warnings: string[] = [];
  if (realmGrand < 6) {
    warnings.push('凡人阶段不能稳定交易宝黄天或采集仙材；只能获得传闻、线索或低阶替代资源。');
  }
  return warnings;
}

export function validateSceneAction(store: any, action: ActionTimePolicy, subject = ''): SceneActionValidation {
  const context = buildSceneTimeContext(store);
  if (context.blockedActions.includes(action) || (context.allowedActions.length > 0 && !context.allowedActions.includes(action))) {
    return {
      allowed: false,
      action,
      disposition: 'block',
      reason: context.lockReasons[0] || `当前场景 ${context.locationLabel} 不允许 ${action}。`,
      context,
    };
  }

  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  const subjectText = `${subject} ${action}`;
  const gate = (RULES.resourceEcologyGates ?? []).find(candidate =>
    includesAny(subjectText, candidate.matchAny) && realmGrand < Number(candidate.minRealmGrand || 1)
  );
  if (gate) {
    return {
      allowed: gate.onFail !== 'block',
      action,
      disposition: gate.onFail,
      reason: gate.reason,
      context,
    };
  }

  return {
    allowed: true,
    action,
    disposition: 'allow',
    reason: 'scene-time local policy allows this action',
    context,
  };
}

export function validateResourceEcologyGate(store: any, action: ActionTimePolicy, subject = ''): SceneActionValidation {
  const context = buildSceneTimeContext(store);
  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  const subjectText = `${subject} ${action}`;
  const gate = (RULES.resourceEcologyGates ?? []).find(candidate =>
    includesAny(subjectText, candidate.matchAny) && realmGrand < Number(candidate.minRealmGrand || 1)
  );
  if (gate) {
    return {
      allowed: gate.onFail !== 'block',
      action,
      disposition: gate.onFail,
      reason: gate.reason,
      context,
    };
  }

  return {
    allowed: true,
    action,
    disposition: 'allow',
    reason: 'resource ecology gate allows this subject',
    context,
  };
}

export function formatSceneTimeContextForPrompt(context: SceneTimeContext): string {
  return [
    '【v0.8.0-c1.1 场景时间协议】',
    `chapter=${context.currentChapterId || 'unknown'}; canonAnchor=${context.currentCanonAnchorId || 'unmapped'}; domain=${context.domain || 'unknown'}; period=${context.period}`,
    `location=${context.locationLabel}; lock=${context.sceneLockState}; combatIntent=${context.combatIntent}`,
    `allowed=${context.allowedActions.join(', ') || 'none'}; blocked=${context.blockedActions.join(', ') || 'none'}`,
    context.lockReasons.length ? `lockReason=${context.lockReasons.join('；')}` : '',
    context.resourceWarnings.length ? `resourceGate=${context.resourceWarnings.join('；')}` : '',
    context.pendingNarrativeSettlement.length ? `pending=${context.pendingNarrativeSettlement.join('；')}` : '',
    '规则：DeepSeek 只能提出候选、传闻和叙事压力；战斗、修行、资源、锚点和高阶采集必须由本地引擎验证后生效。对话锁定时不得直接跳到无关野外战斗或伏击。',
  ].filter(Boolean).join('\n');
}
