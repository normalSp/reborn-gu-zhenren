import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import type { DialogueTopic } from '../../types';

// ═══ M7: NPC dialog animation variants ═══
const npcOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const npcPanelVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

const bubbleVariants = {
  hidden: (role: string) => ({
    opacity: 0,
    x: role === 'player' ? 20 : -20,
    scale: 0.95,
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 250, damping: 22 },
  },
};

const topicBtnVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.04, type: 'spring', stiffness: 200, damping: 20 },
  }),
};

const TOPICS: { key: DialogueTopic; label: string; color: string; desc: string }[] = [
  { key: '闲聊', label: '闲聊', color: 'var(--gu-trace-gold)', desc: '日常交谈' },
  { key: '请教', label: '请教', color: 'var(--gu-life-verdant)', desc: '获取情报' },
  { key: '请教杀招', label: '请教杀招', color: 'var(--gu-life-verdant)', desc: 'NPC传授独门杀招' },
  { key: '交易', label: '交易', color: 'var(--gu-trace-gold)', desc: '买卖蛊材' },
  { key: '委托', label: '委托', color: 'var(--gu-trace-gold)', desc: '接取任务' },
  { key: '挑衅', label: '挑衅', color: 'var(--gu-life-crimson)', desc: '激怒对方' },
  { key: '深交', label: '深交', color: 'var(--gu-trace-gold)', desc: '推进关系' },
];

interface NPCInteractionPanelProps {
  onSubmitDialogueTopic: (topic: DialogueTopic) => Promise<void>;
}

