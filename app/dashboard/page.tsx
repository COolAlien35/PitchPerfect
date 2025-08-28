"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
import "./dashboard.css"

export default function DashboardPage() {
  const router = useRouter()
  const [userStats] = useState({
    totalSessions: 12,
    averageScore: 7.8,
    improvementRate: 23,
    badgesEarned: 5,
    currentStreak: 7,
    nextBadge: "Communication Master",
  })

  const recentSessions = [
    { id: 1, type: "Technical Interview", score: 8.2, date: "2024-01-30", duration: "25 min" },
    { id: 2, type: "Behavioral Questions", score: 7.5, date: "2024-01-29", duration: "30 min" },
    { id: 3, type: "Pressure Mode", score: 6.8, date: "2024-01-28", duration: "20 min" },
  ]

  const badges = [
    { name: "First Steps", icon: "🎯", earned: true },
    { name: "Confident Speaker", icon: "🎤", earned: true },
    { name: "Technical Pro", icon: "💻", earned: true },
    { name: "Pressure Warrior", icon: "⚡", earned: true },
    { name: "Storyteller", icon: "📚", earned: true },
    { name: "Communication Master", icon: "🗣️", earned: false },
  ]

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">PitchPerfect</span>
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
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
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, John! 👋</h1>
          <p className="text-gray-600">Ready to level up your interview skills today?</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold">{userStats.totalSessions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Play className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold">{userStats.averageScore}/10</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Improvement</p>
                  <p className="text-2xl font-bold">+{userStats.improvementRate}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-2xl font-bold">{userStats.currentStreak} days</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Practice Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start */}
            <Card className="transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="mr-2 h-5 w-5 text-primary" />
                  Quick Start Practice
                </CardTitle>
                <CardDescription>Jump into a practice session right away</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button asChild className="h-20 flex-col space-y-2">
                    <Link href="/interview/behavioral">
                      <Users className="w-6 h-6" />
                      <span>Behavioral Interview</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/interview/technical">
                      <Brain className="w-6 h-6" />
                      <span>Technical Interview</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/interview/pressure">
                      <Zap className="w-6 h-6" />
                      <span>Pressure Mode</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/interview/custom">
                      <Target className="w-6 h-6" />
                      <span>Custom Session</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/group-discussion">
                      <Users className="w-6 h-6" />
                      <span>Group Discussion</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <Link href="/interview/challenge">
                      <Flame className="w-6 h-6" />
                      <span>Extreme Challenge</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* New Extreme Modes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flame className="w-5 h-5 mr-2" /> New: Extreme Challenge Modes
                </CardTitle>
                <CardDescription>
                  Push your limits with AI personality cloning, deepfake testing, and hostile scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    asChild
                    className="h-24 flex-col space-y-2"
                  >
                    <Link href="/interview/challenge">
                      <Shield className="w-8 h-8" />
                      <span className="font-medium">Interrupt & Recover</span>
                      <span className="text-xs text-muted-foreground">Random interruptions + AI cloning</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-24 flex-col space-y-2"
                  >
                    <Link href="/group-discussion/extreme">
                      <Sparkles className="w-8 h-8" />
                      <span className="font-medium">Extreme Group Discussion</span>
                      <span className="text-xs text-muted-foreground">Hostile judges + deepfake mode</span>
                    </Link>
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>AI Personality Cloning</Badge>
                  <Badge>Deepfake Testing</Badge>
                  <Badge>Hostile Scenarios</Badge>
                  <Badge>Random Interruptions</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest practice sessions and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Play className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{session.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.date} • {session.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{session.score}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Badges */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Next Badge: {userStats.nextBadge}</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Award className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-medium">3 more sessions to unlock!</p>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
                <CardDescription>{userStats.badgesEarned} earned • 1 in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-center transition-all ${
                        badge.earned
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200"
                          : "bg-gray-50 border-2 border-gray-200 opacity-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <p className="text-xs font-medium">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Challenge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Daily Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Complete a 10-minute pressure mode session to earn bonus XP!
                </p>
                <Button size="sm" className="w-full">
                  Start Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Extreme Mode Teaser */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flame className="mr-2 h-5 w-5 text-primary" /> Extreme Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Ready for the ultimate challenge? Face AI personality clones and hostile scenarios!
                </p>
                <Button
                  size="sm"
                  className="w-full"
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
