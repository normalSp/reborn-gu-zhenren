import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store';
import type { CombatConstraint, CombatEventCandidate } from '../../types';
import { scaleLabel } from '../../engine/v080-narrative-combat-orchestration';
import { buildV017OutcomeBackflowView } from '../../engine/v017-combat-deepening';

interface NarrativeCombatPanelProps {
  onSelectStrategem?: (strategy: string) => void;
}

const EMPTY_COMBAT_EVENT_CANDIDATES: CombatEventCandidate[] = [];

function rewardPolicyCopy(policy?: string): { label: string; detail: string; tone: 'gold' | 'jade' | 'paper' } {
  if (policy === 'local_engine_only') {
    return {
      label: '本地引擎结算',
      detail: '胜负、损耗和回流由战斗引擎决定，本候选不直接发放蛊虫、蛊材、声望或地点解锁。',
      tone: 'gold',
    };
  }
  if (policy === 'candidate_clue_only' || policy === 'rumor_only') {
    return {
      label: '候选线索',
      detail: '只可生成线索或传闻，不能作为正式掉落、奖励池或商店来源。',
      tone: 'jade',
    };
  }
  if (policy) {
    return {
      label: policy,
      detail: '奖励仍需对应本地注册表和战斗结算复核。',
      tone: 'paper',
    };
  }
  return {
    label: '未登记',
    detail: '未登记奖励策略前，只能作为危险提示或剧情候选。',
    tone: 'paper',
  };
}

function rewardPolicyClass(tone: 'gold' | 'jade' | 'paper'): string {
  if (tone === 'gold') return 'border-rg-gold/25 bg-rg-gold/10 text-rg-gold';
  if (tone === 'jade') return 'border-rg-jade-500/25 bg-rg-jade-600/10 text-rg-jade-300';
  return 'border-rg-ink-300/20 bg-rg-ink-900/30 text-rg-paper-200/55';
}

