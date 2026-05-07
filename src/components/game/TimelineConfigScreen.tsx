import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { P4_TALENTS, P4_TALENT_COST, getTalentsByCategory, MORTAL_TALENTS, IMMORTAL_TALENTS, type P4Talent } from '../../data/talents-p4';
import { TIER_COLORS, TIER_LABELS } from '../../data/talents';
import factionDataRaw from '../../canon/faction-data.json';
import guDbRaw from '../../canon/gu-database.json';
import killerMovesRaw from '../../canon/killer-moves.json';
import type { TimelineNode, LifeboundGuSelection, GuSelection, KillerMoveSelection, FactionSelection } from '../../store/slices/timelineSlice';

interface FactionEntry { id: string; name: string; domain: string; type: string; standing: number; description: string; starterGu: { name: string; tier: number; path: string; rank: string } | null; bonus: { resourceMult: number; talentBonus: number; desc: string; attributeBonus?: Record<string, number> }; }
const FACTION_DATA = (factionDataRaw as any).factions as Record<string, FactionEntry[]>;
const GU_DB = guDbRaw as Record<string, any>;
const KILLER_MOVES = (killerMovesRaw as any);

interface TimelineConfigProps {
  onConfirm: () => void;
  onBack: () => void;
}

const STEPS = ['faction', 'talent', 'gu', 'lifebound', 'aperture', 'killermove', 'resource'] as const;
type Step = typeof STEPS[number];

// P2: 原著主线独占仙蛊——不出现在本命蛊/初始蛊候选池
const MAINLINE_EXCLUDED_SET = new Set([
  '春秋蝉','定仙游','坚持仙蛊','宿命蛊','梦蝶蛊','智慧蛊',
  '至尊仙胎蛊','力量蛊','天元宝皇莲','升炼','天机','鸿运齐天蛊',
  '态度蛊','悔蛊','慧剑','万我','净魂仙蛊','剑遁仙蛊','江山如故',
  '换魂','招灾蛊','鼎力','吃力','龙力',
]);

const STEP_LABELS: Record<Step, string> = {
  talent: '天赋遴选', faction: '势力归属', gu: '初始蛊虫',
  lifebound: '本命蛊', aperture: '洞天福地', killermove: '初始杀招', resource: '资源确认',
};

// ─── 确定性伪随机 ───
function seedRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}

// ─── 洞天点数分配公式 ───
function calcAperturePoints(realmGrand: number): { base: number; free: number } {
  // P4: 方案B — 总点数=转数×15 (6转=90, 7转=105, 8转=120, 9转=135)
  const total = realmGrand * 15;
  const base = Math.floor(total * 0.3); // 30%为自动分配的基础值
  const free = total - base;
  return { base, free };
}

function calcMortalTalentPoints(node: TimelineNode): number {
  return Math.max(3, Math.floor(node.startingRealm.grand * 1.5));
}

function calcImmortalTalentPoints(node: TimelineNode): number {
  return Math.max(4, node.startingRealm.grand);
}

