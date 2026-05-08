/**
 * NPC对话 Slice — P2-5
 * 薄切片设计：仅管理对话状态读写，对话生成委托AI（context-builder注入）
 */
import type { ActiveDialogue, DialogueActionCard, DialogueMessage, DialogueTopic } from '../../types';

const THRESHOLD_EVENTS: Record<number, string> = {
  60: '深厚信任——NPC愿意分享私人秘密',
  40: '关系升温——NPC开始主动关心你',
  20: '初步信任——NPC不再戒备',
  '-30': '关系恶化——NPC对你产生敌意',
  '-60': '不共戴天——NPC可能主动攻击或出卖你',
};

export interface DialogueSlice {
  activeDialogue: ActiveDialogue | null;

  initDialogue: (npcId: string, npcName: string, npcPersonality: string, npcFaction: string, affinity: number) => void;
  sendTopic: (topic: DialogueTopic) => DialogueMessage | null;
  appendNpcMessage: (text: string, affinityDelta: number) => void;
  setDialogueActionCards: (cards: DialogueActionCard[]) => void;
  selectDialogueActionCard: (cardId: string) => DialogueActionCard | null;
  clearDialogueActionCards: () => void;
  markDialogueActionBlocked: (cardId: string, reason: string) => void;
  markDialogueError: (error: string) => void;
  endDialogue: () => void;
}

export const createDialogueSlice = (set: any, get: any): DialogueSlice => ({
  activeDialogue: null,

  initDialogue: (npcId, npcName, npcPersonality, npcFaction, affinity) => {
    set({
      activeDialogue: {
        dialogueId: `dial_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        npcId,
        npcName,
        npcPersonality,
        npcFaction,
        affinity,
        messages: [],
        startedAt: Date.now(),
        awaitingResponse: false,
        pendingTopic: null,
        error: null,
        actionCards: [],
        selectedActionCardId: null,
      },
    });
    // ═══ 日志埋点: 开始对话
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('npc', `开始对话: ${npcName} (${npcFaction}, 好感${affinity})`, {
        npcId, npcName, npcFaction, affinity,
      });
    }
    // P1修复: 首次遇到NPC时递增 knownNpcCount（用于成就检测）
    const flagKey = `_npc_met_${npcId}`;
    if (!logStore.flags?.[flagKey]) {
      if (typeof logStore.incrementKnownNpcCount === 'function') {
        logStore.incrementKnownNpcCount();
      }
      if (typeof logStore.setFlag === 'function') {
        logStore.setFlag(flagKey, true);
      }
    }
  },

  sendTopic: (topic) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return null;

    const playerMsg: DialogueMessage = {
      role: 'player',
      text: `【${topic}】`,
      timestamp: Date.now(),
    };

    set({
      activeDialogue: {
        ...current,
        messages: [...current.messages, playerMsg],
        awaitingResponse: true,
        pendingTopic: topic,
        error: null,
        actionCards: [],
        selectedActionCardId: null,
      },
    });

    return playerMsg;
  },

  appendNpcMessage: (text, affinityDelta) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return;

    const npcMsg: DialogueMessage = {
      role: 'npc',
      text,
      affinityChange: affinityDelta,
      timestamp: Date.now(),
    };

    const newAffinity = Math.max(-100, Math.min(100, current.affinity + affinityDelta));
    const newMessages = [...current.messages, npcMsg];

    // 检查阈值事件
    const store = get() as any;
    for (const [thresholdStr, eventDesc] of Object.entries(THRESHOLD_EVENTS)) {
      const threshold = parseInt(thresholdStr, 10);
      const crossed = (current.affinity < threshold && newAffinity >= threshold) ||
        (current.affinity > threshold && newAffinity <= threshold);
      if (crossed || newAffinity === threshold) {
        if (typeof store.trackEffect === 'function') {
          store.trackEffect({
            id: `threshold_${current.npcId}_${threshold}_${Date.now()}`,
            cause: `与${current.npcName}的关系达到阈值`,
            consequence: eventDesc,
            affected_npcs: [current.npcId],
            severity: Math.abs(threshold) >= 40 ? 3 : 1,
            timestamp: Date.now(),
          });
        }
        // ═══ 日志埋点: 好感度阈值跨越
        if (typeof store.addGameLog === 'function') {
          store.addGameLog('npc', `关系阈值跨越: ${current.npcName} → ${eventDesc}`, {
            npcId: current.npcId, npcName: current.npcName,
            newAffinity, threshold, eventDesc,
          });
        }
      }
    }

    // 回写factionSlice好感度
    if (typeof store.updateRelation === 'function') {
      store.updateRelation(current.npcId, { affinity: newAffinity });
    }

    set({
      activeDialogue: {
        ...current,
        messages: newMessages,
        affinity: newAffinity,
        awaitingResponse: false,
        pendingTopic: null,
        error: null,
        actionCards: (current.actionCards || []).map((card) =>
          card.id === current.selectedActionCardId ? { ...card, status: 'resolved' as const } : card,
        ),
        selectedActionCardId: null,
      },
    });
  },

  setDialogueActionCards: (cards) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return;
    set({
      activeDialogue: {
        ...current,
        actionCards: cards,
        selectedActionCardId: null,
      },
    });
  },

  selectDialogueActionCard: (cardId) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return null;
    const cards = current.actionCards || [];
    const selected = cards.find((card) => card.id === cardId);
    if (!selected || selected.status !== 'pending') return null;

    const playerMsg: DialogueMessage = {
      role: 'player',
      text: selected.text,
      timestamp: Date.now(),
    };

    const nextCards = cards.map((card) =>
      card.id === cardId
        ? { ...card, status: 'selected' as const }
        : card.status === 'pending'
          ? { ...card, status: 'expired' as const }
          : card,
    );

    set({
      activeDialogue: {
        ...current,
        messages: [...current.messages, playerMsg],
        actionCards: nextCards,
        awaitingResponse: true,
        pendingTopic: selected.topic,
        selectedActionCardId: cardId,
        error: null,
      },
    });

    return selected;
  },

  clearDialogueActionCards: () => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return;
    set({
      activeDialogue: {
        ...current,
        actionCards: [],
        selectedActionCardId: null,
      },
    });
  },

  markDialogueActionBlocked: (cardId, reason) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return;
    set({
      activeDialogue: {
        ...current,
        actionCards: (current.actionCards || []).map((card) =>
          card.id === cardId
            ? { ...card, status: 'blocked' as const, validationIssues: [...(card.validationIssues || []), reason] }
            : card,
        ),
        awaitingResponse: false,
        pendingTopic: null,
        selectedActionCardId: null,
      },
    });
  },

  markDialogueError: (error) => {
    const current = get().activeDialogue as ActiveDialogue | null;
    if (!current) return;
    set({
      activeDialogue: {
        ...current,
        awaitingResponse: false,
        pendingTopic: null,
        selectedActionCardId: null,
        error,
      },
    });
  },

  endDialogue: () => {
    set({ activeDialogue: null });
  },
});
