"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  Target,
  Brain,
  Star,
  Clock,
  Award,
  Download,
  Share2,
  RotateCcw,
  Home,
  Users,
  Crown,
  Medal,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function GroupDiscussionResultsPage() {
  const params = useParams()
  const [myOverallScore] = useState(82)

  const sessionData = {
    duration: "20:00",
    participants: 5,
    topic: "Should remote work be the new standard for all companies?",
    date: new Date().toLocaleDateString(),
  }

  const myDetailedScores = {
    participation: 85,
    leadership: 78,
    communication: 88,
    teamwork: 80,
    criticalThinking: 75,
    timeManagement: 82,
  }

  const finalLeaderboard = [
    {
      rank: 1,
      name: "Sarah Kim",
      score: 87,
      avatar: "/placeholder.svg?height=40&width=40",
      badge: "Discussion Leader",
    },
    { rank: 2, name: "You", score: 82, avatar: "/placeholder.svg?height=40&width=40", badge: "Strong Contributor" },
    { rank: 3, name: "Alex Chen", score: 79, avatar: "/placeholder.svg?height=40&width=40", badge: "Team Player" },
    { rank: 4, name: "Mike Johnson", score: 75, avatar: "/placeholder.svg?height=40&width=40", badge: "Good Effort" },
    { rank: 5, name: "Emma Davis", score: 71, avatar: "/placeholder.svg?height=40&width=40", badge: "Participant" },
  ]

  const aiJudgeFeedback = [
    {
      category: "Strengths",
      items: [
        "Excellent communication clarity and articulation",
        "Strong evidence-based arguments with real examples",
        "Good listening skills and respectful interaction",
        "Effective time management during responses",
      ],
    },
    {
      category: "Areas for Improvement",
      items: [
        "Could initiate more discussions and lead conversations",
        "Try to build more on others' ideas collaboratively",
        "Consider asking more probing questions to peers",
        "Work on maintaining consistent energy throughout",
      ],
    },
    {
      category: "Key Moments",
      items: [
        "Minute 5:30 - Excellent counter-argument with supporting data",
        "Minute 12:15 - Great facilitation when discussion got heated",
        "Minute 18:45 - Strong closing summary of key points",
      ],
    },
  ]

  const newBadges = [
    { name: "Team Collaborator", icon: "🤝", description: "Worked well with team members" },
    { name: "Critical Thinker", icon: "🧠", description: "Demonstrated analytical thinking" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
              Share Results
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            🎯{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discussion Complete!
            </span>
          </h1>
          <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {myOverallScore}/100
          </div>
          <p className="text-xl text-gray-600 mb-2">Strong Performance!</p>
          <p className="text-gray-500">
            {sessionData.topic} • {sessionData.duration} • {sessionData.date}
          </p>
        </div>

        {/* Final Leaderboard */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Crown className="w-6 h-6 mr-2" />
              Final Leaderboard 🏆
            </CardTitle>
            <CardDescription>How everyone performed in the group discussion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {finalLeaderboard.map((participant, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                    participant.name === "You"
                      ? "bg-blue-100 border-blue-300 shadow-lg"
                      : "bg-white border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-black"
                        : index === 1
                          ? "bg-gray-300 text-black"
                          : index === 2
                            ? "bg-orange-400 text-black"
                            : "bg-gray-600 text-white"
                    }`}
                  >
                    {participant.rank}
                  </div>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-lg">{participant.name}</h3>
                      {participant.name === "You" && <Badge className="bg-blue-100 text-blue-800">You</Badge>}
                    </div>
                    <p className="text-gray-600">{participant.badge}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{participant.score}</div>
                    <p className="text-sm text-gray-500">Score</p>
                  </div>
                  {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                  {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Award className="w-6 h-6 text-orange-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Badges */}
        {newBadges.length > 0 && (
          <Card className="mb-8 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Sparkles className="w-6 h-6 mr-2" />
                New Badges Earned! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {newBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-white rounded-lg p-4 border-2 border-yellow-200 shadow-sm"
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
            <TabsTrigger value="detailed">My Analysis</TabsTrigger>
            <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
            <TabsTrigger value="transcript">Discussion Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-600" />
                    Your Rank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-purple-600">#2</div>
                    <p className="text-sm text-gray-600 mb-2">out of {sessionData.participants} participants</p>
                    <Badge className="bg-purple-100 text-purple-800">Strong Contributor</Badge>
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
                    <span className="text-gray-600">Participants</span>
                    <span className="font-medium">{sessionData.participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Speaking Time</span>
                    <span className="font-medium">4:30 min</span>
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
                    <div className="text-2xl mb-2">🗣️</div>
                    <p className="font-medium mb-2">Communication</p>
                    <div className="text-2xl font-bold text-green-600 mb-2">88/100</div>
                    <p className="text-sm text-gray-600">Clear and articulate</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Detailed Performance Analysis</CardTitle>
                <CardDescription>Private analysis visible only to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(myDetailedScores).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-bold">{score}/100</span>
                      </div>
                      <Progress value={score} className="h-3" />
                      <p className="text-sm text-gray-600">
                        {score >= 85
                          ? "Excellent performance"
                          : score >= 75
                            ? "Good performance"
                            : score >= 65
                              ? "Average performance"
                              : "Needs improvement"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            {aiJudgeFeedback.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-600" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`p-3 rounded-lg border-l-4 ${
                          section.category === "Strengths"
                            ? "bg-green-50 border-green-400"
                            : section.category === "Areas for Improvement"
                              ? "bg-orange-50 border-orange-400"
                              : "bg-blue-50 border-blue-400"
                        }`}
                      >
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="transcript" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discussion Timeline</CardTitle>
                <CardDescription>Key moments and contributions during the discussion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="font-medium text-purple-600 mb-1">00:30 - You</p>
                    <p className="text-gray-700 mb-2">
                      "I believe remote work offers significant advantages in terms of work-life balance and
                      productivity. Studies show that 77% of remote workers report higher productivity levels..."
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Strong opening argument
                    </Badge>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="font-medium text-gray-600 mb-1">02:15 - Sarah Kim</p>
                    <p className="text-gray-700 mb-2">
                      "That's a great point about productivity. However, we should also consider the collaboration
                      challenges..."
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="font-medium text-purple-600 mb-1">05:30 - You</p>
                    <p className="text-gray-700 mb-2">
                      "Sarah raises an important concern. While collaboration can be challenging, tools like Slack and
                      Zoom have evolved significantly. In fact, Microsoft's 2023 report shows..."
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Excellent counter-argument with data
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button size="lg" asChild>
            <Link href="/group-discussion">
              <RotateCcw className="w-5 h-5 mr-2" />
              Start New Discussion
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
            Share Achievement
          </Button>
        </div>
      </div>
    </div>
  )
}
