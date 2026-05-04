/**
 * ═══ 自创杀招面板 — B2.3 ═══
 * 选择核心蛊 → 推荐辅助蛊 → 计算成功率 → 创招
 */
import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import type { KillMove, GuInstance, PathType } from '../../types';

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

export function KillMoveCreationPanel() {
  const inventory = useStore(s => s.inventory);
  const learnKillMove = useStore(s => s.learnKillMove);
  const killMoves = useStore(s => s.killMoves);
  const daoMarks = useStore(s => (s as any).pathBuild?.dao_marks || {}) as Record<string, number>;
  const talents = useStore(s => (s as any).selectedTalents || []) as any[];

  const [step, setStep] = useState<'select_core' | 'select_support' | 'confirm'>('select_core');
  const [selectedCore, setSelectedCore] = useState<GuInstance | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<GuInstance[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 可选核心蛊（非dead、有active）
  const coreCandidates = useMemo(() =>
    inventory.filter(g => g.currentState !== 'dead' && (g as any).active !== false),
  [inventory]);

  // 基于核心蛊推荐辅助蛊：同流派或互补流派
  const supportCandidates = useMemo(() => {
    if (!selectedCore) return [];
    const corePath = selectedCore.path as string;
    const compatible = COMPATIBLE_PATHS[corePath] || [];
    return inventory.filter(g =>
      g.id !== selectedCore.id &&
      g.currentState !== 'dead' &&
      (g.path === corePath || compatible.includes(g.path as string)),
    );
  }, [inventory, selectedCore]);

  // 创招成功率
  const successRate = useMemo(() => {
    if (!selectedCore || selectedSupport.length === 0) return 0;
    const corePath = selectedCore.path as string;
    const lianDao = daoMarks['炼道'] || 0;
    const pathDao = daoMarks[corePath] || 0;
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
  }, [selectedCore, selectedSupport, daoMarks, talents]);

  // 识别已知的流派名称（用于通用名避让）
  const allPaths = [...new Set(inventory.map(g => g.path as string))];

  // 执行创招
  const handleCreate = () => {
    if (!selectedCore || selectedSupport.length === 0) return;

    const roll = Math.random();
    const success = roll < successRate;

    if (success) {
      const corePath = selectedCore.path as PathType;
      const coreNames = [selectedCore, ...selectedSupport].filter(g => (g.path as string) === corePath);
      const keyword = coreNames.length >= 2 ? '连环' : coreNames.length >= 1 ? '强化' : '基础';
      const autoName = `${corePath}·${keyword}`;

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
      };

      learnKillMove(newMove);
    }

    setStep('confirm');
    setTimeout(() => { setIsOpen(false); setStep('select_core'); setSelectedCore(null); setSelectedSupport([]); }, 2000);
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
                {supportCandidates.map(gu => (
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
                      <span className="text-rg-paper-100 font-narrative text-xs">{gu.name}</span>
                      <span className="text-[10px] text-rg-paper-200/50">{gu.tier}转·{gu.path}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedSupport.length > 0 && (
                <div className="bg-rg-ink-800/50 p-3 rounded-sm">
                  <p className="text-rg-paper-200/60 text-xs font-panel">
                    成功率: <span className="text-rg-gold font-semibold">{Math.round(successRate * 100)}%</span>
                  </p>
                  <button onClick={handleCreate}
                    disabled={selectedSupport.length === 0}
                    className="mt-2 w-full text-xs font-button px-3 py-2 rounded-sm bg-rg-gold/20 border border-rg-gold/40 text-rg-gold hover:bg-rg-gold/30 transition-micro disabled:opacity-30 disabled:cursor-not-allowed">
                    尝试创招
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
          {step === 'confirm' && (
            <div className="text-center py-8">
              <p className="text-rg-gold font-narrative text-lg mb-2">
                {successRate > 0.3 ? '创招成功！' : '创招失败……'}
              </p>
              <p className="text-rg-paper-200/50 text-xs font-panel">
                {successRate > 0.3
                  ? `获得新杀招「${selectedCore?.path}·强化」（成功率${Math.round(successRate * 100)}%）`
                  : `蛊虫寿命部分损耗，下次尝试成功率+5%`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
