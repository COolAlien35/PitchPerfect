import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// API base URL – FastAPI backend
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserSession {
  id: string;
  type: string;
  score: number;
  date: string;
  duration: string;
  category: string;
}

interface UserBadge {
  name: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  description: string;
  requirement: string;
}

interface UserStats {
  totalSessions: number;
  averageScore: number;
  improvementRate: number;
  badgesEarned: number;
  currentStreak: number;
  nextBadge: string;
  totalXP: number;
  level: number;
}

interface UserProfile {
  name: string;
  email: string;
  photo?: string;
  roles?: string[];
  createdAt?: string;
  linkedinUrl?: string;
  resumeDriveUrl?: string;
  phone?: string;
  bio?: string;
  experience?: string;
  targetRole?: string;
  industry?: string;
  company?: string;
  education?: string;
  skills?: string[];
  goals?: string[];
  githubUrl?: string;
  stats?: UserStats;
  sessions?: UserSession[];
  badges?: UserBadge[];
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pp_access_token');
}

function setToken(token: string): void {
  localStorage.setItem('pp_access_token', token);
}

function clearToken(): void {
  localStorage.removeItem('pp_access_token');
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from /auth/me
  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/v1/auth/me');
      if (!res.ok) {
        // Token invalid or expired
        clearToken();
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const data: AuthUser = await res.json();
      setUser(data);

      // Build profile from auth user data
      const stats = getDefaultStats();
      const badges = getDefaultBadges();

      const profile: UserProfile = {
        name: data.full_name || data.username || 'User',
        email: data.email,
        createdAt: data.created_at,
        stats,
        badges,
        sessions: [],
      };
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user:', error);
      clearToken();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail?.message || err.detail || 'Login failed');
    }

    const data = await res.json();
    setToken(data.access_token);
    await loadUser();
  }, [loadUser]);

  // Signup
  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail?.message || err.detail || 'Signup failed');
    }

    // Auto-login after signup
    await login(email, password);
  }, [login]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    clearToken();
    setUser(null);
    setUserProfile(null);
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return { user, userProfile, loading, login, signup, logout, refreshProfile };
}

// ---------------------------------------------------------------------------
// Default stats & badges (same as before)
// ---------------------------------------------------------------------------
function getDefaultStats(): UserStats {
  return {
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    badgesEarned: 0,
    currentStreak: 0,
    nextBadge: "First Steps",
    totalXP: 0,
    level: 1,
  };
}

function getDefaultBadges(): UserBadge[] {
  return [
    {
      name: "First Steps",
      icon: "🎯",
      earned: false,
      description: "Complete your first interview session",
      requirement: "Complete 1 session",
    },
    {
      name: "Confident Speaker",
      icon: "🎤",
      earned: false,
      description: "Complete 3 interview sessions",
      requirement: "Complete 3 sessions",
    },
    {
      name: "Technical Pro",
      icon: "💻",
      earned: false,
      description: "Complete 2 technical interview sessions",
      requirement: "Complete 2 technical sessions",
    },
    {
      name: "Pressure Warrior",
      icon: "⚡",
      earned: false,
      description: "Complete 2 pressure mode sessions",
      requirement: "Complete 2 pressure sessions",
    },
    {
      name: "Storyteller",
      icon: "📚",
      earned: false,
      description: "Complete 2 behavioral interview sessions",
      requirement: "Complete 2 behavioral sessions",
    },
    {
      name: "Communication Master",
      icon: "🗣️",
      earned: false,
      description: "Achieve 8.5+ average score with 10+ sessions",
      requirement: "8.5+ avg score & 10+ sessions",
    },
  ];
}
