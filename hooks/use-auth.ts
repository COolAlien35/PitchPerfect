import { useState, useEffect } from 'react';
import { auth, db } from '@/src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, setDoc, addDoc } from 'firebase/firestore';

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
  googleId?: string;
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setUserProfile(profile);
        console.log('Refreshed profile:', profile); // Debug log
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Fetch user profile from Firestore
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          let profile: UserProfile;
          
          if (userSnap.exists()) {
            profile = userSnap.data() as UserProfile;
            console.log('Loaded existing profile:', profile); // Debug log
          } else {
            // If no profile exists, create a basic one from auth user
            profile = {
              name: user.displayName || 'User',
              email: user.email || '',
              photo: user.photoURL || undefined,
            };
            console.log('Created basic profile:', profile); // Debug log
          }

          // Fetch user sessions
          const sessionsRef = collection(db, 'users', user.uid, 'sessions');
          const sessionsQuery = query(sessionsRef, orderBy('date', 'desc'), limit(5));
          const sessionsSnap = await getDocs(sessionsQuery);
          
          let sessions: UserSession[] = sessionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as UserSession));

          // If no sessions exist and this is a new user, create sample data
          if (sessions.length === 0 && !userSnap.exists()) {
            sessions = await createSampleSessions(user.uid);
          }

          // Calculate stats from sessions
          const stats: UserStats = calculateUserStats(sessions);
          
          // Generate badges based on user performance
          const badges: UserBadge[] = generateUserBadges(stats, sessions);
          
          // Update profile with fetched data
          profile.sessions = sessions;
          profile.stats = stats;
          profile.badges = badges;
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to basic profile
          const basicProfile: UserProfile = {
            name: user.displayName || 'User',
            email: user.email || '',
            photo: user.photoURL || undefined,
            stats: getDefaultStats(),
            badges: getDefaultBadges(),
            sessions: []
          };
          setUserProfile(basicProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading, refreshProfile };
}

async function createSampleSessions(userId: string): Promise<UserSession[]> {
  const sampleSessions: Omit<UserSession, 'id'>[] = [
    {
      type: "Technical Interview",
      score: 8.2,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "25 min",
      category: "technical"
    },
    {
      type: "Behavioral Questions",
      score: 7.5,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "30 min",
      category: "behavioral"
    },
    {
      type: "Pressure Mode",
      score: 6.8,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "20 min",
      category: "pressure"
    },
    {
      type: "Technical Interview",
      score: 7.9,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "28 min",
      category: "technical"
    },
    {
      type: "Behavioral Questions",
      score: 8.1,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "32 min",
      category: "behavioral"
    }
  ];

  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const createdSessions: UserSession[] = [];

    for (const session of sampleSessions) {
      const docRef = await addDoc(sessionsRef, session);
      createdSessions.push({
        id: docRef.id,
        ...session
      });
    }

    return createdSessions;
  } catch (error) {
    console.error('Error creating sample sessions:', error);
    return [];
  }
}

function calculateUserStats(sessions: UserSession[]): UserStats {
  if (sessions.length === 0) {
    return getDefaultStats();
  }

  const totalSessions = sessions.length;
  const totalScore = sessions.reduce((sum, session) => sum + session.score, 0);
  const averageScore = Math.round((totalScore / totalSessions) * 10) / 10;
  
  // Calculate improvement rate (simplified)
  const recentSessions = sessions.slice(0, 3);
  const olderSessions = sessions.slice(-3);
  const recentAvg = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;
  const olderAvg = olderSessions.reduce((sum, s) => sum + s.score, 0) / olderSessions.length;
  const improvementRate = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  
  // Calculate current streak (simplified)
  const currentStreak = calculateCurrentStreak(sessions);
  
  // Calculate XP and level
  const totalXP = sessions.reduce((sum, session) => sum + Math.floor(session.score * 10), 0);
  const level = Math.floor(totalXP / 100) + 1;
  
  return {
    totalSessions,
    averageScore,
    improvementRate: Math.max(0, improvementRate),
    badgesEarned: 0, // Will be calculated in badges
    currentStreak,
    nextBadge: "First Steps",
    totalXP,
    level
  };
}

