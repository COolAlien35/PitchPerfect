/**
 * Unit tests for useInterviews, useInterview, and useCreateInterview hooks.
 * Uses Vitest + MSW for request interception (no real network calls).
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
    interviewKeys,
    useCreateInterview,
    useInterview,
    useInterviews,
    type Interview,
    type InterviewDetail,
    type PaginatedInterviews,
} from '@/frontend/hooks/use-interviews';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const MOCK_INTERVIEW: Interview = {
    id: 'int-001',
    title: 'Google SWE Interview',
    job_role: 'Senior Software Engineer',
    status: 'pending',
    overall_score: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
};

const MOCK_DETAIL: InterviewDetail = {
    ...MOCK_INTERVIEW,
    resume_data: { text: 'Python expert.' },
    sessions: [
        {
            id: 'sess-001',
            interview_id: 'int-001',
            overall_score: 75.5,
            detailed_metrics: { pacing: 'good' },
            qa_records: [
                {
                    id: 'qa-001',
                    session_id: 'sess-001',
                    question: 'Explain async/await.',
                    transcript: 'It uses the event loop.',
                    ai_feedback: { clarity_score: 8, tech_depth_score: 7, communication_score: 9 },
                    audio_metrics: { wpm: 140, filler_word_count: 2 },
                    video_metrics: { dominant_emotion: 'neutral', emotion_intensity: 0.6 },
                },
            ],
        },
    ],
};

const MOCK_PAGINATED: PaginatedInterviews = {
    items: [MOCK_INTERVIEW],
    total: 1,
    skip: 0,
    limit: 10,
};

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------
const BASE = 'http://localhost:8000/api/v1';

const handlers = [
    http.get(`${BASE}/interviews`, () =>
        HttpResponse.json(MOCK_PAGINATED)
    ),
    http.get(`${BASE}/interviews/int-001`, () =>
        HttpResponse.json(MOCK_DETAIL)
    ),
    http.get(`${BASE}/interviews/not-found`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 })
    ),
    http.post(`${BASE}/interviews`, async ({ request }) => {
        const body = await request.json() as Record<string, string>;
        const created: Interview = {
            ...MOCK_INTERVIEW,
            id: 'int-999',
            title: body.title ?? 'New Interview',
        };
        return HttpResponse.json(created, { status: 201 });
    }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test wrapper factory
// ---------------------------------------------------------------------------
function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
  );
    Wrapper.displayName = 'TestQueryWrapper';
    return { Wrapper, queryClient };
}

// ---------------------------------------------------------------------------
// useInterviews
// ---------------------------------------------------------------------------
describe('useInterviews', () => {
    it('fetches paginated interviews and returns items', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useInterviews(), { wrapper: Wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].id).toBe('int-001');
        expect(result.current.data?.total).toBe(1);
    });

    it('exposes error state on network failure', async () => {
        server.use(
            http.get(`${BASE}/interviews`, () =>
                HttpResponse.json({ message: 'Server error' }, { status: 500 })
            )
        );

        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useInterviews(), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ---------------------------------------------------------------------------
// useInterview
// ---------------------------------------------------------------------------
describe('useInterview', () => {
    it('fetches interview detail by id', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useInterview('int-001'), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.id).toBe('int-001');
        expect(result.current.data?.sessions).toHaveLength(1);
        expect(result.current.data?.sessions[0].qa_records[0].ai_feedback?.clarity_score).toBe(8);
    });

    it('does not fetch when id is empty string', () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useInterview(''), { wrapper: Wrapper });

        // enabled: false → query stays idle
        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// useCreateInterview
// ---------------------------------------------------------------------------
describe('useCreateInterview', () => {
    it('creates interview and invalidates list cache', async () => {
        const { Wrapper, queryClient } = makeWrapper();

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

        const { result } = renderHook(() => useCreateInterview(), { wrapper: Wrapper });

        await act(async () => {
            await result.current.mutateAsync({
                title: 'New Tech Interview',
                job_role: 'SWE',
                job_description: 'Build scalable systems.',
                resume_text: 'Expert in Python.',
            });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // List cache must be invalidated
        expect(invalidateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ queryKey: interviewKeys.lists() })
        );

        // Detail cache should be pre-seeded
        expect(setQueryDataSpy).toHaveBeenCalledWith(
            interviewKeys.detail('int-999'),
            expect.objectContaining({ id: 'int-999' })
        );
    });

    it('exposes isLoading during mutation', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useCreateInterview(), { wrapper: Wrapper });

        act(() => {
            result.current.mutate({
                title: 'Loading Test', job_role: 'FE', job_description: 'UI.', resume_text: 'React.',
            });
        });

        await waitFor(() => expect(result.current.isPending).toBe(true));
    });
});
