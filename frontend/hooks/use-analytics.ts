import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from '@tanstack/react-query';
import { get, post } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------
export interface OverallAnalytics {
    total_interviews: number;
    average_score: number;
    score_trend: ScorePoint[];
    skill_breakdown: SkillScore[];
    top_strengths: string[];
    improvement_areas: string[];
}

export interface ScorePoint {
    date: string;            // ISO date string
    score: number;
}

export interface SkillScore {
    skill: string;
    score: number;           // 1–10
    delta: number;           // Change from previous period
}

export interface LocalFeedbackPayload {
    session_id: string;
    event_type: 'pacing_alert' | 'filler_word' | 'eye_contact' | 'custom';
    detail: string;
    timestamp: number;       // epoch ms
}

export interface LocalFeedbackAck {
    id: string;
    acknowledged: boolean;
}

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const analyticsKeys = {
    all: ['analytics'] as const,
    overall: () => [...analyticsKeys.all, 'overall'] as const,
    session: (sessionId: string) =>
        [...analyticsKeys.all, 'session', sessionId] as const,
} as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Aggregated performance analytics across all interview sessions */
export function useOverallAnalytics(): UseQueryResult<OverallAnalytics> {
    return useQuery({
        queryKey: analyticsKeys.overall(),
        queryFn: () => get<OverallAnalytics>('/analytics/overall'),
        // Analytics data changes infrequently; 5-minute stale window is acceptable
        staleTime: 5 * 60 * 1_000,
        // Seed the cache with a skeleton structure so consumers never get undefined
        placeholderData: {
            total_interviews: 0,
            average_score: 0,
            score_trend: [],
            skill_breakdown: [],
            top_strengths: [],
            improvement_areas: [],
        } satisfies OverallAnalytics,
    });
}

/** Trigger a local feedback event (e.g. pacing alert from WebSocket) with optimistic UI */
export function useSubmitLocalFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: LocalFeedbackPayload) =>
            post<LocalFeedbackAck>('/analytics/feedback', payload),

        // Optimistically append the new event locally before the server confirms
        onMutate: async (payload: LocalFeedbackPayload) => {
            // Cancel any in-flight refetch to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: analyticsKeys.overall() });

            // Snapshot the current cache value for rollback
            const previous = queryClient.getQueryData<OverallAnalytics>(
                analyticsKeys.overall()
            );

            // Optimistically bump the total_interviews counter as a visual indicator
            // (In production you'd append to a live-events list instead)
            if (previous) {
                queryClient.setQueryData<OverallAnalytics>(analyticsKeys.overall(), {
                    ...previous,
                    // Surface the feedback as a top-of-mind improvement area
                    improvement_areas: [
                        payload.detail,
                        ...previous.improvement_areas,
                    ].slice(0, 5),
                });
            }

            // Return snapshot for rollback
            return { previous };
        },

        onError: (_err, _payload, context) => {
            // Roll back to the snapshotted cache value on error
            if (context?.previous) {
                queryClient.setQueryData(analyticsKeys.overall(), context.previous);
            }
        },

        onSettled: () => {
            // Always re-sync from the server once the mutation settles
            queryClient.invalidateQueries({ queryKey: analyticsKeys.overall() });
        },
    });
}