function calculateCurrentStreak(sessions: UserSession[]): number {
  if (sessions.length === 0) return 0;
  
  // Simplified streak calculation - in real app, you'd check consecutive days
  const today = new Date();
  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const diffTime = Math.abs(today.getTime() - sessionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Sessions in last 7 days
  });
  
  return recentSessions.length;
}

function generateUserBadges(stats: UserStats, sessions: UserSession[]): UserBadge[] {
  const badges: UserBadge[] = [
    {
      name: "First Steps",
      icon: "🎯",
      earned: sessions.length > 0,
      earnedDate: sessions.length > 0 ? sessions[sessions.length - 1].date : undefined,
      description: "Complete your first interview session",
      requirement: "Complete 1 session"
    },
    {
      name: "Confident Speaker",
      icon: "🎤",
      earned: sessions.length >= 3,
      earnedDate: sessions.length >= 3 ? sessions[2].date : undefined,
      description: "Complete 3 interview sessions",
      requirement: "Complete 3 sessions"
    },
    {
      name: "Technical Pro",
      icon: "💻",
      earned: sessions.filter(s => s.category === 'technical').length >= 2,
      earnedDate: undefined,
      description: "Complete 2 technical interview sessions",
      requirement: "Complete 2 technical sessions"
    },
    {
      name: "Pressure Warrior",
      icon: "⚡",
      earned: sessions.filter(s => s.category === 'pressure').length >= 2,
      earnedDate: undefined,
      description: "Complete 2 pressure mode sessions",
      requirement: "Complete 2 pressure sessions"
    },
    {
      name: "Storyteller",
      icon: "📚",
      earned: sessions.filter(s => s.category === 'behavioral').length >= 2,
      earnedDate: undefined,
      description: "Complete 2 behavioral interview sessions",
      requirement: "Complete 2 behavioral sessions"
    },
    {
      name: "Communication Master",
      icon: "🗣️",
      earned: stats.averageScore >= 8.5 && sessions.length >= 10,
      earnedDate: undefined,
      description: "Achieve 8.5+ average score with 10+ sessions",
      requirement: "8.5+ avg score & 10+ sessions"
    }
  ];

  // Update stats with actual badge count
  stats.badgesEarned = badges.filter(b => b.earned).length;
  
  // Find next badge to earn
  const nextBadge = badges.find(b => !b.earned);
  if (nextBadge) {
    stats.nextBadge = nextBadge.name;
  }

  return badges;
}

function getDefaultStats(): UserStats {
  return {
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    badgesEarned: 0,
    currentStreak: 0,
    nextBadge: "First Steps",
    totalXP: 0,
    level: 1
  };
}

function getDefaultBadges(): UserBadge[] {
  return [
    {
      name: "First Steps",
      icon: "🎯",
      earned: false,
      description: "Complete your first interview session",
      requirement: "Complete 1 session"
    },
    {
      name: "Confident Speaker",
      icon: "🎤",
      earned: false,
      description: "Complete 3 interview sessions",
      requirement: "Complete 3 sessions"
    },
    {
      name: "Technical Pro",
      icon: "💻",
      earned: false,
      description: "Complete 2 technical interview sessions",
      requirement: "Complete 2 technical sessions"
    },
    {
      name: "Pressure Warrior",
      icon: "⚡",
      earned: false,
      description: "Complete 2 pressure mode sessions",
      requirement: "Complete 2 pressure sessions"
    },
    {
      name: "Storyteller",
      icon: "📚",
      earned: false,
      description: "Complete 2 behavioral interview sessions",
      requirement: "Complete 2 behavioral sessions"
    },
    {
      name: "Communication Master",
      icon: "🗣️",
      earned: false,
      description: "Achieve 8.5+ average score with 10+ sessions",
      requirement: "8.5+ avg score & 10+ sessions"
    }
  ];
}