export function TimelineConfigScreen({ onConfirm, onBack }: TimelineConfigProps) {
  const store = useStore(s => (s as any));
  const selectedNode = store.selectedNode as TimelineNode | null;
  const selectedDomain = store.selectedDomain as string;
  const timelineTalents = store.timelineTalents as string[];
  const configStep = store.configStep as Step;
  const lifeboundGu = store.lifeboundGu as LifeboundGuSelection | null;
  const primaryPath = store.primaryPath as string;
  const secondaryPath = store.secondaryPath as string;
  // v1.6: 新增
  const factionId = store.factionId as string;
  const guaranteedGu = store.guaranteedGu as GuSelection | null;
  const randomGuPool = store.randomGuPool as GuSelection[];
  const selectedGuList = store.selectedGuList as GuSelection[];
  const guRerollsRemaining = store.guRerollsRemaining as number;
  const selectedKillerMoves = store.selectedKillerMoves as KillerMoveSelection[];
  const killerMovePool = store.killerMovePool as KillerMoveSelection[];

  // ═══ 所有Hooks必须在此调用（v1.5修复: early return移到所有hooks之后） ═══
  const [poolIndex, setPoolIndex] = useState(0);
  const [talentRerollCount, setTalentRerollCount] = useState(0);
  const talentRerollRemaining = Math.max(0, 3 - talentRerollCount);
  const [localAperture, setLocalAperture] = useState({
    areaMu: 200, resourceNodes: 1, timeFlowRatio: 5, defenseLevel: 0,
  });
  const [resourceConfirmed, setResourceConfirmed] = useState(false);

  // useMemo需要在selectedNode为null时也能安全返回值
  const isImmortal = selectedNode?.talentCategory === 'immortal';

  const talentPool = useMemo(() => {
    if (!selectedNode) return [] as P4Talent[];
    return selectedNode.talentCategory === 'immortal' ? IMMORTAL_TALENTS : MORTAL_TALENTS;
  }, [selectedNode]);

  const shuffledPool = useMemo(() => {
    if (!selectedNode || talentPool.length === 0) return [] as P4Talent[];
    const rng = seedRand(selectedNode.startingRealm.grand * 100 + poolIndex);
    let filtered = [...talentPool];
    // P1: 蛊仙模式 — 按主修/辅修过滤天赋池。流派亲和类只显示匹配的，元天赋始终显示
    if (isImmortal && primaryPath) {
      filtered = filtered.filter(t => {
        const rec = t.primaryPathRecommendation;
        // 元天赋（无流派推荐 或 推荐'任意'）始终显示
        if (!rec || rec === '任意' || rec === '按所选道派推荐仙蛊' || rec === '按主修推荐') return true;
        // 匹配主修或辅修
        return rec === primaryPath || (secondaryPath && rec === secondaryPath);
      });
    }
    const sorted = filtered.sort(() => rng() - 0.5);
    const needShow = sorted.filter(t => timelineTalents.includes(t.id));
    const rest = sorted.filter(t => !timelineTalents.includes(t.id));
    return [...needShow, ...rest.slice(0, 12)];
  }, [talentPool, poolIndex, timelineTalents, selectedNode?.startingRealm?.grand, primaryPath, secondaryPath, isImmortal]);

  // P2: 原著主线独占仙蛊——不出现在本命蛊候选池中（与auction-engine.ts MAINLINE_EXCLUDED 同步）

  const guCandidates = useMemo(() => {
    if (!selectedNode || !isImmortal || timelineTalents.length === 0) return null;
    const candidates: string[] = [];
    timelineTalents.forEach((tid: string) => {
      const t = talentPool.find(tt => tt.id === tid);
      if (t?.lifeboundGuCandidates) {
        const filtered = t.lifeboundGuCandidates.filter(g => !MAINLINE_EXCLUDED_SET.has(g) && g !== '按所选道派推荐仙蛊' && g !== '按主修推荐');
        candidates.push(...filtered);
      }
    });
    // fallback: 候选不足2条时，从GU_DB按tier补充（保证至少2个实质选项）
    if (candidates.length < 2) {
      const fallbackTier = Math.max(1, selectedNode.startingRealm.grand - 1);
      const guEntries = Object.entries(GU_DB).filter(([k]) => k !== '_version' && k !== '_meta');
      for (const [dbKey, gu] of guEntries) {
        const g = gu as any;
        if ((g.tier || 1) >= fallbackTier && !candidates.includes(dbKey) && !MAINLINE_EXCLUDED_SET.has(dbKey) && !g.isImmortalGu) {
          candidates.push(dbKey);
        }
        if (candidates.length >= 4) break;
      }
    }
    return [...new Set(candidates)].slice(0, 4);
  }, [selectedNode, isImmortal, timelineTalents, talentPool]);

  const aperturePoints = useMemo(() => {
    if (!selectedNode || !isImmortal) return null;
    return calcAperturePoints(selectedNode.startingRealm.grand);
  }, [selectedNode, isImmortal]);

  const apertureSpent = useMemo(() => {
    const a = localAperture;
    const areaCost = Math.floor((a.areaMu - 100) / 100) * 1; // 每100万亩=1点
    const nodeCost = (a.resourceNodes - 1) * 2;              // 每节点=2点
    const flowCost = (a.timeFlowRatio - 5) * 3;              // 每+1流速=3点
    const defenseCost = a.defenseLevel * 3;                  // 每级=3点
    return areaCost + nodeCost + flowCost + defenseCost;
  }, [localAperture]);

  // ═══ P2补完: 消除early return，改用条件渲染 — selectedNode为null时不调用任何性能敏感计算但确保同一hook链 ═══
  const nodeReady = !!selectedNode;

  // ═══ 非Hook计算值（selectedNode已确保非null） ═══
  const talentPoints = nodeReady
    ? (isImmortal ? calcImmortalTalentPoints(selectedNode!) : calcMortalTalentPoints(selectedNode!)) + (store.factionBonus?.talentBonus ?? 0)
    : 0;

  const spentPoints = timelineTalents.reduce((sum: number, id: string) => {
    const t = talentPool.find(tt => tt.id === id);
    return sum + (t ? (P4_TALENT_COST[t.tier] || 1) : 0);
  }, 0);
  const remainingPoints = talentPoints - spentPoints;

  const apertureRemaining = aperturePoints ? aperturePoints.free - apertureSpent : 0;
  const yuanStone = nodeReady ? selectedNode.startingYuanStone : 0;

  const handleSelectTalent = (talent: P4Talent) => {
    if (timelineTalents.includes(talent.id)) {
      store.deselectTalent(talent.id);
    } else {
      const cost = P4_TALENT_COST[talent.tier] || 1;
      if (cost <= remainingPoints) store.selectTimelineTalent(talent.id);
    }
  };

  // 重掷蛊虫池
  const handleRerollGu = () => {
    if (guRerollsRemaining <= 0 || !selectedNode) return;
    const tierRange = selectedNode.guTierRange || [1, Math.min(3, selectedNode.startingRealm.grand)];
    const [minTier, maxTier] = tierRange;
    const domain = selectedNode.domain || selectedDomain || '南疆';

    const candidates: GuSelection[] = [];
    const guEntries = Object.entries(GU_DB).filter(([k]) => k !== '_version' && k !== '_meta');
    for (const [dbKey, gu] of guEntries) {
      const g = gu as any;
      const tier = g.tier || 1;
      if (tier < minTier || tier > maxTier) continue;
      if (g.isImmortalGu) continue;
      if (MAINLINE_EXCLUDED_SET.has(dbKey)) continue;
      candidates.push({
        name: dbKey,
        tier,
        path: g.path || '通用',
        rank: g.rank || (tier >= 5 ? 'epic' : tier >= 3 ? 'rare' : 'common'),
        description: g.effect || g.description || '',
        isGuaranteed: false,
      });
    }

    const newSeed = Math.floor(Date.now() + Math.random() * 10000);
    const rng = seedRand(newSeed);
    const shuffled = candidates.sort(() => rng() - 0.5);
    const count = Math.min(shuffled.length, selectedNode.startingGuCount || 4);
    const newPool = shuffled.slice(0, count);

    // 重掷时清空已选 + 写入新池（rerollGuPool会减重掷次数）
    useStore.setState((s: any) => ({ ...s, selectedGuList: [] }));
    store.rerollGuPool(newPool, newSeed);
  };

  // ═══ Bug1修复: 蛊虫池生成 — 进入gu步骤时自动生成 ═══
  useEffect(() => {
    if (configStep !== 'gu' || !selectedNode) return;

    // 每次进入gu步骤重置重掷次数（放在池生成守卫之前，确保导航回来时也刷新）
    if (store.guRerollsRemaining <= 0) {
      useStore.setState({ guRerollsRemaining: 3 });
    }

    // 仅当池为空时生成（避免重复或覆盖手动重掷结果）
    if (randomGuPool.length > 0) return;

    const tierRange = selectedNode.guTierRange || [1, Math.min(3, selectedNode.startingRealm.grand)];
    const [minTier, maxTier] = tierRange;
    const domain = selectedNode.domain || selectedDomain || '南疆';

    // 从GU_DB生成蛊虫池
    // 注意：GU_DB中蛊虫名是JSON key，条目不包含name/specId字段
    const candidates: GuSelection[] = [];
    const guEntries = Object.entries(GU_DB).filter(([k]) => k !== '_version' && k !== '_meta');
    for (const [dbKey, gu] of guEntries) {
      const g = gu as any;
      const tier = g.tier || 1;
      if (tier < minTier || tier > maxTier) continue;
      if (g.isImmortalGu) continue;
      if (MAINLINE_EXCLUDED_SET.has(dbKey)) continue;
      candidates.push({
        name: dbKey, // GU_DB的key才是蛊虫名
        tier,
        path: g.path || '通用',
        rank: g.rank || (tier >= 5 ? 'epic' : tier >= 3 ? 'rare' : 'common'),
        description: g.effect || g.description || '',
        isGuaranteed: false,
      });
    }

    // 随机选择（基于节点seed）
    const seed = selectedNode.startingRealm.grand * 1000 + domain.length * 7;
    const rng = seedRand(seed);
    const shuffled = candidates.sort(() => rng() - 0.5);
    const count = Math.min(shuffled.length, selectedNode.startingGuCount || 4);
    const pool = shuffled.slice(0, count);

    // 直接setState（不通过rerollGuPool，避免消耗重掷次数）
    useStore.setState((s: any) => ({ ...s, randomGuPool: pool, guPoolSeed: seed, guRerollsRemaining: 3 }));
  }, [configStep, selectedNode?.id]);

  // ═══ v1.7: 杀招池生成 — 进入killermove步骤时生成，排除isExclusive专属杀招 ═══
  useEffect(() => {
    if (configStep !== 'killermove' || !isImmortal || !selectedNode) return;
    // 收集已选天赋的流派偏好
    const preferredPaths = new Set<string>();
    timelineTalents.forEach((tid: string) => {
      const pt = P4_TALENTS.find(p => p.id === tid);
      if (pt?.primaryPathRecommendation) preferredPaths.add(pt.primaryPathRecommendation);
    });
    const allMoves = KILLER_MOVES as Record<string, any>;
    const pool: KillerMoveSelection[] = [];
    for (const [key, val] of Object.entries(allMoves)) {
      if (key.startsWith('_') || typeof val !== 'object' || !val) continue;
      const km = val as any;
      if (km.isExclusive) continue; // v1.7: 排除角色专属杀招
      if (km.level < 6 || km.level > selectedNode.startingRealm.grand + 1) continue;
      // 优先匹配流派偏好，但也包含其他杀招（保证池子够大）
      const isPreferred = km.path && preferredPaths.has(km.path);
      pool.push({
        name: key, path: km.path || '未知', level: km.level,
        effect: km.effect || '', coreGu: km.coreGu || [], cost: km.cost || '',
      });
    }
    // 按流派偏好排序（偏好在前），随机打乱非偏好部分
    const preferred = pool.filter(p => preferredPaths.has(p.path));
    const others = pool.filter(p => !preferredPaths.has(p.path));
    const shuffledOthers = others.sort(() => Math.random() - 0.5);
    // 直接写入killerMovePool
    const finalPool = [...preferred, ...shuffledOthers].slice(0, 8);
    useStore.setState((s: any) => ({ ...s, killerMovePool: finalPool }));
  }, [configStep, isImmortal, selectedNode?.id]);

  // ─── 步进控制 ───
  const currentStepIdx = STEPS.indexOf(configStep);

  // v1.6: 凡蛊节点跳过的步骤
  const MORTAL_SKIP = new Set(['lifebound', 'aperture', 'killermove']);
  
  const goNext = () => {
    // ═══ 离开aperture步骤时提交localAperture到store ═══
    if (configStep === 'aperture' && isImmortal) {
      store.allocateAperturePoints(localAperture);
    }
    let nextIdx = currentStepIdx + 1;
    while (nextIdx < STEPS.length && !isImmortal && MORTAL_SKIP.has(STEPS[nextIdx])) { nextIdx++; }
    if (nextIdx >= STEPS.length) {
      store.setStartingResources(yuanStone, []);
      // ═══ Bug2修复: RAF延迟onConfirm — 确保React完成'complete'帧commit后再触发resetStore ═══
      store.setConfigStep('complete');
      requestAnimationFrame(() => onConfirm());
      return;
    }
    store.setConfigStep(STEPS[nextIdx]);
  };

  const goBack = () => {
    let prevIdx = currentStepIdx - 1;
    while (prevIdx >= 0 && !isImmortal && MORTAL_SKIP.has(STEPS[prevIdx])) { prevIdx--; }
    if (prevIdx < 0) { onBack(); return; }
    // ═══ 返回aperture步骤时恢复store中的apertureConfig到localAperture ═══
    const prevStep = STEPS[prevIdx];
    if (prevStep === 'aperture' && isImmortal && store.apertureConfig) {
      const ac = store.apertureConfig;
      setLocalAperture({ areaMu: ac.areaMu, resourceNodes: ac.resourceNodes, timeFlowRatio: ac.timeFlowRatio, defenseLevel: ac.defenseLevel });
    }
    store.setConfigStep(prevStep);
  };

  return (
    <div className={nodeReady
      ? 'min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center py-6 px-4 overflow-y-auto'
      : 'min-h-[100dvh] bg-rg-ink-800 flex items-center justify-center'
    }>
      {nodeReady ? (
        <div className="w-full max-w-2xl">
        {/* 头 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-rg-gold font-narrative">{STEP_LABELS[configStep]}</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            {STEPS.filter(s => isImmortal || !MORTAL_SKIP.has(s)).map((s, i) => {
              const doneIdx = STEPS.indexOf(configStep);
              const thisIdx = STEPS.indexOf(s);
              return (
                <div key={s} className={`w-3 h-3 rounded-full border transition-colors ${
                  thisIdx < doneIdx ? 'bg-rg-gold border-rg-gold' :
                  thisIdx === doneIdx ? 'border-rg-gold bg-rg-gold/30' :
                  'border-rg-ink-300/20'
                }`} />
              );
            })}
          </div>
        </div>

        {/* ─── STEP: talent ─── */}
        {configStep === 'talent' && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-rg-paper-200/50 text-xs font-panel">可用天赋点</span>
                <span className="text-rg-gold font-bold text-lg ml-2">{remainingPoints}</span>
                <span className="text-rg-paper-200/30 text-xs ml-1">/ {talentPoints}</span>
              </div>
              <button onClick={() => {
                if (talentRerollCount >= 3) return;
                setPoolIndex(p => p + 1);
                setTalentRerollCount(c => c + 1);
              }}
                disabled={talentRerollCount >= 3}
                className={`text-xs font-button px-3 py-1 border rounded-sm transition-micro ${
                  talentRerollCount >= 3
                    ? 'text-rg-ink-400 border-rg-ink-400/20 cursor-not-allowed'
                    : 'text-rg-gold/60 hover:text-rg-gold border-rg-gold/20'
                }`}
              >
                {talentRerollCount >= 3 ? '次数用尽' : `换一批(${talentRerollRemaining})`}
              </button>
            </div>
            {/* P1: 蛊仙流派选择 — 在天赋池顶部显示主修/辅修选择器 */}
            {isImmortal && (
              <div className="mb-4 p-4 bg-rg-gold/5 border border-rg-gold/15 rounded-md">
                <p className="text-rg-paper-200/60 text-xs font-panel mb-3">
                  {primaryPath ? `主修「${primaryPath}」` : '选择你的主修流派——蛊仙升仙时吸收天地人气，必然凝聚出一脉主修道痕'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['炎道','水道','土道','风道','剑道','毒道','木道','光道','宇道','宙道','炼道','魂道','冰道','雷道','血道','力道','智道','暗道','奴道','变化道','律道','梦道','太道','音道','运道','金道','骨道','食道'].map(path => (
                    <button key={path} onClick={() => {
                      if (primaryPath === path) {
                        store.setPrimaryPath('');
                      } else if (!primaryPath) {
                        store.setPrimaryPath(path);
                      } else {
                        store.setSecondaryPath(path);
                      }
                    }}
                    className={`text-[10px] font-panel px-2 py-1 rounded-sm border transition-colors ${
                      primaryPath === path ? 'bg-rg-gold/20 border-rg-gold/40 text-rg-gold' :
                      secondaryPath === path ? 'bg-rg-jade-400/15 border-rg-jade-400/30 text-rg-jade-400' :
                      'border-rg-ink-400/20 text-rg-paper-200/40 hover:border-rg-gold/30 hover:text-rg-paper-200/70'
                    }`}>
                      {path}
                    </button>
                  ))}
                </div>
                {primaryPath && (
                  <p className="text-rg-paper-200/30 text-[9px] font-panel mt-2">
                    点击另一流派设置辅修（可选）。天赋池已按流派过滤。
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {shuffledPool.map(talent => {
                const isSelected = timelineTalents.includes(talent.id);
                const cost = P4_TALENT_COST[talent.tier] || 1;
                const canAfford = !isSelected && cost <= remainingPoints;
                return (
                  <button key={talent.id} onClick={() => handleSelectTalent(talent)}
                    disabled={!isSelected && !canAfford}
                    className={`text-left p-3 rounded-sm border transition-colors ${isSelected
                      ? 'border-rg-gold/60 bg-rg-gold/10' : canAfford
                      ? 'border-rg-ink-400/12 bg-rg-ink-800/50 hover:border-rg-gold/30'
                      : 'border-rg-ink-400/6 bg-rg-ink-800/20 opacity-30 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-panel px-1 rounded ${TIER_COLORS[talent.tier]}`}>
                        {TIER_LABELS[talent.tier]}
                      </span>
                      <span className="text-rg-paper-100 font-panel text-xs">{talent.name}</span>
                      {talent.primaryPathRecommendation && (
                        <span className="text-[9px] text-rg-gold/60 font-panel ml-auto">
                          {talent.primaryPathRecommendation}道
                        </span>
                      )}
                      <span className={`text-[9px] ${canAfford ? 'text-rg-gold/60' : 'text-rg-paper-200/20'}`}>
                        {cost}pts
                      </span>
                    </div>
                    <p className="text-rg-paper-200/50 text-[11px] font-panel leading-relaxed">
                      {talent.description}
                    </p>
                    {talent.triggerScene && (
                      <p className="text-rg-gold/40 text-[10px] font-panel mt-1">
                        触发: {talent.triggerScene} {talent.effectRange ? `| ${talent.effectRange}` : ''}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── v1.6: STEP: faction ─── */}
        {configStep === 'faction' && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <p className="text-rg-paper-200/60 text-sm font-panel mb-4">
              {selectedNode.domain}的势力格局——选择你的归属。所选势力将影响初始资源和因果。
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[55vh] overflow-y-auto pr-2">
              {[...(FACTION_DATA[selectedNode.domain] || []), ...(FACTION_DATA['散修'] || [])].map((f: FactionEntry) => {
                const isSelected = factionId === f.id;
                return (
                  <button key={f.id} onClick={() => store.selectFaction({
                    factionId: f.id, factionName: f.name, domain: f.domain,
                    starterGu: f.starterGu, bonus: f.bonus,
                  })}
                  className={`text-left p-3 rounded-sm border transition-colors ${isSelected
                    ? 'border-rg-gold/60 bg-rg-gold/10' : 'border-rg-ink-400/12 bg-rg-ink-800/50 hover:border-rg-gold/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-rg-paper-100 font-panel text-sm font-semibold">{f.name}</span>
                      <span className="text-rg-paper-200/40 text-[10px] font-panel">{f.type}</span>
                      {f.bonus.talentBonus > 0 && <span className="text-rg-gold/60 text-[10px]">+{f.bonus.talentBonus}天赋点</span>}
                      {f.starterGu && <span className="text-rg-jade-400/60 text-[10px] ml-auto">保底: {f.starterGu.name}</span>}
                    </div>
                    <p className="text-rg-paper-200/50 text-[11px] font-panel">{f.description}</p>
                    <p className="text-rg-paper-200/30 text-[10px] font-panel mt-1">{f.bonus.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── v1.6: STEP: gu ─── */}
        {configStep === 'gu' && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <p className="text-rg-paper-200/60 text-sm font-panel mb-3">
              初始蛊虫——保底蛊来自势力归属，随机蛊受{selectedNode.domain}区域和气运影响。
              {guRerollsRemaining > 0 && <span className="text-rg-gold ml-1">可重掷 {guRerollsRemaining} 次</span>}
            </p>
            {/* 保底蛊 */}
            {guaranteedGu && (
              <div className="mb-4 p-3 rounded-sm border border-rg-gold/40 bg-rg-gold/5">
                <span className="text-[10px] text-rg-gold font-panel">保底蛊</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-rg-paper-100 font-narrative text-sm">{guaranteedGu.name}</span>
                  <span className="text-rg-paper-200/40 text-xs">{guaranteedGu.path} · {guaranteedGu.rank}</span>
                </div>
              </div>
            )}
            {/* 随机蛊池 */}
            {randomGuPool.length > 0 && (
              <div className="flex items-center gap-3 mb-2">
                <button onClick={handleRerollGu}
                  disabled={guRerollsRemaining <= 0}
                  className={`px-3 py-1 rounded-sm border text-xs transition-colors ${
                    guRerollsRemaining > 0
                      ? 'border-rg-gold/50 text-rg-gold hover:bg-rg-gold/10'
                      : 'border-rg-ink-300/10 text-rg-paper-200/20 cursor-not-allowed'
                  }`}
                >
                  重掷蛊池 ({guRerollsRemaining}次)
                </button>
                <span className="text-rg-paper-200/30 text-[10px]">已选 {selectedGuList.length} 只</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
              {randomGuPool.length === 0 ? (
                <p className="text-rg-paper-200/30 text-xs italic">暂无随机蛊——请先选择势力归属</p>
              ) : (
                randomGuPool.map((gu: GuSelection) => {
                  const isSel = selectedGuList.some(g => g.name === gu.name);
                  return (
                    <button key={gu.name}
                      onClick={() => isSel ? store.deselectStartingGu(gu.name) : store.selectStartingGu(gu)}
                      className={`text-left p-2 rounded-sm border transition-colors ${isSel
                        ? 'border-rg-gold/60 bg-rg-gold/10' : 'border-rg-ink-400/12 bg-rg-ink-800/50 hover:border-rg-gold/30'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-rg-paper-100 font-panel text-xs">{gu.name}</span>
                        <span className="text-rg-paper-200/40 text-[9px]">{gu.path}</span>
                        <span className={`text-[9px] ml-auto ${gu.rank === 'legendary' ? 'text-rg-gold' : gu.rank === 'epic' ? 'text-purple-400' : gu.rank === 'rare' ? 'text-blue-400' : 'text-rg-paper-200/40'}`}>{gu.rank}</span>
                      </div>
                      {gu.description && (
                        <p className="text-rg-paper-200/30 text-[9px] mt-1 leading-tight">
                          {gu.description.length > 40 ? gu.description.slice(0, 40) + '…' : gu.description}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── v1.6: STEP: killermove ─── */}
        {configStep === 'killermove' && isImmortal && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <p className="text-rg-paper-200/60 text-sm font-panel mb-4">
              初始杀招——根据你的流派从匹配杀招中随机呈现，至多选择2条。
            </p>
            {killerMovePool.length === 0 ? (
              <p className="text-rg-paper-200/40 text-sm font-panel">未找到匹配条件的杀招——可能需要先选择道派天赋。</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {killerMovePool.map((km: KillerMoveSelection) => {
                  const isSel = selectedKillerMoves.some(m => m.name === km.name);
                  const atLimit = selectedKillerMoves.length >= 2 && !isSel;
                  return (
                    <button key={km.name}
                      onClick={() => store.selectKillerMove(km)}
                      disabled={atLimit}
                      className={`text-left p-3 rounded-sm border transition-colors ${isSel
                        ? 'border-rg-gold/60 bg-rg-gold/10 ring-1 ring-rg-gold/20' : atLimit
                        ? 'border-rg-ink-400/8 bg-rg-ink-800/20 opacity-40 cursor-not-allowed' : 'border-rg-ink-400/12 bg-rg-ink-800/50 hover:border-rg-gold/30'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-rg-paper-100 font-narrative text-sm">{km.name}</span>
                        <span className="text-rg-paper-200/40 text-[10px]">{km.path}·{km.level}转</span>
                        {isSel && <span className="text-[9px] text-rg-gold ml-auto">已选（点击取消）</span>}
                      </div>
                      <p className="text-rg-paper-200/50 text-[11px] font-panel">{km.effect}</p>
                      <p className="text-rg-paper-200/30 text-[10px] mt-1">核心蛊: {km.coreGu.join('+')} · {km.cost}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: lifebound ─── */}
        {configStep === 'lifebound' && isImmortal && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <p className="text-rg-paper-200/60 text-sm font-panel mb-4">
              你的天赋倾向于以下本命蛊候选。本命蛊将与你血脉相融——选择将不可更改。
            </p>
            {(!guCandidates || guCandidates.length === 0) ? (
              <p className="text-rg-paper-200/40 text-sm font-panel">请先选择至少一个绑定道派的天赋。</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {guCandidates.map((name, i) => {
                  const isSelected = lifeboundGu?.guName === name;
                  return (
                    <button key={name} onClick={() => store.selectLifeboundGu({
                      guName: name, tier: selectedNode.startingRealm.grand,
                      path: (() => {
                        const matchingTalent = talentPool.find(t => t.lifeboundGuCandidates?.includes(name));
                        return matchingTalent?.primaryPathRecommendation || '通用';
                      })(),
                      rarity: i === 0 ? '稀有' : '罕见', description: `${name}——本命仙蛊`
                    })}
                    className={`text-left p-4 rounded-sm border transition-colors ${isSelected
                      ? 'border-rg-gold/60 bg-rg-gold/10' : 'border-rg-ink-400/12 bg-rg-ink-800/50 hover:border-rg-gold/30'}`}
                    >
                      <span className="text-rg-paper-100 font-narrative">{name}</span>
                      <span className="text-rg-paper-200/40 text-xs font-panel ml-2">
                        {i === 0 ? '推荐' : '备选'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: aperture ─── */}
        {configStep === 'aperture' && isImmortal && aperturePoints && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <p className="text-rg-paper-200/60 text-sm font-panel mb-4">
              分配自由点数: <span className="text-rg-gold font-bold">{apertureRemaining}</span>
            </p>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: '面积', unit: '万亩', val: localAperture.areaMu, min: 100, max: 900, step: 100, key: 'areaMu' as const, cost: 1, desc: '小≤300 / 中400-600 / 上700-900' },
                { label: '资源节点', unit: '个', val: localAperture.resourceNodes, min: 1, max: 6, step: 1, key: 'resourceNodes' as const, cost: 2, desc: '决定每回合蛊材产出种类和数量' },
                { label: '流速比', unit: ':1', val: localAperture.timeFlowRatio, min: 5, max: 33, step: 1, key: 'timeFlowRatio' as const, cost: 3, desc: '小1:5-8 / 中1:10-20 / 上1:20-33' },
                { label: '防御阵法', unit: '级', val: localAperture.defenseLevel, min: 0, max: 3, step: 1, key: 'defenseLevel' as const, cost: 3, desc: '影响天灾抵抗能力' },
              ].map(row => {
                const currentCost = row.key === 'areaMu'
                  ? Math.floor((row.val - 100) / 100) * row.cost
                  : row.key === 'timeFlowRatio'
                  ? Math.round(((row.val - 1.0) / 0.2)) * row.cost
                  : row.val * row.cost;
                const canUpgrade = apertureRemaining >= row.cost && row.val < row.max;
                const canDowngrade = row.val > row.min;
                return (
                  <div key={row.key} className="flex items-center justify-between bg-rg-ink-800/50 p-3 rounded-sm">
                    <div>
                      <span className="text-rg-paper-200 text-sm font-panel">{row.label}</span>
                      <span className="text-rg-paper-200/30 text-xs ml-2">{currentCost}pts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => {
                        if (row.val > row.min) setLocalAperture(prev => {
                          const newVal = row.key === 'timeFlowRatio'
                            ? Math.max(row.min, +(prev[row.key] - row.step).toFixed(1))
                            : prev[row.key] - row.step;
                          return { ...prev, [row.key]: newVal };
                        });
                      }} disabled={!canDowngrade}
                      className="text-rg-paper-200/40 disabled:opacity-20 text-sm px-2">−</button>
                      <span className="text-rg-paper-100 font-bold min-w-[3ch] text-center">
                        {row.key === 'timeFlowRatio' ? row.val.toFixed(1) : row.val}
                        <span className="text-rg-paper-200/30 text-xs ml-0.5">{row.unit}</span>
                      </span>
                      <button onClick={() => {
                        if (apertureRemaining >= row.cost && row.val < row.max) setLocalAperture(prev => {
                          const newVal = row.key === 'timeFlowRatio'
                            ? Math.min(row.max, +(prev[row.key] + row.step).toFixed(1))
                            : prev[row.key] + row.step;
                          return { ...prev, [row.key]: newVal };
                        });
                      }} disabled={!canUpgrade}
                      className="text-rg-gold disabled:opacity-20 text-sm px-2">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP: resource ─── */}
        {configStep === 'resource' && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6">
            <h3 className="text-rg-paper-200 text-sm font-panel mb-4">初始资源配置</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                <span className="text-rg-paper-200/70 text-sm font-panel">元石</span>
                <span className="text-rg-gold font-bold font-panel">
                  {isImmortal ? yuanStone.toLocaleString() + ' 仙元' : yuanStone.toLocaleString() + ' 元石'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                <span className="text-rg-paper-200/70 text-sm font-panel">空窍容量</span>
                <span className="text-rg-paper-100 font-bold font-panel">{selectedNode.baseCapacity} 只</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                <span className="text-rg-paper-200/70 text-sm font-panel">境界</span>
                <span className="text-rg-paper-100 font-bold font-panel">
                  {selectedNode.startingRealm.grand}转{selectedNode.startingRealm.sub}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                <span className="text-rg-paper-200/70 text-sm font-panel">所在域</span>
                <span className="text-rg-paper-100 font-bold font-panel">{selectedDomain || selectedNode.domain}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                <span className="text-rg-paper-200/70 text-sm font-panel">天赋数</span>
                <span className="text-rg-gold font-bold font-panel">{timelineTalents.length}</span>
              </div>
              {factionId && (
                <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                  <span className="text-rg-paper-200/70 text-sm font-panel">势力</span>
                  <span className="text-rg-paper-100 font-bold font-panel">{factionId.replace(/_/g, '')}</span>
                </div>
              )}
              {selectedGuList.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                  <span className="text-rg-paper-200/70 text-sm font-panel">初始蛊虫</span>
                  <span className="text-rg-gold font-bold font-panel text-xs">{selectedGuList.map(g => g.name).join('、')}</span>
                </div>
              )}
              {selectedKillerMoves.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                  <span className="text-rg-paper-200/70 text-sm font-panel">初始杀招</span>
                  <span className="text-rg-gold font-bold font-panel text-xs">{selectedKillerMoves.map(m => m.name).join('、')}</span>
                </div>
              )}
              {lifeboundGu && (
                <div className="flex justify-between items-center p-3 bg-rg-ink-800/50 rounded-sm">
                  <span className="text-rg-paper-200/70 text-sm font-panel">本命蛊</span>
                  <span className="text-rg-gold font-bold font-panel">{lifeboundGu.guName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 底部按钮 ─── */}
        <div className="flex justify-between mt-6 pb-12">
          <button onClick={goBack}
            className="text-rg-paper-200/50 hover:text-rg-paper-200/80 text-xs font-button px-4 py-2 border border-rg-ink-300/20 rounded-sm">
            上一步
          </button>
          <button onClick={goNext}
            className="bg-rg-gold text-rg-ink-900 font-button font-semibold px-6 py-2 rounded-sm
                       hover:brightness-115 transition-micro">
            {configStep === 'resource' || (!isImmortal && configStep === 'talent') ? '确认配置' : '下一步'}
          </button>
        </div>
      </div>
      ) : (
        <div className="text-center">
          <p className="text-rg-paper-200/40 font-narrative text-lg">没有选中时间线节点</p>
          <button onClick={onBack}
            className="mt-4 text-rg-gold/60 hover:text-rg-gold font-button text-sm px-4 py-2 border border-rg-gold/20 rounded-sm transition-micro">
            返回选择
          </button>
        </div>
      )}
    </div>
  );
}
