import { describe, expect, it } from 'vitest';
import { NarrativeJSONSchema } from '../../schemas/narrative.schema';
import { extractDialogueAffinityDelta } from '../../engine/response-pipeline';
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
});
