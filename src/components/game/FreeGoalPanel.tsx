import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { LivingPlayerGoalEntry, LocalActionLedgerEntry } from '../../types';
import type { WorldIntentAdjudication } from '../../engine/v011-world-intent-engine';
import {
  buildQingmaoInvestigationFollowUps,
  type QingmaoInvestigationFollowUpCandidate,
} from '../../engine/v011-qingmao-investigation-followups';
import {
  buildQingmaoFactionStanceProjection,
  type QingmaoFactionStanceProjectionResult,
} from '../../engine/v013-qingmao-faction-stance';
import {
  buildQingmaoNpcMemoryProjection,
  type QingmaoNpcMemoryProjectionResult,
} from '../../engine/v013-qingmao-npc-memory';
import {
  buildQingmaoPublicEventChronicle,
  type QingmaoPublicEventChronicleResult,
} from '../../engine/v013-qingmao-public-event-chronicle';
import {
  buildQingmaoSocialFollowups,
  type QingmaoSocialFollowupResult,
} from '../../engine/v013-qingmao-social-followups';
import {
  buildQingmaoRouteContinuationPreview,
  type QingmaoRouteConditionPreview,
  type QingmaoRouteContinuationPreviewResult,
} from '../../engine/v014-qingmao-route-continuation';
import {
  buildQingmaoFactionGoalPrerequisites,
  type QingmaoFactionGoalPrerequisiteCard,
  type QingmaoFactionGoalPrerequisiteResult,
} from '../../engine/v014-qingmao-faction-goal-prerequisites';

const EMPTY_LOCAL_ACTION_LEDGER: LocalActionLedgerEntry[] = [];

const CATEGORY_LABELS: Record<string, string> = {
  available: '可行动',
  available_with_cost: '可尝试',
  requires_prerequisite: '需前置',
  rumor_only: '传闻',
  long_term_goal: '长期目标',
  world_rule_blocked: '世界规则阻断',
  hidden_fact_blocked: '隐藏事实保护',
  major_if_deviation: '重大 IF',
};

const STATUS_LABELS: Record<LivingPlayerGoalEntry['status'], string> = {
  active: '活跃',
  deferred: '延期',
  blocked: '阻断',
  completed: '完成',
  failed: '失败',
};

function riskLabel(value: number): string {
  if (value >= 3) return '高';
  if (value === 2) return '中';
  if (value === 1) return '低';
  return '无';
}

function goalStatusClass(status: LivingPlayerGoalEntry['status']): string {
  if (status === 'active') return 'border-emerald-400/25 text-emerald-200';
  if (status === 'blocked') return 'border-red-400/25 text-red-200';
  if (status === 'failed') return 'border-red-400/25 text-red-200';
  if (status === 'completed') return 'border-rg-paper-200/25 text-rg-paper-100';
  return 'border-rg-gold/25 text-rg-gold';
}

const FOLLOW_UP_KIND_LABELS: Record<QingmaoInvestigationFollowUpCandidate['kind'], string> = {
  contact: '接触',
  avoidance: '避险',
  local_inquiry: '旁证',
  route_preparation: '路线',
};

const NPC_MEMORY_AXIS_LABELS: Record<string, string> = {
  attention: '注意',
  suspicion: '怀疑',
  trust: '信任',
  debt: '人情',
  avoidance: '回避',
  interest: '兴趣',
  record_trace: '流程痕迹',
};

const FACTION_STANCE_AXIS_LABELS: Record<string, string> = {
  watch: '注视',
  opportunity: '机会',
  blockade_hint: '封锁倾向',
  recruitment_hint: '招揽倾向',
  pursuit_risk: '追索风险',
  task_source_hint: '任务来源候选',
  trade_window: '交易窗口',
  suspicion: '疑心',
};

const PUBLIC_EVENT_SCOPE_LABELS: Record<string, string> = {
  player: '自知',
  local_group: '小组可见',
  faction_visible: '势力可见',
  region_public: '区域公开',
  merchant_visible: '商队可见',
  npc_public: '人物公开',
};

const SOCIAL_FOLLOW_UP_KIND_LABELS: Record<string, string> = {
  explain: '解释',
  message: '递话',
  cover: '遮掩',
  avoid: '避险',
  investigate: '旁证',
};

const ROUTE_ELIGIBILITY_LABELS: Record<string, string> = {
  blocked: '阻断',
  needs_preparation: '需前置',
  candidate: '候选',
  ready: '预览满足',
};

const FACTION_GOAL_DISPOSITION_LABELS: Record<string, string> = {
  already_in_faction: '本阵营前置',
  cross_faction_prerequisites: '跨阵营前置',
  outer_contact_prerequisites: '外来接触前置',
  merchant_contact_prerequisites: '商队前置',
  city_entry_deferred: '城市入口延期',
  identity_gap_prerequisites: '身份缺口',
};

function socialRiskLabel(value: string): string {
  if (value === 'blocked') return '阻断';
  if (value === 'high') return '高';
  if (value === 'medium') return '中';
  return '低';
}

function socialRiskClass(value: string): string {
  if (value === 'blocked' || value === 'high') return 'border-red-300/20 text-red-100/70';
  if (value === 'medium') return 'border-rg-gold/25 text-rg-gold/85';
  return 'border-emerald-300/20 text-emerald-100/70';
}

