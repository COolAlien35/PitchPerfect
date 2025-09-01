"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Brain,
  Play,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Users,
  Zap,
  Award,
  Calendar,
  BarChart3,
  Flame,
  Shield,
  Sparkles,
  LogOut,
  User,
  Activity,
  Clock,
  Target as TargetIcon,
  Crown,
  Gem,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/src/firebase"
import { signOut } from "firebase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import "./dashboard.css"

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      alert("Failed to log out. Please try again.")
    }
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user || !userProfile) {
    router.push("/login")
    return null
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get user data with fallbacks
  const userStats = userProfile.stats || {
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    badgesEarned: 0,
    currentStreak: 0,
    nextBadge: "First Steps",
    totalXP: 0,
    level: 1
  }

  const recentSessions = userProfile.sessions || []
  const badges = userProfile.badges || []

  // Calculate progress percentage for next badge
  const getProgressPercentage = () => {
    if (userStats.totalSessions === 0) return 0
    if (userStats.totalSessions >= 10 && userStats.averageScore >= 8.5) return 100
    
    const sessionProgress = Math.min((userStats.totalSessions / 10) * 50, 50)
    const scoreProgress = Math.min((userStats.averageScore / 8.5) * 50, 50)
    return Math.round(sessionProgress + scoreProgress)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-primary-text">
              PitchPerfect
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile.photo} alt={userProfile.name} />
                  <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
                    {getUserInitials(userProfile.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground">{userProfile.email}</p>
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10 text-center welcome-text">
          <h1 className="text-4xl font-bold mb-3 gradient-primary-text">
            Welcome back, {userProfile.name}! 👋
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to level up your interview skills today? Let's make every practice session count.
          </p>
          {userStats.level > 1 && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 py-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">Level {userStats.level}</span>
              <span className="text-xs text-muted-foreground">• {userStats.totalXP} XP</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 stats-grid">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/60 backdrop-blur-sm shadow-lg stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-foreground">{userStats.totalSessions}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/60 backdrop-blur-sm shadow-lg stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-foreground">{userStats.averageScore}/10</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                  <Target className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/60 backdrop-blur-sm shadow-lg stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Improvement</p>
                  <p className="text-3xl font-bold text-foreground">+{userStats.improvementRate}%</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/60 backdrop-blur-sm shadow-lg stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-foreground">{userStats.currentStreak} days</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Practice Options */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Start */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Play className="mr-3 h-6 w-6 text-primary" />
                  Quick Start Practice
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Jump into a practice session right away and start improving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button asChild className="h-24 flex-col space-y-3 btn-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 btn-hover">
                    <Link href="/interview/behavioral">
                      <Users className="w-7 h-7" />
                      <span className="font-semibold">Behavioral Interview</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-24 flex-col space-y-3 border-border hover:border-primary hover:bg-primary/10 transition-all duration-300 btn-hover">
                    <Link href="/interview/technical">
                      <Brain className="w-7 h-7" />
                      <span className="font-semibold">Technical Interview</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-24 flex-col space-y-3 border-border hover:border-purple-400 hover:bg-purple-400/10 transition-all duration-300 btn-hover">
                    <Link href="/interview/pressure">
                      <Zap className="w-7 h-7" />
                      <span className="font-semibold">Pressure Mode</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-24 flex-col space-y-3 border-border hover:border-green-400 hover:bg-green-400/10 transition-all duration-300 btn-hover">
                    <Link href="/interview/custom">
                      <Target className="w-7 h-7" />
                      <span className="font-semibold">Custom Session</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-24 flex-col space-y-3 border-border hover:border-orange-400 hover:bg-orange-400/10 transition-all duration-300 btn-hover">
                    <Link href="/group-discussion">
                      <Users className="w-7 h-7" />
                      <span className="font-semibold">Group Discussion</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-24 flex-col space-y-3 border-border hover:border-red-400 hover:bg-red-400/10 transition-all duration-300 btn-hover">
                    <Link href="/interview/challenge">
                      <Flame className="w-7 h-7" />
                      <span className="font-semibold">Extreme Challenge</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Extreme Modes */}
            <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <Flame className="w-6 h-6 mr-3 text-orange-400" /> 
                  Extreme Challenge Modes
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Push your limits with AI personality cloning, deepfake testing, and hostile scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild className="h-28 flex-col space-y-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 btn-hover">
                    <Link href="/interview/challenge">
                      <Shield className="w-8 h-8" />
                      <span className="font-semibold">Interrupt & Recover</span>
                      <span className="text-xs text-orange-100">Random interruptions + AI cloning</span>
                    </Link>
                  </Button>
                  <Button asChild className="h-28 flex-col space-y-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 btn-hover">
                    <Link href="/group-discussion/extreme">
                      <Sparkles className="w-8 h-8" />
                      <span className="font-semibold">Extreme Group Discussion</span>
                      <span className="text-xs text-purple-100">Hostile judges + deepfake mode</span>
                    </Link>
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">AI Personality Cloning</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Deepfake Testing</Badge>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Hostile Scenarios</Badge>
                  <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">Random Interruptions</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">Recent Sessions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your latest practice sessions and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Play className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{session.type}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {session.date} • {session.duration}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            <span className="font-bold text-lg text-foreground">{session.score}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No sessions yet</p>
                    <p className="text-sm text-muted-foreground">Complete your first interview session to see your progress here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Badges */}
          <div className="space-y-8">
            {/* Progress Card */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Trophy className="mr-3 h-6 w-6 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-medium text-muted-foreground">Next Badge: {userStats.nextBadge}</span>
                    <span className="font-semibold text-primary">{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-3 bg-muted progress-animate" />
                </div>
                <div className="rounded-xl border border-border p-4 text-center bg-accent/50">
                  <Award className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium text-foreground">
                    {userStats.totalSessions === 0 
                      ? "Start your first session to earn badges!" 
                      : `${Math.max(0, 10 - userStats.totalSessions)} more sessions to unlock!`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Badges */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground flex items-center">
                  <Gem className="mr-2 h-5 w-5 text-primary" />
                  Achievement Badges
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {userStats.badgesEarned} earned • {badges.filter(b => !b.earned).length} in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-3">
                    {badges.map((badge, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-4 rounded-xl text-center transition-all duration-300 cursor-pointer ${
                              badge.earned
                                ? "bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-amber-500/20 border-2 border-yellow-400/50 shadow-lg hover:shadow-xl hover:scale-105 badge-earned"
                                : "bg-muted/50 border-2 border-border/50 opacity-70 hover:opacity-100 hover:scale-105"
                            }`}
                          >
                            <div className="text-3xl mb-2 filter drop-shadow-sm">
                              {badge.icon}
                            </div>
                            <p className={`text-xs font-medium ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {badge.name}
                            </p>
                            {badge.earned && (
                              <div className="mt-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-center">
                            <p className="font-semibold mb-1">{badge.name}</p>
                            <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                badge.earned 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {badge.earned ? 'Earned' : badge.requirement}
                              </span>
                            </div>
                            {badge.earnedDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Earned {new Date(badge.earnedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>

            {/* Daily Challenge */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Zap className="mr-3 h-6 w-6 text-green-400" />
                  Daily Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Complete a 10-minute pressure mode session to earn bonus XP!
                </p>
                <Button size="sm" className="w-full btn-gradient-primary shadow-md hover:shadow-lg transition-all duration-300 btn-hover">
                  Start Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Extreme Mode Teaser */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Flame className="mr-3 h-6 w-6 text-red-400" /> 
                  Extreme Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Ready for the ultimate challenge? Face AI personality clones and hostile scenarios!
                </p>
                <Button
                  size="sm"
                  className="w-full btn-gradient-primary shadow-md hover:shadow-lg transition-all duration-300 btn-hover"
                  asChild
                >
                  <Link href="/interview/challenge">
                    <Shield className="mr-2 h-4 w-4" />
                    Enter the Fire
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
