import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store';
import type { InheritanceCandidateRecord, InheritanceSiteSpec } from '../../types';
import { listInheritanceSiteSpecs } from '../../engine/v080-inheritance-land-engine';

const KIND_LABEL: Record<string, string> = {
  minor_cave: '小传承',
  canon_side_branch: '正史旁支',
  blessed_land_claim: '待认主福地',
  grotto_heaven_rumor: '洞天传闻',
};

const STATUS_LABEL: Record<string, string> = {
  candidate: '候选',
  active: '试炼中',
  resolved: '已结算',
  failed: '失败',
  rumor: '传闻',
  blocked: '拦截',
  expired: '过期',
};

function statusTone(status?: string): string {
  if (status === 'resolved') return 'rg-chip rg-chip--jade';
  if (status === 'blocked' || status === 'failed') return 'rg-chip rg-chip--blood';
  if (status === 'active' || status === 'candidate') return 'rg-chip rg-chip--gold';
  return 'rg-chip rg-chip--muted';
}

function siteTone(kind?: string): string {
  if (kind === 'blessed_land_claim') return 'border-rg-gold/35 bg-rg-gold/10';
  if (kind === 'grotto_heaven_rumor') return 'border-rg-blood-400/30 bg-rg-blood-600/10';
  if (kind === 'canon_side_branch') return 'border-rg-jade-400/25 bg-rg-jade-600/10';
  return 'border-rg-ink-300/16 bg-rg-ink-800/55';
}

function rewardText(candidate: InheritanceCandidateRecord | null, site: InheritanceSiteSpec | undefined): string {
  const rewards = candidate?.rewardPreview?.length ? candidate.rewardPreview : site?.rewardPreview || [];
  if (!rewards.length) return '无正式奖励预览';
  return rewards
    .slice(0, 4)
    .map(reward => `${reward.name}${reward.quantity ? `×${reward.quantity}` : ''}${reward.registered ? '' : '(传闻)'}`)
    .join('、');
}

function buildCandidateFromSite(site: InheritanceSiteSpec) {
  const kindLabel = KIND_LABEL[site.kind] || site.kind;
  return {
    siteId: site.siteId,
    title: site.title,
    summary: `${kindLabel}候选：${site.summary}`,
    anchorId: site.anchorId,
    risk: site.kind === 'grotto_heaven_rumor' ? 'high' : site.kind === 'blessed_land_claim' ? 'medium' : 'low',
    source: 'engine' as const,
    rewardPreview: site.rewardPreview,
    landSpiritDemand: site.landClaimTerms?.map(term => term.description).join('；'),
    boundaryHint: site.kind === 'grotto_heaven_rumor' ? 'v0.8 仅作洞天边界传闻，不开放正式认主。' : undefined,
  };
}

