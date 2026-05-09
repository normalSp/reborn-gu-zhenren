import type {
  PartyState,
  SquadCombatState,
  SquadDispatchAssignment,
  SquadDispatchResult,
  SquadDispatchState,
  SquadMember,
  SquadRecruitEvaluation,
} from '../../types';
import {
  evaluateSquadDispatch,
  getSquadDispatchTask,
  resolveSquadDispatchOutcome,
} from '../../engine/squad-dispatch';

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

const DEFAULT_DISPATCH_STATE: SquadDispatchState = {
  activeAssignments: [],
  recentResults: [],
  lastUpdatedTurn: 0,
};

const DISPATCH_MATERIAL_REWARD = '普通蛊材';

const FORMATIONS: SquadCombatState['formation'][] = ['合击', '牵制', '掠阵', '斩首'];

function clamp01(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function getDefaultPartyState(turn = 0): PartyState {
  return { ...DEFAULT_PARTY_STATE, lastUpdatedTurn: turn };
}

export function getDefaultSquadDispatchState(turn = 0): SquadDispatchState {
  return { ...DEFAULT_DISPATCH_STATE, lastUpdatedTurn: turn };
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

function normalizeDispatchState(state: Partial<SquadDispatchState> | null | undefined, turn = 0): SquadDispatchState {
  return {
    activeAssignments: Array.isArray(state?.activeAssignments) ? state.activeAssignments : [],
    recentResults: Array.isArray(state?.recentResults) ? state.recentResults.slice(-20) : [],
    lastUpdatedTurn: Number.isFinite(state?.lastUpdatedTurn) ? Number(state?.lastUpdatedTurn) : turn,
  };
}

function buildAssignmentId(memberId: string, taskId: string, turn: number): string {
  return `dispatch_${turn}_${memberId}_${taskId}`;
}

function expectedRewardFromTask(taskId: string): SquadDispatchAssignment['expectedReward'] {
  const task = getSquadDispatchTask(taskId);
  if (!task) return {};
  const reward = task.successReward || {};
  return {
    yuanStone: reward.yuanStone,
    materials: reward.materials ? { [DISPATCH_MATERIAL_REWARD]: reward.materials } : undefined,
    reputation: reward.reputation,
    relationship: reward.relationship,
    rumors: reward.rumors ? Array.from({ length: reward.rumors }, (_, index) => `${task.name}线索${index + 1}`) : undefined,
  };
}

function updateFactionMember(store: any, memberId: string, patch: Partial<SquadMember>): any {
  const faction = store.playerFaction;
  if (!faction?.members) return {};
  return {
    playerFaction: {
      ...faction,
      members: faction.members.map((member: SquadMember) => (
        member.id === memberId ? { ...member, ...patch } : member
      )),
    },
  };
}

export interface SquadSlice {
  partyState: PartyState;
  squadDispatchState: SquadDispatchState;
  evaluateRecruitment: (member: SquadMember) => SquadRecruitEvaluation;
  addMemberToParty: (memberId: string) => { success: boolean; reason?: string; evaluation?: SquadRecruitEvaluation };
  removeMemberFromParty: (memberId: string) => { success: boolean; reason?: string };
  setPartyFormation: (formation: SquadCombatState['formation']) => void;
  clearParty: () => void;
  startSquadDispatch: (memberId: string, taskId: string) => { success: boolean; reason?: string; assignment?: SquadDispatchAssignment };
  resolveSquadDispatch: (assignmentId: string) => { success: boolean; reason?: string; result?: SquadDispatchResult };
  cancelExpiredDispatchView: (assignmentId: string) => void;
}

export const createSquadSlice = (set: any, get: any): SquadSlice => ({
  partyState: getDefaultPartyState(0),
  squadDispatchState: getDefaultSquadDispatchState(0),

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
    const usedUnifiedAp = typeof store.spendAp === 'function';
    if (usedUnifiedAp && !store.spendAp(1, `调${member.name}入队`)) {
      return { success: false, reason: '行动点不足，无法调成员入队', evaluation };
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
      ...(usedUnifiedAp ? {} : { gameTime: { ...s.gameTime, ap: Math.max(0, (s.gameTime?.ap ?? 0) - 1) } }),
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

  startSquadDispatch: (memberId, taskId) => {
    const store = get() as any;
    const nowTurn = store.turn ?? 0;
    const task = getSquadDispatchTask(taskId);
    if (!task) return { success: false, reason: '未知外派任务' };
    const member = (store.playerFaction?.members ?? []).find((item: SquadMember) => item.id === memberId);
    if (!member) return { success: false, reason: '成员不在当前势力成员池' };
    if (store.partyState?.members?.some((item: SquadMember) => item.id === memberId)) {
      return { success: false, reason: '成员正在随队，不能同时外派' };
    }
    const unavailable = getUnavailableReason(member, nowTurn);
    if (unavailable) return { success: false, reason: unavailable };
    const gameTime = store.gameTime ?? { ap: 0 };
    if ((gameTime.ap ?? 0) < 1) return { success: false, reason: '行动点不足，无法安排外派' };
    const dispatchState = normalizeDispatchState(store.squadDispatchState, nowTurn);
    if (dispatchState.activeAssignments.some(assignment => assignment.memberId === memberId && assignment.status === 'active')) {
      return { success: false, reason: '成员已有进行中的外派' };
    }

    const evaluation = evaluateSquadDispatch(member, taskId, { morale: store.partyState?.morale ?? 50, turn: nowTurn });
    if (!evaluation.canDispatch) {
      return { success: false, reason: evaluation.reasons.join('；') || '外派条件不足' };
    }
    const usedUnifiedAp = typeof store.spendAp === 'function';
    if (usedUnifiedAp && !store.spendAp(1, `安排${member.name}外派`)) {
      return { success: false, reason: '行动点不足，无法安排外派' };
    }

    const assignment: SquadDispatchAssignment = {
      id: buildAssignmentId(memberId, taskId, nowTurn),
      taskId,
      taskName: task.name,
      memberId,
      memberName: member.name,
      startedTurn: nowTurn,
      endsTurn: nowTurn + task.durationTurns,
      risk: task.risk,
      successChance: evaluation.successChance,
      status: 'active',
      expectedReward: expectedRewardFromTask(taskId),
    };

    set((state: any) => ({
      ...updateFactionMember(state, memberId, { status: 'expedition', externalTaskUntil: assignment.endsTurn }),
      ...(usedUnifiedAp ? {} : { gameTime: { ...state.gameTime, ap: Math.max(0, (state.gameTime?.ap ?? 0) - 1) } }),
      squadDispatchState: {
        activeAssignments: [...dispatchState.activeAssignments, assignment],
        recentResults: dispatchState.recentResults,
        lastUpdatedTurn: nowTurn,
      },
    }));

    if (typeof store.addGameLog === 'function') {
      store.addGameLog('faction', `小队外派开始: ${member.name} → ${task.name}`, {
        memberId,
        taskId,
        endsTurn: assignment.endsTurn,
        successChance: assignment.successChance,
      });
    }
    return { success: true, assignment };
  },

  resolveSquadDispatch: (assignmentId) => {
    const store = get() as any;
    const nowTurn = store.turn ?? 0;
    const dispatchState = normalizeDispatchState(store.squadDispatchState, nowTurn);
    const assignment = dispatchState.activeAssignments.find(item => item.id === assignmentId);
    if (!assignment) return { success: false, reason: '未找到外派记录' };
    if (assignment.endsTurn > nowTurn) return { success: false, reason: `外派尚未到期，还需 ${assignment.endsTurn - nowTurn} 回合` };
    const member = (store.playerFaction?.members ?? []).find((item: SquadMember) => item.id === assignment.memberId) || {
      id: assignment.memberId,
      name: assignment.memberName,
      path: '信道',
      realm: 1,
      loyalty: 50,
      personality: 'cautious',
      alive: true,
      hp: 100,
      maxHp: 100,
      atk: 10,
      def: 5,
      adventureTrust: 50,
      interestDrive: 40,
    } as SquadMember;
    const outcome = resolveSquadDispatchOutcome(member, assignment.taskId, assignment.id, {
      morale: store.partyState?.morale ?? 50,
      turn: nowTurn,
      location: store.currentDomain || store.playerPosition?.region,
    });
    const task = getSquadDispatchTask(assignment.taskId);
    const materialRewards: Record<string, number> = {};
    if (outcome.rewards.materials) {
      materialRewards[DISPATCH_MATERIAL_REWARD] = outcome.rewards.materials;
      if (typeof store.addMaterial === 'function') store.addMaterial(DISPATCH_MATERIAL_REWARD, outcome.rewards.materials);
    }
    if (outcome.rewards.yuanStone && typeof store.addYuanStone === 'function') {
      store.addYuanStone(outcome.rewards.yuanStone, `小队外派-${assignment.taskName}`, assignment.memberId, assignment.taskId);
    } else if (outcome.rewards.yuanStone) {
      set((state: any) => ({ currency: Math.max(0, (state.currency || 0) + (outcome.rewards.yuanStone || 0)) }));
    }

    const result: SquadDispatchResult = {
      assignmentId,
      taskId: assignment.taskId,
      taskName: assignment.taskName,
      memberId: assignment.memberId,
      memberName: assignment.memberName,
      turn: nowTurn,
      success: outcome.success,
      roll: outcome.roll,
      successChance: outcome.successChance,
      rewards: {
        yuanStone: outcome.rewards.yuanStone,
        materials: Object.keys(materialRewards).length > 0 ? materialRewards : undefined,
        reputation: outcome.rewards.reputation,
        relationship: outcome.rewards.relationship,
        rumors: outcome.generatedRumor ? [outcome.generatedRumor] : undefined,
      },
      costs: outcome.costs,
      message: outcome.success
        ? `${assignment.memberName}完成${assignment.taskName}，带回可审计回流。`
        : `${assignment.memberName}外派${assignment.taskName}失败，承受风险代价。`,
    };

    set((state: any) => {
      const factionPatch = updateFactionMember(state, assignment.memberId, {
        status: 'available',
        externalTaskUntil: 0,
        adventureTrust: Math.max(0, Math.min(100, (member.adventureTrust ?? 50) + outcome.relationDelta.trust)),
        loyalty: Math.max(0, Math.min(100, (member.loyalty ?? 50) + outcome.relationDelta.morale)),
      });
      const patchedFaction = factionPatch.playerFaction ?? state.playerFaction;
      return {
        ...factionPatch,
        partyState: {
          ...normalizePartyState(state.partyState, nowTurn),
          morale: Math.max(0, Math.min(100, (state.partyState?.morale ?? 50) + outcome.relationDelta.morale)),
          lastUpdatedTurn: nowTurn,
        },
        squadDispatchState: {
          activeAssignments: dispatchState.activeAssignments.filter(item => item.id !== assignmentId),
          recentResults: [result, ...dispatchState.recentResults].slice(0, 20),
          lastUpdatedTurn: nowTurn,
        },
        playerFaction: patchedFaction ? {
          ...patchedFaction,
          reputation: Math.max(0, (patchedFaction.reputation || 0) + outcome.relationDelta.reputation),
        } : patchedFaction,
      };
    });

    if (outcome.costs.yuanStone && typeof store.spendYuanStone === 'function') {
      store.spendYuanStone(outcome.costs.yuanStone, `小队外派失败-${assignment.taskName}`, assignment.memberId, assignment.taskId);
    }
    if (typeof store.addGameLog === 'function') {
      store.addGameLog(outcome.success ? 'faction' : 'danger', result.message, {
        assignmentId,
        taskId: assignment.taskId,
        rewards: result.rewards,
        costs: result.costs,
        template: task?.rewardTags ?? [],
      });
    }
    return { success: true, result };
  },

  cancelExpiredDispatchView: (assignmentId) => {
    const store = get() as any;
    const dispatchState = normalizeDispatchState(store.squadDispatchState, store.turn ?? 0);
    set({
      squadDispatchState: {
        ...dispatchState,
        recentResults: dispatchState.recentResults.filter(result => result.assignmentId !== assignmentId),
      },
    });
  },

  clearParty: () => {
    const store = get() as any;
    set({ partyState: getDefaultPartyState(store.turn ?? 0) });
  },
});
