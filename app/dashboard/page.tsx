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
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InterviewAce AI
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">JD</span>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold">{userStats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold">{userStats.averageScore}/10</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Improvement</p>
                  <p className="text-2xl font-bold">+{userStats.improvementRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-2xl font-bold">{userStats.currentStreak} days</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2 text-blue-600" />
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
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                    <Link href="/interview/technical">
                      <Brain className="w-6 h-6" />
                      <span>Technical Interview</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                    <Link href="/interview/pressure">
                      <Zap className="w-6 h-6" />
                      <span>Pressure Mode</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                    <Link href="/interview/custom">
                      <Target className="w-6 h-6" />
                      <span>Custom Session</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                    <Link href="/group-discussion">
                      <Users className="w-6 h-6" />
                      <span>Group Discussion</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-20 flex-col space-y-2 bg-transparent border-red-200 hover:bg-red-50"
                  >
                    <Link href="/interview/challenge">
                      <Flame className="w-6 h-6 text-red-500" />
                      <span className="text-red-600">Extreme Challenge</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* New Extreme Modes */}
            <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <Flame className="w-5 h-5 mr-2" />🔥 NEW: Extreme Challenge Modes
                </CardTitle>
                <CardDescription className="text-red-600">
                  Push your limits with AI personality cloning, deepfake testing, and hostile scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    asChild
                    className="h-24 flex-col space-y-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    <Link href="/interview/challenge">
                      <Shield className="w-8 h-8" />
                      <span className="font-bold">Interrupt & Recover</span>
                      <span className="text-xs opacity-90">Random interruptions + AI cloning</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-24 flex-col space-y-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Link href="/group-discussion/extreme">
                      <Sparkles className="w-8 h-8" />
                      <span className="font-bold">Extreme Group Discussion</span>
                      <span className="text-xs opacity-90">Hostile judges + deepfake mode</span>
                    </Link>
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-red-500 text-white">AI Personality Cloning</Badge>
                  <Badge className="bg-orange-500 text-white">Deepfake Testing</Badge>
                  <Badge className="bg-purple-500 text-white">Hostile Scenarios</Badge>
                  <Badge className="bg-blue-500 text-white">Random Interruptions</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest practice sessions and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Play className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{session.type}</p>
                          <p className="text-sm text-gray-500">
                            {session.date} • {session.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
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
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-blue-900">3 more sessions to unlock!</p>
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
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <Zap className="w-5 h-5 mr-2" />
                  Daily Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700 mb-4">
                  Complete a 10-minute pressure mode session to earn bonus XP!
                </p>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                  Start Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Extreme Mode Teaser */}
            <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <Flame className="w-5 h-5 mr-2" />🔥 Extreme Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 mb-4">
                  Ready for the ultimate challenge? Face AI personality clones and hostile scenarios!
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  asChild
                >
                  <Link href="/interview/challenge">
                    <Shield className="w-4 h-4 mr-2" />
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
