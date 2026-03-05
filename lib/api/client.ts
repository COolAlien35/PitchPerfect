/**
 * Lightweight fetch wrapper for the backend API.
 * Used by React Query hooks in frontend/hooks/*.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pp_access_token");
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>
): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
            errorData?.detail?.message || errorData?.detail || `Request failed: ${res.status}`
        );
    }

    return res.json() as Promise<T>;
}

export function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return request<T>("GET", path, undefined, params);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, body);
}

export function put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PUT", path, body);
}

export function del<T>(path: string): Promise<T> {
    return request<T>("DELETE", path);
}
