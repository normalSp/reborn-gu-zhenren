import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { useShallow } from 'zustand/shallow';
import { INITIAL_TALENTS, TIER_COLORS, TIER_LABELS, TALENT_COST } from '../../data/talents';
import { P4_TALENTS, P4_TALENT_COST, getTalentsByCategory } from '../../data/talents-p4';
import { deriveCombatStats, extractTalentModifiers } from '../../engine/combat-stats';
import guDbRaw from '../../canon/gu-database.json';
import factionDbRaw from '../../canon/faction-data.json';
import { computePathLevel } from '../../engine/path-progression';
import type { Talent, MortalAperture, ImmortalAperture } from '../../types';

const GU_DB = guDbRaw as Record<string, any>;
const FACTION_DB = factionDbRaw as Record<string, any>;

interface CharacterCreateProps {
  onConfirm: () => void;
  /** v1.6: 可选返回按钮，timeline模式回timeline_config */
  onBack?: () => void;
}

// ─── 骰子随机生成属性 ───
function rollAttribute(): number {
  // 1-10，但概率偏向4-7（现实中大多数人的资质在中等范围）
  const roll = Math.random() * 10;
  // 4-7概率最高（40%），极端值概率低
  if (roll < 0.5) return 1;       // 5%
  if (roll < 1.0) return 2;       // 5%
  if (roll < 1.6) return 3;       // 6%
  if (roll < 2.6) return 4;       // 10%
  if (roll < 4.1) return 5;       // 15%
  if (roll < 6.1) return 6;       // 20%
  if (roll < 7.6) return 7;       // 15%
  if (roll < 8.6) return 8;       // 10%
  if (roll < 9.5) return 9;       // 9%
  return 10;                       // 5%
}

function rollAllAttributes(): { 资质: number; 体魄: number; 心智: number; 气运: number } {
  const 资质 = rollAttribute();
  // 十绝体：资质=10时，其余属性保底≥8（全属性极致）
  if (资质 === 10) {
    const rollHigh = () => {
      const r = Math.random() * 10;
      if (r < 8.5) return 8;  // 15%
      if (r < 9.2) return 9;  // 7%
      return 10;               // 8%
    };
    return { 资质: 10, 体魄: rollHigh(), 心智: rollHigh(), 气运: rollHigh() };
  }
  return {
    资质,
    体魄: rollAttribute(),
    心智: rollAttribute(),
    气运: rollAttribute(),
  };
}

// ─── 属性分级显示 ───
// 原著：甲等-丁等仅用于评价空窍真元容量（资质），体魄/心智/气运不使用
function attrGrade(value: number, attrName: string): { label: string; color: string } {
  if (attrName !== '资质') return { label: '', color: 'text-rg-paper-100' };
  if (value >= 9) return { label: '甲等', color: 'text-rg-gold' };
  if (value >= 7) return { label: '乙等', color: 'text-rg-jade-400' };
  if (value >= 5) return { label: '丙等', color: 'text-rg-paper-200' };
  return { label: '丁等', color: 'text-rg-paper-200/50' };
}

// ─── 确定性伪随机（种子shuffle用） ───
function seedRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}

// ─── 计算时间线起点的初始属性（基于境界，可手动重掷） ───
function timelineBaseAttributes(realmGrand: number): { 资质: number; 体魄: number; 心智: number; 气运: number } {
  const baseAttr = Math.min(10, 3 + realmGrand);
  return { 资质: baseAttr, 体魄: baseAttr, 心智: baseAttr, 气运: baseAttr };
}