export function NPCInteractionPanel({ onSubmitDialogueTopic }: NPCInteractionPanelProps) {
  const ad = useStore((s: any) => s.activeDialogue);
  const sendTopic = useStore((s: any) => s.sendTopic);
  const markDialogueError = useStore((s: any) => s.markDialogueError);
  const endDialogue = useStore((s: any) => s.endDialogue);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (ad) {
      setVisible(true);
      const t = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(t);
    } else {
      setShowContent(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [ad]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ad?.messages?.length]);

  const handleTopic = useCallback(async (topic: DialogueTopic) => {
    if (!ad || ad.awaitingResponse) return;
    // P4: 请教杀招 — 好感度≥80时可能触发传授
    if (topic === '请教杀招' && ad.affinity >= 80) {
      const teachKillMove = (useStore.getState() as any).teachKillMove;
      const npcKillMoves = (useStore.getState() as any).npcKillMoves || [] as any[];
      const npcMove = npcKillMoves.find((m: any) => m.npcName === ad.npcName && m.canTeach !== false);
      if (npcMove && typeof teachKillMove === 'function') {
        teachKillMove(npcMove);
      }
    }
    sendTopic(topic);
    try {
      await onSubmitDialogueTopic(topic);
    } catch (err: any) {
      markDialogueError?.(err?.message || '对话生成失败，请稍后重试。');
    }
  }, [ad, markDialogueError, onSubmitDialogueTopic, sendTopic]);

  const handleClose = useCallback(() => {
    endDialogue();
  }, [endDialogue]);

  if (!visible || !ad) return null;

  const affinity = ad.affinity || 0;
  const affinityColor = affinity >= 30 ? 'var(--gu-life-verdant)' : affinity >= 0 ? 'var(--gu-trace-gold)' : affinity >= -30 ? 'var(--gu-life-crimson)' : 'var(--gu-life-crimson-dim)';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center"
          variants={npcOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{ backgroundColor: 'var(--gu-bg-deep)' }}
        >
          <motion.div
            className="w-full max-w-md mx-auto rounded-t-xl overflow-hidden"
            variants={npcPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              backgroundColor: 'var(--gu-bg-standard)',
              border: '1px solid var(--gu-trace-gold-dim)',
              borderBottom: 'none',
              boxShadow: 'var(--gu-shadow-lg)',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ─── 顶部信息栏 ─── */}
            <div className="p-3 border-b border-rg-gold-400/10 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-bold text-rg-gold-400">{ad.npcName}</span>
                  <span className="text-xs text-rg-paper-200/40 ml-2">{ad.npcFaction}</span>
                </div>
                <motion.button onClick={handleClose} className="text-rg-paper-200/40 hover:text-rg-paper-200/80 text-lg cursor-pointer" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>&times;</motion.button>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-rg-paper-200/40 w-8">好感度</span>
                <div className="flex-1 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" layout transition={{ type: 'spring', stiffness: 120, damping: 15 }} style={{ width: `${(affinity + 100) / 2}%`, backgroundColor: affinityColor }} />
                </div>
                <motion.span key={affinity} className="text-[10px] font-mono w-8 text-right" initial={{ scale: 1.3 }} animate={{ scale: 1 }} style={{ color: affinityColor }}>{affinity}</motion.span>
              </div>
              <div className="text-[10px] text-rg-paper-200/30 italic">{ad.npcPersonality}</div>
            </div>

            {/* ─── 消息列表 ─── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {ad.messages.length === 0 && (
                <div className="text-xs text-rg-paper-200/30 text-center py-8">选择一个话题开始对话</div>
              )}
              {ad.messages.map((m: any, i: number) => (
                <motion.div
                  key={i}
                  className={`flex ${m.role === 'player' ? 'justify-end' : 'justify-start'}`}
                  custom={m.role}
                  variants={bubbleVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div
                    className="max-w-[80%] px-3 py-1.5 rounded-lg text-xs leading-relaxed"
                    style={{
                      backgroundColor: m.role === 'player' ? 'var(--gu-trace-gold-dim)' : 'var(--gu-bg-standard)',
                      color: m.role === 'player' ? 'var(--gu-trace-gold)' : 'var(--gu-text-primary)',
                      border: m.role === 'player' ? '1px solid var(--gu-trace-gold-dim)' : '1px solid var(--gu-trace-slate)',
                      textAlign: m.role === 'player' ? 'right' : 'left',
                    }}
                  >
                    {m.text}
                    {m.affinityChange !== undefined && m.affinityChange !== 0 && (
                      <div className="text-[10px] mt-0.5" style={{ color: m.affinityChange > 0 ? 'var(--gu-life-verdant)' : 'var(--gu-life-crimson)' }}>
                        {m.affinityChange > 0 ? '+' : ''}{m.affinityChange} 好感
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {ad.awaitingResponse && ad.pendingTopic && (
                <motion.div className="flex justify-end" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--gu-trace-gold-dim)', color: 'var(--gu-trace-gold)', border: '1px dashed var(--gu-trace-gold-dim)' }}>
                    {ad.pendingTopic}——等待对方回应...
                  </div>
                </motion.div>
              )}
              {ad.error && (
                <motion.div className="flex justify-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="px-3 py-1.5 rounded-lg text-xs text-rg-blood-400 border border-rg-blood-400/30 bg-rg-blood-400/10">
                    {ad.error}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── 话题按钮 ─── */}
            <motion.div className="p-2 border-t border-rg-gold-400/10 flex gap-1 flex-shrink-0 bg-rg-ink-900/50" initial="hidden" animate="visible">
              {TOPICS.map((t, i) => (
                <motion.button
                  key={t.key}
                  custom={i}
                  variants={topicBtnVariant}
                  onClick={() => handleTopic(t.key)}
                  disabled={!!ad.awaitingResponse}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-panel font-medium flex flex-col items-center ${ad.awaitingResponse ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
                  style={{
                    backgroundColor: 'var(--gu-bg-standard)',
                    color: t.color,
                    border: `1px solid ${t.color}`,
                  }}
                  whileHover={{ scale: 1.04, borderColor: t.color + '60' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span>{t.label}</span>
                  <span className="text-[8px] opacity-40">{t.desc}</span>
                </motion.button>
              ))}
            </motion.div>

            <motion.button
              onClick={handleClose}
              className="w-full py-1.5 text-[10px] text-rg-paper-200/30 hover:text-rg-paper-200/60 transition-all cursor-pointer bg-rg-ink-900/30"
              whileHover={{ backgroundColor: 'var(--gu-trace-slate-light)' }}
            >结束对话</motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
