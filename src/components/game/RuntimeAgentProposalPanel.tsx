import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import {
  type V340AgentLayer,
  type V340PostCheckDecision,
} from '../../engine/v340-transient-agent-proposal';
import {
  buildV360TransientAgentMicroExpansion,
  type V360LaneStatus,
} from '../../engine/v360-transient-agent-micro-expansion';

const layerLabel: Record<V340AgentLayer, string> = {
  L2: 'L2 次要意图',
  L3: 'L3 场景关键意图',
};

const decisionLabel: Record<V340PostCheckDecision, string> = {
  approved_expression_candidate: '候选表达',
  rejected_violation: '已阻断',
  needs_user_decision: '待决策',
};

const lifecycleLabel: Record<V360LaneStatus, string> = {
  candidate: '候选',
  rejected: '阻断',
  expired: '过期',
  needs_user_decision: '待决策',
};

const proposalClass: Record<V340AgentLayer, string> = {
  L2: 'border-rg-jade-400/24 bg-rg-jade-500/10',
  L3: 'border-rg-gold-400/28 bg-rg-gold-500/10',
};

export function RuntimeAgentProposalPanel() {
  const [previewLane, setPreviewLane] = useState(0);
  const regionalEventLedger = useStore((s: any) => s.regionalEventLedger);
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const localActionLedger = useStore((s: any) => s.sceneSessionState?.localActionLedger || []);
  const turn = useStore((s: any) => s.turn);

  const report = useMemo(() => buildV360TransientAgentMicroExpansion({
    previewLane,
    regionalEventLedger,
    routeLocationState,
    livingWorldState,
    localActionLedger,
    turn,
  }), [previewLane, regionalEventLedger, routeLocationState, livingWorldState, localActionLedger, turn]);

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v340-runtime-agent-proposal-panel">
      <div className="space-y-3" data-testid="v350-runtime-agent-hardening-panel">
        <div className="space-y-3" data-testid="v360-runtime-agent-micro-expansion-panel">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v340-agent-proposal-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-rg-gold-100">Runtime AgentProposal</p>
              <p className="mt-1 text-[10px] text-rg-paper-200/55">{report.statusLabel}</p>
            </div>
            <button
              type="button"
              className="rounded-sm border border-rg-gold-400/35 bg-rg-ink-900/35 px-2 py-1 text-[10px] text-rg-gold-100 transition-micro hover:border-rg-gold-300/65"
              onClick={() => setPreviewLane(value => (value + 1) % 4)}
              data-testid="v340-agent-proposal-cycle"
            >
              重排候选
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{report.publicSummary}</p>
        </div>

        <div className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3" data-testid="v340-agent-proposal-audit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-jade-100">WorldCore post-check</p>
            <span className="text-[10px] text-rg-paper-200/55">{report.audit.persistenceMode}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            {report.audit.worldCoreAuthority} · {report.audit.saveWritePolicy} · live DeepSeek：否 · MiroFish：否 · backend：否
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/50" data-testid="v350-agent-proposal-lifecycle-audit">
            v3.5 lifecycle v2：candidate / rejected / expired / needs_user_decision · v3.6 synthetic L2/L3 micro-expansion · self-learning writes：否 · runFingerprint：否
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4" data-testid="v350-agent-proposal-lifecycle-summary">
          {(Object.keys(report.lifecycleSummary) as V360LaneStatus[]).map(status => (
            <div key={status} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2">
              <p className="text-[10px] font-semibold text-rg-paper-100">{lifecycleLabel[status]}</p>
              <p className="mt-1 text-lg font-semibold text-rg-gold-100">{report.lifecycleSummary[status]}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 lg:grid-cols-3" data-testid="v340-agent-proposal-list">
          {report.candidateLanes.map(item => {
            const proposal = item.layer !== 'none'
              ? {
                id: item.id,
                layer: item.layer,
                agentRole: item.agentRole,
                publicExpression: item.publicExpression,
                safeNextStep: item.safeNextStep,
                evidenceRefs: item.evidenceRefs,
                decision: item.decision,
              }
              : null;
            if (!proposal) return null;
            return (
            <article
              key={proposal.id}
              className={`rounded-sm border p-3 ${proposalClass[proposal.layer]}`}
              data-testid={`v340-agent-proposal-${proposal.layer.toLowerCase()}-${proposal.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-rg-paper-100">{proposal.agentRole}</p>
                  <p className="mt-1 text-[10px] text-rg-paper-200/55">{layerLabel[proposal.layer]} · {decisionLabel[proposal.decision as V340PostCheckDecision]} · {item.genericArchetype}</p>
                </div>
                <span className="rounded-sm border border-rg-ink-100/10 px-2 py-1 text-[10px] text-rg-paper-200/60">
                  transient
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-100/78">{proposal.publicExpression}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/62">{proposal.safeNextStep}</p>
              <p className="mt-2 text-[9px] leading-relaxed text-rg-paper-200/50">
                候选表达，不是事实 · {item.playerFacingBoundary} · 不写存档 · 不结算奖励 · 不定 NPC 命运
              </p>
              <div className="mt-2 grid gap-1" data-testid={`v350-agent-proposal-copy-guards-${proposal.id}`}>
                {item.copyGuardLines.slice(0, 3).map(line => (
                  <p key={line} className="text-[9px] leading-relaxed text-rg-paper-200/45">{line}</p>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {proposal.evidenceRefs.slice(0, 4).map(ref => (
                  <span key={ref} className="rounded-sm border border-rg-ink-100/10 px-1.5 py-0.5 text-[9px] text-rg-paper-200/55">
                    {ref}
                  </span>
                ))}
              </div>
            </article>
            );
          })}
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v340-agent-proposal-rejections">
          <p className="text-xs font-semibold text-rg-paper-100">阻断项</p>
          <div className="mt-2 grid gap-1.5 lg:grid-cols-3">
            {report.inheritedRejectedProbes.map(item => (
              <div key={item.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-rg-paper-100">{item.label}</p>
                  <span className="text-[9px] text-rg-paper-200/45">{decisionLabel[item.decision]}</span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-rg-paper-200/55">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v350-agent-proposal-lifecycle-details">
          <p className="text-xs font-semibold text-rg-paper-100">lifecycle v2</p>
          <div className="mt-2 grid gap-1.5 lg:grid-cols-3">
            {[...report.rejectedLanes, ...report.expiredLanes, ...report.needsUserDecisionLanes].map(item => (
              <div key={item.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-rg-paper-100">{item.label}</p>
                  <span className="text-[9px] text-rg-paper-200/45">{lifecycleLabel[item.lifecycleStatus]}</span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-rg-paper-200/55">{item.reason}</p>
                <p className="mt-1 text-[9px] leading-relaxed text-rg-paper-200/45">{item.safeNextStep}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v340-agent-proposal-deterministic">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-paper-100">30 轮 deterministic 基线 / 60 轮 v3.5 硬化门 / 90 轮 v3.6 微扩门</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {report.deterministicProbe.roundsChecked} rounds · rescoreStable
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55" data-testid="v350-agent-proposal-deterministic-result">
            inherited accepted {report.inheritedDeterministicProbe.acceptedRounds}/{report.inheritedDeterministicProbe.roundsChecked} · inherited acceptedForGate {String(report.inheritedDeterministicProbe.acceptedForGate)} · accepted {report.deterministicProbe.acceptedRounds}/{report.deterministicProbe.roundsChecked} · unique signatures {report.deterministicProbe.uniqueLaneSignatures} · acceptedForGate {String(report.deterministicProbe.acceptedForGate)}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/55" data-testid="v360-agent-proposal-deterministic-result">
            v3.6 accepted {report.deterministicProbe.acceptedRounds}/{report.deterministicProbe.roundsChecked} · synthetic L2/L3 lanes {report.syntheticLayerSummary.L2}/{report.syntheticLayerSummary.L3} · runFingerprint {String(report.audit.runFingerprintUsed)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.deterministicProbe.driftFamilies.map(item => (
              <span key={item} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v340-agent-proposal-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {report.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v340-agent-proposal-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.sourceRefs.slice(0, 12).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