export function NarrativeCombatPanel({ onSelectStrategem }: NarrativeCombatPanelProps) {
  const {
    cc,
    setCC,
    setFlag,
    turn,
    realm,
    guInventory,
    combatEventCandidates,
    acceptCombatEventCandidate,
    combatEncounterState,
  } = useStore(useShallow((s: any) => ({
    cc: s.transientCombatConstraint as CombatConstraint | null,
    setCC: s.setTransientCombatConstraint as ((c: CombatConstraint | null) => void) | undefined,
    setFlag: s.setFlag as ((key: string, value: any) => void) | undefined,
    turn: s.turn as number | undefined,
    realm: s.realm as string | undefined,
    guInventory: s.gu_inventory as any[] | undefined,
    combatEventCandidates: (s.flags?.combatEventCandidates || EMPTY_COMBAT_EVENT_CANDIDATES) as CombatEventCandidate[],
    acceptCombatEventCandidate: s.acceptCombatEventCandidate as ((id: string) => boolean) | undefined,
    combatEncounterState: s.combatEncounterState as any,
  })));

  const formalCandidates = useMemo(
    () => combatEventCandidates
      .filter(candidate => candidate?.id && candidate.engineValidation !== 'accepted')
      .slice(-4)
      .reverse(),
    [combatEventCandidates],
  );

  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const shouldShow = Boolean(cc) || formalCandidates.length > 0 || combatEncounterState?.outcomeSummary;
    if (shouldShow) {
      setVisible(true);
      const t = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(t);
    }

    setShowContent(false);
    const t = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(t);
  }, [cc, formalCandidates.length, combatEncounterState?.outcomeSummary]);

  if (!visible) return null;

  const handleDismiss = () => {
    setCC?.(null);
    setShowContent(false);
    setTimeout(() => setVisible(false), 180);
  };

  if (cc) {
    return (
      <LegacyCombatStrategyPanel
        cc={cc}
        realm={realm}
        guInventory={guInventory}
        turn={turn}
        setCC={setCC}
        setFlag={setFlag}
        onSelectStrategem={onSelectStrategem}
        showContent={showContent}
      />
    );
  }

  const v017OutcomeBackflow = combatEncounterState?.outcomeSummary
    ? buildV017OutcomeBackflowView(combatEncounterState.outcomeSummary)
    : null;

  return (
    <div
      className="fixed inset-0 z-45 flex items-end justify-center px-3 pb-3 sm:pb-6 transition-all duration-300 pointer-events-none"
      style={{ backgroundColor: showContent ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0)' }}
      data-testid="narrative-combat-panel"
    >
      <div
        className="w-full max-w-xl rounded-xl overflow-hidden pointer-events-auto transition-all duration-300 max-h-[82vh] overflow-y-auto"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          backgroundColor: 'var(--gu-bg-standard)',
          border: '1px solid var(--gu-trace-gold-dim)',
          boxShadow: 'var(--gu-shadow-lg)',
        }}
      >
        <div className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <div className="text-sm font-bold text-rg-gold-400">剧情战斗候选</div>
              <div className="text-[11px] text-rg-paper-200/45 mt-1">
                DeepSeek 只提出敌情，本地引擎决定能否入场、胜负与战后回流。
              </div>
            </div>
            <button
              className="text-xs text-rg-paper-200/45 hover:text-rg-paper-100 transition-micro"
              onClick={handleDismiss}
            >
              收起
            </button>
          </div>

          {combatEncounterState?.outcomeSummary && (
            <div className="mb-3 rounded-lg border border-rg-jade-500/25 bg-rg-jade-600/10 p-3" data-testid="battle-outcome-summary">
              <div className="text-xs font-semibold text-rg-jade-300">战后回流已写入场景账本</div>
              <div className="mt-1 text-xs text-rg-paper-200/70 leading-relaxed">
                {combatEncounterState.outcomeSummary.summary}
              </div>
              {v017OutcomeBackflow && (
                <div className="mt-2 rounded-md border border-rg-ink-300/14 bg-rg-ink-900/28 p-2" data-testid="v017-combat-outcome-backflow">
                  <div className="text-[11px] font-semibold text-rg-gold">{v017OutcomeBackflow.title}</div>
                  <div className="mt-1 space-y-1">
                    {v017OutcomeBackflow.lines.slice(1, 4).map((line, index) => (
                      <div key={`${v017OutcomeBackflow.id}_${index}`} className="line-clamp-1 text-[10px] text-rg-paper-200/52">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 line-clamp-1 text-[10px] text-rg-blood-400/55">{v017OutcomeBackflow.boundary}</div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {formalCandidates.length === 0 && (
              <div className="rounded-lg border border-rg-ink-300/20 bg-rg-ink-900/30 p-3 text-xs text-rg-paper-200/45">
                暂无可进入的剧情战斗候选。
              </div>
            )}
            {formalCandidates.map(candidate => {
              const validation = candidate.entryValidation;
              const spec = validation?.spec;
              const blocked = candidate.engineValidation === 'blocked'
                || candidate.engineValidation === 'downgraded'
                || validation?.valid === false;
              const rewardPolicy = rewardPolicyCopy(candidate.dropPolicyId || spec?.dropPolicyId);
              const blockers = [...(validation?.blockers || [])];
              const warnings = [...new Set([
                ...(validation?.warnings || []),
                ...((candidate.validationIssues || []).filter(issue => !blockers.includes(issue))),
              ])];
              return (
                <div
                  key={candidate.id}
                  className="rounded-lg border border-rg-ink-300/20 bg-rg-ink-900/40 p-3"
                  data-testid="narrative-combat-candidate"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={blocked ? 'rg-chip rg-chip--blood' : 'rg-chip rg-chip--gold'}>
                          {blocked ? '危险提示' : '进入战斗'}
                        </span>
                        <span className={`rg-chip ${validation?.valid ? 'rg-chip--jade' : 'rg-chip--blood'}`}>
                          {validation ? (validation.valid ? '入口校验通过' : '入口校验阻断') : '等待校验'}
                        </span>
                        <span className="text-sm font-bold text-rg-paper-100">{candidate.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-rg-paper-200/60 leading-relaxed">{candidate.summary}</p>
                    </div>
                    <div className="text-right text-[11px] text-rg-paper-200/50">
                      <div>{spec ? scaleLabel(spec.scale) : '待校验'}</div>
                      <div className={candidate.risk === 'high' ? 'text-rg-blood-300' : 'text-rg-gold'}>
                        风险 {candidate.risk || 'medium'}
                      </div>
                    </div>
                  </div>

                  {spec && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-rg-paper-200/55">
                      <div>敌情：{spec.enemyHint}</div>
                      <div>可用蛊虫：{spec.availableGu.slice(0, 3).join('、') || '无登记凡战蛊'}</div>
                      <div>杀招：{spec.availableKillerMoves.slice(0, 2).join('、') || '无'}</div>
                    </div>
                  )}

                  <div
                    className={`mt-2 rounded-md border p-2 text-[11px] leading-relaxed ${rewardPolicyClass(rewardPolicy.tone)}`}
                    data-testid="narrative-combat-reward-boundary"
                  >
                    <div className="font-semibold">奖励边界：{rewardPolicy.label}</div>
                    <div className="mt-0.5 opacity-80">{rewardPolicy.detail}</div>
                  </div>

                  {blockers.length > 0 && (
                    <div className="mt-2 text-[11px] text-rg-blood-300/80" data-testid="narrative-combat-blockers">
                      {blockers.join('；')}
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="mt-2 text-[11px] text-rg-gold/75" data-testid="narrative-combat-warnings">
                      {warnings.join('；')}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-micro ${
                        blocked
                          ? 'border border-rg-ink-300/20 text-rg-paper-200/35'
                          : 'bg-rg-gold/80 text-rg-ink-900 hover:bg-rg-gold'
                      }`}
                      disabled={blocked}
                      onClick={() => candidate.id && acceptCombatEventCandidate?.(candidate.id)}
                      data-testid="enter-combat-candidate"
                    >
                      {blocked ? '已降级' : '进入战斗'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegacyCombatStrategyPanel(props: {
  cc: CombatConstraint;
  realm?: string;
  guInventory?: any[];
  turn?: number;
  setCC?: (c: CombatConstraint | null) => void;
  setFlag?: (key: string, value: any) => void;
  onSelectStrategem?: (strategy: string) => void;
  showContent: boolean;
}) {
  const { cc, realm, guInventory, turn, setCC, setFlag, onSelectStrategem, showContent } = props;
  const realmNum = realmToNum(realm || '一转蛊师');
  const realmDiff = realmNum - (cc.recommendedRealm || 2);
  const baseChance = cc.baseChance || 0.5;
  const realmWeight = cc.statBridge?.realmWeight || 0.15;
  const guTags = guInventory?.flatMap((g: any) => (cc.statBridge?.guTagInfluence || [])
    .filter((t: any) => t.tag === g.path)
    .map((t: any) => t.bonus)) || [];
  const guBonus = guTags.reduce((sum: number, value: number) => sum + (value || 0), 0);
  const successChance = Math.max(0.05, Math.min(0.95, baseChance + realmDiff * realmWeight + guBonus));
  const chanceColor = successChance >= 0.7
    ? 'var(--gu-life-verdant)'
    : successChance >= 0.4
      ? 'var(--gu-trace-gold)'
      : 'var(--gu-life-crimson)';
  const riskLabel = successChance >= 0.7 ? '高胜算' : successChance >= 0.4 ? '有风险' : '极大风险';
  const strategyCount = Math.min(cc.strategicChoiceCount || 2, 4);

  const handleSelect = (strategyLabel: string) => {
    setCC?.(null);
    setFlag?.('_lastCombatStrategy', {
      strategy: strategyLabel,
      sceneId: cc.sceneId || cc.scale || 'narrative',
      turn: turn || 1,
    });
    onSelectStrategem?.(`combat_strategy_${strategyLabel}`);
  };

  return (
    <div
      className="fixed inset-0 z-45 flex items-end justify-center px-3 pb-3 sm:pb-6 transition-all duration-300 pointer-events-none"
      style={{ backgroundColor: showContent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0)' }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden pointer-events-auto transition-all duration-300 max-h-[82vh] overflow-y-auto"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          backgroundColor: 'var(--gu-bg-standard)',
          border: '1px solid var(--gu-trace-gold-dim)',
          boxShadow: 'var(--gu-shadow-lg)',
        }}
      >
        <div className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="text-sm font-bold text-rg-gold-400">
              {cc.scale === 'battle' ? '大规模战斗' : '战斗遭遇'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-rg-paper-200/40">成功概率</span>
              <span className="text-sm font-bold" style={{ color: chanceColor }}>{Math.round(successChance * 100)}%</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--gu-bg-elevated)', color: chanceColor, border: `1px solid ${chanceColor}` }}
              >
                {riskLabel}
              </span>
            </div>
          </div>

          {cc.narrativeStyle && (
            <div className="text-xs text-rg-paper-200/60 mb-3 leading-relaxed">
              {cc.narrativeStyle.substring(0, 220)}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: strategyCount }, (_, i) => {
              const labels = ['正面迎战', '迂回作战', '埋伏设陷', '观察待机'];
              const risks = [
                '高风险，直面敌人主力',
                '中等风险，需要地形优势',
                '中等风险，需要判断时机',
                '低风险，但可能错失战机',
              ];
              const label = labels[i] || `选项${i + 1}`;
              return (
                <button
                  key={label}
                  className="min-h-14 py-2 px-2 rounded-lg text-xs font-panel font-medium transition-all duration-150 cursor-pointer active:scale-95 text-center"
                  style={{ backgroundColor: 'var(--gu-trace-gold-dim)', color: 'var(--gu-trace-gold)', border: '1px solid var(--gu-trace-gold)' }}
                  onClick={() => handleSelect(label)}
                >
                  <div>{label}</div>
                  <div className="text-[10px] text-rg-paper-200/40 mt-0.5">{risks[i] || ''}</div>
                </button>
              );
            })}
          </div>

          <button
            className="w-full mt-3 py-1.5 rounded-lg text-xs font-panel text-rg-paper-200/40 hover:text-rg-paper-200/70 transition-all cursor-pointer"
            onClick={() => setCC?.(null)}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function realmToNum(realm: string): number {
  const map: Record<string, number> = {
    凡人: 0,
    一转蛊师: 1,
    二转蛊师: 2,
    三转蛊师: 3,
    四转蛊师: 4,
    五转蛊师: 5,
  };
  return map[realm] ?? 1;
}
