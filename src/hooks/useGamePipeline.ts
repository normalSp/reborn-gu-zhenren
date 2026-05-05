import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store';
import { ResponsePipeline, type PipeState, type PipeResult } from '../engine/response-pipeline';
import type { SemanticValidationResult } from '../engine/semantic-validator';
import chaptersRaw from '../canon/chapters.json';
import worldRulesRaw from '../canon/world-rules.json';

const chaptersData = chaptersRaw as { domains: Record<string, any[]> };

// ─── 单例管道 ───
let pipelineInstance: ResponsePipeline | null = null;

function getPipeline(): ResponsePipeline {
  if (!pipelineInstance) {
    const mode = useStore.getState().gameMode || 'canon';
    pipelineInstance = new ResponsePipeline({ mode });
  }
  return pipelineInstance;
}

interface UseGamePipelineReturn {
  pipeState: PipeState;
  pipeResult: PipeResult | null;
  validation: SemanticValidationResult | null;
  startGame: (isResume?: boolean) => Promise<void>;
  submitChoice: (choiceId: string) => Promise<void>;
  retry: () => Promise<void>;
}

export function useGamePipeline(): UseGamePipelineReturn {
  const [pipeState, setPipeState] = useState<PipeState>('IDLE');
  const [pipeResult, setPipeResult] = useState<PipeResult | null>(null);
  const [validation, setValidation] = useState<SemanticValidationResult | null>(null);

  const setPipelinePhase = useStore(s => s.setPipelinePhase);
  const setPipelineError = useStore(s => s.setPipelineError);
  const setL3Warnings = useStore(s => s.setL3Warnings);
  const screenState = useStore(s => s.screenState);

  const lastChoiceRef = useRef<string | null>(null);
  const submittedRef = useRef(false); // 防止重复提交的锁

  // 同步管道状态到 Zustand
  const syncState = useCallback((state: PipeState) => {
    console.log(`%c[PIPE] SYNC %c→ ${state}`,'color:#888','color:#999');
    setPipeState(state);
    setPipelinePhase(state);
  }, [setPipelinePhase]);

  // ─── 开始游戏（开局叙事/续档叙事） ───
  const startGame = useCallback(async (isResume: boolean = false) => {
    console.log(`%c[PIPE] START_GAME %c→ isResume=${isResume}`,'color:#b8860b;font-weight:bold','color:#999');
    const pipeline = getPipeline();
    pipeline.reset();

    // P3修复：新游戏时初始化章节系统
    if (!isResume) {
      const store = useStore.getState() as any;
      const bg: string = store.profile?.background || '南疆';
      // 从 "中洲 · 蛊师学徒" 格式中提取域名
      const originFlag = store.flags?._origin;
      const timelineStartFlag = store.flags?._timeline_start; // 时间线起点节点ID
      const domainCandidates = ['南疆', '北原', '东海', '西漠', '中洲'];
      let domain = originFlag || '南疆';
      // 如果flag没有，尝试从background解析
      if (!originFlag || !domainCandidates.includes(originFlag)) {
        domain = domainCandidates.find(d => bg.includes(d)) || '南疆';
      }
      // ═══ 时间线桥接：如果_timeline_start非空，优先用时间线起点章节 ═══
      const domainChapters = chaptersData.domains[domain] || [];
      let chapterId: string | null = null;
      if (timelineStartFlag) {
        const timelineChapter = domainChapters.find((c: any) => c.id === timelineStartFlag);
        if (timelineChapter) {
          chapterId = timelineChapter.id;
          console.log(`[Chapter] 时间线起点: ${timelineChapter.displayName} (${domain})`);
        } else {
          console.warn(`[Chapter] 时间线节点 "${timelineStartFlag}" 在域 "${domain}" 中未找到，回退到域入口`);
        }
      }
      // fallback: 如果没有时间线起点，使用域入口章节（domainOpeningChapter）
      if (!chapterId) {
        const openingChapter = domainChapters.find((c: any) => c.domainOpeningChapter);
        if (openingChapter) {
          chapterId = openingChapter.id;
          console.log(`[Chapter] 域入口章节: ${openingChapter.displayName} (${domain})`);
        }
      }
      if (chapterId) {
        store.initChapter?.(chapterId, domain);
      } else {
        console.warn(`[Chapter] 域 "${domain}" 无入口章节，使用南疆默认`);
        const nanjiangChapters = chaptersData.domains['南疆'] || [];
        const fallback = nanjiangChapters.find((c: any) => c.domainOpeningChapter);
        if (fallback) store.initChapter?.(fallback.id, '南疆');
      }

      // ═══ P4: 初始化势力声望（基于 world-rules.json 五域势力定义） ═══
      const factionData = (worldRulesRaw as any)?.['五域势力']?.[domain];
      if (factionData?.keyFactions && typeof store.updateStanding === 'function') {
        for (const faction of factionData.keyFactions) {
          const standing = faction.standing || 0;
          if (standing !== 0) {
            store.updateStanding(faction.id, standing);
            console.log(`[Faction] 初始化 ${faction.name}: ${standing > 0 ? '+' : ''}${standing} (${domain})`);
          }
        }
      }
    }

    // 立即进入处理状态，UI 层展示加载
    syncState('BUILDING_CONTEXT');

    try {
      // isResume: 续档=true/新游戏=false（isOpening 硬编码路径已移除，统一标准约束prompt）
      const result = await pipeline.process(null, isResume);
      setPipeResult(result);

      if (result.state === 'RESOLVED') {
        syncState('RESOLVED');
        if (result.validation?.warningRules.length) {
          setL3Warnings(
            result.validation.warningRules.map(r => ({
              ruleName: r.ruleName,
              details: r.details,
            }))
          );
        }
        setValidation(result.validation || null);
      } else {
        syncState('ERROR');
        setPipelineError(result.error || '开局叙事生成失败');
      }
    } catch (err: any) {
      syncState('ERROR');
      setPipelineError(err?.message || '开局叙事异常');
    }
  }, [syncState, setPipelineError, setL3Warnings]);

  // ─── 提交选择 ───
  const submitChoice = useCallback(async (choiceId: string) => {
    // ─── 防御性：retry 不应作为选择ID进入管道 ───
    if (choiceId === 'retry') {
      await retry();
      return;
    }

    // ═══ 运行中守卫：防止重复提交 ═══
    if (submittedRef.current) {
      console.log(`%c[PIPE] GUARD %c→ blocked, already submitting`,'color:#e85050','color:#999');
      return;
    }
    // 去重：同一选择ID刚提交过且管道仍在处理中
    const currentPhase = useStore.getState().pipelinePhase;
    const isProcessing = currentPhase !== 'IDLE' && currentPhase !== 'RESOLVED' && currentPhase !== 'ERROR';
    if (isProcessing && lastChoiceRef.current === choiceId) {
      console.log(`%c[PIPE] GUARD %c→ blocked, duplicate choiceId=${choiceId}`,'color:#e85050','color:#999');
      return;
    }

    submittedRef.current = true;
    const pipeline = getPipeline();
    console.log(`%c[PIPE] SUBMIT %c→ id=${choiceId}`,'color:#b8860b','color:#999');

    // 立即进入处理状态，UI 层禁止重复点击
    syncState('BUILDING_CONTEXT');
    lastChoiceRef.current = choiceId;

    // 先记录玩家的选择
    useStore.getState().appendMessage({
      role: 'user',
      content: choiceId,
    });

    try {
      const result = await pipeline.process(choiceId, false);
      setPipeResult(result);

      if (result.state === 'RESOLVED') {
        syncState('RESOLVED');
        if (result.validation?.warningRules.length) {
          setL3Warnings(
            result.validation.warningRules.map(r => ({
              ruleName: r.ruleName,
              details: r.details,
            }))
          );
        }
        setValidation(result.validation || null);
      } else {
        syncState('ERROR');
        setPipelineError(result.error || 'AI响应失败');
      }
    } catch (err: any) {
      syncState('ERROR');
      setPipelineError(err?.message || '选择处理异常');
    } finally {
      submittedRef.current = false;
    }
  }, [syncState, setPipelineError, setL3Warnings]);

  // ─── 重试 ───
  const retry = useCallback(async () => {
    console.log('%c[PIPE] RETRY %c→ resetting pipeline','color:#e85050','color:#999');
    const pipeline = getPipeline();
    pipeline.reset();

    if (lastChoiceRef.current) {
      await submitChoice(lastChoiceRef.current);
    } else {
      await startGame();
    }
  }, [startGame, submitChoice]);

  return {
    pipeState,
    pipeResult,
    validation,
    startGame,
    submitChoice,
    retry,
  };
}
