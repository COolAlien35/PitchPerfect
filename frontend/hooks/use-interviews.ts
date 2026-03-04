import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from '@tanstack/react-query';
import { get, post } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Interview {
    id: string;
    title: string;
    job_role: string;
    status: InterviewStatus;
    overall_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface InterviewDetail extends Interview {
    resume_data: Record<string, unknown> | null;
    sessions: InterviewSession[];
}

export interface InterviewSession {
    id: string;
    interview_id: string;
    overall_score: number | null;
    detailed_metrics: Record<string, unknown> | null;
    qa_records: QARecord[];
}

export interface QARecord {
    id: string;
    session_id: string;
    question: string;
    transcript: string;
    ai_feedback: Record<string, unknown> | null;
    audio_metrics: Record<string, unknown> | null;
    video_metrics: Record<string, unknown> | null;
}

export interface PaginatedInterviews {
    items: Interview[];
    total: number;
    skip: number;
    limit: number;
}

export interface CreateInterviewPayload {
    title: string;
    job_role: string;
    job_description: string;
    resume_text: string;
}

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const interviewKeys = {
    all: ['interviews'] as const,
    lists: () => [...interviewKeys.all, 'list'] as const,
    list: (skip: number, limit: number) =>
        [...interviewKeys.lists(), { skip, limit }] as const,
    details: () => [...interviewKeys.all, 'detail'] as const,
    detail: (id: string) => [...interviewKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Paginated interview history list */
export function useInterviews(
    skip = 0,
    limit = 10
): UseQueryResult<PaginatedInterviews> {
    return useQuery({
        queryKey: interviewKeys.list(skip, limit),
        queryFn: () =>
            get<PaginatedInterviews>('/interviews', { skip, limit }),
        // Keep previous page data visible while next page loads (zero perception lag)
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

/** Detailed interview + session data with optional background polling */
export function useInterview(
    id: string,
    { pollIntervalMs = 0 }: { pollIntervalMs?: number } = {}
): UseQueryResult<InterviewDetail> {
    return useQuery({
        queryKey: interviewKeys.detail(id),
        queryFn: () => get<InterviewDetail>(`/interviews/${id}`),
        enabled: Boolean(id),
        // Continuously refresh while the interview is in-progress
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'in_progress' || status === 'pending') {
                return pollIntervalMs > 0 ? pollIntervalMs : 5_000;
            }
            return false;
        },
        staleTime: 10_000,
    });
}

/** Create a new interview session + invalidate the list cache */
export function useCreateInterview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateInterviewPayload) =>
            post<Interview>('/interviews', payload),
        onSuccess: (newInterview) => {
            // Invalidate all list views so they refetch with the new entry
            queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });

            // Pre-populate the detail cache to avoid a redundant network request
            queryClient.setQueryData(
                interviewKeys.detail(newInterview.id),
                newInterview
            );
        },
    });
}