type FreeGoalSocialImpactBundle = {
  npcMemory: QingmaoNpcMemoryProjectionResult;
  factionStance: QingmaoFactionStanceProjectionResult;
  publicChronicle: QingmaoPublicEventChronicleResult;
  socialFollowups: QingmaoSocialFollowupResult;
};

function pickPriorityRoute(preview: QingmaoRouteContinuationPreviewResult): QingmaoRouteConditionPreview | null {
  return preview.previews.find(route => route.eligibility !== 'blocked') || preview.previews[0] || null;
}

function topSocialHint(socialImpact: FreeGoalSocialImpactBundle): string {
  const followUp = socialImpact.socialFollowups.candidates[0];
  if (followUp) {
    return `${SOCIAL_FOLLOW_UP_KIND_LABELS[followUp.kind] || followUp.kind} · ${followUp.title}`;
  }
  const faction = socialImpact.factionStance.projections[0];
  if (faction) {
    return `${faction.factionLabel} · ${FACTION_STANCE_AXIS_LABELS[faction.stanceAxis] || faction.stanceAxis}`;
  }
  const npc = socialImpact.npcMemory.projections[0];
  if (npc) {
    return `${npc.subjectLabel} · ${NPC_MEMORY_AXIS_LABELS[npc.memoryAxis] || npc.memoryAxis}`;
  }
  const event = socialImpact.publicChronicle.events[0];
  if (event) {
    return PUBLIC_EVENT_SCOPE_LABELS[event.eventScope] || event.eventScope;
  }
  return '暂无公开信号';
}

function FreeGoalNextStepSummary({
  goals,
  routeContinuation,
  factionGoalPrerequisites,
  socialImpact,
  hasIntentContext,
}: {
  goals: LivingPlayerGoalEntry[];
  routeContinuation: QingmaoRouteContinuationPreviewResult;
  factionGoalPrerequisites: QingmaoFactionGoalPrerequisiteResult;
  socialImpact: FreeGoalSocialImpactBundle;
  hasIntentContext: boolean;
}) {
  const topGoal = goals[0] || null;
  const priorityRoute = pickPriorityRoute(routeContinuation);
  const factionCard = factionGoalPrerequisites.cards[0] || null;
  const socialSignalCount = socialImpact.npcMemory.projections.length
    + socialImpact.factionStance.projections.length
    + socialImpact.publicChronicle.events.length
    + socialImpact.socialFollowups.candidates.length;
  const routeLine = hasIntentContext && priorityRoute
    ? `${priorityRoute.displayName} · ${ROUTE_ELIGIBILITY_LABELS[priorityRoute.eligibility] || priorityRoute.eligibility}`
    : '输入目标后评估路线';
  const routeReason = hasIntentContext && priorityRoute
    ? priorityRoute.reason
    : '先让本地裁决判断目标类型，再看路线、前置和风险。';
  const factionLine = factionCard
    ? `${factionCard.title} · ${FACTION_GOAL_DISPOSITION_LABELS[factionCard.disposition] || factionCard.disposition}`
    : '无阵营前置命中';
  const socialLine = socialSignalCount > 0
    ? `${socialSignalCount} 条公开信号 · ${topSocialHint(socialImpact)}`
    : '暂无公开信号';

  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/25 bg-rg-ink-900/48 p-3"
      data-testid="free-goal-next-step-summary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-gold">优先摘要</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/50">
            先看下一步，再展开完整路线、阵营和社会影响。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-gold/25 px-2 py-1 text-[10px] text-rg-gold/80">
          只读
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2" data-testid="free-goal-summary-goal">
          <p className="text-[10px] text-rg-paper-200/35">当前目标</p>
          <p className="mt-1 text-xs font-semibold text-rg-paper-100">
            {topGoal ? `${topGoal.targetRef} · ${STATUS_LABELS[topGoal.status]}` : '尚未记录目标'}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/50">
            {topGoal?.rationale || '可先输入自由目标，本地裁决后再决定是否写入目标账本。'}
          </p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2" data-testid="free-goal-summary-route">
          <p className="text-[10px] text-rg-paper-200/35">路线</p>
          <p className="mt-1 text-xs font-semibold text-rg-paper-100">{routeLine}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/50">{routeReason}</p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2" data-testid="free-goal-summary-faction">
          <p className="text-[10px] text-rg-paper-200/35">阵营 / 身份</p>
          <p className="mt-1 text-xs font-semibold text-rg-paper-100">{factionLine}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/50">
            {factionCard?.publicSummary || '只在命中投靠、商队、商家城或散修目标时展示前置。'}
          </p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2" data-testid="free-goal-summary-social">
          <p className="text-[10px] text-rg-paper-200/35">社会影响</p>
          <p className="mt-1 text-xs font-semibold text-rg-paper-100">{socialLine}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/50">
            {socialSignalCount > 0 ? '先处理高风险公开后续，再考虑路线承接。' : '公开行动痕迹不足时，不推演声望、通缉或招揽。'}
          </p>
        </div>
      </div>

      <p className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-950/35 px-2 py-1.5 text-[10px] leading-relaxed text-rg-paper-200/42">
        摘要只排序信息，不写状态、不转阵营、不发奖励、不进地点。
      </p>
    </section>
  );
}

