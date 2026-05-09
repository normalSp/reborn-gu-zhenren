import type { ActivityLocationContext } from './activity-panel';

export type ActivitySceneMode =
  | 'safe_hub'
  | 'caravan'
  | 'field'
  | 'wild'
  | 'aperture'
  | 'dialogue'
  | 'trade'
  | 'combat';

export interface ActivityAvailabilityContext {
  sceneMode: ActivitySceneMode;
  locationContext: ActivityLocationContext;
  locationLabel: string;
  sceneLocked: boolean;
  lockReason?: string;
  fieldActionsAllowed: boolean;
  fieldActionReason?: string;
  apertureActionsAllowed: boolean;
  apPolicyNote: string;
  isImmortal: boolean;
}

const SAFE_KEYWORDS = ['古月山寨', '山寨', '城', '商会', '坊市', '客栈', '洞府', '营地', '族学', '炼蛊房'];
const CARAVAN_KEYWORDS = ['商队', '商路', '驿站', '车队'];
const FIELD_KEYWORDS = ['野外', '森林', '山林', '猎场', '密林', '荒野', '溪边'];
const WILD_KEYWORDS = ['险地', '禁地', '遗迹', '狼潮', '兽群', '战场', '天坑'];
const APERTURE_KEYWORDS = ['仙窍', '福地', '洞天'];

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function getSceneText(store: any): string {
  const flags = store?.flags || {};
  const narrativeText = store?.currentNarrative?.narrative?.text
    || store?.currentNarrative?.text
    || store?.messages?.slice?.(-1)?.[0]?.content
    || '';
  return [
    flags.currentLocation,
    flags.current_location,
    flags.currentPlace,
    flags.current_place,
    flags.currentScene,
    flags.current_scene,
    flags.currentDomain,
    flags.current_domain,
    flags.currentChapter,
    flags.current_chapter,
    store?.currentChapterId,
    narrativeText.slice(-500),
  ].filter(Boolean).join(' ');
}

function resolveLocation(store: any, isImmortal: boolean): { mode: ActivitySceneMode; context: ActivityLocationContext; label: string } {
  const text = getSceneText(store);
  if (isImmortal && includesAny(text, APERTURE_KEYWORDS)) {
    return { mode: 'aperture', context: 'aperture', label: '仙窍/福地' };
  }
  if (includesAny(text, WILD_KEYWORDS)) {
    return { mode: 'wild', context: 'wild', label: '险地' };
  }
  if (includesAny(text, FIELD_KEYWORDS)) {
    return { mode: 'field', context: 'field', label: '野外' };
  }
  if (includesAny(text, CARAVAN_KEYWORDS)) {
    return { mode: 'caravan', context: 'caravan', label: '商路/商队' };
  }
  if (includesAny(text, SAFE_KEYWORDS) || String(store?.currentChapterId || '').includes('qingmao')) {
    return { mode: 'safe_hub', context: 'safe', label: '安全地' };
  }
  return { mode: 'safe_hub', context: 'safe', label: '安全地' };
}

export function deriveActivityAvailabilityContext(store: any): ActivityAvailabilityContext {
  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  const isImmortal = realmGrand >= 6 || store?.vitals?.essenceType === 'immortal';
  const location = resolveLocation(store, isImmortal);
  const inCombat = Boolean(store?.duelState || store?.squadCombatState?.status === 'active' || store?.squadCombatState?.phase);
  const inDialogue = Boolean(store?.activeDialogue);
  const inTrade = Boolean(store?.activeMerchant || store?.merchantPanelOpen || store?.flags?.sceneLock === 'trade');

  if (inCombat) {
    return {
      sceneMode: 'combat',
      locationContext: location.context,
      locationLabel: location.label,
      sceneLocked: true,
      lockReason: '当前处于战斗或小队战结算中，行动面板暂时只读。',
      fieldActionsAllowed: false,
      fieldActionReason: '战斗中不能另起野外行动。',
      apertureActionsAllowed: location.context === 'aperture',
      apPolicyNote: 'v0.7.1 仍采用“行动推进一时段，下一时段 AP 回满”的协议；v0.8 会重做完整时段预算。',
      isImmortal,
    };
  }

  if (inDialogue) {
    return {
      sceneMode: 'dialogue',
      locationContext: location.context,
      locationLabel: location.label,
      sceneLocked: true,
      lockReason: '当前正在对话/交易候选中，先完成或结束当前场景，避免时间推进与剧情割裂。',
      fieldActionsAllowed: false,
      fieldActionReason: '对话场景锁定中，不能切出到野外行动。',
      apertureActionsAllowed: false,
      apPolicyNote: '场景锁会阻止侧栏行动推进；这是 v0.7.1 的防割裂补丁。',
      isImmortal,
    };
  }

  if (inTrade) {
    return {
      sceneMode: 'trade',
      locationContext: location.context,
      locationLabel: location.label,
      sceneLocked: true,
      lockReason: '当前正在商会或交易界面，先完成交易再推进行动。',
      fieldActionsAllowed: false,
      fieldActionReason: '交易中不能同时执行野外行动。',
      apertureActionsAllowed: false,
      apPolicyNote: '交易/对话/战斗锁定期间，行动面板只展示状态。',
      isImmortal,
    };
  }

  const fieldActionsAllowed = location.context === 'field' || location.context === 'wild' || location.context === 'caravan';
  const fieldActionReason = fieldActionsAllowed
    ? undefined
    : location.context === 'aperture'
      ? '当前处于仙窍/福地内，野外采集与狩猎需回到外界地点。'
      : '当前处在山寨、城镇或安全营地；需离开安全地后才能执行野外行动。';

  return {
    sceneMode: location.mode,
    locationContext: location.context,
    locationLabel: location.label,
    sceneLocked: false,
    fieldActionsAllowed,
    fieldActionReason,
    apertureActionsAllowed: isImmortal && location.context === 'aperture',
    apPolicyNote: '本版本 AP 表示当前时段行动余裕：动作会消耗本时段并推进到下一时段，AP 随时段回满；完整日程系统放入 v0.8。',
    isImmortal,
  };
}