export function CharacterCreate({ onConfirm, onBack }: CharacterCreateProps) {
  // ═══ P4: 时间线配置检测 (v1.4修复: 只选primitive值避免无限循环) ═══
  const timelineNodeId = useStore(s => (s as any).selectedNodeId as string | null);
  const timelineNode = useMemo(() => {
    if (!timelineNodeId) return null;
    return (useStore.getState() as any).selectedNode ?? null;
  }, [timelineNodeId]);
  const isTimelineStart = timelineNode != null;

  // ═══ v1.5: 时间线起点使用基于境界的初始属性，但仍允许手动掷骰 ═══
  const initialAttrs = useMemo(() => {
    if (timelineNode) return timelineBaseAttributes(timelineNode.startingRealm.grand);
    return rollAllAttributes();
  }, [timelineNode]);

  // ═══ v1.5: 时间线起点预填充P4已在TimelineConfig选好的天赋 ═══
  // P1修复: 直接通过 useStore 订阅 timelineTalents，避免 useMemo 依赖链断裂
  // 原依赖 [timelineNode] 不包含 timelineTalents，变化时 memo 不重算
  const timelineTalents = useStore(useShallow((s: any) => s.timelineTalents as string[]));
  const initialTalents = useMemo(() => {
    if (!timelineNode) return [] as Talent[];
    if (timelineTalents.length === 0) return [];
    const p4Pool = getTalentsByCategory(timelineNode.talentCategory);
    return timelineTalents
      .map((id: string) => p4Pool.find(t => t.id === id))
      .filter(Boolean) as Talent[];
  }, [timelineNode, timelineTalents]);

  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState(initialAttrs);
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>(initialTalents);
  const [poolIndex, setPoolIndex] = useState(0);
  const [rerollCount, setRerollCount] = useState(0);
  const rerollRemaining = Math.max(0, 3 - rerollCount);

  // ═══ useEffect 同步（App.tsx 一次性渲染全部Screen，useState 初始值在首次挂载时捕获空数组） ═══
  useEffect(() => {
    if (isTimelineStart && initialTalents.length > 0 && selectedTalents.length === 0) {
      setSelectedTalents(initialTalents);
    }
  }, [isTimelineStart, initialTalents, selectedTalents.length]);

  // ─── 天赋点数计算（5B: /5 而非 /6） + v0.6.0修复: 势力天赋加成 ───
  const isTenUltimate = attributes.资质 === 10;
  const timelineConfig = useStore(useShallow((s: any) => s.getTimelineConfig?.()));
  const factionTalentBonus = useMemo(() => {
    const fid = timelineConfig?.factionId || (useStore.getState() as any).flags?._origin || '';
    const faction = FACTION_DB._factions?.[fid] || Object.values(FACTION_DB._factions || {}).find((f: any) => f.id === fid);
    return (faction as any)?.bonus?.talentBonus ?? 0;
  }, [timelineConfig?.factionId]);
  const talentPoints = useMemo(() => {
    const total = attributes.资质 + attributes.体魄 + attributes.心智 + attributes.气运;
    const divisor = isTenUltimate ? 8 : 5;
    return Math.floor(total / divisor) + factionTalentBonus;
  }, [attributes, isTenUltimate, factionTalentBonus]);

  // ─── v1.5: 时间线模式用P4分层天赋池，普通模式用旧池 ───
  const talentSourcePool = useMemo(() => {
    if (timelineNode) return getTalentsByCategory(timelineNode.talentCategory) as Talent[];
    return INITIAL_TALENTS;
  }, [timelineNode]);

  // 随机12条天赋池（保留已选天赋在列表中）
  const shuffledPool = useMemo(() => {
    const rng = seedRand(attributes.资质 * 100 + attributes.体魄 * 10 + poolIndex);
    const sorted = [...talentSourcePool].sort(() => rng() - 0.5);
    const needShow = sorted.filter(t => selectedTalents.some(s => s.id === t.id));
    const rest = sorted.filter(t => !selectedTalents.some(s => s.id === t.id));
    return [...needShow, ...rest.slice(0, 12)];
  }, [attributes, poolIndex, selectedTalents, talentSourcePool]);

  // 已消费点数 — v1.5: 时间线模式用P4_TALENT_COST
  const spentPoints = selectedTalents.reduce((sum, t) => {
    const cost = isTimelineStart
      ? ((P4_TALENTS.find(pt => pt.id === t.id) as any) ? (P4_TALENT_COST[(t as any).tier] || 1) : (TALENT_COST[t.tier] || 1))
      : (TALENT_COST[t.tier] || 1);
    return sum + cost;
  }, 0);
  const remainingPoints = talentPoints - spentPoints;

  // ─── v1.5: 时间线模式优先用节点domain作为出身域 ───
  const background = useMemo(() => {
    if (timelineNode) return timelineNode.domain;
    return (useStore.getState() as any).flags?._origin || '南疆';
  }, [timelineNode]);
  const identity = useMemo(() => {
    if (timelineNode) return timelineNode.talentCategory === 'immortal' ? '蛊仙' : '蛊师';
    return (useStore.getState() as any).flags?._identity || '蛊师学徒';
  }, [timelineNode]);

  // toggle 天赋选中 — v1.5: 时间线模式用P4_TALENT_COST
  const toggleTalent = (talent: Talent) => {
    setSelectedTalents(prev => {
      const exists = prev.find(t => t.id === talent.id);
      if (exists) return prev.filter(t => t.id !== talent.id);
      const cost = isTimelineStart
        ? (P4_TALENT_COST[(talent as any).tier] || 1)
        : (TALENT_COST[talent.tier] || 1);
      if (remainingPoints >= cost) return [...prev, talent];
      return prev;
    });
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    // ═══ P4: 获取时间线配置（如有） ═══
    const tc = (useStore.getState() as any).getTimelineConfig?.() ?? null;
    const tNode = tc?.node;

    // ═══ v1.7: 势力属性加成 → 必须在 deriveCombatStats 前注入 ═══
    const effectiveAttributes = { ...attributes };
    if (tNode && tc?.factionBonus?.attributeBonus) {
      for (const [attrName, delta] of Object.entries(tc.factionBonus.attributeBonus)) {
        if (attrName === '资质' || attrName === '体魄' || attrName === '心智' || attrName === '气运') {
          effectiveAttributes[attrName] = Math.max(0, Math.min(10, effectiveAttributes[attrName] + delta));
        }
      }
    }

    // 完全重置旧存档
    const fullState = useStore.getState();
    (fullState as any).resetStore?.();
    // v1.5: timeline模式下出身域来自节点domain，普通模式来自OriginSelect
    const origin = tNode?.domain || background;
    const playerIdentity = tNode ? (tNode.talentCategory === 'immortal' ? '蛊仙' : '蛊师') : identity;
    useStore.getState().setFlag('_origin', origin);
    useStore.getState().setFlag('_identity', playerIdentity);
    useStore.getState().setFlag('_profile_init', true);

    // 境界：使用时间线预设或默认一转
    const startRealm = tNode?.startingRealm ?? { grand: 1, sub: '初阶' };
    const realmLabel = `${startRealm.grand}转${startRealm.sub}`;

    useStore.setState({
      profile: {
        name,
        realm: { grand: startRealm.grand, sub: startRealm.sub, label: realmLabel },
        background: `${origin} · ${playerIdentity}`,
      },
      attributes: effectiveAttributes,
    });

    // ═══ v1.5: 货币 — 优先使用timeline配置，fallback到境界基础表 ═══
    const REALM_STARTING_CURRENCY: Record<number, { currency: number; immortalCurrency: number }> = {
      1: { currency: 200, immortalCurrency: 0 },
      2: { currency: 500, immortalCurrency: 0 },
      3: { currency: 1500, immortalCurrency: 0 },
      4: { currency: 5000, immortalCurrency: 0 },
      5: { currency: 20000, immortalCurrency: 0 },
      6: { currency: 0, immortalCurrency: 40000 },
      7: { currency: 0, immortalCurrency: 100000 },
      8: { currency: 0, immortalCurrency: 350000 },
      9: { currency: 0, immortalCurrency: 1000000 },
    };
    // timeline配置优先（TimelineConfig resource步骤可能已调整）
    const tcYuan = tc?.startingYuanStone;
    const startMoney = (tcYuan && tcYuan > 0)
      ? { currency: startRealm.grand <= 5 ? tcYuan : 0, immortalCurrency: startRealm.grand >= 6 ? tcYuan : 0 }
      : REALM_STARTING_CURRENCY[startRealm.grand] || REALM_STARTING_CURRENCY[1];
    if (startMoney.currency > 0) {
      (useStore.getState() as any).setCurrency?.(startMoney.currency);
    }
    if (startMoney.immortalCurrency > 0) {
      (useStore.getState() as any).setImmortalCurrency?.(startMoney.immortalCurrency);
    }

    // 天赋写入
    selectedTalents.forEach(t => useStore.getState().selectTalent(t));
    // ═══ P4数值修复: 战斗属性桥接 — 体魄/资质/境界→HP/ATK/DEF ═══
    const allModifiers = extractTalentModifiers(selectedTalents as any[]);
    const cStats = deriveCombatStats({
      physique: effectiveAttributes.体魄,
      aptitude: effectiveAttributes.资质,
      mind: effectiveAttributes.心智,
      realmGrand: startRealm.grand,
      talentModifiers: allModifiers,
    });
    (useStore.getState() as any).setCombatStats?.(cStats);

    // ═══ P4: 高转开局按流派自动解锁蛊方（用户选B方案：按流派解锁） ═══
    if (isTimelineStart && startRealm.grand >= 4) {
      const ALL_PATHS = ['光道','食道','智道','土道','木道','金道','力道','骨道','水道','风道','毒道','炎道','天道','人道','暗道','雷道','变化道','奴道','宇道','侦察','炼道','冰道','魂道','律道','梦道','太道','血道','音道','运道','宙道'];
      const pathsFromTalents = new Set<string>();
      for (const t of selectedTalents) {
        const text = `${t.name} ${(t as any).description || ''} ${((t as any).tags || []).join(' ')}`;
        for (const path of ALL_PATHS) {
          if (text.includes(path)) pathsFromTalents.add(path);
        }
      }
      if (pathsFromTalents.size > 0) {
        const store = useStore.getState() as any;
        const completed = { ...(store.flags?.completedRecipes || {}) };
        for (const [guName, gu] of Object.entries(GU_DB)) {
          if (gu.isImmortalGu) continue;
          const guTier = gu.tier || 1;
          if (guTier > startRealm.grand) continue;
          if (!gu.path || !pathsFromTalents.has(gu.path)) continue;
          if (!gu.refineCost && !gu.refineMaterials) continue;
          completed[guName] = true;
        }
        // 通过 setState 直接写入（此时 store 刚 reset，flags 尚未写入）
        const newFlags = { ...(store.flags || {}), completedRecipes: completed };
        useStore.setState((s: any) => ({ ...s, flags: newFlags }));
      }
    }

    // P4: 写入时间线配置flag
    if (tNode) {
      useStore.getState().setFlag('_timeline_start', tNode.id);
      useStore.getState().setFlag('_timeline_domain', tc.domain || tNode.domain);
    }

    // 域设置 — v1.5: timeline模式直接用节点domain
    const domainKeys = ['中洲', '南疆', '北原', '东海', '西漠'];
    const targetDomain = (tNode ? (tc.domain || tNode.domain) : null) || domainKeys.find(d => origin.includes(d)) || '南疆';
    useStore.setState({ currentDomain: targetDomain } as any);

    const movePlayer = (useStore.getState() as any).movePlayer;
    const revealRegion = (useStore.getState() as any).revealRegion;
    if (typeof movePlayer === 'function') movePlayer({ x: 0.5, y: 0.5, region: targetDomain });
    if (typeof revealRegion === 'function') revealRegion(targetDomain);

    // ═══ P4: 时间线起点→蛊仙空窍初始化 ═══
    if (tNode && tNode.needAperture) {
      const ac = tc.apertureConfig || { areaMu: 100, resourceNodes: 1, timeFlowRatio: 1.0, defenseLevel: 0 };
      const immortalAperture: ImmortalAperture = {
        type: 'immortal',
        area_mu: ac.areaMu,
        time_flow_ratio: ac.timeFlowRatio,
        resource_nodes: Array.from({ length: ac.resourceNodes }, (_, i) => ({
          type: '通用', quality: 1, output_rate: 1 + i, // Will be customized by path
        })),
        dao_mark_density: {},
        status: '稳定',
        disaster_timer: 0,
      };
      (useStore.getState() as any).initializeAperture?.(immortalAperture);
    } else {
      // 凡蛊空窍
      const getColorName = (zizhi: number): MortalAperture['primevalSea']['colorName'] => {
        if (zizhi >= 10) return '黄金';
        if (zizhi >= 7) return '白银';
        if (zizhi >= 4) return '赤铁';
        return '青铜';
      };
      const colorName = getColorName(effectiveAttributes.资质);
      const colorMap: Record<string, string> = {
        '青铜': '#4a8c5c', '赤铁': '#8c4a4a', '白银': '#8c8c9a', '黄金': '#c9a84a', '紫晶': '#7a4a9a',
      };
      const capacity = tNode?.baseCapacity ?? 3;
      const aperture: MortalAperture = {
        type: 'mortal',
        rank: startRealm.grand,
        subRank: startRealm.sub,
        primevalSea: {
          color: colorMap[colorName],
          colorName,
          fillPercent: Math.min(100, 50 + effectiveAttributes.资质 * 5 + (effectiveAttributes.资质 >= 7 ? 10 : 0) + (effectiveAttributes.资质 >= 9 ? 5 : 0)),
        },
        apertureWall: {
          state: '坚实',
          opacity: 1,
          description: '窍壁完整，真元流转自如',
        },
        capacity,
        carriedGu: 0,
      };
      (useStore.getState() as any).initializeMortalAperture?.(aperture);
    }

    // ═══ P4/v1.6: 时间线起点→本命蛊绑定（修复addGuToInventory→addGu） ═══
    if (tNode?.needLifeboundGu && tc?.lifeboundGu) {
      const lg = tc.lifeboundGu;
      const store = useStore.getState() as any;
      if (typeof store.addGu === 'function') {
        store.addGu({
          id: `lifebound_${lg.guName}`,
          specId: lg.guName,
          name: lg.guName,
          tier: lg.tier,
          path: lg.path,
          rank: lg.rarity,
          description: lg.description,
          currentState: 'optimal',
          hungerCounter: 0,
        });
      }
      store.setFlag('_lifebound_gu', lg.guName);
      // ═══ P0.5: 绑定本命蛊 — 调用 guSlice.bindLifeboundGu 激活本命蛊系统 ═══
      if (typeof store.bindLifeboundGu === 'function') {
        store.bindLifeboundGu(`lifebound_${lg.guName}`, 1);
      }
    }

    // ═══ v1.6: 势力写入 + 初始蛊虫 + 杀招 + 势力加成 ═══
    if (tNode && tc) {
      // 势力
      if (tc.factionId) {
        useStore.getState().setFlag('_faction', tc.factionId);
        const fb = tc.factionBonus;
        if (fb && fb.resourceMult && fb.resourceMult !== 1.0) {
          const adjustedCurrency = Math.round(startMoney.currency * fb.resourceMult);
          const adjustedImmortal = Math.round(startMoney.immortalCurrency * fb.resourceMult);
          if (adjustedCurrency > 0) (useStore.getState() as any).setCurrency?.(adjustedCurrency);
          if (adjustedImmortal > 0) (useStore.getState() as any).setImmortalCurrency?.(adjustedImmortal);
        }
      }
      // 初始蛊虫
      const allGu = [...(tc.selectedGuList || [])];
      if (tc.guaranteedGu) allGu.unshift(tc.guaranteedGu);
      const storeRef = useStore.getState() as any;
      if (typeof storeRef.addGu === 'function') {
        allGu.forEach((g: any, i: number) => {
          storeRef.addGu({
            id: `starter_gu_${i}_${g.name}`, specId: g.name, name: g.name,
            tier: g.tier, path: g.path, rank: g.rank, description: g.description || '',
            currentState: 'optimal', hungerCounter: 0,
          });
        });
        useStore.getState().setFlag('_starting_gu_count', allGu.length);
      }
      // 杀招 — v1.7: 改为调用learnKillMove写入killMoves数组（修复孤儿数据）
      if (tc.selectedKillerMoves && tc.selectedKillerMoves.length > 0) {
        const storeRef2 = useStore.getState() as any;
        tc.selectedKillerMoves.forEach((km: any, i: number) => {
          if (typeof storeRef2.learnKillMove === 'function') {
            storeRef2.learnKillMove({
              id: `starter_km_${i}_${km.name}`,
              name: km.name,
              path: km.path,
              level: km.level,
              baseCost: km.level * 10,
              multiplier: 1.5 + km.level * 0.3,
              cooldown: Math.max(1, 8 - km.level),
              description: km.effect || km.name,
            });
          }
        });
        useStore.getState().setFlag('_killer_moves', tc.selectedKillerMoves.map((km: any) => km.name).join(','));
      }
    }

    // ═══ P4: 清理timelineSlice配置（避免存档污染） ═══
    (useStore.getState() as any).resetTimelineConfig?.();

    // ═══ P1: 蛊仙主修/辅修流派写入 pathBuild + 道痕初始化 ═══
    // 公式设计依据：
    //   原著：升仙时三气(天气地气人气)融合→道印加持，人气=自身积累，天气地气由人气引动
    //   游戏阈值：大师51-200/宗师201-500/大宗师501-1500/准无上1501-5000 (path-progression.ts)
    //   战斗倍率：1+道痕/10000 (combat-engine.ts) — 道痕数千才有显著效果
    //   杀招进化：50/100/200/500/1500门槛 (killmove-evolution.ts)
    //   设计原则：非线性加速增长(realm²)，6转大宗师、8转准无上，体现高转蛊仙积累差距
    if (tNode && tc?.primaryPath) {
      const storeRef = useStore.getState() as any;
      const realm = startRealm.grand;
      const allPaths = ['炎道','水道','土道','风道','剑道','毒道','木道','光道','宇道','宙道','炼道','魂道','冰道','雷道','血道','力道','智道','暗道','奴道','变化道','律道','梦道','太道','音道','运道','金道','骨道','食道'];
      const initDaoMarks: Record<string, number> = {};
      // 主修道痕 = realm² × 25（非线性加速，6转=900/7转=1225/8转=1600/9转=2025）
      initDaoMarks[tc.primaryPath] = realm * realm * 25;
      // 辅修道痕 = realm × 30（6转=180/7转=210/8转=240/9转=270）
      if (tc.secondaryPath) initDaoMarks[tc.secondaryPath] = realm * 30;
      // 杂道道痕×4条 = realm × 8（升仙时三气冲刷必然沾染杂道痕迹）
      const otherPaths = allPaths.filter(p => p !== tc.primaryPath && p !== tc.secondaryPath);
      for (let i = 0; i < 4; i++) {
        const idx = Math.floor(Math.random() * otherPaths.length);
        const randPath = otherPaths.splice(idx, 1)[0];
        initDaoMarks[randPath] = realm * 8 + Math.floor(Math.random() * 5); // 微小随机波动
      }
      // 天赋流派亲和加成 = realm × 8（天赋加深对应流派道痕积累）
      for (const t of selectedTalents) {
        const tp = (t as any) as import('../data/talents-p4').P4Talent;
        const recPath = tp.primaryPathRecommendation;
        if (recPath && recPath !== '任意' && recPath !== '按主修推荐' && recPath !== '按所选道派推荐仙蛊') {
          initDaoMarks[recPath] = (initDaoMarks[recPath] || 0) + realm * 8;
        }
      }
      // 写入 pathBuild + 用 computePathLevel 动态计算流派境界（修复硬编码Bug）
      const daoMarkDensity = { ...initDaoMarks };
      if (storeRef.pathBuild) {
        storeRef.setPrimaryPath?.(tc.primaryPath);
        if (tc.secondaryPath) storeRef.addSecondaryPath?.(tc.secondaryPath);
      }
      useStore.setState((s: any) => ({
        ...s,
        pathBuild: {
          ...(s.pathBuild || {}),
          primary: tc.primaryPath,
          secondary: tc.secondaryPath ? [tc.secondaryPath] : [],
          dao_marks: initDaoMarks,
          path_levels: Object.fromEntries(
            Object.entries(initDaoMarks).map(([p, val]) => [p, computePathLevel(val)])
          ),
        },
        aperture: s.aperture ? { ...s.aperture, dao_mark_density: daoMarkDensity } : s.aperture,
      }));
    }

    // ═══ P2: 道心倾向初始化 — 据出身域和身份赋初始值 ═══
    {
      const storeRef = useStore.getState() as any;
      const identity = tNode?.talentCategory === 'immortal' ? '蛊仙' : playerIdentity;
      const isSanXiu = !tc?.factionId && identity === '蛊仙';
      const isMortalSanXiu = !tc?.factionId && identity !== '蛊仙' && !tNode;
      const domain = tc?.domain || tNode?.domain || origin;
      // 基础道心值设定
      let dhKill = 0, dhMercy = 0, dhScheme = 0, dhAmbition = 0;
      if (isSanXiu) {
        // 散修：杀戮倾向高，慎密
        dhKill = 2; dhScheme = 2; dhAmbition = 3;
      } else if (identity === '蛊仙') {
        // 宗门蛊仙：野心与慎密并重
        dhAmbition = 3; dhScheme = 2; dhMercy = 1;
      } else if (tc?.factionId) {
        // 有势力归属：正统门派偏仁慈，魔道偏杀戮
        dhMercy = 2; dhAmbition = 2;
      } else {
        // 散修蛊师
        dhKill = 2; dhScheme = 3; dhAmbition = 2;
      }
      // 地域修正
      if (domain === '南疆') { dhScheme += 1; dhKill += 1; }
      if (domain === '北原') { dhKill += 2; }
      if (domain === '中洲') { dhMercy += 1; dhAmbition += 1; }
      // 天赋修正
      for (const t of selectedTalents) {
        const desc = t.description || '';
        const name = t.name || '';
        if (desc.includes('杀戮') || name.includes('杀手')) dhKill += 1;
        if (desc.includes('仁慈') || desc.includes('慈悲')) dhMercy += 1;
        if (desc.includes('谋略') || desc.includes('慎密') || name.includes('深谋')) dhScheme += 1;
        if (desc.includes('野心') || name.includes('逆天') || name.includes('道主')) dhAmbition += 1;
      }
      // 钳制范围 [0, 10]
      useStore.setState((s: any) => ({
        ...s,
        daoHeart: {
          kill: Math.min(10, Math.max(0, dhKill)),
          mercy: Math.min(10, Math.max(0, dhMercy)),
          scheme: Math.min(10, Math.max(0, dhScheme)),
          ambition: Math.min(10, Math.max(0, dhAmbition)),
        },
      }));
    }

    onConfirm();
  };

  const handleReroll = () => {
    if (rerollCount >= 3) return;
    setAttributes(rollAllAttributes());
    setRerollCount(c => c + 1);
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-start p-8 overflow-y-auto">
      {/* ─── v1.5: 时间线模式与普通模式标题区分 ─── */}
      <div className="text-center mb-8 pt-8">
        <h2 className="text-3xl font-bold text-rg-gold font-narrative tracking-wider">
          {isTimelineStart ? '最终确认' : '开窍'}
        </h2>
        <p className="text-rg-paper-200/50 text-sm font-panel mt-2 tracking-[0.1em]">
          {isTimelineStart
            ? `自"${timelineNode!.displayTitle}"出发 · ${origin} · ${identity}`
            : '天意垂青 · 你于今日开窍，踏入蛊师之路'}
        </p>
        <div className="mt-4 w-12 h-[1px] bg-rg-gold/30 mx-auto" />
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* ─── 姓名输入 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <label className="block text-rg-paper-200 text-sm font-panel mb-3">
            你的名号
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入你的蛊师之名..."
            maxLength={8}
            className="w-full bg-rg-ink-900 border border-rg-ink-500/30 text-rg-paper-100 font-narrative text-lg px-4 py-3 rounded-sm
                       placeholder:text-rg-ink-400 focus:outline-none focus:border-rg-gold/60"
          />
        </div>

        {/* ─── 属性骰子 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">
              先天资质
            </h3>
            <button
              onClick={handleReroll}
              disabled={rerollCount >= 3}
              className={`text-xs font-button px-3 py-1 border rounded-sm transition-micro ${
                rerollCount >= 3
                  ? 'text-rg-ink-400 border-rg-ink-400/20 cursor-not-allowed'
                  : 'text-rg-gold/80 hover:text-rg-gold border-rg-gold/25 hover:bg-rg-gold/10'
              }`}
            >
              {rerollCount >= 3 ? '次数用尽' : `重新掷骰(${rerollRemaining})`}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {(['资质', '体魄', '心智', '气运'] as const).map(attr => {
              const val = attributes[attr];
              const grade = attrGrade(val, attr);
              const isTen = attr === '资质' && val === 10;
              return (
                <div key={attr} className={`text-center p-3 rounded-sm border transition-micro ${
                  isTen ? 'bg-rg-gold/10 border-rg-gold/30' : 'bg-rg-ink-800/50 border-rg-ink-400/15'
                }`}>
                  <div className="text-rg-paper-200/70 text-xs font-panel mb-1">{attr}</div>
                  <div className={`text-2xl font-bold font-panel ${isTen ? 'text-rg-gold' : grade.color}`}>
                    {val}
                    {isTen && <span className="text-[10px] text-rg-gold ml-1">十绝</span>}
                  </div>
                  {grade.label && (
                    <div className={`text-xs font-panel mt-1 ${grade.color}`}>{grade.label}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-rg-ink-300 text-xs font-panel leading-relaxed">
            {(() => {
              if (attributes.资质 === 10) {
                return '十绝体！空窍十成真元、修行一日千里。但升仙时灾劫恐怖、天意必诛、极易陨落。木秀于林，风必摧之。';
              }
              const { 资质: q, 体魄: t, 心智: x, 气运: y } = attributes;
              const total = q + t + x + y;
              if (total >= 32) return '天资卓绝，百年难遇。但你当知：木秀于林，风必摧之。';
              if (total >= 24) return '天赋不错，修行之路有望。但仍需步步为营。';
              if (total >= 16) return '资质平庸，但平凡之人亦能有所成就。天道酬勤。';
              return '资质低下，前路艰难。但蛊界从不缺少以凡人之躯逆天改命的传说。';
            })()}
          </div>
        </div>

        {/* ─── v1.6: 天赋区 — timeline模式只读展示（已在TimelineConfig选定） ─── */}
        {isTimelineStart ? (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">
              天命馈赠 · 已在天命抉择中选定
            </h3>
            <p className="text-rg-paper-200/40 text-xs font-panel mb-3">
              以下天赋来自时间线节点预设与你的选择，此处仅供确认。若需调整，请返回上一步。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedTalents.length === 0 ? (
                <p className="col-span-2 text-rg-paper-200/30 text-xs font-panel italic">未选择天赋</p>
              ) : (
                selectedTalents.map(talent => (
                  <div key={talent.id}
                    className="text-left p-4 rounded-sm border border-rg-ink-400/12 bg-rg-ink-800/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-panel font-semibold ${TIER_COLORS[talent.tier]}`}>{TIER_LABELS[talent.tier]}</span>
                      <span className="text-rg-paper-100 font-panel text-sm font-semibold">{talent.name}</span>
                      <span className="text-[9px] text-rg-gold/40 ml-auto">已定</span>
                    </div>
                    <p className="text-rg-paper-200/60 text-xs font-panel leading-relaxed">{talent.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">
                天赋遴选（可多选至点数用尽）
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-rg-paper-200/50 text-xs font-panel">
                  已选<span className="text-rg-gold font-bold">{selectedTalents.length}</span>个 · 剩余<span className="text-rg-gold font-bold">{remainingPoints}</span>点
                </span>
                <button onClick={() => setPoolIndex(p => p + 1)}
                  className="text-rg-gold/60 hover:text-rg-gold text-xs font-button px-2 py-0.5 border border-rg-gold/20 rounded-sm transition-micro">
                  换一批
                </button>
              </div>
            </div>
            {isTenUltimate && (
              <p className="text-rg-gold/80 text-xs font-panel mb-4">
                十绝体！空窍十成真元、全属性极致。天赋余裕所剩无几——仅能选基础天赋。
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shuffledPool.map(talent => {
                const isSelected = selectedTalents.some(t => t.id === talent.id);
                const cost = TALENT_COST[talent.tier] || 1;
                const canAfford = !isSelected && cost <= remainingPoints;
                return (
                  <button
                    key={talent.id}
                    onClick={() => toggleTalent(talent)}
                    disabled={!isSelected && !canAfford}
                    className={`text-left p-4 rounded-sm border transition-micro ${isSelected ? 'border-rg-gold/60 bg-rg-gold/10 ring-1 ring-rg-gold/20' : canAfford ? 'border-rg-ink-400/15 bg-rg-ink-800/50 hover:border-rg-gold/30' : 'border-rg-ink-400/8 bg-rg-ink-800/30 opacity-30 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-panel font-semibold ${TIER_COLORS[talent.tier]}`}>{TIER_LABELS[talent.tier]}</span>
                      <span className="text-rg-paper-100 font-panel text-sm font-semibold">{talent.name}</span>
                      {isSelected && <span className="text-[9px] text-rg-gold ml-auto">已选</span>}
                      {!isSelected && <span className={`text-[9px] font-panel ml-auto ${canAfford ? 'text-rg-gold/60' : 'text-rg-paper-200/20'}`}>{cost}pts</span>}
                    </div>
                    <p className="text-rg-paper-200/60 text-xs font-panel leading-relaxed">{talent.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── v1.6: 确认按钮 — timeline模式增加返回 ─── */}
        <div className="flex justify-center gap-4 pb-12">
          {onBack && (
            <button
              onClick={onBack}
              className="text-rg-paper-200/50 hover:text-rg-paper-100 text-xs font-button px-6 py-3 border border-rg-ink-300/20 rounded-sm transition-micro"
            >
              上一步
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="bg-rg-gold text-rg-ink-900 font-button font-semibold px-8 py-3 rounded-sm
                       hover:brightness-115 hover:scale-[1.02] transition-micro
                       disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-not-allowed"
          >
            踏入蛊界
          </button>
        </div>
      </div>
    </div>
  );
}
