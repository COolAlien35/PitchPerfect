import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiError {
    message: string;
    status: number;
    detail?: string | Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------
const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
});

// ---------------------------------------------------------------------------
// Request interceptor – JWT injection
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Tokens are stored in httpOnly cookies on production; access token kept in
        // memory only to protect against XSS. Adapt the storage strategy as needed.
        const token =
            typeof window !== 'undefined'
                ? window.__PITCHPERFECT_ACCESS_TOKEN__
                : undefined;

        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor – error normalisation + 401/403 handling
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
            // Attempt a silent refresh before redirecting to login
            try {
                const { data } = await axios.post<{ access_token: string }>(
                    `${BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                if (typeof window !== 'undefined') {
                    window.__PITCHPERFECT_ACCESS_TOKEN__ = data.access_token;
                }
                // Retry the original request with the new token
                if (error.config) {
                    error.config.headers['Authorization'] = `Bearer ${data.access_token}`;
                    return apiClient(error.config);
                }
            } catch {
                if (typeof window !== 'undefined') {
                    window.__PITCHPERFECT_ACCESS_TOKEN__ = undefined;
                    window.location.href = '/auth/login';
                }
            }
        }

        if (status === 403) {
            if (typeof window !== 'undefined') {
                window.location.href = '/403';
            }
        }

        const apiError: ApiError = {
            message:
                (error.response?.data as Record<string, string>)?.message ??
                error.message,
            status: status ?? 0,
            detail: (error.response?.data as Record<string, unknown>)?.detail,
        };

        return Promise.reject(apiError);
    }
);

export default apiClient;

// ---------------------------------------------------------------------------
// Typed helper wrappers
// ---------------------------------------------------------------------------
export const get = <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data);

export const post = <T>(url: string, body?: unknown) =>
    apiClient.post<T>(url, body).then((r) => r.data);

export const patch = <T>(url: string, body?: unknown) =>
    apiClient.patch<T>(url, body).then((r) => r.data);

export const del = <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data);

// ---------------------------------------------------------------------------
// Module augmentation for the in-memory token store
// ---------------------------------------------------------------------------
declare global {
    interface Window {
        __PITCHPERFECT_ACCESS_TOKEN__?: string;
    }
}
