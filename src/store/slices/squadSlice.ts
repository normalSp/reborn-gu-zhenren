import type {
  PartyState,
  SquadCombatState,
  SquadMember,
  SquadRecruitEvaluation,
} from '../../types';

const DEFAULT_PARTY_STATE: PartyState = {
  members: [],
  maxSize: 4,
  formation: null,
  morale: 50,
  coordination: 50,
  lastUpdatedTurn: 0,
  memberCooldowns: {},
  memberRolePausedUntil: {},
};

const FORMATIONS: SquadCombatState['formation'][] = ['合击', '牵制', '掠阵', '斩首'];

function clamp01(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function getDefaultPartyState(turn = 0): PartyState {
  return { ...DEFAULT_PARTY_STATE, lastUpdatedTurn: turn };
}

function normalizePartyState(party: Partial<PartyState> | null | undefined, turn = 0): PartyState {
  const formation = party?.formation && FORMATIONS.includes(party.formation) ? party.formation : null;
  return {
    ...DEFAULT_PARTY_STATE,
    ...party,
    members: Array.isArray(party?.members) ? party.members : [],
    maxSize: Number.isFinite(party?.maxSize) ? Number(party?.maxSize) : 4,
    formation,
    morale: Number.isFinite(party?.morale) ? clamp01(Number(party?.morale)) : 50,
    coordination: Number.isFinite(party?.coordination) ? clamp01(Number(party?.coordination)) : 50,
    lastUpdatedTurn: Number.isFinite(party?.lastUpdatedTurn) ? Number(party?.lastUpdatedTurn) : turn,
    memberCooldowns: party?.memberCooldowns ?? {},
    memberRolePausedUntil: party?.memberRolePausedUntil ?? {},
  };
}

function getUnavailableReason(member: SquadMember, nowTurn: number): string | null {
  if (!member.alive) return '成员已阵亡';
  const m = member as SquadMember & {
    status?: string;
    woundedUntil?: number;
    closedDoorUntil?: number;
    externalTaskUntil?: number;
    factionTaskUntil?: number;
  };
  if (m.status === 'wounded' || (m.woundedUntil ?? 0) > nowTurn) return '成员重伤休养中';
  if (m.status === 'closed_door' || (m.closedDoorUntil ?? 0) > nowTurn) return '成员闭关中';
  if (m.status === 'expedition' || (m.externalTaskUntil ?? 0) > nowTurn) return '成员外派中';
  if (m.status === 'faction_task' || (m.factionTaskUntil ?? 0) > nowTurn) return '成员正在执行势力任务';
  return null;
}

export interface SquadSlice {
  partyState: PartyState;
  evaluateRecruitment: (member: SquadMember) => SquadRecruitEvaluation;
  addMemberToParty: (memberId: string) => { success: boolean; reason?: string; evaluation?: SquadRecruitEvaluation };
  removeMemberFromParty: (memberId: string) => { success: boolean; reason?: string };
  setPartyFormation: (formation: SquadCombatState['formation']) => void;
  clearParty: () => void;
}

export const createSquadSlice = (set: any, get: any): SquadSlice => ({
  partyState: getDefaultPartyState(0),

  evaluateRecruitment: (member) => {
    const trust = clamp01(member.adventureTrust ?? 50);
    const interest = clamp01(member.interestDrive ?? 30);
    const reasons: string[] = [];
    const aiTags: string[] = [];

    const nowTurn = (get() as any).turn ?? 0;
    const unavailable = getUnavailableReason(member, nowTurn);
    if (unavailable) {
      reasons.push(unavailable);
      return {
        memberId: member.id,
        memberName: member.name,
        disposition: 'unwilling',
        canJoin: false,
        trustScore: trust,
        interestScore: interest,
        reasons,
        aiTags: ['unavailable'],
      };
    }

    if (trust >= 70) {
      reasons.push('信任充足，愿意随队冒险');
      aiTags.push('trust_first');
      return {
        memberId: member.id,
        memberName: member.name,
        disposition: 'willing_eager',
        canJoin: true,
        trustScore: trust,
        interestScore: interest,
        reasons,
        aiTags,
      };
    }

    if (trust >= 50 || (trust >= 40 && interest >= 50)) {
      reasons.push('信任尚可，但会观察分赃与风险');
      aiTags.push('cautious');
      return {
        memberId: member.id,
        memberName: member.name,
        disposition: 'willing_cautious',
        canJoin: true,
        trustScore: trust,
        interestScore: interest,
        reasons,
        aiTags,
      };
    }

    if (interest >= 65) {
      const payment = Math.max(100, member.realm * 120);
      reasons.push('信任不足，需要明确报酬');
      aiTags.push('mercenary');
      return {
        memberId: member.id,
        memberName: member.name,
        disposition: 'mercenary',
        canJoin: true,
        trustScore: trust,
        interestScore: interest,
        requiredPayment: { yuanStone: payment },
        reasons,
        aiTags,
      };
    }

    reasons.push('信任和利益都不足，不愿入队');
    aiTags.push('refuse');
    return {
      memberId: member.id,
      memberName: member.name,
      disposition: 'unwilling',
      canJoin: false,
      trustScore: trust,
      interestScore: interest,
      reasons,
      aiTags,
    };
  },

  addMemberToParty: (memberId) => {
    const store = get() as any;
    const party = normalizePartyState(store.partyState, store.turn ?? 0);
    const factionMembers = store.playerFaction?.members ?? [];
    const member = factionMembers.find((m: SquadMember) => m.id === memberId);
    if (!member) return { success: false, reason: '成员不在当前势力成员池' };
    if (party.members.some(m => m.id === memberId)) return { success: false, reason: '成员已经在队伍中' };

    const npcSlots = Math.max(0, party.maxSize - 1);
    if (party.members.length >= npcSlots) {
      return { success: false, reason: `小队上限为${party.maxSize}人（含玩家）` };
    }

    const gameTime = store.gameTime ?? { ap: 0 };
    if ((gameTime.ap ?? 0) < 1) return { success: false, reason: '行动点不足，无法调成员入队' };

    const evaluation = (get() as SquadSlice).evaluateRecruitment(member);
    if (!evaluation.canJoin) return { success: false, reason: evaluation.reasons.join('；'), evaluation };

    const payment = evaluation.requiredPayment?.yuanStone ?? 0;
    if (payment > 0) {
      const paid = typeof store.spendYuanStone === 'function'
        ? store.spendYuanStone(payment, `招募${member.name}临时入队`, member.id)
        : false;
      if (!paid) return { success: false, reason: `元石不足，需支付${payment}`, evaluation };
    }

    const nowTurn = store.turn ?? 0;
    const newParty: PartyState = {
      ...party,
      members: [...party.members, member],
      formation: party.formation ?? '牵制',
      morale: Math.min(100, party.morale + (evaluation.disposition === 'willing_eager' ? 2 : 0)),
      lastUpdatedTurn: nowTurn,
      memberRolePausedUntil: {
        ...party.memberRolePausedUntil,
        [member.id]: nowTurn + 3,
      },
    };

    set((s: any) => ({
      partyState: newParty,
      squadMembersRecruited: (s.squadMembersRecruited || 0) + 1,
      gameTime: {
        ...s.gameTime,
        ap: Math.max(0, (s.gameTime?.ap ?? 0) - 1),
      },
    }));

    if (typeof store.addGameLog === 'function') {
      store.addGameLog('faction', `调入小队: ${member.name}`, { memberId, disposition: evaluation.disposition });
    }
    return { success: true, evaluation };
  },

  removeMemberFromParty: (memberId) => {
    const store = get() as any;
    const party = normalizePartyState(store.partyState, store.turn ?? 0);
    if (!party.members.some(m => m.id === memberId)) return { success: false, reason: '成员不在队伍中' };
    const rolePaused = { ...party.memberRolePausedUntil };
    delete rolePaused[memberId];
    set({
      partyState: {
        ...party,
        members: party.members.filter(m => m.id !== memberId),
        memberRolePausedUntil: rolePaused,
        lastUpdatedTurn: store.turn ?? 0,
      },
    });
    return { success: true };
  },

  setPartyFormation: (formation) => {
    const store = get() as any;
    if (!FORMATIONS.includes(formation)) return;
    const party = normalizePartyState(store.partyState, store.turn ?? 0);
    set({ partyState: { ...party, formation, lastUpdatedTurn: store.turn ?? 0 } });
  },

  clearParty: () => {
    const store = get() as any;
    set({ partyState: getDefaultPartyState(store.turn ?? 0) });
  },
});
