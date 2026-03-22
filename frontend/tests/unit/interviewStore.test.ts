/**
 * frontend/tests/unit/interviewStore.test.ts
 *
 * Unit tests for the Zustand interview store.
 * Tests all state transitions, question flow, and real-time data updates.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInterviewStore, buildSessionSummary } from '@root/stores/interviewStore';

// Reset the store to initial state before every test
beforeEach(() => {
  useInterviewStore.getState().resetInterview();
});

const MOCK_QUESTIONS = [
  'Tell me about yourself.',
  'What is your greatest strength?',
  'Where do you see yourself in 5 years?',
];

describe('interviewStore — session lifecycle', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useInterviewStore());
    expect(result.current.status).toBe('idle');
    expect(result.current.questions).toHaveLength(0);
  });

  it('initSession transitions to ready with correct questions', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.questions).toEqual(MOCK_QUESTIONS);
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.records).toHaveLength(3);
  });

  it('startInterview transitions to active and records start time', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
    });
    expect(result.current.status).toBe('active');
    expect(result.current.sessionStartedAt).toBeGreaterThan(0);
  });

  it('pauseInterview and resumeInterview toggle correctly', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
      result.current.pauseInterview();
    });
    expect(result.current.status).toBe('paused');
    act(() => {
      result.current.resumeInterview();
    });
    expect(result.current.status).toBe('active');
  });

  it('completeInterview sets status to completed', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
      result.current.completeInterview();
    });
    expect(result.current.status).toBe('completed');
  });

  it('resetInterview returns to idle with empty questions', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('technical', MOCK_QUESTIONS);
      result.current.startInterview();
      result.current.resetInterview();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.questions).toHaveLength(0);
    expect(result.current.currentQuestionIndex).toBe(0);
  });

  it('setError transitions to error state', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.setError('Network failure');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Network failure');
  });
});

describe('interviewStore — question flow', () => {
  it('nextQuestion advances the question index', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
      result.current.nextQuestion();
    });
    expect(result.current.currentQuestionIndex).toBe(1);
    expect(result.current.status).toBe('active');
  });

  it('nextQuestion on the last question sets status to completed', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
      // Advance through all 3 questions
      result.current.nextQuestion(); // → index 1
      result.current.nextQuestion(); // → index 2 (last)
      result.current.nextQuestion(); // → completed
    });
    expect(result.current.status).toBe('completed');
  });

  it('setTranscript stores transcript on the correct record', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.setTranscript(0, 'I am a software engineer.');
    });
    expect(result.current.records[0].transcript).toBe('I am a software engineer.');
    expect(result.current.records[1].transcript).toBe('');
  });

  it('nextQuestion snapshots voice and emotion to the record', () => {
    const { result } = renderHook(() => useInterviewStore());
    const mockVoice = {
      wpm: 130,
      volume: 0.7,
      fillerWords: 2,
      confidence: 'high',
      clarity: 'clear',
    };
    const mockEmotion = {
      happy: 0.6,
      sad: 0,
      angry: 0,
      surprised: 0.1,
      neutral: 0.3,
      disgusted: 0,
      fearful: 0,
    };
    act(() => {
      result.current.initSession('behavioral', MOCK_QUESTIONS);
      result.current.startInterview();
      result.current.updateVoiceMetrics(mockVoice);
      result.current.updateEmotionData(mockEmotion);
      result.current.nextQuestion();
    });
    expect(result.current.records[0].voiceSnapshot).toEqual(mockVoice);
    expect(result.current.records[0].emotionSnapshot).toEqual(mockEmotion);
    expect(result.current.records[0].answeredAt).toBeGreaterThan(0);
  });
});

describe('interviewStore — real-time metrics', () => {
  it('updateVoiceMetrics sets latestVoiceMetrics', () => {
    const { result } = renderHook(() => useInterviewStore());
    const metrics = {
      wpm: 120,
      volume: 0.5,
      fillerWords: 1,
      confidence: 'medium',
      clarity: 'clear',
    };
    act(() => {
      result.current.updateVoiceMetrics(metrics);
    });
    expect(result.current.latestVoiceMetrics).toEqual(metrics);
  });

  it('updateEmotionData derives confidenceScore from happy+neutral', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.updateEmotionData({
        happy: 40,
        neutral: 40,
        sad: 10,
        angry: 5,
        surprised: 5,
        disgusted: 0,
        fearful: 0,
      });
    });
    // (happy=40 + neutral=40) / total=100 * 100 = 80
    expect(result.current.confidenceScore).toBeCloseTo(80, 0);
  });

  it('updateAudioLevel sets audioLevel', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.updateAudioLevel(128);
    });
    expect(result.current.audioLevel).toBe(128);
  });

  it('tickElapsed increments sessionElapsedSeconds', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.tickElapsed();
      result.current.tickElapsed();
      result.current.tickElapsed();
    });
    expect(result.current.sessionElapsedSeconds).toBe(3);
  });
});

describe('interviewStore — UI flags', () => {
  it('setAvatarSpeaking toggles the flag', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => result.current.setAvatarSpeaking(true));
    expect(result.current.isAvatarSpeaking).toBe(true);
    act(() => result.current.setAvatarSpeaking(false));
    expect(result.current.isAvatarSpeaking).toBe(false);
  });

  it('setUserSpeaking toggles the flag', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => result.current.setUserSpeaking(true));
    expect(result.current.isUserSpeaking).toBe(true);
  });

  it('setListening toggles the flag', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => result.current.setListening(true));
    expect(result.current.isListening).toBe(true);
  });
});

describe('buildSessionSummary', () => {
  it('produces a summary with all required fields', () => {
    const { result } = renderHook(() => useInterviewStore());
    act(() => {
      result.current.initSession('technical', MOCK_QUESTIONS, 'sess-001');
      result.current.startInterview();
    });
    const summary = buildSessionSummary(result.current);
    expect(summary.mode).toBe('technical');
    expect(summary.sessionId).toBe('sess-001');
    expect(summary.questions).toEqual(MOCK_QUESTIONS);
    expect(summary.completedAt).toBeTruthy();
  });
});