export function InheritanceLandPanel() {
  const reduceMotion = useReducedMotion();
  const [lastMessage, setLastMessage] = useState('');
  const sites = useMemo(() => listInheritanceSiteSpecs(), []);
  const inheritanceLandState = useStore(s => (s as any).inheritanceLandState);
  const heavenlyLand = useStore(s => (s as any).heavenlyLand);
  const sceneSession = useStore(s => (s as any).sceneSessionState);
  const recordCandidate = useStore(s => (s as any).recordInheritanceCandidateAction);
  const startTrial = useStore(s => (s as any).startInheritanceTrialAction);
  const resolveTrial = useStore(s => (s as any).resolveInheritanceTrialAction);
  const attemptClaim = useStore(s => (s as any).attemptLandClaimAction);
  const dismissCandidate = useStore(s => (s as any).dismissInheritanceCandidateAction);

  const state = inheritanceLandState || {};
  const candidates: InheritanceCandidateRecord[] = Array.isArray(state.candidates) ? state.candidates : [];
  const siteById = new Map(sites.map(site => [site.siteId, site]));
  const steps = Array.isArray(state.lastResolutionSteps) ? state.lastResolutionSteps.slice(-8).reverse() : [];
  const blocked = Array.isArray(state.blockedRecords) ? state.blockedRecords.slice(-6).reverse() : [];
  const claimedLandIds = Array.isArray(state.claimedLandIds) ? state.claimedLandIds : [];
  const remainingAp = sceneSession?.actionBudget?.remainingAp ?? sceneSession?.actionBudget?.remaining ?? sceneSession?.actionBudget?.available ?? 0;

  const stageSample = (site: InheritanceSiteSpec) => {
    const validation = recordCandidate?.(buildCandidateFromSite(site));
    setLastMessage(validation?.reason || validation?.blockers?.join('；') || `${site.title} 已登记为候选。`);
  };

  const handleStart = (candidate: InheritanceCandidateRecord) => {
    const result = startTrial?.(candidate.id);
    setLastMessage(result?.message || '传承试炼入口已更新。');
  };

  const handleResolve = (candidate: InheritanceCandidateRecord) => {
    const result = resolveTrial?.(candidate.id);
    setLastMessage(result?.message || '传承试炼已交给本地引擎结算。');
  };

  const handleClaim = (candidate: InheritanceCandidateRecord) => {
    const result = attemptClaim?.(candidate.id);
    setLastMessage(result?.message || '福地认主尝试已交给本地引擎结算。');
  };

  return (
    <motion.div
      className="rg-scrollable h-full overflow-y-auto px-3 py-4 text-rg-paper-100 sm:px-4"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      data-testid="inheritance-land-panel"
    >
      <header className="mb-4 border-b border-rg-gold/25 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-panel tracking-[0.18em] text-rg-gold/80">v0.8.0-c2.5</p>
            <h2 className="font-title text-lg text-rg-gold">传承与福地</h2>
          </div>
          <span className="rg-chip rg-chip--gold" data-testid="inheritance-scene-ap">
            场景AP {remainingAp}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/62">
          DeepSeek 只能给线索、地灵条件和洞天传闻；奖励、试炼、福地归属和资源节点由本地引擎结算。
        </p>
      </header>

      <section className="rg-explain-card mb-4 border-rg-gold/20 bg-rg-gold/5 p-3" data-testid="inheritance-clue-ledger-policy">
        <p className="text-xs font-panel tracking-[0.12em] text-rg-gold/85">线索账本</p>
        <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/58">
          传承、无主福地和洞天边界只从剧情线索进入；本面板不再直接生成样板入口。点击“出发”会消耗场景 AP 并登记叙事推进意图，奖励和归属仍由本地引擎在试炼/认主后结算。
        </p>
      </section>

      {lastMessage && (
        <motion.div
          className="rg-explain-card mb-4 border-rg-gold/25 bg-rg-gold/10 p-3 text-xs text-rg-paper-100"
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          data-testid="inheritance-last-message"
        >
          {lastMessage}
        </motion.div>
      )}

      <section className="mb-4" data-testid="inheritance-candidate-list">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">剧情线索账本</p>
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {candidates.map(candidate => {
              const site = siteById.get(candidate.siteId);
              const canDepart = candidate.status === 'candidate' || candidate.status === 'failed';
              const canResolve = candidate.status === 'active';
              const canClaim = site?.kind === 'blessed_land_claim' && candidate.status === 'resolved';
              return (
                <motion.article
                  key={candidate.id}
                  className={`rg-action-card p-3 ${siteTone(site?.kind)}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  data-testid="inheritance-candidate-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-title text-sm text-rg-paper-100">{candidate.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/58">{candidate.summary}</p>
                    </div>
                    <span className={statusTone(candidate.status)}>{STATUS_LABEL[candidate.status] || candidate.status}</span>
                  </div>
                  <div className="mt-2 grid gap-2 text-[11px] text-rg-paper-200/60 sm:grid-cols-2">
                    <p>奖励预览：{rewardText(candidate, site)}</p>
                    <p>入口条件：境界 {site?.minRealmGrand || 1}+，AP {site?.entryCostAp || 0}</p>
                    <p>正史边界：{site?.anchorId || candidate.anchorId || '当前场景'}</p>
                    <p>风险：{candidate.risk} · {candidate.validationIssues?.[0] || '由本地引擎继续校验'}</p>
                  </div>
                  {candidate.landClaimTerms.length > 0 && (
                    <div className="mt-2 rounded border border-rg-gold/20 bg-rg-gold/5 p-2 text-[11px] text-rg-paper-200/65">
                      地灵执念：{candidate.landClaimTerms.map(term => term.description).join('；')}
                    </div>
                  )}
                  {candidate.kind === 'grotto_heaven_rumor' && (
                    <div className="mt-2 rounded border border-rg-blood-400/20 bg-rg-blood-600/10 p-2 text-[11px] text-rg-blood-200">
                      洞天在 v0.8 只保留高压传闻和禁区边界，不开放正式认主或资源节点。
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleStart(candidate)}
                      disabled={!canDepart || candidate.kind === 'grotto_heaven_rumor'}
                      className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                      data-testid="inheritance-start-trial-action"
                    >
                      出发 / 进入线索地
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(candidate)}
                      disabled={!canResolve || candidate.kind === 'grotto_heaven_rumor'}
                      className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                      data-testid="inheritance-resolve-trial-action"
                    >
                      结算试炼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaim(candidate)}
                      disabled={!canClaim}
                      className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs text-rg-gold disabled:cursor-not-allowed disabled:opacity-45"
                      data-testid="inheritance-land-claim-action"
                    >
                      尝试认主
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissCandidate?.(candidate.id)}
                      className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs text-rg-paper-200/60"
                    >
                      移除
                    </button>
                  </div>
                </motion.article>
              );
            })}
            {candidates.length === 0 && (
              <p className="rg-explain-card p-3 text-[11px] text-rg-paper-200/42">
                暂无剧情线索。传承、福地和洞天边界需要先在剧情文本中被发现，再进入本地线索账本。
              </p>
            )}
          </div>
        </AnimatePresence>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rg-explain-card p-3" data-testid="inheritance-claimed-land-summary">
          <p className="text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">福地摘要</p>
          <p className="mt-2 text-sm text-rg-paper-100">
            {heavenlyLand?.name || claimedLandIds[0] || '尚未认主福地'}
          </p>
          <p className="mt-1 text-[11px] text-rg-paper-200/55">
            已认主 {claimedLandIds.length} 处；正式归属只来自本地认主结算。
          </p>
        </div>
        <div className="rg-explain-card p-3" data-testid="inheritance-blocked-records">
          <p className="text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">禁区拦截</p>
          <div className="mt-2 space-y-1">
            {blocked.slice(0, 3).map(step => (
              <p key={step.id} className="line-clamp-2 text-[11px] text-rg-paper-200/58">
                {step.kind}：{step.message}
              </p>
            ))}
            {blocked.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无洞天认主、未知仙蛊、十转或永生越界拦截。</p>}
          </div>
        </div>
      </section>

      <section data-testid="inheritance-resolution-steps">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">本地结算轨迹</p>
        <div className="rg-trace-list space-y-1.5">
          {steps.map(step => (
            <div key={step.id} className="flex gap-2 text-[11px] leading-relaxed text-rg-paper-200/62">
              <span className="shrink-0 text-rg-gold">{step.kind}</span>
              <span>{step.message}</span>
            </div>
          ))}
          {steps.length === 0 && <p className="text-[11px] text-rg-paper-200/38">等待传承或福地试炼结算。</p>}
        </div>
      </section>
    </motion.div>
  );
}
