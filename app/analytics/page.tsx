"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  Calendar,
  Users,
  Brain,
  Zap,
  Flame,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  Star,
  Trophy,
  Activity,
  PieChart,
  LineChart,
  BarChart
} from "lucide-react"
import { useAuth, apiFetch } from "@/hooks/use-auth"

interface SessionData {
  id: string
  type: string
  score: number
  date: string
  duration: string
  category: string
}

interface AnalyticsData {
  totalSessions: number
  averageScore: number
  improvementRate: number
  totalTimeSpent: number
  bestScore: number
  worstScore: number
  currentStreak: number
  longestStreak: number
  sessionsByType: { [key: string]: number }
  scoresByType: { [key: string]: number[] }
  monthlyProgress: { month: string; score: number; sessions: number }[]
  weeklyActivity: { week: string; sessions: number; avgScore: number }[]
  recentTrend: 'up' | 'down' | 'stable'
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

const sessionTypes = [
  { value: 'behavioral', label: 'Behavioral Interview', icon: Users, color: 'bg-blue-500' },
  { value: 'technical', label: 'Technical Interview', icon: Brain, color: 'bg-green-500' },
  { value: 'pressure', label: 'Pressure Mode', icon: Zap, color: 'bg-orange-500' },
  { value: 'group', label: 'Group Discussion', icon: Users, color: 'bg-pink-500' },
  { value: 'challenge', label: 'Extreme Challenge', icon: Flame, color: 'bg-red-500' }
]

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    if (user && !loading) {
      loadAnalyticsData()
    }
  }, [user, loading, selectedPeriod])

  const loadAnalyticsData = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Load sessions from backend
      const res = await apiFetch('/api/v1/analytics/sessions');
      let sessions: SessionData[] = [];
      if (res.ok) {
        const data = await res.json();
        sessions = data.sessions || [];
      }
      const analytics = calculateAnalytics(sessions)
      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnalytics = (sessions: SessionData[]): AnalyticsData => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        improvementRate: 0,
        totalTimeSpent: 0,
        bestScore: 0,
        worstScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByType: {},
        scoresByType: {},
        monthlyProgress: [],
        weeklyActivity: [],
        recentTrend: 'stable',
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    }

    // Basic stats
    const totalSessions = sessions.length
    const scores = sessions.map(s => s.score)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const bestScore = Math.max(...scores)
    const worstScore = Math.min(...scores)

    // Calculate total time spent (assuming duration is in minutes)
    const totalTimeSpent = sessions.reduce((total, session) => {
      const duration = parseInt(session.duration.replace(/\D/g, '')) || 30
      return total + duration
    }, 0)

    // Sessions by type
    const sessionsByType: { [key: string]: number } = {}
    const scoresByType: { [key: string]: number[] } = {}

    sessions.forEach(session => {
      sessionsByType[session.type] = (sessionsByType[session.type] || 0) + 1
      if (!scoresByType[session.type]) scoresByType[session.type] = []
      scoresByType[session.type].push(session.score)
    })

    // Calculate improvement rate
    const recentSessions = sessions.slice(0, Math.min(5, sessions.length))
    const olderSessions = sessions.slice(-Math.min(5, sessions.length))
    const recentAvg = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length
    const olderAvg = olderSessions.reduce((sum, s) => sum + s.score, 0) / olderSessions.length
    const improvementRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

    // Calculate streaks
    const currentStreak = calculateCurrentStreak(sessions)
    const longestStreak = calculateLongestStreak(sessions)

    // Monthly progress
    const monthlyProgress = calculateMonthlyProgress(sessions)

    // Weekly activity
    const weeklyActivity = calculateWeeklyActivity(sessions)

    // Recent trend
    const recentTrend = calculateRecentTrend(sessions)

    // Strengths and weaknesses
    const { strengths, weaknesses } = analyzePerformance(scoresByType)

    // Recommendations
    const recommendations = generateRecommendations(analyticsData || {
      totalSessions,
      averageScore,
      improvementRate,
      totalTimeSpent,
      bestScore,
      worstScore,
      currentStreak,
      longestStreak,
      sessionsByType,
      scoresByType,
      monthlyProgress,
      weeklyActivity,
      recentTrend,
      strengths,
      weaknesses,
      recommendations: []
    })

    return {
      totalSessions,
      averageScore: Math.round(averageScore * 10) / 10,
      improvementRate: Math.round(improvementRate * 10) / 10,
      totalTimeSpent,
      bestScore,
      worstScore,
      currentStreak,
      longestStreak,
      sessionsByType,
      scoresByType,
      monthlyProgress,
      weeklyActivity,
      recentTrend,
      strengths,
      weaknesses,
      recommendations
    }
  }

  const calculateCurrentStreak = (sessions: SessionData[]): number => {
    if (sessions.length === 0) return 0

    const today = new Date()
    let streak = 0

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasSession = sessions.some(session =>
        session.date.split('T')[0] === dateStr
      )

      if (hasSession) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  const calculateLongestStreak = (sessions: SessionData[]): number => {
    if (sessions.length === 0) return 0

    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let maxStreak = 0
    let currentStreak = 0
    let lastDate: Date | null = null

    sortedSessions.forEach(session => {
      const sessionDate = new Date(session.date)

      if (lastDate) {
        const daysDiff = Math.floor((sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff === 1) {
          currentStreak++
        } else if (daysDiff > 1) {
          maxStreak = Math.max(maxStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }

      lastDate = sessionDate
    })

    return Math.max(maxStreak, currentStreak)
  }

  const calculateMonthlyProgress = (sessions: SessionData[]) => {
    const monthlyData: { [key: string]: { scores: number[], sessions: number } } = {}

    sessions.forEach(session => {
      const date = new Date(session.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { scores: [], sessions: 0 }
      }

      monthlyData[monthKey].scores.push(session.score)
      monthlyData[monthKey].sessions++
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      sessions: data.sessions
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  const calculateWeeklyActivity = (sessions: SessionData[]) => {
    const weeklyData: { [key: string]: { scores: number[], sessions: number } } = {}

    sessions.forEach(session => {
      const date = new Date(session.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { scores: [], sessions: 0 }
      }

      weeklyData[weekKey].scores.push(session.score)
      weeklyData[weekKey].sessions++
    })

    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      sessions: data.sessions,
      avgScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
    })).sort((a, b) => a.week.localeCompare(b.week)).slice(-8)
  }

  const calculateRecentTrend = (sessions: SessionData[]): 'up' | 'down' | 'stable' => {
    if (sessions.length < 4) return 'stable'

    const recent = sessions.slice(0, 3)
    const previous = sessions.slice(3, 6)

    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length
    const previousAvg = previous.reduce((sum, s) => sum + s.score, 0) / previous.length

    const diff = recentAvg - previousAvg

    if (diff > 0.5) return 'up'
    if (diff < -0.5) return 'down'
    return 'stable'
  }

  const analyzePerformance = (scoresByType: { [key: string]: number[] }) => {
    const strengths: string[] = []
    const weaknesses: string[] = []

    Object.entries(scoresByType).forEach(([type, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const typeInfo = sessionTypes.find(t => t.value === type)

      if (avgScore >= 8.0) {
        strengths.push(typeInfo?.label || type)
      } else if (avgScore < 6.0) {
        weaknesses.push(typeInfo?.label || type)
      }
    })

    return { strengths, weaknesses }
  }

  const generateRecommendations = (data: AnalyticsData): string[] => {
    const recommendations: string[] = []

    if (data.totalSessions < 5) {
      recommendations.push("Complete more practice sessions to get better insights")
    }

    if (data.averageScore < 7.0) {
      recommendations.push("Focus on improving your overall performance")
    }

    if (data.currentStreak < 3) {
      recommendations.push("Try to maintain a consistent practice schedule")
    }

    if (data.weaknesses.length > 0) {
      recommendations.push(`Focus on improving: ${data.weaknesses.join(', ')}`)
    }

    if (data.improvementRate < 0) {
      recommendations.push("Consider reviewing your practice strategy")
    }

    if (recommendations.length === 0) {
      recommendations.push("Great job! Keep up the excellent work!")
    }

    return recommendations
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-blue-500'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    router.push("/login")
    return null
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">No Data Available</h1>
          <p className="text-muted-foreground mb-6">
            Complete some practice sessions to see your analytics
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="btn-gradient-primary"
          >
            Start Practicing
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-primary-text">
              Performance Analytics
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalyticsData}
              className="bg-background/50 border-border"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-background/50 border-border"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Sessions</p>
                  <p className="text-3xl font-bold text-foreground">{analyticsData.totalSessions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Average Score</p>
                  <p className="text-3xl font-bold text-foreground">{analyticsData.averageScore}/10</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Improvement</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-3xl font-bold text-foreground">
                      {analyticsData.improvementRate > 0 ? '+' : ''}{analyticsData.improvementRate}%
                    </p>
                    {getTrendIcon(analyticsData.recentTrend)}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Time Spent</p>
                  <p className="text-3xl font-bold text-foreground">
                    {Math.round(analyticsData.totalTimeSpent / 60)}h {analyticsData.totalTimeSpent % 60}m
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Types Distribution */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <PieChart className="mr-3 h-6 w-6 text-primary" />
                    Session Types
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Distribution of your practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analyticsData.sessionsByType).map(([type, count]) => {
                      const typeInfo = sessionTypes.find(t => t.value === type)
                      const percentage = (count / analyticsData.totalSessions) * 100

                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded ${typeInfo?.color || 'bg-gray-500'} text-white`}>
                              {typeInfo && <typeInfo.icon className="h-4 w-4" />}
                            </div>
                            <span className="text-foreground">{typeInfo?.label || type}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${typeInfo?.color || 'bg-gray-500'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {count} ({Math.round(percentage)}%)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance by Type */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <BarChart className="mr-3 h-6 w-6 text-primary" />
                    Performance by Type
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Average scores for each session type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analyticsData.scoresByType).map(([type, scores]) => {
                      const typeInfo = sessionTypes.find(t => t.value === type)
                      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
                      const progress = (avgScore / 10) * 100

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`flex h-6 w-6 items-center justify-center rounded ${typeInfo?.color || 'bg-gray-500'} text-white`}>
                                {typeInfo && <typeInfo.icon className="h-3 w-3" />}
                              </div>
                              <span className="text-sm text-foreground">{typeInfo?.label || type}</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">{avgScore.toFixed(1)}/10</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-foreground">
                  <LineChart className="mr-3 h-6 w-6 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your weekly practice activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.weeklyActivity.map((week, index) => (
                    <div key={week.week} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Week of {new Date(week.week).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {week.sessions} sessions • Avg: {week.avgScore.toFixed(1)}/10
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(week.avgScore / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {week.avgScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best & Worst Scores */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Trophy className="mr-3 h-6 w-6 text-primary" />
                    Score Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-500 mb-2">{analyticsData.bestScore}/10</div>
                    <p className="text-muted-foreground">Best Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-500 mb-2">{analyticsData.worstScore}/10</div>
                    <p className="text-muted-foreground">Worst Score</p>
                  </div>
                </CardContent>
              </Card>

              {/* Streaks */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Zap className="mr-3 h-6 w-6 text-primary" />
                    Practice Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-500 mb-2">{analyticsData.currentStreak}</div>
                    <p className="text-muted-foreground">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500 mb-2">{analyticsData.longestStreak}</div>
                    <p className="text-muted-foreground">Longest Streak</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-foreground">
                  <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                  Monthly Progress
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyProgress.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {month.sessions} sessions
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{month.score.toFixed(1)}/10</p>
                          <p className="text-xs text-muted-foreground">Average Score</p>
                        </div>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(month.score / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Star className="mr-3 h-6 w-6 text-green-500" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData.strengths.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.strengths.map((strength, index) => (
                        <Badge key={index} className="bg-green-500/20 text-green-400 border-green-500/30 mr-2 mb-2">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Complete more sessions to identify your strengths</p>
                  )}
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Target className="mr-3 h-6 w-6 text-orange-500" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData.weaknesses.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.weaknesses.map((weakness, index) => (
                        <Badge key={index} className="bg-orange-500/20 text-orange-400 border-orange-500/30 mr-2 mb-2">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Great job! No major areas for improvement identified</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Award className="mr-3 h-6 w-6 text-primary" />
                  Recommendations
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Personalized suggestions to improve your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-foreground">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