function FollowUpCard({
  followUp,
  onExecuteBaiContact,
}: {
  followUp: QingmaoInvestigationFollowUpCandidate;
  onExecuteBaiContact?: () => void;
}) {
  const isBaiContactAction = followUp.id === 'followup_baijia_visible_contact_probe'
    && followUp.status === 'formal_action_available';
  return (
    <article className="rounded-sm border border-rg-gold/20 bg-rg-ink-900/38 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rg-gold">{followUp.title}</p>
          <p className="mt-1 text-[11px] text-rg-paper-200/45">
            {FOLLOW_UP_KIND_LABELS[followUp.kind]} · {isBaiContactAction ? '可执行试探' : '提示，不是正式行动'}
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          来源 {followUp.visibleSourceRefs.length + followUp.hiddenSourceRefCount}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/75">{followUp.visibleReason}</p>
      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/58">{followUp.nextStepHint}</p>
      {isBaiContactAction && onExecuteBaiContact && (
        <button
          type="button"
          onClick={onExecuteBaiContact}
          className="mt-3 rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15"
          data-testid="free-goal-bai-contact"
        >
          试探接触
        </button>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {followUp.forbiddenUpgrades.slice(0, 5).map(item => (
          <span key={item} className="rounded-sm border border-red-300/15 bg-red-400/5 px-2 py-1 text-[10px] text-red-100/55">
            禁止 {item}
          </span>
        ))}
      </div>
    </article>
  );
}

function SocialImpactPanel({
  npcMemory,
  factionStance,
  publicChronicle,
  socialFollowups,
  expanded,
  onToggle,
  onExecuteCoverTracks,
}: {
  npcMemory: QingmaoNpcMemoryProjectionResult;
  factionStance: QingmaoFactionStanceProjectionResult;
  publicChronicle: QingmaoPublicEventChronicleResult;
  socialFollowups: QingmaoSocialFollowupResult;
  expanded: boolean;
  onToggle: () => void;
  onExecuteCoverTracks?: () => void;
}) {
  const totalSignals = npcMemory.projections.length
    + factionStance.projections.length
    + publicChronicle.events.length
    + socialFollowups.candidates.length;
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-social-impact"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
        data-testid="free-goal-social-impact-toggle"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">社会影响 / 局势后续</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            只读取公开行动痕迹，展示谁记住了你、势力怎么看、哪些后续仍只是候选。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          {expanded ? '收起' : '展开'} · {totalSignals}
        </span>
      </button>

      {expanded && (
        totalSignals > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-rg-paper-200/55 sm:grid-cols-4">
              <div className="rounded-sm bg-rg-ink-700/35 p-2">
                <p className="text-rg-paper-200/35">谁记住了你</p>
                <p className="mt-1 text-rg-paper-100/75">{npcMemory.projections.length}</p>
              </div>
              <div className="rounded-sm bg-rg-ink-700/35 p-2">
                <p className="text-rg-paper-200/35">势力态度</p>
                <p className="mt-1 text-rg-paper-100/75">{factionStance.projections.length}</p>
              </div>
              <div className="rounded-sm bg-rg-ink-700/35 p-2">
                <p className="text-rg-paper-200/35">公开行动摘要</p>
                <p className="mt-1 text-rg-paper-100/75">{publicChronicle.events.length}</p>
              </div>
              <div className="rounded-sm bg-rg-ink-700/35 p-2">
                <p className="text-rg-paper-200/35">后续机会 / 风险</p>
                <p className="mt-1 text-rg-paper-100/75">{socialFollowups.candidates.length}</p>
              </div>
            </div>

            {npcMemory.projections.length > 0 && (
              <div className="space-y-2" data-testid="free-goal-npc-memory">
                <p className="text-[11px] font-semibold text-rg-paper-100">谁记住了你</p>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {npcMemory.projections.slice(0, 4).map(projection => (
                    <article key={projection.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-rg-paper-100">{projection.subjectLabel}</p>
                          <p className="mt-1 text-[10px] text-rg-paper-200/42">
                            {NPC_MEMORY_AXIS_LABELS[projection.memoryAxis] || projection.memoryAxis} · 候选记忆
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${socialRiskClass(projection.riskLevel)}`}>
                          {socialRiskLabel(projection.riskLevel)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/65">{projection.publicReason}</p>
                      <p className="mt-2 text-[10px] text-rg-paper-200/38">
                        公开依据 {projection.visibleSourceRefs.length} · 只读 · 不写关系分数
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {factionStance.projections.length > 0 && (
              <div className="space-y-2" data-testid="free-goal-faction-stance">
                <p className="text-[11px] font-semibold text-rg-paper-100">势力态度</p>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {factionStance.projections.slice(0, 4).map(projection => (
                    <article key={projection.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-rg-paper-100">{projection.factionLabel}</p>
                          <p className="mt-1 text-[10px] text-rg-paper-200/42">
                            {FACTION_STANCE_AXIS_LABELS[projection.stanceAxis] || projection.stanceAxis} · 压力候选
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${socialRiskClass(projection.severity)}`}>
                          {socialRiskLabel(projection.severity)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/65">{projection.publicReason}</p>
                      <p className="mt-2 text-[10px] text-rg-paper-200/38">
                        {projection.escalationBlocked ? '正式升级已阻断' : '仅作候选解释'} · 不写声望/阵营
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {publicChronicle.events.length > 0 && (
              <div className="space-y-2" data-testid="free-goal-public-chronicle">
                <p className="text-[11px] font-semibold text-rg-paper-100">公开行动摘要</p>
                <div className="space-y-2">
                  {publicChronicle.events.slice(0, 3).map(event => (
                    <article key={event.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-xs leading-relaxed text-rg-paper-200/68">{event.publicSummary}</p>
                        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/50">
                          {PUBLIC_EVENT_SCOPE_LABELS[event.eventScope] || event.eventScope}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {socialFollowups.candidates.length > 0 && (
              <div className="space-y-2" data-testid="free-goal-social-followups">
                <p className="text-[11px] font-semibold text-rg-paper-100">局势后续</p>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {socialFollowups.candidates.slice(0, 4).map(candidate => (
                    <article key={candidate.id} className="rounded-sm border border-rg-gold/18 bg-rg-gold/5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-rg-gold">{candidate.title}</p>
                          <p className="mt-1 text-[10px] text-rg-paper-200/45">
                            {SOCIAL_FOLLOW_UP_KIND_LABELS[candidate.kind] || candidate.kind} · {candidate.id === 'followup_prepare_public_reason' ? '可执行前置行动，不是任务' : '候选，不是任务'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${socialRiskClass(candidate.riskLevel)}`}>
                          {socialRiskLabel(candidate.riskLevel)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/68">{candidate.publicReason}</p>
                      <p className="mt-2 text-[10px] text-rg-paper-200/38">
                        不创建正式任务 · 不发奖励 · 不改变阵营
                      </p>
                      {candidate.id === 'followup_prepare_public_reason' && onExecuteCoverTracks && (
                        <button
                          type="button"
                          onClick={onExecuteCoverTracks}
                          className="mt-3 rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15"
                          data-testid="free-goal-cover-tracks-run"
                        >
                          遮掩痕迹
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/30 p-3 text-xs leading-relaxed text-rg-paper-200/52">
            还没有足够的公开行动痕迹。完成调查、递话、路线准备等本地行动后，这里会显示社会反应候选。
          </div>
        )
      )}
    </section>
  );
}

function RouteContinuationCard({
  route,
  onExecuteMountainPass,
}: {
  route: QingmaoRouteConditionPreview;
  onExecuteMountainPass?: () => void;
}) {
  const missingIds = route.missingConditions.map(condition => condition.id);
  const isMountainPass = route.routeKey === 'mountain_pass_escape';
  const canExecute = isMountainPass
    && (route.eligibility === 'candidate' || route.eligibility === 'ready')
    && !missingIds.includes('social_cover_story');
  return (
    <article className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-rg-paper-100">{route.displayName}</p>
          <p className="mt-1 text-[11px] text-rg-paper-200/45">
            {route.routeKey} · 候选，不是地点进入
          </p>
        </div>
        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${
          route.eligibility === 'candidate' || route.eligibility === 'ready'
            ? 'border-rg-gold/25 text-rg-gold'
            : 'border-rg-ink-300/20 text-rg-paper-200/50'
        }`}
        >
          {ROUTE_ELIGIBILITY_LABELS[route.eligibility] || route.eligibility}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/65">{route.reason}</p>
      {route.missingConditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {route.missingConditions.slice(0, 4).map(condition => (
            <span key={condition.id} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/45">
              缺 {condition.label}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] text-rg-paper-200/38">
        不改变阵营 · 不发奖励 · 不写 route_entered
      </p>
      {isMountainPass && onExecuteMountainPass && (
        <button
          type="button"
          onClick={onExecuteMountainPass}
          disabled={!canExecute}
          className="mt-3 rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
          data-testid="free-goal-mountain-pass-route-run"
        >
          承接山路
        </button>
      )}
    </article>
  );
}

function RouteContinuationPanel({
  preview,
  onExecuteMountainPass,
}: {
  preview: QingmaoRouteContinuationPreviewResult;
  onExecuteMountainPass?: () => void;
}) {
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-route-continuation"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">路线承接</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            只读路线条件和前置缺口，正式离开青茅山仍需后续阶段。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          {preview.previews.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {preview.previews.slice(0, 4).map(route => (
          <RouteContinuationCard
            key={route.routeKey}
            route={route}
            onExecuteMountainPass={onExecuteMountainPass}
          />
        ))}
      </div>
      {preview.intentRulingHints.length > 0 && (
        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3 text-xs leading-relaxed text-rg-paper-200/62">
          {preview.intentRulingHints[0].visibleSummary}
        </div>
      )}
    </section>
  );
}

function SupplyFeedingPreparationPanel({
  canExecute,
  onExecute,
}: {
  canExecute: boolean;
  onExecute: () => void;
}) {
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-supply-feeding-prep-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">补给/喂养缺口</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            把离山补给、落脚遮掩和酒虫食料压力写入前置账本。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          v0.15-b1
        </span>
      </div>
      <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3 text-xs leading-relaxed text-rg-paper-200/62">
        不发材料 · 不扣元石 · 不开放市场 · 不判定离山成功
      </div>
      <button
        type="button"
        onClick={onExecute}
        disabled={!canExecute}
        className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
        data-testid="free-goal-supply-feeding-prep"
      >
        整理缺口
      </button>
    </section>
  );
}

function RefinementBoundaryPanel({
  canExecute,
  onExecute,
}: {
  canExecute: boolean;
  onExecute: () => void;
}) {
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-refinement-boundary-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">残方/炼蛊边界</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            试读月光蛊进阶残方、材料验证和失败代价，只形成边界账本。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          v0.15-b2
        </span>
      </div>
      <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3 text-xs leading-relaxed text-rg-paper-200/62">
        不消耗材料 · 不解锁蛊方 · 不写成败结论 · 不扩张 DeepSeek
      </div>
      <button
        type="button"
        onClick={onExecute}
        disabled={!canExecute}
        className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
        data-testid="free-goal-refinement-boundary"
      >
        试读边界
      </button>
    </section>
  );
}

function MarketWindowPanel({
  canExecute,
  onExecute,
}: {
  canExecute: boolean;
  onExecute: () => void;
}) {
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-market-window-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">商队/市场窗口</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            试探商队、问价、递话和公开理由，只形成候选窗口。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          v0.15-b3
        </span>
      </div>
      <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/28 p-3 text-xs leading-relaxed text-rg-paper-200/62">
        不买卖 · 不写价格 · 不开放库存 · 不加入商队
      </div>
      <button
        type="button"
        onClick={onExecute}
        disabled={!canExecute}
        className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
        data-testid="free-goal-market-window"
      >
        试探窗口
      </button>
    </section>
  );
}

function FactionGoalPrerequisiteCard({ card }: { card: QingmaoFactionGoalPrerequisiteCard }) {
  return (
    <article className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-rg-paper-100">{card.title}</p>
          <p className="mt-1 text-[11px] text-rg-paper-200/45">
            {card.currentIdentitySummary} · 只显示前置，不转阵营
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-gold/25 px-2 py-1 text-[10px] text-rg-gold">
          {FACTION_GOAL_DISPOSITION_LABELS[card.disposition] || card.disposition}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/65">{card.publicSummary}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="rounded-sm border border-rg-ink-300/12 bg-rg-ink-700/30 p-2">
          <p className="text-[10px] font-semibold text-rg-paper-100">前置条件</p>
          <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-rg-paper-200/55">
            {card.prerequisiteLines.slice(0, 3).map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-red-300/10 bg-red-400/5 p-2">
          <p className="text-[10px] font-semibold text-red-100/75">风险</p>
          <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-rg-paper-200/55">
            {card.riskLines.slice(0, 3).map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-rg-gold/14 bg-rg-gold/5 p-2">
          <p className="text-[10px] font-semibold text-rg-gold/85">可做小步</p>
          <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-rg-paper-200/55">
            {card.allowedNextSteps.slice(0, 3).map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {card.blockedUpgrades.slice(0, 6).map(item => (
          <span key={item} className="rounded-sm border border-red-300/15 bg-red-400/5 px-2 py-1 text-[10px] text-red-100/55">
            禁止 {item}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-rg-paper-200/38">
        只读 · 不改变阵营 · 不创建正式任务 · 不发奖励
      </p>
    </article>
  );
}

function FactionGoalPrerequisitePanel({
  preview,
}: {
  preview: QingmaoFactionGoalPrerequisiteResult;
}) {
  if (preview.cards.length === 0) return null;
  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/18 bg-rg-ink-900/38 p-3"
      data-testid="free-goal-faction-prerequisites"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rg-paper-100">阵营/身份目标前置</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/48">
            把长期阵营、商队或城市入口目标拆成可见前置。这里只读，不转阵营。
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/55">
          {preview.cards.length}
        </span>
      </div>
      <div className="space-y-2">
        {preview.cards.map(card => (
          <FactionGoalPrerequisiteCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

function RulingCard({ adjudication }: { adjudication: WorldIntentAdjudication }) {
  const ruling = adjudication.ruling;
  const goal = adjudication.suggestedPlayerGoal;
  const refs = [...ruling.prerequisiteRefs, ...ruling.costRefs];
  const visibleFactIds = adjudication.factCardRefs.visibleFactCardIds;
  const writeScope = goal
    ? 'playerGoals'
    : adjudication.candidate.intentType === 'investigate' && ruling.allowed
      ? 'knownFacts'
      : '不写入';

  return (
    <section
      className="space-y-3 rounded-sm border border-rg-gold/25 bg-rg-ink-900/45 p-3"
      data-testid="free-goal-ruling"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rg-gold">
            {CATEGORY_LABELS[ruling.category] || ruling.category}
          </p>
          <p className="mt-1 text-[11px] text-rg-paper-200/55">
            {adjudication.candidate.intentType} · {adjudication.candidate.targetRef}
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-rg-ink-300/20 px-2 py-1 text-[10px] text-rg-paper-200/60">
          风险 {riskLabel(ruling.riskLevel)}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-rg-paper-100/78">{ruling.visibleExplanation}</p>

      {refs.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-rg-paper-200/35">前置/代价</p>
          <div className="flex flex-wrap gap-1.5">
            {refs.map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/45 px-2 py-1 text-[10px] text-rg-paper-200/58">
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px] text-rg-paper-200/55">
        <div className="rounded-sm bg-rg-ink-700/40 p-2">
          <p className="text-rg-paper-200/35">行动路由</p>
          <p className="mt-1 text-rg-paper-100/72">{adjudication.route.domain || '暂不路由'}</p>
        </div>
        <div className="rounded-sm bg-rg-ink-700/40 p-2">
          <p className="text-rg-paper-200/35">写入范围</p>
          <p className="mt-1 text-rg-paper-100/72">{writeScope}</p>
        </div>
      </div>

      {visibleFactIds.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-rg-paper-200/35">可见事实</p>
          <div className="flex flex-wrap gap-1.5">
            {visibleFactIds.map(ref => (
              <span key={ref} className="rounded-sm border border-rg-gold/20 bg-rg-gold/10 px-2 py-1 text-[10px] text-rg-gold/80">
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {goal && (
        <div className={`rounded-sm border px-2 py-2 text-xs ${goalStatusClass(goal.status)}`}>
          将记录为{STATUS_LABELS[goal.status]}目标
        </div>
      )}
    </section>
  );
}

function GoalEntry({
  goal,
  onPrepareEscapeRoute,
}: {
  goal: LivingPlayerGoalEntry;
  onPrepareEscapeRoute?: (goalId: string) => void;
}) {
  const canPrepareEscapeRoute = goal.targetRef === 'region:outside_qingmao'
    && goal.status !== 'completed'
    && goal.status !== 'failed';
  return (
    <article className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-rg-paper-100">{goal.targetRef}</p>
          <p className="mt-1 text-[11px] text-rg-paper-200/45">{goal.intentType} · T{goal.createdTurn}</p>
        </div>
        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${goalStatusClass(goal.status)}`}>
          {STATUS_LABELS[goal.status]}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/65">{goal.rationale}</p>
      {goal.nextStepHints.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {goal.nextStepHints.slice(0, 4).map(hint => (
            <span key={hint} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/45">
              {hint}
            </span>
          ))}
        </div>
      )}
      {canPrepareEscapeRoute && onPrepareEscapeRoute && (
        <button
          type="button"
          onClick={() => onPrepareEscapeRoute(goal.id)}
          className="mt-3 rounded-sm border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100 transition-micro hover:bg-sky-300/15"
          data-testid="free-goal-escape-route-prep"
        >
          准备路线
        </button>
      )}
    </article>
  );
}

export function FreeGoalPanel() {
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState<WorldIntentAdjudication | null>(null);
  const [message, setMessage] = useState('');
  const [socialImpactExpanded, setSocialImpactExpanded] = useState(true);
  const {
    goals,
    previewWorldIntentAction,
    confirmWorldIntentGoalAction,
    resolveVisibleInvestigationAction,
    resolveBaiContactWindowAction,
    resolveQingmaoEscapeRoutePreparationAction,
    resolveQingmaoCoverEscapeTracksAction,
    resolveQingmaoMountainPassRouteContinuationAction,
    resolveQingmaoSupplyFeedingPreparationAction,
    resolveQingmaoRefinementBoundaryAction,
    resolveQingmaoMarketWindowAction,
    resolveQingmaoFactionReactionBridgeAction,
    resolveFangYuanPublicEvidenceAction,
    livingWorldState,
    localActionLedger,
    selectedStartProfileId,
    currentFactionId,
  } = useStore(useShallow((state: any) => ({
    goals: state.livingWorldState?.playerGoals || [],
    previewWorldIntentAction: state.previewWorldIntentAction,
    confirmWorldIntentGoalAction: state.confirmWorldIntentGoalAction,
    resolveVisibleInvestigationAction: state.resolveVisibleInvestigationAction,
    resolveBaiContactWindowAction: state.resolveBaiContactWindowAction,
    resolveQingmaoEscapeRoutePreparationAction: state.resolveQingmaoEscapeRoutePreparationAction,
    resolveQingmaoCoverEscapeTracksAction: state.resolveQingmaoCoverEscapeTracksAction,
    resolveQingmaoMountainPassRouteContinuationAction: state.resolveQingmaoMountainPassRouteContinuationAction,
    resolveQingmaoSupplyFeedingPreparationAction: state.resolveQingmaoSupplyFeedingPreparationAction,
    resolveQingmaoRefinementBoundaryAction: state.resolveQingmaoRefinementBoundaryAction,
    resolveQingmaoMarketWindowAction: state.resolveQingmaoMarketWindowAction,
    resolveQingmaoFactionReactionBridgeAction: state.resolveQingmaoFactionReactionBridgeAction,
    resolveFangYuanPublicEvidenceAction: state.resolveFangYuanPublicEvidenceAction,
    livingWorldState: state.livingWorldState,
    localActionLedger: state.sceneSessionState?.localActionLedger || EMPTY_LOCAL_ACTION_LEDGER,
    selectedStartProfileId: state.selectedStartProfileId || state.timelineState?.startProfileId || state.flags?._start_profile || null,
    currentFactionId: state.timelineState?.factionId || state.currentFaction || state.flags?._faction || null,
  })));

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => b.lastUpdatedTurn - a.lastUpdatedTurn || b.createdTurn - a.createdTurn),
    [goals],
  );
  const followUps = useMemo(
    () => buildQingmaoInvestigationFollowUps({ livingWorldState }),
    [livingWorldState],
  );
  const socialImpact = useMemo(() => {
    const npcMemory = buildQingmaoNpcMemoryProjection({
      livingWorldState,
      localActionLedger,
      maxProjections: 4,
    });
    const factionStance = buildQingmaoFactionStanceProjection({
      livingWorldState,
      localActionLedger,
      maxProjections: 4,
    });
    const publicChronicle = buildQingmaoPublicEventChronicle({
      livingWorldState,
      localActionLedger,
      maxEvents: 3,
    });
    const socialFollowups = buildQingmaoSocialFollowups({
      npcMemory,
      factionStance,
      publicChronicle,
      maxFollowups: 4,
    });
    return {
      npcMemory,
      factionStance,
      publicChronicle,
      socialFollowups,
    };
  }, [livingWorldState, localActionLedger]);
  const routeContinuation = useMemo(() => buildQingmaoRouteContinuationPreview({
    livingWorldState,
    intentText: rawText.trim() || sortedGoals[0]?.rationale || '我想离开青茅山',
    maxRoutes: 4,
  }), [livingWorldState, rawText, sortedGoals]);
  const factionGoalPrerequisites = useMemo(() => buildQingmaoFactionGoalPrerequisites({
    livingWorldState,
    intentText: rawText.trim() || preview?.candidate.rawText || sortedGoals[0]?.rationale || '',
    selectedStartProfileId,
    playerFactionId: currentFactionId,
    maxCards: 4,
  }), [livingWorldState, rawText, preview, sortedGoals, selectedStartProfileId, currentFactionId]);
  const canPrepareSupplyFeeding = useMemo(() => {
    const facts = livingWorldState?.knownFacts || {};
    const hasEscapeGoal = sortedGoals.some(goal => (
      goal.status !== 'failed'
      && (goal.targetRef === 'region:outside_qingmao' || goal.rationale.includes('逃离青茅山'))
    ));
    return Boolean(
      hasEscapeGoal
      && (
        facts.qingmao_escape_route_preparation_baseline
        || facts.qingmao_escape_tracks_cover_baseline
        || facts.qingmao_mountain_pass_route_continuation_candidate
      )
    );
  }, [livingWorldState, sortedGoals]);
  const canRunRefinementBoundary = useMemo(() => {
    const facts = livingWorldState?.knownFacts || {};
    const consequences = livingWorldState?.actionConsequences || [];
    return Boolean(
      facts.qingmao_supply_feeding_preparation_baseline
      || consequences.some(entry => entry.actionId === 'qingmao_supply_feeding_preparation_probe'),
    );
  }, [livingWorldState]);
  const canRunMarketWindow = useMemo(() => {
    const facts = livingWorldState?.knownFacts || {};
    const consequences = livingWorldState?.actionConsequences || [];
    return Boolean(
      facts.qingmao_supply_feeding_preparation_baseline
      || facts.qingmao_refinement_fragment_boundary_baseline
      || consequences.some(entry => (
        entry.actionId === 'qingmao_supply_feeding_preparation_probe'
        || entry.actionId === 'qingmao_refinement_boundary_probe'
      )),
    );
  }, [livingWorldState]);

  const handlePreview = () => {
    const result = previewWorldIntentAction(rawText);
    setPreview(result.adjudication);
    setMessage(result.message);
  };

  const handleConfirm = () => {
    if (!preview) return;
    const result = confirmWorldIntentGoalAction(preview);
    setMessage(result.message);
    if (result.success) {
      setRawText('');
      setPreview(null);
    }
  };

  const handleInvestigation = () => {
    if (!preview) return;
    const result = resolveVisibleInvestigationAction(preview);
    setMessage(result.message);
  };

  const handleFangYuanPublicEvidence = () => {
    if (!preview) return;
    const result = resolveFangYuanPublicEvidenceAction(preview);
    setMessage(result.message);
  };

  const handleBaiContact = () => {
    const result = resolveBaiContactWindowAction();
    setMessage(result.message);
  };

  const handleEscapeRoutePreparation = (goalId: string) => {
    const result = resolveQingmaoEscapeRoutePreparationAction(goalId);
    setMessage(result.message);
  };

  const handleCoverEscapeTracks = () => {
    const result = resolveQingmaoCoverEscapeTracksAction();
    setMessage(result.message);
  };

  const handleMountainPassRouteContinuation = () => {
    const result = resolveQingmaoMountainPassRouteContinuationAction();
    setMessage(result.message);
  };

  const handleSupplyFeedingPreparation = () => {
    const result = resolveQingmaoSupplyFeedingPreparationAction();
    setMessage(result.message);
  };

  const handleRefinementBoundary = () => {
    const result = resolveQingmaoRefinementBoundaryAction();
    setMessage(result.message);
  };

  const handleMarketWindow = () => {
    const result = resolveQingmaoMarketWindowAction();
    setMessage(result.message);
  };

  const handleFactionReactionBridge = () => {
    const result = resolveQingmaoFactionReactionBridgeAction();
    setMessage(result.message);
  };

  const canExecuteInvestigation = Boolean(
    preview
    && preview.candidate.intentType === 'investigate'
    && preview.ruling.allowed,
  );
  const canExecuteFangYuanPublicEvidence = Boolean(
    canExecuteInvestigation
    && preview?.candidate.targetRef === 'npc:fang_yuan',
  );

  return (
    <div className="rg-scrollable flex h-full flex-col gap-4 overflow-y-auto p-4" data-testid="free-goal-panel">
      <section className="space-y-3">
        <label htmlFor="free-goal-input" className="text-xs font-semibold text-rg-paper-100">
          自由目标
        </label>
        <textarea
          id="free-goal-input"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={4}
          className="min-h-24 w-full resize-y rounded-sm border border-rg-ink-300/20 bg-rg-ink-900/55 px-3 py-2 text-sm leading-relaxed text-rg-paper-100 outline-none transition-micro placeholder:text-rg-paper-200/25 focus:border-rg-gold/50"
          placeholder="我要逃离青茅山"
          data-testid="free-goal-input"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!rawText.trim()}
            className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
            data-testid="free-goal-adjudicate"
          >
            裁决
          </button>
          <button
            type="button"
            onClick={handleInvestigation}
            disabled={!canExecuteInvestigation}
            className="rounded-sm border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100 transition-micro hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
            data-testid="free-goal-investigate"
          >
            执行调查
          </button>
          <button
            type="button"
            onClick={handleFangYuanPublicEvidence}
            disabled={!canExecuteFangYuanPublicEvidence}
            className="rounded-sm border border-purple-300/30 bg-purple-300/10 px-3 py-2 text-xs font-semibold text-purple-100 transition-micro hover:bg-purple-300/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
            data-testid="free-goal-fang-yuan-public-evidence"
          >
            旁证询问
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview?.suggestedPlayerGoal}
            className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-micro hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:border-rg-ink-300/15 disabled:bg-rg-ink-700/30 disabled:text-rg-paper-200/25"
            data-testid="free-goal-confirm"
          >
            记录目标
          </button>
        </div>
        {message && (
          <p className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/35 px-3 py-2 text-xs leading-relaxed text-rg-paper-200/68">
            {message}
          </p>
        )}
      </section>

      {preview && <RulingCard adjudication={preview} />}

      <FreeGoalNextStepSummary
        goals={sortedGoals}
        routeContinuation={routeContinuation}
        factionGoalPrerequisites={factionGoalPrerequisites}
        socialImpact={socialImpact}
        hasIntentContext={Boolean(rawText.trim() || preview || sortedGoals.length > 0)}
      />

      {followUps.length > 0 && (
        <section className="space-y-2" data-testid="free-goal-followups">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rg-paper-100">后续提示</p>
            <span className="text-[10px] text-rg-paper-200/35">{followUps.length}</span>
          </div>
          <div className="space-y-2">
            {followUps.map(followUp => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
                onExecuteBaiContact={handleBaiContact}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2" data-testid="free-goal-reaction-bridge">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-rg-paper-100">局势反应</p>
            <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/45">
              读取已公开行动痕迹，只推演压力和公开记忆。
            </p>
          </div>
          <button
            type="button"
            onClick={handleFactionReactionBridge}
            className="shrink-0 rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-3 py-2 text-xs font-semibold text-rg-gold transition-micro hover:bg-rg-gold/15"
            data-testid="free-goal-reaction-bridge-run"
          >
            推演
          </button>
        </div>
      </section>

      <SocialImpactPanel
        npcMemory={socialImpact.npcMemory}
        factionStance={socialImpact.factionStance}
        publicChronicle={socialImpact.publicChronicle}
        socialFollowups={socialImpact.socialFollowups}
        expanded={socialImpactExpanded}
        onToggle={() => setSocialImpactExpanded(value => !value)}
        onExecuteCoverTracks={handleCoverEscapeTracks}
      />

      <FactionGoalPrerequisitePanel preview={factionGoalPrerequisites} />

      <RouteContinuationPanel
        preview={routeContinuation}
        onExecuteMountainPass={handleMountainPassRouteContinuation}
      />

      <SupplyFeedingPreparationPanel
        canExecute={canPrepareSupplyFeeding}
        onExecute={handleSupplyFeedingPreparation}
      />

      <RefinementBoundaryPanel
        canExecute={canRunRefinementBoundary}
        onExecute={handleRefinementBoundary}
      />

      <MarketWindowPanel
        canExecute={canRunMarketWindow}
        onExecute={handleMarketWindow}
      />

      <section className="space-y-2" data-testid="free-goal-ledger">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-rg-paper-100">目标账本</p>
          <span className="text-[10px] text-rg-paper-200/35">{sortedGoals.length}</span>
        </div>
        {sortedGoals.length > 0 ? (
          <div className="space-y-2">
            {sortedGoals.map(goal => (
              <GoalEntry
                key={goal.id}
                goal={goal}
                onPrepareEscapeRoute={handleEscapeRoutePreparation}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/35 p-3 text-xs text-rg-paper-200/45">
            暂无记录
          </div>
        )}
      </section>
    </div>
  );
}
