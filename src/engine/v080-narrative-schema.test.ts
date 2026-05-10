import { describe, expect, it } from 'vitest';
import { NarrativeJSONSchema } from '../schemas/narrative.schema';

describe('v0.8.0 narrative state_update schema', () => {
  it('accepts story, IF branch, and canon anchor pressure candidates', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: '宿命战余波尚未散尽，天庭残存的秩序与五域自由乱世互相碾压。你没有资格替代方源，也不能一句话改写宿命，只能把眼前的侧线选择写成候选，等待引擎记录代价与反噬。',
        choices: [
          { id: 'c1', text: '观察天庭残部动向', risk: 'medium', risk_note: '可能被天庭注意' },
          { id: 'c2', text: '暗中接触反宿命势力', risk: 'high', risk_note: '可能引来追杀' },
        ],
      },
      state_update: {
        story_event_candidates: {
          add: [{
            anchorId: 'fate_war',
            type: 'faction_move',
            title: '天庭残部整肃',
            summary: '天庭残部试图在宿命战后重新维持秩序。',
            risk: 'medium',
          }],
        },
        if_branch_candidates: {
          add: [{
            anchorId: 'fate_war',
            axis: 'break_fate',
            proposedDelta: 30,
            summary: '玩家倾向利用宿命破碎后的自由乱世。',
            costHint: '天意压力与正道敌意上升。',
            downstreamHint: ['宿命战后路线偏移'],
          }],
        },
        canon_anchor_pressure: {
          add: [{
            anchorId: 'fate_war',
            pressure: 80,
            reason: 'AI 文本接近直接改写宿命战结果。',
            attemptedMutation: '玩家替代方源摧毁宿命蛊',
            engineDecision: 'redirect',
            fallbackNarrativeHint: '改写为侧翼战场或战后余波。',
          }],
        },
      },
    });

    expect(parsed.state_update?.story_event_candidates?.add?.[0].title).toBe('天庭残部整肃');
    expect(parsed.state_update?.if_branch_candidates?.add?.[0].axis).toBe('break_fate');
    expect(parsed.state_update?.canon_anchor_pressure?.add?.[0].engineDecision).toBe('redirect');
  });

  it('accepts v0.8 narrative Gu affordance metadata and guarded suggestions', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: 'The sealed ravine is blocked by old vine cords and corpse poison mist. The engine must expose Gu-based scene options as candidates only, while local validation decides whether any registered effect may execute.',
        choices: [
          {
            id: 'c1',
            text: 'Use Moonlight Gu to cut the vine cord',
            risk: 'medium',
            risk_note: 'The blade flash may reveal your position.',
            gu_affordance: {
              sourceType: 'gu',
              sourceName: '月光蛊',
              utilityId: 'cut_rope',
              category: 'obstacle_breaking',
              status: 'available',
              riskHint: 'Scene result still needs local validation.',
            },
          },
          {
            id: 'c2',
            text: 'Ask for traces of Tracking Gu',
            risk: 'low',
            risk_note: 'Without the Gu this remains a clue route.',
            guAffordances: [{
              sourceType: 'gu',
              sourceName: '追踪蛊',
              utilityId: 'follow_fugitive',
              category: 'tracking',
              status: 'missing',
            }],
          },
        ],
      },
      state_update: {
        gu_use_suggestions: {
          add: [{
            guName: '月光蛊',
            utilityId: 'cut_rope',
            category: 'obstacle_breaking',
            riskHint: 'May make noise in the ravine.',
            sceneValidated: true,
            sceneTags: ['ravine', 'vine_cord'],
            reason: 'The selected choice asks for a registered obstacle-breaking use.',
          }],
        },
      },
    });

    expect(parsed.narrative.choices[0].gu_affordance).toBeTruthy();
    expect(parsed.narrative.choices[1].guAffordances?.[0].category).toBe('tracking');
    expect(parsed.state_update?.gu_use_suggestions?.add?.[0].utilityId).toBe('cut_rope');
  });
});
