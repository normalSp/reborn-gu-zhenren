/**
 * ═══ 自创杀招面板 — B2.3 + v0.7.0 凡/仙分流 ═══
 * 选择核心蛊 → 推荐辅助蛊 → 计算成功率(凡/仙分流) → 创招
 */
import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import type { KillMove, GuInstance, PathType, PathLevel } from '../../types';
import { checkKillMoveGuCompatibility, suggestGuForKillMove, getKillMoveGuSlots } from '../../engine/killmove-bridge';

/** 流派互补充系映射（用于辅助蛊推荐） */
const COMPATIBLE_PATHS: Record<string, string[]> = {
  '金道': ['土道', '力道'], '木道': ['水道', '毒道'], '水道': ['冰道', '木道'],
  '火道': ['风道', '土道'], '土道': ['金道', '火道'], '风道': ['火道', '雷道'],
  '雷道': ['金道', '风道'], '冰道': ['水道', '风道'], '力道': ['土道', '金道'],
  '魂道': ['暗道', '智道'], '血道': ['力道', '毒道'], '智道': ['光道', '魂道'],
  '光道': ['火道', '智道'], '暗道': ['魂道', '骨道'], '毒道': ['木道', '血道'],
  '骨道': ['暗道', '土道'], '奴道': ['魂道', '力道'], '食道': ['木道', '水道'],
  '偷道': ['暗道', '风道'], '变化道': ['水道', '火道'],
  '炼道': ['金道', '火道'], '剑道': ['金道', '力道'],
};

const _KC_EMPTY_OBJ = Object.freeze({});
const _KC_EMPTY_ARR: readonly never[] = Object.freeze([]);

