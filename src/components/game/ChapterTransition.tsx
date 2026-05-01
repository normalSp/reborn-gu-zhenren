/**
 * ChapterTransition — 转章过场动画组件
 * P1基础架构：淡入动画 + 章节标题 + 叙事摘要 + 确认按钮
 * P2扩展：五域差异化美术风格、音效、转章回顾
 */
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { ChapterDefinition } from '../../types';
import chaptersRaw from '../../canon/chapters.json';

const chaptersData = chaptersRaw as { domains: Record<string, ChapterDefinition[]> };

export const ChapterTransition: React.FC = () => {
  const [opacity, setOpacity] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const transitionState = useStore(s => s.transitionState);
  const currentDomain = useStore(s => s.currentDomain);
  const activateChapter = useStore(s => s.activateChapter);
  const setTransitionState = useStore(s => s.setTransitionState);
  const finalizeChapter = useStore(s => s.finalizeChapter);
  const checkProgression = useStore(s => s.checkProgression);
  const turn = useStore(s => s.turn);

  const [nextChapter, setNextChapter] = useState<ChapterDefinition | null>(null);
  const [progressionResult, setProgressionResult] = useState<ReturnType<typeof checkProgression> | null>(null);

  // 检测转章触发
  useEffect(() => {
    if (transitionState !== 'idle') return;

    const result = checkProgression();
    if (result.shouldTransition && result.nextChapterId) {
      setProgressionResult(result);
      setTransitionState('transitioning');
    }
  }, [transitionState, turn, checkProgression, setTransitionState]);

  // 过渡动画
  useEffect(() => {
    if (transitionState !== 'transitioning') return;

    // 获取下一章节定义
    if (progressionResult?.nextChapterId) {
      const domain = currentDomain;
      const chapters = chaptersData.domains[domain] || [];
      const next = chapters.find(c => c.id === progressionResult.nextChapterId);
      setNextChapter(next || null);
    }

    // 淡入动画
    const timer = setTimeout(() => {
      setOpacity(1);
      setTimeout(() => setShowContent(true), 500);
    }, 100);

    return () => clearTimeout(timer);
  }, [transitionState, progressionResult, currentDomain]);

  const handleConfirm = () => {
    if (!progressionResult?.nextChapterId) return;

    // 完成当前章节记录
    finalizeChapter();

    // 淡出
    setShowContent(false);
    setOpacity(0);

    setTimeout(() => {
      // 激活下一章节
      activateChapter(progressionResult.nextChapterId!);
      setTransitionState('idle');
      setNextChapter(null);
      setProgressionResult(null);
    }, 600);
  };

  if (transitionState !== 'transitioning') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      {showContent && (
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '40px' }}>
          {/* 章节标题 */}
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#c9a87c',
              marginBottom: '16px',
              fontFamily: '"Serif", serif',
              letterSpacing: '0.1em',
            }}
          >
            {nextChapter?.displayName || '新章节'}
          </h2>

          {/* 域标识 */}
          <div
            style={{
              fontSize: '14px',
              color: '#6b5b4f',
              marginBottom: '32px',
              letterSpacing: '0.2em',
            }}
          >
            {nextChapter?.domain || currentDomain}
          </div>

          {/* 位置区域 */}
          {nextChapter && (
            <div
              style={{
                fontSize: '16px',
                color: '#8b7355',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              区域：{nextChapter.position.area}
            </div>
          )}

          {/* 叙事主题 */}
          {nextChapter && (
            <div
              style={{
                fontSize: '14px',
                color: '#5c4a3a',
                marginBottom: '40px',
                lineHeight: '1.8',
                fontStyle: 'italic',
                padding: '0 20px',
              }}
            >
              {nextChapter.sceneConstraints.narrativeTheme}
            </div>
          )}

          {/* 目标预览 */}
          {nextChapter && nextChapter.goals.length > 0 && (
            <div style={{ marginBottom: '40px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', color: '#6b5b4f', marginBottom: '8px' }}>
                本章目标：
              </div>
              {nextChapter.goals.map(g => (
                <div
                  key={g.id}
                  style={{
                    fontSize: '14px',
                    color: '#8b7355',
                    padding: '4px 0',
                  }}
                >
                  {g.description}
                </div>
              ))}
            </div>
          )}

          {/* 确认按钮 */}
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 48px',
              fontSize: '18px',
              backgroundColor: 'transparent',
              color: '#c9a87c',
              border: '1px solid #c9a87c',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Serif", serif',
              letterSpacing: '0.1em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(201, 168, 124, 0.15)';
              e.currentTarget.style.borderColor = '#d4b896';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#c9a87c';
            }}
          >
            踏入新章
          </button>

          {progressionResult?.reason && (
            <div style={{ fontSize: '12px', color: '#4a3a2a', marginTop: '16px' }}>
              {progressionResult.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
