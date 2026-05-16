import type { LivingWorldState } from '../types';

export type QingmaoInvestigationFollowUpKind =
  | 'contact'
  | 'avoidance'
  | 'local_inquiry'
  | 'route_preparation';

export interface QingmaoInvestigationFollowUpCandidate {
  id: string;
  title: string;
  kind: QingmaoInvestigationFollowUpKind;
  status: 'suggested_only' | 'formal_action_available';
  visibleReason: string;
  nextStepHint: string;
  visibleSourceRefs: string[];
  hiddenSourceRefCount: number;
  forbiddenUpgrades: string[];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function knownFactIds(state?: Partial<LivingWorldState> | null): Set<string> {
  return new Set(Object.keys(state?.knownFacts || {}));
}

function hiddenFactRefIds(state?: Partial<LivingWorldState> | null): Set<string> {
  return new Set(Object.keys(state?.hiddenFactRefs || {}));
}

function hasBaiOpportunityPressure(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(state?.factionPressure?.some(entry => (
    entry.factionId === 'baijia_zhai'
    && entry.pressureType === 'opportunity'
    && entry.visibility === 'player_visible'
  )));
}

function hasFangYuanProtectedMemory(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(state?.npcMemories?.some(entry => (
    entry.npcId === 'fang_yuan'
    && entry.tags.includes('hidden_fact_protected')
  )));
}

export function buildQingmaoInvestigationFollowUps(input: {
  livingWorldState?: Partial<LivingWorldState> | null;
} = {}): QingmaoInvestigationFollowUpCandidate[] {
  const state = input.livingWorldState;
  const known = knownFactIds(state);
  const hidden = hiddenFactRefIds(state);
  const candidates: QingmaoInvestigationFollowUpCandidate[] = [];

  const baiVisibleRefs = [
    known.has('qingmao_three_clans_layout') ? 'fact:qingmao_three_clans_layout' : '',
    known.has('baijia_bai_ning_bing_public_talent') ? 'fact:baijia_bai_ning_bing_public_talent' : '',
    hasBaiOpportunityPressure(state) ? 'pressure:baijia_zhai:opportunity' : '',
  ];
  if (baiVisibleRefs.some(Boolean)) {
    candidates.push({
      id: 'followup_baijia_visible_contact_probe',
      title: '谨慎核对白家接触窗口',
      kind: 'contact',
      status: 'formal_action_available',
      visibleReason: '已掌握白家相关公开线索，可以先从公开渠道核对接触窗口和风险。',
      nextStepHint: '可执行下一步：公开试探/递话，只记录机会压力和身份暴露风险，不改变势力归属。',
      visibleSourceRefs: uniqueStrings(baiVisibleRefs),
      hiddenSourceRefCount: 0,
      forbiddenUpgrades: [
        'faction_transfer',
        'standing_delta',
        'reward',
        'location_unlock',
        'npc_state_change',
        'canon_anchor_change',
        'bai_ning_bing_major_if',
      ],
    });
  }

  const hasFangHiddenRef = hidden.has('fang_yuan_private_causality_hidden_anchor');
  const hasFangMemory = hasFangYuanProtectedMemory(state);
  if (hasFangHiddenRef || hasFangMemory) {
    candidates.push({
      id: 'followup_fang_yuan_visible_scope_caution',
      title: '暂缓深追方源，改走旁证调查',
      kind: 'avoidance',
      status: 'suggested_only',
      visibleReason: '已有调查失败痕迹，继续直追容易扩大风险；当前只适合查公开目击与山寨动静。',
      nextStepHint: '下一步应转向族学告示、山道目击或公开行踪，不直接追问不可见因果。',
      visibleSourceRefs: hasFangMemory ? ['npc_memory:fang_yuan_public_failure'] : [],
      hiddenSourceRefCount: hasFangHiddenRef ? 1 : 0,
      forbiddenUpgrades: [
        'hidden_fact_reveal',
        'npc_state_change',
        'npc_death',
        'canon_anchor_change',
        'deepseek_hidden_context',
      ],
    });
  }

  if (hidden.has('guyue_spirit_spring_resource_basis')) {
    candidates.push({
      id: 'followup_qingmao_resource_public_inquiry',
      title: '资源线暂走公开渠道',
      kind: 'local_inquiry',
      status: 'suggested_only',
      visibleReason: '这条调查触及受保护内情，当前只能转成公开账目、族学传闻或山寨日常异常的旁证调查。',
      nextStepHint: '若后续开放正式行动，需要先补原著事实卡、可见线索、风险代价和揭示门槛。',
      visibleSourceRefs: [],
      hiddenSourceRefCount: 1,
      forbiddenUpgrades: [
        'hidden_fact_reveal',
        'resource_reward',
        'faction_secret_reveal',
        'canon_anchor_change',
        'deepseek_hidden_context',
      ],
    });
  }

  return candidates;
}