export function KillMoveCreationPanel() {
  const inventory = useStore(s => s.inventory);
  const learnKillMove = useStore(s => s.learnKillMove);
  const killMoves = useStore(s => s.killMoves);
  const daoMarks = useStore(s => (s as any).pathBuild?.dao_marks || _KC_EMPTY_OBJ) as Record<string, number>;
  const pathLevels = useStore(s => (s as any).pathBuild?.path_levels || _KC_EMPTY_OBJ) as Record<string, PathLevel>;
  const realmGrand = useStore(s => (s as any).profile?.realm?.grand || (s as any).vitals?.realmGrand || 2) as number;
  const playerHp = useStore(s => (s as any).vitals?.health?.current || (s as any).hp || 100) as number;
  const applyHpDelta = useStore(s => (s as any).applyHpDelta) as ((delta: number) => void) | undefined;
  const talents = useStore(s => (s as any).selectedTalents || _KC_EMPTY_ARR) as any[];

  const [step, setStep] = useState<'select_core' | 'select_support' | 'confirm'>('select_core');
  const [selectedCore, setSelectedCore] = useState<GuInstance | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<GuInstance[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  /** 🆕 存储创招的实际掷骰结果（区别于显示的成功率概率） */
  const [creationResult, setCreationResult] = useState<{
    success: boolean; rolled: number; rate: number; autoName: string; reason?: string;
  } | null>(null);

  // 可选核心蛊（非dead、有active）
  const coreCandidates = useMemo(() =>
    inventory.filter(g => g.currentState !== 'dead' && (g as any).active !== false),
  [inventory]);

  // 基于核心蛊推荐辅助蛊：同流派或互补流派
  const supportCandidates = useMemo(() => {
    if (!selectedCore) return [];
    const corePath = selectedCore.path as string;
    const compatible = COMPATIBLE_PATHS[corePath] || [];
    const filtered = inventory.filter(g =>
      g.id !== selectedCore.id &&
      g.currentState !== 'dead' &&
      (g.path === corePath || compatible.includes(g.path as string)),
    );
    // Fix#2: 为每个候选蛊附加兼容性信息
    return filtered.map(g => {
      const compat = checkKillMoveGuCompatibility(
        { path: corePath, level: selectedCore.tier } as KillMove,
        g,
      );
      return { ...g, _compatible: compat.compatible, _compatReason: compat.reason };
    }) as (GuInstance & { _compatible: boolean; _compatReason?: string })[];
  }, [inventory, selectedCore]);

  // Fix#2: 根据当前核心蛊推荐最优辅助蛊（用于排序提示）
  const suggestedGuIds = useMemo(() => {
    if (!selectedCore) return new Set<string>();
    const suggestions = suggestGuForKillMove(
      supportCandidates as GuInstance[],
      { path: selectedCore.path as PathType, level: selectedCore.tier } as KillMove,
      5,
    );
    return new Set(suggestions.map(g => g.id));
  }, [selectedCore, supportCandidates]);

  // ═══ v0.7.0: 创招成功率 — 凡/仙级分流 ═══
  const successRate = useMemo(() => {
    if (!selectedCore || selectedSupport.length === 0) return 0;
    const corePath = selectedCore.path as string;
    const lianDao = daoMarks['炼道'] || 0;
    const pathDao = daoMarks[corePath] || 0;
    const isImmortalCreator = realmGrand >= 6;
    const killMoveLevel = isImmortalCreator ? Math.max(6, selectedCore.tier) : selectedCore.tier;
    const isImmortalKillMove = killMoveLevel >= 6;

    // ═══ 仙级杀招创建：道痕门槛 + 流派境界门槛 ═══
    if (isImmortalKillMove) {
      // 仙级杀招需要对应流派道痕≥300
      if (pathDao < 300) return 0; // 道痕不足，无法创招
      // 仙级杀招需要流派境界≥大师
      const currentPathLevel = pathLevels[corePath] || '普通';
      const pathLevelRank: Record<string, number> = {
        '普通': 0, '大师': 1, '宗师': 2, '大宗师': 3, '准无上': 4, '无上': 5, '道主': 6,
      };
      if ((pathLevelRank[currentPathLevel] || 0) < 1) return 0; // 流派境界不足

      // 仙级成功率：极低基础 + 道痕/炼道加成（上限15%）
      let rate = (lianDao * 0.01 + (pathDao - 300) * 0.0002);
      // 蛊虫契合度
      const samePathCount = [selectedCore, ...selectedSupport]
        .filter(g => (g.path as string) === corePath).length;
      const totalCount = selectedSupport.length + 1;
      const matchRatio = samePathCount / totalCount;
      rate += matchRatio * 0.05;
      // 天赋加成（减半）
      const hasCreator = talents.some((t: any) => t.id === 'talent_killmove_creator' || t.id?.includes('killer'));
      if (hasCreator) rate += 0.05;
      return Math.min(0.15, Math.max(0.01, rate));
    }

    // ═══ 凡级杀招创建：宽松公式（最低5%，最高85%） ═══
    let rate = lianDao * 0.05 + pathDao * 0.03;

    // 蛊虫契合度
    const samePathCount = [selectedCore, ...selectedSupport]
      .filter(g => (g.path as string) === corePath).length;
    const totalCount = selectedSupport.length + 1;
    const matchRatio = samePathCount / totalCount;
    rate += matchRatio * 0.20;

    // 天赋加成
    const hasCreator = talents.some((t: any) => t.id === 'talent_killmove_creator' || t.id?.includes('killer'));
    const hasPathMaster = talents.some((t: any) =>
      t.primaryPathRecommendation === corePath || t.id?.includes('path_master'));
    if (hasCreator) rate += 0.20;
    if (hasPathMaster) rate += 0.15;

    return Math.min(0.85, Math.max(0.05, rate));
  }, [selectedCore, selectedSupport, daoMarks, pathLevels, realmGrand, talents]);

  // 识别已知的流派名称（用于通用名避让）
  const allPaths = [...new Set(inventory.map(g => g.path as string))];

  // 执行创招
  const handleCreate = () => {
    if (!selectedCore || selectedSupport.length === 0) return;

    const corePath = selectedCore.path as PathType;
    const coreNames = [selectedCore, ...selectedSupport].filter(g => (g.path as string) === corePath);
    const keyword = coreNames.length >= 2 ? '连环' : coreNames.length >= 1 ? '强化' : '基础';
    const autoName = `${corePath}·${keyword}`;

    // 🆕 重复检测：检查是否已存在相同蛊虫组合（coreGu排序后比对）
    const newCoreGu = [selectedCore.name, ...selectedSupport.map(s => s.name)].sort();
    const dup = killMoves.find(km => {
      if (!km.coreGu || km.coreGu.length !== newCoreGu.length) return false;
      const sorted = [...km.coreGu].sort();
      return sorted.every((g, i) => g === newCoreGu[i]);
    });
    if (dup) {
      setCreationResult({
        success: false, rolled: -1, rate: successRate, autoName,
        reason: `已存在相同蛊虫组合的杀招「${dup.name}」，无法重复创建`,
      });
      setStep('confirm');
      return;
    }

    const roll = Math.random();
    const success = roll < successRate;

    // ═══ v0.7.0: 仙级杀招创招失败反噬 ═══
    const isImmortalKillMove = realmGrand >= 6 || selectedCore.tier >= 6;
    if (!success && isImmortalKillMove && successRate > 0) {
      // 失败反噬：扣除当前HP的20-40%
      const backlashPct = 0.2 + Math.random() * 0.2;
      const backlashDmg = Math.round(playerHp * backlashPct);
      if (applyHpDelta) {
        applyHpDelta(-backlashDmg);
      }
      // 额外：创招冷却惩罚（可通过flag记录）
      const store = useStore.getState() as any;
      if (typeof store.setFlag === 'function') {
        store.setFlag('killmove_creation_backlash', Date.now());
      }
      setCreationResult({
        success: false, rolled: roll, rate: successRate, autoName,
        reason: `创招反噬！流派冲突导致仙元暴走，扣除HP ${backlashDmg}（${Math.round(backlashPct * 100)}%）`,
      });
      setStep('confirm');
      return;
    }

    if (success) {
      const newMove: KillMove = {
        id: `created_${Date.now()}`,
        name: autoName,
        path: corePath,
        level: selectedCore.tier,
        baseCost: selectedCore.tier * 10,
        multiplier: 1.5 + selectedCore.tier * 0.3,
        cooldown: Math.max(1, 8 - selectedCore.tier),
        description: `自创杀招——${autoName}（${selectedCore.name}+${selectedSupport.map(s => s.name).join('+')}）`,
        coreGu: [selectedCore.name, ...selectedSupport.map(s => s.name)],
        supportGu: selectedSupport.map(s => s.name),
        source: 'created',
        proficiency: 0,
        usageCount: 0,
        evolutionStage: 0,
        canTeach: false,
        isImmortal: isImmortalKillMove,
      };

      learnKillMove(newMove);
    }

    setCreationResult({ success, rolled: roll, rate: successRate, autoName });
    setStep('confirm');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-[9px] font-button px-2 py-1 rounded-sm border border-rg-gold/25 text-rg-gold/70 hover:bg-rg-gold/10 bg-rg-ink-800/50 transition-micro"
      >
        自创杀招
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rg-ink-900/85 backdrop-blur-sm">
      <div className="bg-rg-ink-700/95 border border-rg-gold/30 rounded-lg w-full max-w-md max-h-[85vh] flex flex-col mx-4 overflow-hidden">
        {/* 标题 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rg-gold/20 bg-rg-ink-800/50">
          <h3 className="text-rg-gold font-narrative text-sm">自创杀招</h3>
          <button onClick={() => setIsOpen(false)} className="text-rg-paper-200/40 hover:text-rg-paper-200/80 text-xs font-button">关闭</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Step 1: 选择核心蛊 */}
          {step === 'select_core' && (
            <>
              <p className="text-rg-paper-200/50 text-xs font-panel">选择一只核心蛊作为杀招根基（将决定杀招流派和主要效果）</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {coreCandidates.map(gu => (
                  <button key={gu.id} onClick={() => { setSelectedCore(gu); setStep('select_support'); }}
                    className={`w-full text-left p-3 rounded-sm border transition-colors ${
                      selectedCore?.id === gu.id ? 'border-rg-gold/60 bg-rg-gold/10' : 'border-rg-ink-300/10 hover:border-rg-gold/30'
                    }`}>
                    <div className="flex justify-between">
                      <span className="text-rg-paper-100 font-narrative text-sm">{gu.name}</span>
                      <span className="text-[10px] text-rg-paper-200/50">{gu.tier}转·{gu.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: 选择辅助蛊 */}
          {step === 'select_support' && (
            <>
              <p className="text-rg-paper-200/50 text-xs font-panel">
                核心蛊: <span className="text-rg-gold">{selectedCore?.name}</span> ({selectedCore?.path}) —
                选择1-5只辅助蛊增强杀招效果
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {supportCandidates.map(gu => {
                  const isSuggested = suggestedGuIds.has(gu.id);
                  return (
                  <button key={gu.id} onClick={() => {
                    setSelectedSupport(prev =>
                      prev.some(s => s.id === gu.id)
                        ? prev.filter(s => s.id !== gu.id)
                        : prev.length < 5 ? [...prev, gu] : prev
                    );
                  }}
                  className={`w-full text-left p-2 rounded-sm border transition-colors ${
                    selectedSupport.some(s => s.id === gu.id) ? 'border-rg-gold/60 bg-rg-gold/10' : 'border-rg-ink-300/10 hover:border-rg-gold/20'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-rg-paper-100 font-narrative text-xs">{gu.name}</span>
                        {isSuggested && <span className="text-[9px] text-rg-gold/70 border border-rg-gold/30 rounded-sm px-1">推荐</span>}
                        {!gu._compatible && <span className="text-[9px] text-rg-blood-300/70 border border-rg-blood-300/30 rounded-sm px-1" title={gu._compatReason}>非互补</span>}
                      </div>
                      <span className="text-[10px] text-rg-paper-200/50">{gu.tier}转·{gu.path}</span>
                    </div>
                  </button>
                  );
                })}
              </div>

              {selectedSupport.length > 0 && (
                <div className="bg-rg-ink-800/50 p-3 rounded-sm space-y-2">
                  {/* v0.7.0: 凡/仙级标识 */}
                  {realmGrand >= 6 && (
                    <p className="text-[10px] text-rg-gold/80 font-panel border-b border-rg-gold/15 pb-1">
                      【仙级杀招·道痕门槛】需{selectedCore?.path || '未知'}道痕≥300 / 流派境界≥大师
                    </p>
                  )}
                  <p className="text-rg-paper-200/60 text-xs font-panel">
                    成功率: <span className={`font-semibold ${successRate > 0 ? 'text-rg-gold' : 'text-rg-blood-300/70'}`}>{Math.round(successRate * 100)}%</span>
                    {realmGrand >= 6 && successRate === 0 && (
                      <span className="text-[10px] text-rg-blood-300/70 ml-1">（道痕或流派境界不足）</span>
                    )}
                    {realmGrand < 6 && selectedCore && (
                      <span className="text-[10px] text-rg-paper-200/40 ml-1">凡级杀招</span>
                    )}
                  </p>
                  {realmGrand >= 6 && successRate > 0 && (
                    <p className="text-[9px] text-rg-blood-300/60 font-panel">⚠ 失败将遭受反噬：扣除HP 20-40%</p>
                  )}
                  <button onClick={handleCreate}
                    disabled={selectedSupport.length === 0 || successRate === 0}
                    className="mt-2 w-full text-xs font-button px-3 py-2 rounded-sm bg-rg-gold/20 border border-rg-gold/40 text-rg-gold hover:bg-rg-gold/30 transition-micro disabled:opacity-30 disabled:cursor-not-allowed">
                    {successRate === 0 && realmGrand >= 6 ? '条件不足' : '尝试创招'}
                  </button>
                </div>
              )}

              <button onClick={() => { setStep('select_core'); setSelectedSupport([]); }}
                className="w-full text-xs font-button text-rg-paper-200/40 hover:text-rg-paper-200/60 py-1">
                重新选择核心蛊
              </button>
            </>
          )}

          {/* Step 3: 确认结果 */}
          {step === 'confirm' && creationResult && (
            <div className="text-center py-6">
              {/* 重复杀招 */}
              {creationResult.reason ? (
                <>
                  <p className="text-rg-paper-200/70 font-narrative text-base mb-3">创招终止</p>
                  <p className="text-rg-paper-200/50 text-xs font-panel leading-relaxed mb-3">
                    {creationResult.reason}
                  </p>
                </>
              ) : creationResult.success ? (
                <>
                  <p className="text-rg-gold font-narrative text-lg mb-2">创招成功！</p>
                  <p className="text-rg-paper-200/50 text-xs font-panel">
                    {`获得新杀招「${creationResult.autoName}」（成功率${Math.round(creationResult.rate * 100)}%，掷骰结果: ${Math.round(creationResult.rolled * 100)} < ${Math.round(creationResult.rate * 100)}）`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-rg-paper-200/70 font-narrative text-lg mb-2">创招失败……</p>
                  <p className="text-rg-paper-200/50 text-xs font-panel mb-1">
                    灵感未至——蛊虫的配合还不够完美
                  </p>
                  <p className="text-rg-paper-200/30 text-[10px] font-panel">
                    成功率{Math.round(creationResult.rate * 100)}%，掷骰结果: {Math.round(creationResult.rolled * 100)} ≥ {Math.round(creationResult.rate * 100)}
                  </p>
                  <button
                    onClick={() => { setStep('select_support'); setCreationResult(null); }}
                    className="mt-4 text-xs font-button px-4 py-1.5 rounded-sm bg-rg-gold/10 border border-rg-gold/25 text-rg-gold/70 hover:bg-rg-gold/20 transition-micro"
                  >
                    重新尝试
                  </button>
                </>
              )}
              {!creationResult.reason && (
                <button
                  onClick={() => {
                    setIsOpen(false); setStep('select_core'); setSelectedCore(null); setSelectedSupport([]); setCreationResult(null);
                  }}
                  className="mt-4 text-xs font-button text-rg-paper-200/40 hover:text-rg-paper-200/60"
                >
                  关闭
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
