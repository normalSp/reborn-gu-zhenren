import { useStore } from '../store';
import type { StateUpdate, ButterflyEffect } from '../types';
import type { EncounterReward } from '../types/encounter';
import { applyDaoHeartEvent, getDaoHeartEventPolicy, getReputationEventPolicy, type NarrativeEventKind } from './dao-reputation-policy';
import { canApplyAttributeMutation, getAttributeMutationPolicy, type AttributeMutationSource } from './attribute-mutation-policy';
import { getGuUseEntry, resolveSceneGatedGuUseSuggestion, type GuUseTarget } from './gu-use-registry';
import { validateNarrativeGuUseSuggestion } from './v080-narrative-gu-affordances';
import { validateResourceEcologyGate } from './v080-scene-time-engine';
import { evaluateCombatEncounterEntry } from './v080-narrative-combat-orchestration';
import economyRaw from '../canon/economy.json';
import chaptersRaw from '../canon/chapters.json';

const economyData = economyRaw as Record<string, any>;
const chaptersData = chaptersRaw as any;

// ─── 全局自增计数器 ───
let guIdCounter = 1000;

function nextGuId(): string {
  return `gu_${++guIdCounter}_${Date.now()}`;
}

// ─── 境界标签解析 ───
const REALM_GRAND_BY_LABEL: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function getRealmUpdateValue(realm: NonNullable<StateUpdate['player']>['realm']): string | null {
  if (!realm) return null;
  if (typeof realm === 'string') return realm;
  return typeof realm.value === 'string' ? realm.value : null;
}

function parseRealmGrand(value: string): number {
  const match = value.trim().match(/([一二三四五六七八九]|[1-9])转/);
  if (!match) return 0;
  const raw = match[1];
  return Number.isFinite(Number(raw)) ? Number(raw) : REALM_GRAND_BY_LABEL[raw] || 0;
}

function sanitizePlayerUpdateForCultivation(
  playerUpdate: StateUpdate['player'],
  store: any,
): { safe: StateUpdate['player']; blocked: string[] } {
  if (!playerUpdate) return { safe: playerUpdate, blocked: [] };
  const safe: NonNullable<StateUpdate['player']> = { ...playerUpdate };
  const blocked: string[] = [];
  const currentGrand = Number(store?.profile?.realm?.grand || 1);
  const realmValue = getRealmUpdateValue(playerUpdate.realm);
  const targetGrand = realmValue ? parseRealmGrand(realmValue) : 0;

  if (realmValue && targetGrand > 0 && targetGrand !== currentGrand) {
    delete safe.realm;
    blocked.push(`境界写入 ${realmValue} 已降级：v0.8-b2 后跨境界必须由本地修行/升仙引擎结算。`);
  }
  if (playerUpdate.essenceType === 'immortal' && currentGrand < 6) {
    delete safe.essenceType;
    blocked.push('仙元类型写入已降级：凡人到蛊仙的质变必须由升仙引擎结算。');
  }

  return { safe, blocked };
}

// ─── 声望级别计算 ───
function calcReputationTier(standing: number): string {
  if (standing >= 90) return '崇拜';
  if (standing >= 70) return '尊敬';
  if (standing >= 40) return '友善';
  if (standing >= 10) return '中立';
  if (standing >= -10) return '冷淡';
  if (standing >= -40) return '敌对';
  return '死敌';
}

// ─── P2: wealth.delta 经济合理性校验 ───
/**
 * 基于当前章节 priceMultiplier 和 canonical 收入基准校验 wealth.delta 是否合理。
 * 返回 { valid: boolean, clampedDelta: number, reason: string }
 * - 超过 5x 月收入上限 (500元石) 时 warn 日志但仅警告
 * - 超过 15x 月收入上限 (1500元石) 时 clamp 到合理范围
 * - 负向 delta 不能使余额低于 0
 */
