import { useStore } from '../store';
import type { StateUpdate, ButterflyEffect } from '../types';
import type { EncounterReward } from '../types/encounter';
import { evaluateApertureGrade } from '../store/slices/immortalSlice';
import { applyDaoHeartEvent, getDaoHeartEventPolicy, getReputationEventPolicy, type NarrativeEventKind } from './dao-reputation-policy';
import { canApplyAttributeMutation, getAttributeMutationPolicy, type AttributeMutationSource } from './attribute-mutation-policy';
import { getGuUseEntry, resolveSceneGatedGuUseSuggestion, type GuUseTarget } from './gu-use-registry';
import economyRaw from '../canon/economy.json';
import chaptersRaw from '../canon/chapters.json';

const economyData = economyRaw as Record<string, any>;
const chaptersData = chaptersRaw as any;

// ─── 全局自增计数器 ───
let guIdCounter = 1000;

function nextGuId(): string {
  return `gu_${++guIdCounter}_${Date.now()}`;
}

// ─── 境界标签映射 ───
const REALM_LABEL_MAP: Record<string, { grand: number; sub: string; label: string }> = {
  '一转初阶': { grand: 1, sub: '初阶', label: '一转初阶' },
  '一转中阶': { grand: 1, sub: '中阶', label: '一转中阶' },
  '一转高阶': { grand: 1, sub: '高阶', label: '一转高阶' },
  '一转巅峰': { grand: 1, sub: '巅峰', label: '一转巅峰' },
  '二转初阶': { grand: 2, sub: '初阶', label: '二转初阶' },
  '二转中阶': { grand: 2, sub: '中阶', label: '二转中阶' },
  '二转高阶': { grand: 2, sub: '高阶', label: '二转高阶' },
  '二转巅峰': { grand: 2, sub: '巅峰', label: '二转巅峰' },
  '三转初阶': { grand: 3, sub: '初阶', label: '三转初阶' },
  '三转中阶': { grand: 3, sub: '中阶', label: '三转中阶' },
  '三转高阶': { grand: 3, sub: '高阶', label: '三转高阶' },
  '三转巅峰': { grand: 3, sub: '巅峰', label: '三转巅峰' },
  '四转初阶': { grand: 4, sub: '初阶', label: '四转初阶' },
  '四转中阶': { grand: 4, sub: '中阶', label: '四转中阶' },
  '四转高阶': { grand: 4, sub: '高阶', label: '四转高阶' },
  '四转巅峰': { grand: 4, sub: '巅峰', label: '四转巅峰' },
  '五转初阶': { grand: 5, sub: '初阶', label: '五转初阶' },
  '五转中阶': { grand: 5, sub: '中阶', label: '五转中阶' },
  '五转高阶': { grand: 5, sub: '高阶', label: '五转高阶' },
  '五转巅峰': { grand: 5, sub: '巅峰', label: '五转巅峰' },
};

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
    const p = update.player;
    // 直接调用 playerSlice 的方法
    if (typeof (store as any).applyStateUpdate === 'function') {
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
        if (qty > 0) store2.addMaterial(matName, qty);
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
  if (update.player?.realm) {
    const realmValue = update.player.realm.value;
    const realmNum = parseInt(realmValue) || 0;
    if (realmNum >= 6) {
      const currentStore = useStore.getState() as any;
      if (!currentStore.heavenlyLand) {
        const currentDomain = currentStore.currentDomain || '南疆';

        // P4: 方案A — 根据蛊师阶段积累评定福地等级
        const daoMarksTotal = Object.values(currentStore.pathBuild?.dao_marks || {}).reduce((a: number, b: number) => a + b, 0);
        const guRefinedCount = (currentStore.inventory || []).length;
        const famousScenesCompleted = Object.values(currentStore.flags?.completedFamousScenes || {}).filter(Boolean).length;
        const killerMovesKnown = (currentStore.killMoves || []).length;
        const talentLevel = currentStore.attributes?.资质 || 5;

        const evalResult = evaluateApertureGrade(daoMarksTotal, guRefinedCount, famousScenesCompleted, killerMovesKnown, talentLevel);

        const areaMu = evalResult.areaRange[0] + Math.floor(Math.random() * (evalResult.areaRange[1] - evalResult.areaRange[0]));
        const flowRatio = evalResult.flowRange[0] + Math.floor(Math.random() * (evalResult.flowRange[1] - evalResult.flowRange[0]));
        const nodeCount = evalResult.nodeRange[0] + Math.floor(Math.random() * (evalResult.nodeRange[1] - evalResult.nodeRange[0]));

        const landType = evalResult.grade === '上等福地' ? (Math.random() < 0.5 ? '洞天' : '福地') : '福地';
        const now = Date.now();
        useStore.setState({
          heavenlyLand: {
            id: `land_${now}`,
            type: landType,
            domain: currentDomain,
            name: `${currentDomain}${landType}`,
            areaMu,
            timeFlowRatio: flowRatio,
            resourceOutputRate: realmNum * 5,
            earthSpirit: { formed: false, approval: 0 },
            disasterCountdown: 60 + Math.floor(Math.random() * 40),
            nextDisasterType: ['地火', '天水', '风灾', '雷劫'][Math.floor(Math.random() * 4)],
            createdAt: currentStore.turn || 1,
            accessible: true,
          },
        });
        // ═══ 日志埋点: 六转升仙
        if (typeof currentStore.addGameLog === 'function') {
          currentStore.addGameLog('system', `升仙成功! 开辟${evalResult.grade}(${landType}): ${areaMu}亩 / 流速1:${flowRatio}`, {
            grade: evalResult.grade, landType, areaMu, flowRatio, domain: currentDomain,
          });
        }
        // ═══ P4: 仙窍存储迁移 — 空窍蛊虫/蛊材全部迁入仙窍无限存储 ═══
        if (typeof currentStore.migrateToApertureStorage === 'function') {
          currentStore.migrateToApertureStorage();
        }
        // ═══ v0.6.0: 元石→仙元迁移 (1000:1) ═══
        const mortalCurrency = currentStore.currency || 0;
        if (mortalCurrency > 0) {
          const immortalBonus = Math.floor(mortalCurrency / 1000);
          const currentImmortal = currentStore.immortalCurrency || 0;
          useStore.setState({ currency: 0, immortalCurrency: currentImmortal + immortalBonus } as any);
          if (typeof currentStore.addGameLog === 'function') {
            currentStore.addGameLog('system', `凡尘财富化为仙途底蕴——${mortalCurrency}元石兑换为${immortalBonus}仙元石`, { mortalCurrency, immortalBonus });
          }
        }
        // ═══ 空窍→仙窍替换 + 生成初始资源节点 ═══
        const currentAperture = currentStore.aperture;
        const shouldReplace = !currentAperture || currentAperture.type === 'mortal';
        if (shouldReplace) {
          // P4: 生成初始资源节点
          const nodeTypes = ['月华草', '铁屑', '金粉', '冰晶核心', '雷击石', '金刚石粉', '空间晶石', '灾劫灰烬', '光阴砂', '道痕结晶'];
          const nodeGrades: Record<string, string> = {
            '月华草': '普通', '铁屑': '普通', '金粉': '精品', '冰晶核心': '精品',
            '雷击石': '精品', '金刚石粉': '稀有', '空间晶石': '仙材', '灾劫灰烬': '仙材',
            '光阴砂': '仙材', '道痕结晶': '仙材',
          };
          const initialNodes = [];
          for (let i = 0; i < Math.min(nodeCount, nodeTypes.length); i++) {
            const nodeName = nodeTypes[i];
            initialNodes.push({
              id: `node_${Date.now()}_${i}`,
              type: nodeName,
              name: nodeName,
              output_rate: 1 + Math.floor(Math.random() * 3),
              quality: 50 + Math.floor(Math.random() * 50),
              grade: (nodeGrades[nodeName] || '普通') as '普通' | '精品' | '稀有' | '仙材',
              active: true,
            });
          }
          currentStore.initializeAperture?.({
            type: landType,
            grade: evalResult.grade,
            area_mu: areaMu,
            time_flow_ratio: flowRatio,
            resource_nodes: initialNodes,
            dao_mark_density: {},
            next_disaster_type: '地火',
            disaster_countdown: 60 + Math.floor(Math.random() * 40),
          });
          // ═══ v0.7.0: 十绝体类型升仙传递 — 设计大纲§5.2 ═══
          const oldAperture = currentStore.aperture;
          if (oldAperture?.extremePhysiqueType) {
            // 将十绝体类型传递到仙窍阶段
            currentStore.setFlag?.('ascendedExtremePhysiqueType', oldAperture.extremePhysiqueType);
            if (typeof currentStore.addGameLog === 'function') {
              currentStore.addGameLog('system', `十绝体「${oldAperture.extremePhysiqueType}」升仙! 高压迫槽位解除，仙窍无限容量。`);
            }
          }
        }
      }
    }
  }

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
