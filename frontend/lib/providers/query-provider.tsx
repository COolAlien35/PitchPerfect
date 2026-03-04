'use client';

import { useState } from 'react';
import {
    QueryClient,
    QueryClientProvider,
    isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is considered fresh for 60 seconds
                staleTime: 60 * 1_000,
                // Keep unused data in cache for 5 minutes
                gcTime: 5 * 60 * 1_000,
                // Retry failed requests up to 3 times with exponential back-off
                retry: 3,
                retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
                // Refetch when window regains focus for real-time freshness
                refetchOnWindowFocus: true,
                // Do not refetch on reconnect by default (WebSocket handles live data)
                refetchOnReconnect: false,
            },
            mutations: {
                // Surface mutation errors through the default error handler
                throwOnError: false,
            },
        },
    });
}

// SSR-safe singleton: one client per server request, one stable client on the browser
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
    if (isServer) {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // useState keeps the client stable across re-renders without a module-level ref
    const [queryClient] = useState(getQueryClient);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}
