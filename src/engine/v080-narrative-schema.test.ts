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

  it('accepts v0.8-c2.5 inheritance choice tags and guarded candidates', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: 'A sealed side cave shows old refinement marks and a faint land-spirit oath. The AI may surface the clue, but the local inheritance engine decides whether the trial can start, whether any reward is registered, and whether a blessed land can be claimed.',
        choices: [
          {
            id: 'c1',
            text: 'Inspect the minor inheritance seal',
            risk: 'medium',
            risk_note: 'The seal may trigger a guardian trial.',
            inheritance_tags: [{
              siteId: 'minor_cave_inheritance',
              kind: 'inheritance_hint',
              label: '传承线索',
              status: 'available',
              reason: 'Only a candidate; rewards need local validation.',
              risk: 'medium',
              apCost: 1,
            }],
          },
          {
            id: 'c2',
            text: 'Listen for grotto-heaven rumors',
            risk: 'high',
            risk_note: 'This remains boundary pressure in v0.8.',
            inheritanceTags: [{
              siteId: 'grotto_heaven_boundary_rumor',
              kind: 'grotto_heaven_rumor',
              label: '洞天传闻',
              status: 'rumor',
              reason: 'Grotto-heaven claiming is not opened in v0.8.',
            }],
          },
        ],
      },
      state_update: {
        inheritance_land_candidates: {
          add: [{
            siteId: 'minor_cave_inheritance',
            title: '小传承洞府线索',
            summary: '旧炼道洞府露出封印裂隙，等待本地引擎判断是否能进入。',
            rewardPreview: [{
              kind: 'gu',
              name: '月光蛊',
              tier: 1,
              path: '月道',
              registered: true,
            }],
          }],
        },
      },
    });

    expect(parsed.narrative.choices[0].inheritance_tags?.[0].label).toBe('传承线索');
    expect(parsed.narrative.choices[1].inheritanceTags?.[0].status).toBe('rumor');
    expect(parsed.state_update?.inheritance_land_candidates?.add?.[0].siteId).toBe('minor_cave_inheritance');
  });

  it('accepts v0.9-a2 training ground choice tags and guarded clue candidates', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: 'The clan elder hands over a bamboo token that only points to the outer refinement platform. It is a clue, not a reward.',
        choices: [
          {
            id: 'training_clue',
            text: 'Accept the token and verify the training-ground clue',
            risk: 'low',
            risk_note: 'The local engine decides AP, cost, cooldown and result.',
            trainingGroundTags: [{
              groundId: 'tg_nanjiang_refine',
              kind: 'training_ground_clue',
              label: '道场线索',
              status: 'available',
              reason: 'Only visible after a story clue.',
              apCost: 1,
            }],
          },
          {
            id: 'hunt_rumor',
            text: 'Record the black-heaven hunting rumor as a later lead',
            risk: 'high',
            risk_note: 'Hunt entries wait for the v0.9.0-a3 beast library.',
            training_ground_tags: [{
              groundId: 'tg_black_heaven',
              kind: 'beast_library_pending',
              label: '待荒兽敌库',
              status: 'blocked',
              reason: 'No beast drop can be written by narrative text.',
            }],
          },
        ],
      },
      state_update: {
        training_ground_candidates: {
          add: [{
            groundId: 'tg_nanjiang_refine',
            title: '青茅山炼蛊台竹牌',
            summary: '剧情给出的道场线索，等待本地引擎校验。',
            source: 'ai-rumor',
            locationHint: '青茅山',
            risk: 'low',
            apCostHint: 1,
          }],
        },
      },
    });

    expect(parsed.narrative.choices[0].trainingGroundTags?.[0].groundId).toBe('tg_nanjiang_refine');
    expect(parsed.narrative.choices[1].training_ground_tags?.[0].status).toBe('blocked');
    expect(parsed.state_update?.training_ground_candidates?.add?.[0].groundId).toBe('tg_nanjiang_refine');
  });
});
