import React, { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { PartyState, SquadCombatState, SquadMember, SquadRecruitEvaluation } from '../../types';

const TACTICAL_POSTURES: SquadCombatState['formation'][] = ['合击', '牵制', '掠阵', '斩首'];
const EMPTY_MEMBERS: SquadMember[] = [];
const EMPTY_PARTY: PartyState = {
  members: EMPTY_MEMBERS,
  maxSize: 4,
  formation: null,
  morale: 50,
  coordination: 50,
  lastUpdatedTurn: 0,
  memberCooldowns: {},
  memberRolePausedUntil: {},
};

const POSTURE_NOTES: Record<SquadCombatState['formation'], string> = {
  合击: '集火关键目标，适合快速破局，但需要队友配合度。',
  牵制: '拖住强敌并降低其闪避，适合越级或护送战。',
  掠阵: '保护低血量队友，训练和长线探索更稳。',
  斩首: '优先击破弱点目标，爆发更高但防御窗口更薄。',
};

function dispositionLabel(evaluation: SquadRecruitEvaluation): string {
  if (evaluation.disposition === 'willing_eager') return '愿随队';
  if (evaluation.disposition === 'willing_cautious') return '谨慎观望';
  if (evaluation.disposition === 'mercenary') return `索要报酬${evaluation.requiredPayment?.yuanStone ?? 0}元石`;
  return '暂不愿意';
}

function dispositionClass(evaluation: SquadRecruitEvaluation): string {
  if (evaluation.disposition === 'willing_eager') return 'text-emerald-300';
  if (evaluation.disposition === 'willing_cautious') return 'text-sky-300';
  if (evaluation.disposition === 'mercenary') return 'text-amber-300';
  return 'text-red-300';
}

interface MemberCardProps {
  member: SquadMember;
  evaluation?: SquadRecruitEvaluation;
  rolePausedUntil?: number;
  action: 'add' | 'remove';
  disabled?: boolean;
  onClick: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, evaluation, rolePausedUntil, action, disabled, onClick }) => {
  const availabilityText = evaluation ? dispositionLabel(evaluation) : rolePausedUntil ? `岗位暂停至T${rolePausedUntil}` : '随队中';
  const availabilityClass = evaluation ? dispositionClass(evaluation) : 'text-rg-paper-200/55';
  const buttonLabel = action === 'add' ? '入队' : '离队';

  return (
    <div className="rounded border border-rg-ink-300/15 bg-rg-ink-700/55 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-rg-paper-100 font-panel font-semibold truncate">{member.name}</span>
            <span className="text-[10px] text-rg-paper-200/45">{member.path} {member.realm}转</span>
          </div>
          <div className="mt-1 text-[11px] text-rg-paper-200/45">
            信任 {member.adventureTrust ?? 50} · 忠诚 {member.loyalty ?? 50} · 利益 {member.interestDrive ?? 30}
          </div>
          <div className="mt-1 text-[10px] text-rg-paper-200/35">
            HP {member.hp}/{member.maxHp} · 攻 {member.atk} · 防 {member.def}
          </div>
          <div className={`mt-1 text-[11px] ${availabilityClass}`}>{availabilityText}</div>
          {evaluation?.reasons?.length ? (
            <div className="mt-1 text-[10px] text-rg-paper-200/35">{evaluation.reasons.join('；')}</div>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`shrink-0 rounded-sm border px-3 py-1 text-[11px] font-button transition-micro ${
            disabled
              ? 'border-rg-ink-300/15 text-rg-paper-200/25 cursor-not-allowed'
              : action === 'add'
                ? 'border-rg-gold/35 text-rg-gold hover:bg-rg-gold/10'
                : 'border-red-400/35 text-red-300 hover:bg-red-500/10'
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export const SquadFormationPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    playerFaction,
    partyState,
    ap,
    evaluateRecruitment,
    addMemberToParty,
    removeMemberFromParty,
    setPartyFormation,
  } = useStore(useShallow((s: any) => ({
    playerFaction: s.playerFaction ?? null,
    partyState: (s.partyState ?? EMPTY_PARTY) as PartyState,
    ap: s.gameTime?.ap ?? 0,
    evaluateRecruitment: s.evaluateRecruitment,
    addMemberToParty: s.addMemberToParty,
    removeMemberFromParty: s.removeMemberFromParty,
    setPartyFormation: s.setPartyFormation,
  })));

  const squadMembers = partyState.members ?? EMPTY_MEMBERS;
  const squadIds = useMemo(() => new Set(squadMembers.map(member => member.id)), [squadMembers]);
  const availableMembers = useMemo(() => {
    const members = (playerFaction?.members ?? EMPTY_MEMBERS) as SquadMember[];
    return members.filter(member => !squadIds.has(member.id));
  }, [playerFaction, squadIds]);
  const evaluations = useMemo(() => {
    const rows = new Map<string, SquadRecruitEvaluation>();
    for (const member of availableMembers) {
      rows.set(member.id, evaluateRecruitment(member));
    }
    return rows;
  }, [availableMembers, evaluateRecruitment]);

  const currentFormation = partyState.formation ?? '牵制';
  const npcSlotCount = Math.max(0, partyState.maxSize - 1);
  const totalPower = squadMembers.reduce((sum, member) => sum + member.atk + member.def + member.maxHp * 0.3, 0);
  const powerLabel = totalPower >= 420 ? '可挑战精英敌群' : totalPower >= 260 ? '可接中等委托' : '适合护送与侦察';

  return (
    <div className="h-full overflow-y-auto p-4 text-rg-paper-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-title text-lg text-rg-gold">小队编成</h2>
          <p className="mt-1 text-[11px] text-rg-paper-200/45">
            队伍上限 {partyState.maxSize} 人含玩家，当前队友 {squadMembers.length}/{npcSlotCount}，行动点 {ap}
          </p>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-[11px] text-rg-paper-200/45 hover:text-rg-paper-100">
            关闭
          </button>
        ) : null}
      </div>

      <section className="mt-4">
        <div className="text-[11px] text-rg-paper-200/45">战术姿态</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TACTICAL_POSTURES.map(posture => (
            <button
              key={posture}
              type="button"
              onClick={() => setPartyFormation(posture)}
              className={`rounded-sm border px-3 py-2 text-left transition-micro ${
                currentFormation === posture
                  ? 'border-rg-gold/50 bg-rg-gold/10 text-rg-gold'
                  : 'border-rg-ink-300/15 text-rg-paper-200/55 hover:border-rg-gold/30'
              }`}
            >
              <div className="text-sm font-panel font-semibold">{posture}</div>
              <div className="mt-1 text-[10px] text-rg-paper-200/40">{POSTURE_NOTES[posture]}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 rounded-sm border border-rg-ink-300/12 bg-rg-ink-700/35 p-2 text-[11px] text-rg-paper-200/45">
          士气 {partyState.morale} · 配合度 {partyState.coordination} · 战力评估：{powerLabel}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-panel text-rg-paper-100">当前小队</h3>
        <div className="mt-2 space-y-2">
          {squadMembers.length === 0 ? (
            <div className="rounded border border-dashed border-rg-ink-300/20 p-4 text-center text-[12px] text-rg-paper-200/35">
              暂无队友。先从势力成员池中调入成员，小队战才会进入多人结算。
            </div>
          ) : squadMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              rolePausedUntil={partyState.memberRolePausedUntil[member.id]}
              action="remove"
              onClick={() => removeMemberFromParty(member.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-panel text-rg-paper-100">势力成员池</h3>
        {!playerFaction ? (
          <div className="mt-2 rounded border border-rg-ink-300/15 bg-rg-ink-700/35 p-4 text-[12px] text-rg-paper-200/45">
            尚未创建势力。小队核心闭环从势力成员池开始，后续可由动态 NPC 或剧情接触进入候选池。
          </div>
        ) : availableMembers.length === 0 ? (
          <div className="mt-2 rounded border border-rg-ink-300/15 bg-rg-ink-700/35 p-4 text-[12px] text-rg-paper-200/45">
            当前没有可调入成员。已入队、重伤、闭关、外派或执行势力任务的成员不会重复显示。
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {availableMembers.map(member => {
              const evaluation = evaluations.get(member.id);
              const disabled = !evaluation?.canJoin || ap < 1 || squadMembers.length >= npcSlotCount;
              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  evaluation={evaluation}
                  action="add"
                  disabled={disabled}
                  onClick={() => addMemberToParty(member.id)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
