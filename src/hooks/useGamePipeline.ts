import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store';
import { ResponsePipeline, type PipeState, type PipeResult } from '../engine/response-pipeline';
import type { SemanticValidationResult } from '../engine/semantic-validator';

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
  startGame: () => Promise<void>;
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

  // ─── 开始游戏（开局叙事） ───
  const startGame = useCallback(async () => {
    console.log('%c[PIPE] START_GAME','color:#b8860b;font-weight:bold');
    const pipeline = getPipeline();
    pipeline.reset();
    // 立即进入处理状态，UI 层展示加载
    syncState('BUILDING_CONTEXT');

    try {
      const result = await pipeline.process(null, true); // isOpening = true
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
