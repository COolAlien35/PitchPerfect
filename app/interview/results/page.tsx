"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Target, TrendingUp, Brain, Star, Clock, Award, Download, Share2, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function InterviewResultsPage() {
  const [overallScore] = useState(7.8)

  const sessionData = {
    duration: "18:42",
    questionsAnswered: 5,
    type: "Behavioral Interview",
    date: new Date().toLocaleDateString(),
  }

  const detailedScores = {
    communication: 8.2,
    confidence: 7.5,
    clarity: 8.0,
    engagement: 7.3,
    storytelling: 8.5,
    professionalism: 7.8,
  }

  const improvements = [
    {
      area: "Filler Words",
      current: "12 instances",
      target: "< 5 instances",
      tip: "Practice pausing instead of using 'um' or 'uh'",
    },
    {
      area: "Eye Contact",
      current: "78%",
      target: "85%+",
      tip: "Look directly at the camera more frequently",
    },
    {
      area: "Speech Pace",
      current: "165 WPM",
      target: "140-160 WPM",
      tip: "Slow down slightly for better comprehension",
    },
  ]

  const strengths = [
    "Excellent storytelling with clear STAR structure",
    "Strong examples with quantifiable results",
    "Professional tone and vocabulary",
    "Good energy and enthusiasm",
  ]

  const newBadges = [
    { name: "Storyteller", icon: "📚", description: "Used STAR method effectively" },
    { name: "Professional", icon: "💼", description: "Maintained professional demeanor" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InterviewAce AI
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Mock Mic Drop Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            🎤{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mock Mic Drop!
            </span>
          </h1>
          <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {overallScore}/10
          </div>
          <p className="text-xl text-gray-600 mb-2">Outstanding Performance!</p>
          <p className="text-gray-500">
            {sessionData.type} • {sessionData.duration} • {sessionData.date}
          </p>
        </div>

        {/* New Badges */}
        {newBadges.length > 0 && (
          <Card className="mb-8 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Award className="w-6 h-6 mr-2" />
                New Badges Earned! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {newBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-white rounded-lg p-4 border-2 border-yellow-200"
                  >
                    <div className="text-3xl">{badge.icon}</div>
                    <div>
                      <p className="font-bold text-yellow-800">{badge.name}</p>
                      <p className="text-sm text-yellow-600">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-blue-600">{overallScore}</div>
                    <Progress value={overallScore * 10} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">Above Average Performance</p>
                  </div>
                </CardContent>
              </Card>

              {/* Session Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Session Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{sessionData.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium">{sessionData.questionsAnswered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <Badge variant="secondary">{sessionData.type}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Top Strength */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-600" />
                    Top Strength
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <p className="font-medium mb-2">Storytelling</p>
                    <div className="text-2xl font-bold text-green-600 mb-2">8.5/10</div>
                    <p className="text-sm text-gray-600">Excellent use of STAR method</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <p className="text-sm text-green-800">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Score Breakdown</CardTitle>
                <CardDescription>Performance across different evaluation criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(detailedScores).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-bold">{score}/10</span>
                      </div>
                      <Progress value={score * 10} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Specific recommendations to boost your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {improvements.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{item.area}</h4>
                        <Badge variant="outline">Priority</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Current</p>
                          <p className="font-medium text-orange-600">{item.current}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Target</p>
                          <p className="font-medium text-green-600">{item.target}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">💡 {item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interview Transcript</CardTitle>
                <CardDescription>Complete conversation with AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="font-medium text-blue-600 mb-2">Interviewer:</p>
                    <p className="text-gray-700 mb-2">
                      Tell me about a time when you had to work with a difficult team member. How did you handle the
                      situation?
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-medium text-green-600 mb-2">You:</p>
                    <p className="text-gray-700 mb-2">
                      I'd like to share an experience from my previous role as a project manager. We had a team member
                      who consistently missed deadlines and was resistant to feedback...
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Good STAR structure
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Clear example
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Professional tone
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button size="lg" asChild>
            <Link href="/interview/behavioral">
              <RotateCcw className="w-5 h-5 mr-2" />
              Practice Again
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  )
}