function validateWealthDelta(delta: number): { valid: boolean; clampedDelta: number; reason: string } {
  const store = useStore.getState() as any;
  const currentChapterId = store.currentChapterId || '';
  const currentDomain = store.currentDomain || '南疆';
  const currentCurrency = store.currency || 0;

  // 读取当前章节priceMultiplier
  let chapterMultiplier = 1.0;
  try {
    const domainChapters = chaptersData.domains?.[currentDomain] || [];
    const chapterDef = domainChapters.find((c: any) => c.id === currentChapterId);
    if (chapterDef?.chapterPriceMultiplier) {
      chapterMultiplier = chapterDef.chapterPriceMultiplier;
    }
  } catch { /* use default */ }

  // Canonical 月收入基准: 30-100元石 (来自economy.json)
  const MAX_MONTHLY_INCOME = 100;
  // 单轮收入合理上限 = 5x 月收入上限 × 章节系数
  const WARN_THRESHOLD = 500 * chapterMultiplier;
  // 绝对上限 = 15x 月收入上限 × 章节系数（超出即截断）
  const CLAMP_THRESHOLD = 1500 * chapterMultiplier;

  // 正向delta校验
  if (delta > 0) {
    if (delta > CLAMP_THRESHOLD) {
      const clamped = CLAMP_THRESHOLD;
      const reason = `wealth.delta=${delta} 超过绝对上限 ${CLAMP_THRESHOLD}(章节系数${chapterMultiplier}x)，已截断至 ${clamped}`;
      console.warn(`[WealthValidation] ${reason}`);
      return { valid: false, clampedDelta: clamped, reason };
    }
    if (delta > WARN_THRESHOLD) {
      console.warn(`[WealthValidation] wealth.delta=${delta} 超过警告线 ${WARN_THRESHOLD}(月收入上限${MAX_MONTHLY_INCOME}×5×章节系数${chapterMultiplier})，AI可能未遵守经济锚定规则`);
    }
  }

  // 负向delta校验：不能使余额低于0
  if (delta < 0) {
    if (currentCurrency + delta < 0) {
      const clamped = -currentCurrency;
      const reason = `wealth.delta=${delta} 将使余额变为 ${currentCurrency + delta}(负值)，已截断至 ${clamped}`;
      console.warn(`[WealthValidation] ${reason}`);
      return { valid: false, clampedDelta: clamped, reason };
    }
    if (Math.abs(delta) > CLAMP_THRESHOLD) {
      const clamped = -Math.min(Math.abs(delta), currentCurrency);
      const reason = `wealth.delta=${delta} 负向绝对值超过绝对上限 ${CLAMP_THRESHOLD}，已截断至 ${clamped}`;
      console.warn(`[WealthValidation] ${reason}`);
      return { valid: false, clampedDelta: clamped, reason };
    }
  }

  return { valid: true, clampedDelta: delta, reason: '' };
}
export function applyStateUpdate(update: StateUpdate): void {
  if (!update) return; // 5C: 防崩溃守卫——state_update可选时可能为undefined
  const store = useStore.getState();

  // ─── Player 更新（直接调用 store 方法） ───
  if (update.player) {
    const sanitized = sanitizePlayerUpdateForCultivation(update.player, store);
    const p = sanitized.safe || {};
    if (sanitized.blocked.length > 0) {
      const s = useStore.getState() as any;
      s.addGameLog?.('pipeline', `修行/升仙写入已拦截：${sanitized.blocked.join('；')}`, {
        source: 'v080-cultivation-guard',
        blocked: sanitized.blocked,
      });
    }
    // 直接调用 playerSlice 的方法
    if (p && typeof (store as any).applyStateUpdate === 'function') {
      (store as any).applyStateUpdate(p);
    }
    // ─── 道心四维变更 ───
    if (p.dao_heart) {
      const store2 = useStore.getState();
      const prev = store2.daoHeart;
      useStore.setState({
        daoHeart: {
          kill: prev.kill + (p.dao_heart.kill ?? 0),
          mercy: prev.mercy + (p.dao_heart.mercy ?? 0),
          scheme: prev.scheme + (p.dao_heart.scheme ?? 0),
          ambition: prev.ambition + (p.dao_heart.ambition ?? 0),
        },
      });
    }
  }

  // ─── 财富变更（含经济合理性校验） ───
  if (update.wealth) {
    const { valid, clampedDelta, reason } = validateWealthDelta(update.wealth.delta);
    const appliedDelta = valid ? update.wealth.delta : clampedDelta;
    
    if (!valid) {
      const logStore = useStore.getState() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('system', `[经济校验] ${reason}`, { originalDelta: update.wealth.delta, appliedDelta, chapter: logStore.currentChapterId });
      }
    }
    
    if (appliedDelta !== 0) {
      (store as any).addCurrency?.(appliedDelta);
    }
  }

  // ─── 蛊虫库存更新 ───
  if (update.gu_inventory) {
    const inv = update.gu_inventory;
    if (inv.add) {
      // ═══ 日志埋点: 叙事获得蛊虫
      const gLog = useStore.getState() as any;
      if (typeof gLog.addGameLog === 'function' && inv.add.length > 0) {
        const names = inv.add.map(g => g.name).join('、');
        gLog.addGameLog('gu', `叙事获得蛊虫: ${names}`, { count: inv.add.length, names: inv.add.map(g => g.name) });
      }
      for (const gu of inv.add) {
        // ═══ v1.7: AI叙事仙蛊过滤 — 仙蛊不可通过叙事凭空获得 ═══
        if ((gu as any).isImmortalGu) {
          console.warn(`[StateUpdateApplier] AI叙事尝试添加仙蛊「${gu.name}」，已根据仙蛊唯一性原则拦截。`);
          continue;
        }
        store.addGu({
          id: nextGuId(),
          specId: gu.name.toLowerCase().replace(/\s+/g, '_'),
          name: gu.name,
          tier: gu.tier,
          path: gu.path,
          currentState: 'optimal' as const,
          proficiency: 0,
          bonded: false,
          active: true,
          acquiredAt: {
            turn: store.messages.length,
            narrative: `获得${gu.name}: ${gu.description}`,
          },
        });
      }
    }
    if (inv.remove) {
      for (const guName of inv.remove) {
        const existing = store.inventory.find(
          g => g.name === guName || g.id === guName
        );
        if (existing) {
          store.removeGu(existing.id);
        }
      }
    }
  }

  // ─── Flag 更新 ───
  if (update.flags) {
    if (update.flags.set) {
      for (const [key, value] of Object.entries(update.flags.set)) {
        store.setFlag(key, value);
      }
    }
    if (update.flags.remove) {
      for (const key of update.flags.remove) {
        store.removeFlag(key);
      }
    }
  }

  // ─── 🆕 蛊材/材料获得 ───
  if (update.materials?.add) {
    const store2 = useStore.getState() as any;
    if (typeof store2.addMaterial === 'function') {
      for (const [matName, qty] of Object.entries(update.materials.add)) {
        if (Number(qty) <= 0) continue;
        const resourceGate = validateResourceEcologyGate(store2, 'immortal_resource_gather', matName);
        if (resourceGate.disposition !== 'allow') {
          if (resourceGate.disposition === 'downgrade_to_rumor') {
            const currentRumors = Array.isArray(store2.flags?.aiRumorDiscoveries)
              ? [...store2.flags.aiRumorDiscoveries]
              : [];
            currentRumors.push({
              type: 'resource_rumor',
              name: matName,
              note: resourceGate.reason,
              source: 'v080-scene-time-resource-gate',
            });
            store2.setFlag?.('aiRumorDiscoveries', currentRumors);
          }
          store2.addGameLog?.('pipeline', `AI材料写入已拦截：${matName}。${resourceGate.reason}`, {
            material: matName,
            disposition: resourceGate.disposition,
            reason: resourceGate.reason,
          });
          continue;
        }
        store2.addMaterial(matName, Number(qty));
      }
    }
  }

  // ─── v0.7.0-pre: 残方发现（完整蛊方不允许AI直接解锁） ───
  if ((update as any).recipe_fragments?.add && Array.isArray((update as any).recipe_fragments.add)) {
    const store2 = useStore.getState() as any;
    const current = Array.isArray(store2.flags?.discoveredFragments)
      ? [...store2.flags.discoveredFragments]
      : [];
    for (const fragmentId of (update as any).recipe_fragments.add) {
      current.push(fragmentId);
      if (typeof store2.addGameLog === 'function') {
        store2.addGameLog('system', `获得残方线索：${fragmentId}`, { fragmentId });
      }
    }
    store2.setFlag?.('discoveredFragments', current);
  }

  // ─── v0.7.0-pre: AI待审线索（无数值效果） ───
  if ((update as any).discoveries?.add && Array.isArray((update as any).discoveries.add)) {
    const store2 = useStore.getState() as any;
    const current = Array.isArray(store2.flags?.aiRumorDiscoveries)
      ? [...store2.flags.aiRumorDiscoveries]
      : [];
    for (const discovery of (update as any).discoveries.add) {
      current.push({
        ...discovery,
        turn: store2.turn || 1,
        chapterId: store2.currentChapterId || '',
        domain: store2.currentDomain || '',
      });
      if (typeof store2.addGameLog === 'function') {
        store2.addGameLog('pipeline', `AI待审线索：${discovery.name}`, discovery);
      }
    }
    store2.setFlag?.('aiRumorDiscoveries', current.slice(-100));
  }

  // ─── v0.7.0-pre: NPC对话委托/交易候选（不创建正式任务，不改经济） ───
  if ((update as any).dialogue_requests?.add && Array.isArray((update as any).dialogue_requests.add)) {
    const store2 = useStore.getState() as any;
    const current = Array.isArray(store2.flags?.npcRequestCandidates)
      ? [...store2.flags.npcRequestCandidates]
      : [];
    for (const request of (update as any).dialogue_requests.add) {
      const candidate = {
        ...request,
        status: 'candidate',
        source: request.source || 'ai-rumor',
        turn: store2.turn || 1,
        chapterId: store2.currentChapterId || '',
        domain: store2.currentDomain || '',
        timestamp: Date.now(),
      };
      current.push(candidate);
      if (typeof store2.addGameLog === 'function') {
        store2.addGameLog('npc', `NPC候选线索：${candidate.title}`, candidate);
      }
    }
    store2.setFlag?.('npcRequestCandidates', current.slice(-100));
  }

  // v0.7.0-pre M17: AI 只能提出场景蛊使用候选，实际生效必须经过引擎校验。
  if ((update as any).gu_use_suggestions?.add && Array.isArray((update as any).gu_use_suggestions.add)) {
    const s = useStore.getState() as any;
    const guList = [
      ...(Array.isArray(s.inventory) ? s.inventory : []),
      ...(Array.isArray(s.apertureInventory?.gu) ? s.apertureInventory.gu : []),
    ];
    for (const suggestion of (update as any).gu_use_suggestions.add) {
      if (!suggestion?.guName) continue;
      const owned = guList.find((gu: any) => gu.name === suggestion.guName || gu.id === suggestion.guName);
      const narrativeGuValidation = validateNarrativeGuUseSuggestion(suggestion, s);
      if (!narrativeGuValidation.allowed || !narrativeGuValidation.executable) {
        s.addGameLog?.('pipeline', `剧情蛊候选未执行：${suggestion.guName}`, {
          reason: narrativeGuValidation.reason,
          suggestion,
          affordance: narrativeGuValidation.affordance,
        });
        continue;
      }
      const entry = getGuUseEntry(suggestion.guName);
      const target = suggestion.target as GuUseTarget | undefined;
      const result = resolveSceneGatedGuUseSuggestion(entry, target, {
        sceneValidated: suggestion.sceneValidated === true,
        sceneTags: Array.isArray(suggestion.sceneTags) ? suggestion.sceneTags : [],
      });

      if (!owned || !result.success) {
        s.addGameLog?.('pipeline', `剧情蛊候选未执行：${suggestion.guName}`, {
          reason: !owned ? '未持有该蛊' : result.message,
          suggestion,
        });
        continue;
      }

      if (result.targetedEffect && typeof s.addTargetedGuEffect === 'function') {
        s.addTargetedGuEffect({
          ...result.targetedEffect,
          sourceGuId: owned.id,
        });
      }
      for (const [attr, delta] of Object.entries(result.attributeDeltas)) {
        s.addAttribute?.(attr, delta);
      }
      for (const [key, value] of Object.entries(result.flags)) {
        s.setFlag?.(key, value);
      }
      if (result.consumesGu && typeof s.removeGu === 'function') {
        s.removeGu(owned.id);
      }
      s.addGameLog?.('gu', result.message, {
        guId: owned.id,
        guName: entry.guName,
        target: result.target,
        sceneTags: suggestion.sceneTags,
      });
    }
  }

  // v0.7.0-a: LLM may only propose combat event candidates. The engine validates them later.
  if ((update as any).combat_event_candidates?.add && Array.isArray((update as any).combat_event_candidates.add)) {
    const s = useStore.getState() as any;
    const current = Array.isArray(s.flags?.combatEventCandidates)
      ? [...s.flags.combatEventCandidates]
      : [];
    for (const candidate of (update as any).combat_event_candidates.add) {
      if (!candidate?.title || !candidate?.summary) continue;
      const id = candidate.id || `combat_candidate_${Date.now()}_${current.length}`;
      const validation = evaluateCombatEncounterEntry({ ...candidate, id }, s);
      current.push({
        ...candidate,
        id,
        source: candidate.source || 'ai-rumor',
        engineValidation: validation.valid ? 'pending' : 'downgraded',
        validationIssues: validation.blockers,
        entryValidation: validation,
        createdTurn: s.turn || 1,
        duelId: s.duelState?.duelId,
      });
      s.addGameLog?.('combat', `战斗候选事件：${candidate.title}`, {
        type: candidate.type,
        risk: candidate.risk,
        summary: candidate.summary,
      });
    }
    s.setFlag?.('combatEventCandidates', current.slice(-40));
  }

  // v0.8.0-b3: story/IF/anchor updates are candidates only. The local engine validates them.
  {
    const direct = update as any;
    const directAttempts: string[] = [];
    if (direct.fateState !== undefined || direct.fate_state !== undefined) directAttempts.push('direct fateState write');
    if (direct.anchorResults !== undefined || direct.anchor_results !== undefined) directAttempts.push('direct anchorResults write');
    if (direct.endingOutcome !== undefined || direct.ending_outcome !== undefined) directAttempts.push('direct ending write');
    if (direct.endingState !== undefined || direct.ending_state !== undefined) directAttempts.push('direct endingState write');
    if (direct.ending_candidates !== undefined || direct.endingCandidates !== undefined) directAttempts.push('direct ending candidates write');
    if (direct.finalOutcome !== undefined || direct.final_outcome !== undefined) directAttempts.push('direct final outcome write');
    if (direct.venerableKill !== undefined || direct.venerable_kill !== undefined) directAttempts.push('direct venerable kill write');
    if (direct.rankTen !== undefined || direct.rank_ten !== undefined) directAttempts.push('direct rank ten write');
    if (direct.immortalityConclusion !== undefined || direct.immortality_conclusion !== undefined) directAttempts.push('direct immortality conclusion write');
    if (direct.keyNpcDeath !== undefined || direct.key_npc_death !== undefined) directAttempts.push('direct key NPC death write');
    if (directAttempts.length > 0) {
      const s = useStore.getState() as any;
      s.recordEndingPressureAction?.(directAttempts.join(', '), 'AI 不能直接写入正式终局、尊者击杀、十转或永生定论。');
      const anchorId = s.storyAnchorState?.currentAnchorId || s.flags?.currentCanonAnchorId || s.currentChapterId || 'unknown_anchor';
      s.recordCanonAnchorPressureAction?.({
        anchorId,
        pressure: 100,
        reason: 'AI 不能直接写入宿命状态、正史结果、关键 NPC 生死、尊者击杀或正式结局。',
        attemptedMutation: directAttempts.join(', '),
        engineDecision: 'block',
        fallbackNarrativeHint: '改写为候选或压力记录，等待本地引擎结算。',
      });
    }
  }
  if ((update as any).story_event_candidates?.add && Array.isArray((update as any).story_event_candidates.add)) {
    const s = useStore.getState() as any;
    for (const candidate of (update as any).story_event_candidates.add) {
      if (!candidate?.title || !candidate?.summary) continue;
      s.resolveStoryEventCandidateAction?.(candidate);
    }
  }

  if ((update as any).if_branch_candidates?.add && Array.isArray((update as any).if_branch_candidates.add)) {
    const s = useStore.getState() as any;
    for (const candidate of (update as any).if_branch_candidates.add) {
      if (!candidate?.anchorId || !candidate?.axis) continue;
      s.resolveIfBranchCandidateAction?.(candidate);
    }
  }

  if ((update as any).canon_anchor_pressure?.add && Array.isArray((update as any).canon_anchor_pressure.add)) {
    const s = useStore.getState() as any;
    for (const pressure of (update as any).canon_anchor_pressure.add) {
      if (!pressure?.anchorId || !pressure?.attemptedMutation) continue;
      s.recordCanonAnchorPressureAction?.(pressure);
    }
  }

  // v0.7.0-pre M9: AI location names are rumors until verified.
  const rumorLocationUpdates =
    (Array.isArray((update as any).map?.rumors) && (update as any).map.rumors) ||
    (Array.isArray((update as any).locations?.rumors) && (update as any).locations.rumors) ||
    [];
  if (rumorLocationUpdates.length > 0) {
    const store2 = useStore.getState() as any;
    for (const loc of rumorLocationUpdates) {
      const region = loc.region || store2.currentDomain || store2.playerPosition?.region || '未知区域';
      const id = loc.id || `rumor_${region}_${loc.name || 'unknown'}_${store2.turn || 1}`;
      store2.addRumorLocation?.({
        id,
        name: loc.name || '未核验地点',
        region,
        x: typeof loc.x === 'number' ? loc.x : 0.5,
        y: typeof loc.y === 'number' ? loc.y : 0.5,
        discovered: false,
        type: loc.type || 'rumor',
        description: loc.description || loc.note || 'AI 回传的未核验地点，需亲自抵达、任务验证或审核后才成为已知地点。',
        dangerLevel: loc.dangerLevel || 'medium',
        facilities: Array.isArray(loc.facilities) ? loc.facilities : [],
        relatedFactions: Array.isArray(loc.relatedFactions) ? loc.relatedFactions : [],
        resourceHints: Array.isArray(loc.resourceHints) ? loc.resourceHints : [],
        source: 'ai_rumor',
        credibility: typeof loc.credibility === 'number' ? loc.credibility : 35,
        isRumor: true,
        actions: Array.isArray(loc.actions) ? loc.actions : ['打听消息', '前往核验'],
      });
      store2.addGameLog?.('map', `新增传闻地点：${loc.name || id}`, { id, region, source: 'ai_rumor' });
    }
  }

  // ═══ v1.7: 杀招学习 — 事件/NPC传授路径接口预留 ═══
  if ((update as any).kill_move?.learn && Array.isArray((update as any).kill_move.learn)) {
    const storeRef = useStore.getState() as any;
    if (typeof storeRef.learnKillMove === 'function') {
      for (const moveName of (update as any).kill_move.learn) {
        const existingCheck = storeRef.killMoves?.find((km: any) => km.name === moveName);
        if (!existingCheck) {
          storeRef.learnKillMove({
            id: `learned_${moveName}_${Date.now()}`,
            name: moveName,
            path: '通用',
            level: 1,
            baseCost: 10,
            multiplier: 1.5,
            cooldown: 4,
            description: `习得杀招: ${moveName}`,
          });
        }
      }
    }
  }

  // ─── 势力好感度更新 ───
  if (update.faction) {
    const logStore = useStore.getState() as any;
    for (const [factionId, data] of Object.entries(update.faction)) {
      store.updateStanding(factionId, data.standing);
      // ═══ 日志埋点: 势力声望变更
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('npc', `势力声望变更: ${factionId} ${data.standing > 0 ? '+' : ''}${data.standing}`, {
          factionId, delta: data.standing,
        });
      }
    }
  }

  // ═══ P2-13 + P4: 六转升仙触发洞天/福地初始化 + 仙窍存储迁移 ═══
  // v0.8.0-b2: 叙事 state_update 不再负责升仙/福地初始化。
  // 跨境界与六转质变已在上方 sanitizePlayerUpdateForCultivation 降级，
  // 正式结算必须走 cultivationSlice.attemptAscension() 的本地引擎轨迹。
  // v0.8.0-b2: AI state_update may no longer initialize immortal aperture or blessed land here.
  // Cross-realm cultivation, ascension, and calamity outcomes must enter via cultivationSlice local actions.

  // ═══ v0.7.0 P2: 动态NPC处理 — AI叙事生成的"路人甲"NPC ═══
  if (update.dynamic_npcs) {
    const dn = update.dynamic_npcs;
    const s = useStore.getState() as any;

    // 处理新增NPC
    if (dn.add && Array.isArray(dn.add)) {
      let counter = 0;
      for (const payload of dn.add) {
        counter++;
        const npcId = `npc_dynamic_${store.messages.length}_${counter}_${Date.now()}`;
        const currentTurn = (s as any).turn || store.messages.length;

        // 检查是否已有同名NPC（去重）
        const existingByName = Object.values(s.dynamicNPCs || {}).find(
          (n: any) => n.name === payload.name
        );
        if (existingByName) {
          // 已存在同名NPC，仅更新好感度
          if (typeof s.updateDynamicNPCAffinity === 'function') {
            s.updateDynamicNPCAffinity((existingByName as any).id, 5);
          }
          continue;
        }

        const newNpc = {
          id: npcId,
          name: payload.name,
          path: payload.path || '通用',
          realm: Math.min(2, Math.max(1, payload.realm || 1)), // 限制1-2转
          realm_label: `${payload.realm || 1}转初阶`,
          personality: payload.personality || '未知',
          domain: s.currentDomain || '南疆',
          description: payload.bonding_hint || `一位名叫${payload.name}的蛊师`,
          affinity: 10, // 初始好感度（正面初见）
          interaction_count: 1,
          battle_count: 0,
          plot_participation: 5,
          recruit_eligible: false, // 好感度<60不可招募
          created_at: currentTurn,
          updated_at: currentTurn,
          hp: 80 + (payload.realm || 1) * 20,
          maxHp: 80 + (payload.realm || 1) * 20,
          atk: 10 + (payload.realm || 1) * 5,
          def: 5 + (payload.realm || 1) * 3,
        };

        if (typeof s.upsertDynamicNPC === 'function') {
          s.upsertDynamicNPC(newNpc);
        }
      }

      // 日志记录
      if (typeof s.addGameLog === 'function' && counter > 0) {
        s.addGameLog('npc', `AI生成${counter}个新路人NPC`, { names: dn.add.map((p: any) => p.name) });
      }
    }

    // 处理好感度变化
    if (dn.affinity_delta && Array.isArray(dn.affinity_delta)) {
      for (const ad of dn.affinity_delta) {
        // 按名称查找NPC
        const existingByName = Object.values(s.dynamicNPCs || {}).find(
          (n: any) => n.name === ad.name
        );
        if (existingByName && typeof s.updateDynamicNPCAffinity === 'function') {
          s.updateDynamicNPCAffinity((existingByName as any).id, ad.delta || 0);
        }
      }
    }
  }

  // ─── v0.7.0-pre M11: NPC contact 进入人物图鉴（已闻/已见/已交互）───
  if ((update as any).npc_contacts?.add && Array.isArray((update as any).npc_contacts.add)) {
    const s = useStore.getState() as any;
    for (const contact of (update as any).npc_contacts.add) {
      if (!contact?.name) continue;
      s.addNpcContact?.({
        npcId: contact.npcId,
        name: contact.name,
        source: contact.source || 'ai_rumor',
        status: contact.status || 'seen',
        location: contact.location || s.playerPosition?.region || s.currentDomain,
        summary: contact.summary || '剧情中出现过的人物，尚未建立正式关系。',
      });
      s.addGameLog?.('npc', `人物图鉴新增线索：${contact.name}`, {
        summary: `${contact.name} · ${contact.status || '已见'}`,
        detail: contact.summary || '剧情中出现过的人物，尚未建立正式关系。',
        location: contact.location || s.currentDomain,
        actors: [contact.name],
        importance: 2,
      });
    }
  }

  // ─── v0.7.0-pre M14: 事件政策真实接入，道心/声望/四维由引擎校验后写入 ───
  const eventPolicy = (update as any).event_policy;
  if (eventPolicy?.kind) {
    const s = useStore.getState() as any;
    const kind = eventPolicy.kind as NarrativeEventKind;
    try {
      const daoPolicy = getDaoHeartEventPolicy(kind);
      if (daoPolicy) {
        const prev = s.daoHeart || { kill: 0, mercy: 0, scheme: 0, ambition: 0 };
        useStore.setState({ daoHeart: applyDaoHeartEvent(prev, daoPolicy) } as any);
      }
      const repPolicy = getReputationEventPolicy(kind);
      const factionId = eventPolicy.factionId || eventPolicy.faction_id;
      if (repPolicy && factionId && typeof s.updateStanding === 'function') {
        const alignment = eventPolicy.alignment || 'merchant';
        const delta = alignment === 'righteous'
          ? repPolicy.righteousDelta
          : alignment === 'demonic'
            ? repPolicy.demonicDelta
            : repPolicy.merchantDelta;
        s.updateStanding(factionId, delta, eventPolicy.reason || repPolicy.defaultReason);
      }
      s.addGameLog?.('system', `事件政策结算：${kind}`, {
        summary: eventPolicy.reason || daoPolicy?.defaultReason || `事件政策：${kind}`,
        detail: eventPolicy.note || eventPolicy.reason || '道心与势力声望已按事件政策结算。',
        actors: Array.isArray(eventPolicy.actors) ? eventPolicy.actors : undefined,
        importance: 2,
      });
    } catch (err) {
      s.addGameLog?.('pipeline', `事件政策拒绝：${String(eventPolicy.kind)}`, {
        summary: '事件政策字段未通过引擎校验',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const attributeMutations = Array.isArray((update as any).attribute_mutations?.add)
    ? (update as any).attribute_mutations.add
    : [];
  if (attributeMutations.length > 0) {
    const s = useStore.getState() as any;
    for (const mutation of attributeMutations) {
      try {
        const policy = getAttributeMutationPolicy(mutation.source as AttributeMutationSource);
        if (!policy) continue;
        const verdict = canApplyAttributeMutation(policy, {
          realmGrand: s.profile?.realm?.grand || 1,
          targetScope: mutation.targetScope || 'self',
          sceneValidated: mutation.sceneValidated === true,
        });
        if (!verdict.ok) {
          s.addGameLog?.('pipeline', `四维变更拒绝：${mutation.source}`, { summary: verdict.reason || '不符合四维变更规则', mutation });
          continue;
        }
        if (mutation.targetScope && mutation.targetScope !== 'self') {
          s.addGameLog?.('pipeline', `四维变更暂存线索：${mutation.source}`, {
            summary: 'NPC/队友四维变更需后续小队系统接入',
            mutation,
          });
          continue;
        }
        const delta = Math.max(-policy.maxDelta, Math.min(policy.maxDelta, Number(mutation.delta || policy.maxDelta)));
        s.addAttribute?.(policy.attribute, delta);
        s.addGameLog?.('system', `四维变更：${policy.attribute}${delta > 0 ? '+' : ''}${delta}`, {
          summary: `${policy.attribute}${delta > 0 ? '+' : ''}${delta}`,
          detail: mutation.reason || policy.notes,
          importance: 3,
        });
      } catch (err) {
        s.addGameLog?.('pipeline', `四维变更异常：${mutation?.source || 'unknown'}`, {
          summary: err instanceof Error ? err.message : String(err),
          mutation,
        });
      }
    }
  }

  // ─── 因果更新 ───
  if (update.causality) {
    if (update.causality.track) {
      store.trackEffect({
        id: `cause_${Date.now()}`,
        cause: update.causality.track,
        consequence: '',
        affected_npcs: [],
        severity: 1,
        timestamp: Date.now(),
      });
    }
    if (update.causality.butterfly_effects) {
      for (const effect of update.causality.butterfly_effects) {
        store.trackEffect({
          id: `bf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          cause: '蝴蝶效应',
          consequence: effect,
          affected_npcs: [],
          severity: 2,
          timestamp: Date.now(),
        });
      }
    }
  }

  // ─── 道痕更新（顶层 dao_marks / path_levels，passthrough兜底） ───
  if ((update as any).dao_marks) {
    const dm = (update as any).dao_marks as Record<string, number>;
    const store2 = useStore.getState() as any;
    for (const [path, delta] of Object.entries(dm)) {
      if (typeof store2.addDaoMarks === 'function') {
        store2.addDaoMarks(path, delta);
      }
    }
  }
  if ((update as any).path_levels) {
    const pl = (update as any).path_levels as Record<string, string>;
    const store2 = useStore.getState() as any;
    const currentBuild = store2.pathBuild || {};
    const currentLevels = { ...currentBuild.path_levels };
    for (const [path, level] of Object.entries(pl)) {
      currentLevels[path] = level;
    }
    useStore.setState({
      pathBuild: { ...currentBuild, path_levels: currentLevels },
    });
  }

  // ─── P2-4b: 战斗结果回写 ───
  if ((update as any).combat_result) {
    const cr = (update as any).combat_result;
    const s = useStore.getState() as any;
    if (cr.hp_delta && typeof s.applyHpDelta === 'function') {
      s.applyHpDelta(cr.hp_delta);
    }
    // ═══ v0.7.0: 战利品仅处理蛊材类（蛊虫100%销毁，不再作为战利品） ═══
    if (cr.loot && Array.isArray(cr.loot) && cr.loot.length > 0) {
      // 蛊材类物品自动兑换元石（name包含蛊材类型关键词的材料）
      const materialKeywords = ['牙','皮','骨','粉','石','草','液','晶','水','土','木','铁','金','血','丝','页','瓶','块','卷','板','盒'];
      let yuanStoneGain = 0;
      for (const item of cr.loot) {
        const itemName = (item.name || '').toString();
        if (materialKeywords.some(kw => itemName.includes(kw)) && !itemName.includes('蛊')) {
          yuanStoneGain += item.price || (item.tier ? item.tier * 5 : 5);
        }
      }
      if (yuanStoneGain > 0) {
        if (typeof s.addYuanStone === 'function') s.addYuanStone(yuanStoneGain, '战斗战利品兑换');
        else if (typeof s.addCurrency === 'function') s.addCurrency(yuanStoneGain);
      }
    }
    if (cr.injury && typeof s.applyInjury === 'function') {
      s.applyInjury(cr.injury);
    }
  }
}

// ═══ P4.2: 遭遇奖励程序化发放 ═══

export function applyEncounterRewards(rewards: EncounterReward): string[] {
  const s = useStore.getState() as any;
  const messages: string[] = [];

  // 元石奖励
  if (rewards.currency) {
    const [min, max] = rewards.currency;
    const amount = Math.floor(min + Math.random() * (max - min + 1));
    if (amount > 0) {
      if (typeof s.addCurrency === 'function') s.addCurrency(amount);
      messages.push(`元石 +${amount}`);
    }
  }

  // 材料奖励 — P4: 对齐 shop-items.json 混合产出（通用蛊材+具体材料）
  if (rewards.materials) {
    const { common, uncommon, rare, count } = rewards.materials;
    const grades: string[] = [];
    // P4: 通用蛊材（保留原有产出逻辑）
    if (common) for (let i = 0; i < (common[1] ? Math.floor(common[0] + Math.random() * (common[1] - common[0] + 1)) : common[0]); i++) grades.push('普通蛊材');
    if (uncommon) for (let i = 0; i < (uncommon[1] ? Math.floor(uncommon[0] + Math.random() * (uncommon[1] - uncommon[0] + 1)) : uncommon[0]); i++) grades.push('精品蛊材');
    if (rare) for (let i = 0; i < (rare[1] ? Math.floor(rare[0] + Math.random() * (rare[1] - rare[0] + 1)) : rare[0]); i++) grades.push('稀有蛊材');
    for (const g of grades) {
      if (typeof s.addMaterial === 'function') s.addMaterial(g, 1);
    }
    // P4: 具体材料随机掉落（从 shop-items.json 材料池中概率产出，对齐混合方案）
    if (Math.random() < 0.4 && grades.length > 0) {
      const shopMaterials = ['月华草','石粉','铁屑','新鲜兽肉','草木精华液','特制木炭','金粉','美酒','山泉水','风之精华','毒物样本','新鲜血液瓶','冰晶核心','愈合草药包','兽骨','蚕丝卷'];
      const randomMat = shopMaterials[Math.floor(Math.random() * shopMaterials.length)];
      if (typeof s.addMaterial === 'function') s.addMaterial(randomMat, 1);
    }
    if (grades.length) messages.push(`蛊材 +${grades.length}份`);
  }

  // 蛊虫奖励
  if (rewards.gu && Math.random() < rewards.gu.chance) {
    // 随机蛊虫逻辑简化
    messages.push('发现了一只蛊虫');
  }

  // 势力声望
  if (rewards.factionStanding) {
    for (const [fid, [min, max]] of Object.entries(rewards.factionStanding)) {
      const delta = Math.floor(min + Math.random() * (max - min + 1));
      if (delta !== 0 && typeof s.updateStanding === 'function') s.updateStanding(fid, delta);
    }
  }

  // 杀招残卷 B2.5a
  if (rewards.killMoveFragment && Math.random() < rewards.killMoveFragment.chance) {
    const [minTier, maxTier] = rewards.killMoveFragment.tierRange;
    messages.push(`发现了杀招残卷（${minTier}-${maxTier}转）`);
    // 延迟处理：由 response-pipeline 调用 learnKillMove
  }

  return messages;
}
