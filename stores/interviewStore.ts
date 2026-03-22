/**
 * stores/interviewStore.ts
 *
 * Global Zustand store for interview session state.
 *
 * Replaces 20+ scattered useState calls across behavioral/technical pages
 * with a single, serialisable store that can be subscribed to from any
 * component without prop-drilling.
 *
 * Usage:
 *   import { useInterviewStore } from '@/stores/interviewStore';
 *   const { status, currentQuestionIndex, nextQuestion } = useInterviewStore();
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type InterviewMode = 'behavioral' | 'technical' | 'group' | 'challenge';

export type InterviewStatus =
  | 'idle'       // Not started
  | 'ready'      // Camera / mic acquired, waiting for "Start"
  | 'active'     // Interview in progress
  | 'paused'     // Temporarily paused
  | 'completed'  // All questions answered
  | 'error';     // Unrecoverable error

export interface VoiceMetrics {
  wpm: number;
  volume: number;
  fillerWords: number;
  confidence: string;
  clarity: string;
}

export interface EmotionData {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  neutral: number;
  disgusted: number;
  fearful: number;
}

export interface QuestionRecord {
  question: string;
  transcript: string;
  startedAt: number;
  answeredAt: number | null;
  voiceSnapshot: VoiceMetrics | null;
  emotionSnapshot: EmotionData | null;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface InterviewState {
  // Session identity
  mode: InterviewMode;
  sessionId: string | null;

  // Interview flow
  status: InterviewStatus;
  questions: string[];
  currentQuestionIndex: number;
  records: QuestionRecord[];

  // Real-time analysis snapshots
  latestVoiceMetrics: VoiceMetrics | null;
  latestEmotionData: EmotionData | null;
  confidenceScore: number;
  audioLevel: number;

  // UI flags
  isAvatarSpeaking: boolean;
  isUserSpeaking: boolean;
  isListening: boolean;

  // Timing
  sessionStartedAt: number | null;
  sessionElapsedSeconds: number;

  // Error
  error: string | null;
}

export interface InterviewActions {
  // Lifecycle
  initSession: (mode: InterviewMode, questions: string[], sessionId?: string) => void;
  startInterview: () => void;
  pauseInterview: () => void;
  resumeInterview: () => void;
  completeInterview: () => void;
  resetInterview: () => void;
  setError: (error: string) => void;

  // Question flow
  nextQuestion: () => void;
  setTranscript: (questionIndex: number, transcript: string) => void;

  // Real-time data updates
  updateVoiceMetrics: (metrics: VoiceMetrics) => void;
  updateEmotionData: (emotion: EmotionData) => void;
  updateAudioLevel: (level: number) => void;
  updateConfidenceScore: (score: number) => void;

  // UI flags
  setAvatarSpeaking: (speaking: boolean) => void;
  setUserSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;

  // Timer
  tickElapsed: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE: InterviewState = {
  mode: 'behavioral',
  sessionId: null,
  status: 'idle',
  questions: [],
  currentQuestionIndex: 0,
  records: [],
  latestVoiceMetrics: null,
  latestEmotionData: null,
  confidenceScore: 75,
  audioLevel: 0,
  isAvatarSpeaking: false,
  isUserSpeaking: false,
  isListening: false,
  sessionStartedAt: null,
  sessionElapsedSeconds: 0,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInterviewStore = create<InterviewState & InterviewActions>()(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,

      // ------------------------------------------------------------------
      // Lifecycle
      // ------------------------------------------------------------------
      initSession: (mode, questions, sessionId) =>
        set(
          {
            mode,
            questions,
            sessionId: sessionId ?? null,
            status: 'ready',
            currentQuestionIndex: 0,
            records: questions.map((q) => ({
              question: q,
              transcript: '',
              startedAt: 0,
              answeredAt: null,
              voiceSnapshot: null,
              emotionSnapshot: null,
            })),
            error: null,
          },
          false,
          'initSession'
        ),

      startInterview: () =>
        set(
          { status: 'active', sessionStartedAt: Date.now(), sessionElapsedSeconds: 0 },
          false,
          'startInterview'
        ),

      pauseInterview: () =>
        set({ status: 'paused' }, false, 'pauseInterview'),

      resumeInterview: () =>
        set({ status: 'active' }, false, 'resumeInterview'),

      completeInterview: () =>
        set({ status: 'completed' }, false, 'completeInterview'),

      resetInterview: () =>
        set({ ...INITIAL_STATE }, false, 'resetInterview'),

      setError: (error) =>
        set({ status: 'error', error }, false, 'setError'),

      // ------------------------------------------------------------------
      // Question flow
      // ------------------------------------------------------------------
      nextQuestion: () => {
        const { currentQuestionIndex, questions, latestVoiceMetrics, latestEmotionData } = get();
        const now = Date.now();

        // Snapshot the current question record
        set(
          (state) => {
            const records = [...state.records];
            if (records[currentQuestionIndex]) {
              records[currentQuestionIndex] = {
                ...records[currentQuestionIndex],
                answeredAt: now,
                voiceSnapshot: latestVoiceMetrics,
                emotionSnapshot: latestEmotionData,
              };
            }
            const isLast = currentQuestionIndex >= questions.length - 1;
            return {
              records,
              currentQuestionIndex: isLast
                ? currentQuestionIndex
                : currentQuestionIndex + 1,
              status: isLast ? 'completed' : 'active',
            };
          },
          false,
          'nextQuestion'
        );
      },

      setTranscript: (questionIndex, transcript) =>
        set(
          (state) => {
            const records = [...state.records];
            if (records[questionIndex]) {
              records[questionIndex] = { ...records[questionIndex], transcript };
            }
            return { records };
          },
          false,
          'setTranscript'
        ),

      // ------------------------------------------------------------------
      // Real-time data
      // ------------------------------------------------------------------
      updateVoiceMetrics: (metrics) =>
        set({ latestVoiceMetrics: metrics }, false, 'updateVoiceMetrics'),

      updateEmotionData: (emotion) => {
        const { happy = 0, neutral = 0 } = emotion;
        const total =
          Object.values(emotion).reduce<number>((acc, v) => acc + (v as number), 0) || 1;
        const confidence = Math.min(100, ((happy + neutral) / total) * 100);
        set(
          { latestEmotionData: emotion, confidenceScore: confidence },
          false,
          'updateEmotionData'
        );
      },

      updateAudioLevel: (level) =>
        set({ audioLevel: level }, false, 'updateAudioLevel'),

      updateConfidenceScore: (score) =>
        set({ confidenceScore: score }, false, 'updateConfidenceScore'),

      // ------------------------------------------------------------------
      // UI flags
      // ------------------------------------------------------------------
      setAvatarSpeaking: (speaking) =>
        set({ isAvatarSpeaking: speaking }, false, 'setAvatarSpeaking'),

      setUserSpeaking: (speaking) =>
        set({ isUserSpeaking: speaking }, false, 'setUserSpeaking'),

      setListening: (listening) =>
        set({ isListening: listening }, false, 'setListening'),

      // ------------------------------------------------------------------
      // Timer
      // ------------------------------------------------------------------
      tickElapsed: () =>
        set(
          (state) => ({ sessionElapsedSeconds: state.sessionElapsedSeconds + 1 }),
          false,
          'tickElapsed'
        ),
    }),
    { name: 'InterviewStore' }
  )
);

// ---------------------------------------------------------------------------
// Convenience selector hooks — use these in components to avoid subscribing
// to the whole store on every re-render.
// ---------------------------------------------------------------------------
export const useInterviewStatus = () => useInterviewStore((s) => s.status);
export const useCurrentQuestion = () =>
  useInterviewStore((s) => s.questions[s.currentQuestionIndex] ?? '');
export const useSessionProgress = () =>
  useInterviewStore((s) => ({
    current: s.currentQuestionIndex + 1,
    total: s.questions.length,
    percent:
      s.questions.length > 0
        ? Math.round(((s.currentQuestionIndex + 1) / s.questions.length) * 100)
        : 0,
  }));
export const useVoiceMetrics = () =>
  useInterviewStore((s) => s.latestVoiceMetrics);
export const useEmotionData = () =>
  useInterviewStore((s) => s.latestEmotionData);

/**
 * Build the full session summary payload for localStorage / API submission.
 */
export const buildSessionSummary = (state: InterviewState) => ({
  mode: state.mode,
  sessionId: state.sessionId,
  questions: state.questions,
  records: state.records,
  confidenceScore: state.confidenceScore,
  sessionElapsedSeconds: state.sessionElapsedSeconds,
  completedAt: new Date().toISOString(),
});
