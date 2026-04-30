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

  // 同步管道状态到 Zustand
  const syncState = useCallback((state: PipeState) => {
    setPipeState(state);
    setPipelinePhase(state);
  }, [setPipelinePhase]);

  // ─── 开始游戏（开局叙事） ───
  const startGame = useCallback(async () => {
    const pipeline = getPipeline();
    pipeline.reset();
    syncState('IDLE');

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
    const pipeline = getPipeline();
    syncState('IDLE');
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
    }
  }, [syncState, setPipelineError, setL3Warnings]);

  // ─── 重试 ───
  const retry = useCallback(async () => {
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
