import { describe, expect, it } from 'vitest';
import { NarrativeJSONSchema } from '../../schemas/narrative.schema';
import { buildDialogueActionCards, extractDialogueAffinityDelta } from '../../engine/response-pipeline';
import { createDialogueSlice } from './dialogueSlice';

function createHarness(initial: Record<string, any> = {}) {
  let state: Record<string, any> = { ...initial };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createDialogueSlice(set, get);
  state = { ...slice, ...state };
  return {
    get state() {
      return state;
    },
  };
}

describe('NPC dialogue state bridge', () => {
  it('marks a sent topic as awaiting an NPC response', () => {
    const harness = createHarness();
    harness.state.initDialogue('npc_batuer', '胡勒·巴图尔', '精明老练，善于权衡利益', '北原', 10);

    harness.state.sendTopic('深交');

    expect(harness.state.activeDialogue.messages).toMatchObject([
      { role: 'player', text: '【深交】' },
    ]);
    expect(harness.state.activeDialogue.awaitingResponse).toBe(true);
    expect(harness.state.activeDialogue.pendingTopic).toBe('深交');
    expect(harness.state.activeDialogue.error).toBeNull();
  });

  it('appends the DeepSeek NPC reply and clears the waiting state', () => {
    const harness = createHarness();
    harness.state.initDialogue('npc_batuer', '胡勒·巴图尔', '精明老练，善于权衡利益', '北原', 10);
    harness.state.sendTopic('深交');

    harness.state.appendNpcMessage('你若能帮我猎到冰原狼王，咱们的交情就算开始。', 3);

    expect(harness.state.activeDialogue.messages).toHaveLength(2);
    expect(harness.state.activeDialogue.messages[1]).toMatchObject({
      role: 'npc',
      affinityChange: 3,
    });
    expect(harness.state.activeDialogue.affinity).toBe(13);
    expect(harness.state.activeDialogue.awaitingResponse).toBe(false);
    expect(harness.state.activeDialogue.pendingTopic).toBeNull();
  });

  it('keeps the dialogue usable after DeepSeek failures', () => {
    const harness = createHarness();
    harness.state.initDialogue('npc_batuer', '胡勒·巴图尔', '精明老练，善于权衡利益', '北原', 10);
    harness.state.sendTopic('深交');

    harness.state.markDialogueError('AI响应失败');

    expect(harness.state.activeDialogue.awaitingResponse).toBe(false);
    expect(harness.state.activeDialogue.pendingTopic).toBeNull();
    expect(harness.state.activeDialogue.error).toBe('AI响应失败');
  });

  it('accepts dynamic NPC affinity deltas and extracts zero-delta replies', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: '胡勒·巴图尔轻笑一声，给了你一个追猎冰原狼王的机会。他没有立刻交心，只是把选择摆在你面前，等你拿实力或诚意说话。',
        choices: [
          { id: 'c1', text: '接受猎杀冰原狼王的任务', risk: 'high', risk_note: '可能遭遇狼群围攻' },
        ],
      },
      state_update: {
        dynamic_npcs: {
          affinity_delta: [{ name: '胡勒·巴图尔', delta: 0 }],
        },
      },
    });

    expect(parsed.state_update?.dynamic_npcs?.affinity_delta?.[0]?.delta).toBe(0);
    expect(extractDialogueAffinityDelta(parsed.state_update, '胡勒·巴图尔')).toBe(0);
  });

  it('turns DeepSeek choices into clickable dialogue action cards', () => {
    const harness = createHarness({ turn: 12 });
    harness.state.initDialogue('npc_batuer', '胡勒·巴图尔', '精明老练，善于权衡利益', '北原', 10);
    harness.state.sendTopic('交易');

    const cards = buildDialogueActionCards([
      { id: 'c1', text: '接受猎杀冰原狼王的委托', risk: 'high', risk_note: '可能遭遇狼群围攻' },
      { id: 'c2', text: '追问冰原狼王的踪迹和报酬', risk: 'medium', risk_note: '可能暴露意图' },
    ], harness.state.activeDialogue, 12);
    harness.state.appendNpcMessage('我可以给你一个机会，但你要先选。', 0);
    harness.state.setDialogueActionCards(cards);

    expect(harness.state.activeDialogue.actionCards).toHaveLength(2);
    expect(harness.state.activeDialogue.actionCards[0]).toMatchObject({
      category: 'accept_request',
      status: 'pending',
    });
    expect(harness.state.activeDialogue.actionCards[1]).toMatchObject({
      category: 'negotiate',
    });
  });

  it('selects a dialogue action card as an in-dialogue player response', () => {
    const harness = createHarness();
    harness.state.initDialogue('npc_batuer', '胡勒·巴图尔', '精明老练，善于权衡利益', '北原', 10);
    harness.state.setDialogueActionCards([{
      id: 'card_1',
      npcId: 'npc_batuer',
      npcName: '胡勒·巴图尔',
      topic: '委托',
      text: '接受猎杀冰原狼王的委托',
      risk: 'high',
      riskNote: '可能遭遇狼群围攻',
      category: 'accept_request',
      status: 'pending',
      createdTurn: 1,
    }]);

    const selected = harness.state.selectDialogueActionCard('card_1');

    expect(selected?.id).toBe('card_1');
    expect(harness.state.activeDialogue.messages.at(-1)).toMatchObject({
      role: 'player',
      text: '接受猎杀冰原狼王的委托',
    });
    expect(harness.state.activeDialogue.awaitingResponse).toBe(true);
    expect(harness.state.activeDialogue.selectedActionCardId).toBe('card_1');
    expect(harness.state.activeDialogue.actionCards[0].status).toBe('selected');
  });

  it('blocks NPC dialogue requests from becoming formal tasks in schema terms', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: '胡勒·巴图尔把冰原狼王的消息压低声音说出，只说这是一条可查的线索，不会立刻把报酬塞到你手上。他让你自己判断风险，也提醒你这还只是口头机会，真正行动前仍需确认踪迹、报酬和退路。',
        choices: [
          { id: 'c1', text: '继续追问狼王踪迹', risk: 'medium', risk_note: '可能被试探底细' },
        ],
      },
      state_update: {
        dynamic_npcs: { affinity_delta: [{ name: '胡勒·巴图尔', delta: 0 }] },
        dialogue_requests: {
          add: [{
            npcName: '胡勒·巴图尔',
            title: '冰原狼王踪迹',
            summary: 'NPC提出的猎杀候选，等待引擎和白名单校验。',
            category: 'hunt',
            risk: 'high',
            source: 'ai-rumor',
          }],
        },
      },
    });

    expect(parsed.state_update?.dialogue_requests?.add?.[0]?.category).toBe('hunt');
  });
});
