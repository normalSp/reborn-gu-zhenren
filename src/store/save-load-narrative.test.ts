import { beforeEach, describe, expect, it } from 'vitest';
import { buildVisibleNarrativeAfterLoad, type SaveFileFormat, useStore } from './index';
import { SAVE_FORMAT_VERSION } from './initialState';
import type { NarrativeJSON } from '../types';

function makeNarrative(text: string, choiceText = '继续'): NarrativeJSON {
  return {
    narrative: {
      text,
      choices: [
        {
          id: 'continue',
          text: choiceText,
          risk: 'low',
          risk_note: '测试选项',
        },
      ],
    },
    state_update: {},
  };
}

function makeSave(state: Record<string, any>): SaveFileFormat {
  return {
    formatVersion: SAVE_FORMAT_VERSION,
    timestamp: new Date('2026-05-10T00:00:00.000Z').toISOString(),
    meta: {
      playerName: '读档者',
      realm: '二转中阶',
      turn: state.turn ?? 31,
      gameMode: 'canon',
    },
    state,
  };
}

describe('save load visible narrative finalizer', () => {
  beforeEach(() => {
    useStore.getState().resetStore();
    useStore.setState({
      currentNarrative: makeNarrative('新开一转剧情不应残留'),
      screenState: 'game_play',
      pipelinePhase: 'RESOLVED',
      gameLoadVersion: 0,
    } as any);
  });

  it('keeps currentNarrative when the save file contains a visible narrative snapshot', () => {
    const narrative = buildVisibleNarrativeAfterLoad({
      currentNarrative: makeNarrative('存档里的可见叙事', '选择存档选项'),
    });

    expect(narrative.narrative.text).toBe('存档里的可见叙事');
    expect(narrative.narrative.choices[0]?.text).toBe('选择存档选项');
  });

  it('derives visible narrative from the latest assistant message for old saves', () => {
    const messageNarrative = makeNarrative('旧存档消息中的叙事');
    const narrative = buildVisibleNarrativeAfterLoad({
      messages: [
        { role: 'assistant', content: JSON.stringify(messageNarrative) },
      ],
    });

    expect(narrative.narrative.text).toBe('旧存档消息中的叙事');
    expect(narrative.narrative.choices[0]?.id).toBe('continue');
  });

  it('uses a safe load summary instead of retaining the previous new-game text', () => {
    const narrative = buildVisibleNarrativeAfterLoad({}, {
      playerName: '旧档',
      realm: '三转巅峰',
      turn: 88,
      gameMode: 'canon',
    });

    expect(narrative.narrative.text).toContain('第88回合');
    expect(narrative.narrative.text).not.toContain('新开一转剧情');
    expect(narrative.narrative.choices[0]?.id).toBe('continue_loaded_save');
  });

  it('loads file saves through a finalizer that replaces visible narrative and runtime state', () => {
    const save = makeSave({
      turn: 31,
      profile: { name: '旧档角色', realm: { grand: 2, sub: '中阶', label: '二转中阶' }, background: '南疆' },
      currentNarrative: makeNarrative('已载入的存档叙事'),
      messages: [],
    });

    const beforeVersion = useStore.getState().gameLoadVersion;
    const result = useStore.getState().loadFromFile(JSON.stringify(save));
    const state = useStore.getState() as any;

    expect(result.success).toBe(true);
    expect(state.turn).toBe(31);
    expect(state.screenState).toBe('game_play');
    expect(state.pipelinePhase).toBe('RESOLVED');
    expect(state.pipelineError).toBeNull();
    expect(state.currentNarrative.narrative.text).toBe('已载入的存档叙事');
    expect(state.gameLoadVersion).toBe(beforeVersion + 1);
  });

  it('does not retain pre-load narrative when loading an old save without currentNarrative', () => {
    const save = makeSave({
      turn: 12,
      profile: { name: '旧档角色', realm: { grand: 1, sub: '高阶', label: '一转高阶' }, background: '南疆' },
      messages: [],
    });

    const result = useStore.getState().loadFromFile(JSON.stringify(save));
    const state = useStore.getState() as any;

    expect(result.success).toBe(true);
    expect(state.currentNarrative.narrative.text).toContain('第12回合');
    expect(state.currentNarrative.narrative.text).not.toContain('新开一转剧情');
  });

  it('keeps squad combat state from battle test saves', () => {
    const save = makeSave({
      turn: 44,
      profile: { name: '小队战测试', realm: { grand: 4, sub: '高阶', label: '四转高阶' }, background: '南疆' },
      currentNarrative: makeNarrative('小队战专项存档'),
      squadCombatState: {
        squadId: 'test_squad_battle',
        phase: 'player_turn',
        round: 1,
        formation: '合击',
        morale: 60,
        coordination: 60,
        members: [{ id: 'm1', name: '队友', hp: 100, maxHp: 100, path: '力道', realm: 3, moves: [] }],
        enemies: [{ id: 'e1', name: '敌人', hp: 80, maxHp: 80, path: '力道', realm: 3, moves: [] }],
        log: [],
        trace: [],
      },
      battleVisualQueue: [{ id: 'flash_1', kind: 'killer_move' }],
    });

    const result = useStore.getState().loadFromFile(JSON.stringify(save));
    const state = useStore.getState() as any;

    expect(result.success).toBe(true);
    expect(state.squadCombatState?.phase).toBe('player_turn');
    expect(state.squadCombatState?.members).toHaveLength(1);
    expect(state.duelState).toBeNull();
    expect(state.battleVisualQueue).toHaveLength(1);
  });

  it('keeps duel state from single combat saves', () => {
    const save = makeSave({
      turn: 45,
      profile: { name: '单人战测试', realm: { grand: 2, sub: '中阶', label: '二转中阶' }, background: '南疆' },
      currentNarrative: makeNarrative('单人战专项存档'),
      duelState: {
        duelId: 'test_duel',
        phase: 'player_turn',
        round: 1,
        mode: 'lethal',
        player: { name: '玩家', realm: '二转中阶', hp: 100, maxHp: 100, path: '力道', moves: [] },
        enemy: { name: '敌人', realm: '二转中阶', hp: 80, maxHp: 80, path: '力道', moves: [] },
        result: null,
        log: [],
      },
    });

    const result = useStore.getState().loadFromFile(JSON.stringify(save));
    const state = useStore.getState() as any;

    expect(result.success).toBe(true);
    expect(state.duelState?.phase).toBe('player_turn');
    expect(state.squadCombatState).toBeNull();
  });

  it('does not create combat state for ordinary narrative saves', () => {
    const save = makeSave({
      turn: 46,
      profile: { name: '普通叙事测试', realm: { grand: 1, sub: '初阶', label: '一转初阶' }, background: '南疆' },
      currentNarrative: makeNarrative('普通剧情存档'),
      messages: [],
    });

    const result = useStore.getState().loadFromFile(JSON.stringify(save));
    const state = useStore.getState() as any;

    expect(result.success).toBe(true);
    expect(state.duelState).toBeNull();
    expect(state.squadCombatState).toBeNull();
    expect(state.transientCombatConstraint).toBeNull();
  });
});
