"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Copy, Share2, Trophy, Brain, Play, Settings, Crown, Target, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function GroupDiscussionPage() {
  const [sessionCode, setSessionCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("20")
  const [maxParticipants, setMaxParticipants] = useState("8")
  const [difficulty, setDifficulty] = useState("intermediate")
  const [participants, setParticipants] = useState<any[]>([])
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const router = useRouter()

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const predefinedTopics = [
    "Should remote work be the new standard for all companies?",
    "Is artificial intelligence a threat to human employment?",
    "Should social media platforms be regulated by governments?",
    "Is cryptocurrency the future of global finance?",
    "Should companies prioritize profit or environmental sustainability?",
    "Is online education as effective as traditional classroom learning?",
    "Should there be a universal basic income?",
    "Is work-life balance achievable in today's competitive world?",
  ]

  const difficultyLevels = {
    beginner: {
      name: "Beginner",
      description: "Basic topics, supportive environment",
      color: "bg-green-100 text-green-800",
    },
    intermediate: {
      name: "Intermediate",
      description: "Moderate complexity, balanced discussion",
      color: "bg-blue-100 text-blue-800",
    },
    advanced: {
      name: "Advanced",
      description: "Complex topics, competitive environment",
      color: "bg-purple-100 text-purple-800",
    },
    expert: {
      name: "Expert",
      description: "Highly challenging, pressure situations",
      color: "bg-red-100 text-red-800",
    },
  }

  const createSession = () => {
    const code = generateSessionCode()
    setSessionCode(code)
    setIsHost(true)
    setIsCreatingSession(false)
    // In a real app, this would create the session on the server
  }

  const joinSession = () => {
    if (sessionCode.length === 6) {
      // In a real app, this would join the existing session
      router.push(`/group-discussion/room/${sessionCode}`)
    }
  }

  const startSession = () => {
    router.push(`/group-discussion/room/${sessionCode}`)
  }

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode)
  }

  const shareSession = () => {
    const shareUrl = `${window.location.origin}/group-discussion/join/${sessionCode}`
    navigator.clipboard.writeText(shareUrl)
  }

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
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Group Discussion Mode
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master the most challenging part of interviews with AI-powered group discussions. Practice with friends and
            get real-time feedback from our AI judge.
          </p>
        </div>

        {!sessionCode ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Create Session */}
              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-purple-600" />
                    Host a Session
                  </CardTitle>
                  <CardDescription>Create a new group discussion and invite your friends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCreatingSession ? (
                    <Button onClick={() => setIsCreatingSession(true)} className="w-full" size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Session
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sessionName">Session Name</Label>
                        <Input
                          id="sessionName"
                          placeholder="e.g., Friday Practice Session"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="topic">Discussion Topic</Label>
                        <Select value={topic} onValueChange={setTopic}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a topic or create custom" />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedTopics.map((t, index) => (
                              <SelectItem key={index} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Topic</SelectItem>
                          </SelectContent>
                        </Select>
                        {topic === "custom" && (
                          <Textarea
                            className="mt-2"
                            placeholder="Enter your custom topic..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="20">20 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="maxParticipants">Max Participants</Label>
                          <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 people</SelectItem>
                              <SelectItem value="6">6 people</SelectItem>
                              <SelectItem value="8">8 people</SelectItem>
                              <SelectItem value="10">10 people</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(difficultyLevels).map(([key, level]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center space-x-2">
                                  <span>{level.name}</span>
                                  <Badge className={level.color}>{level.description}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={createSession} className="flex-1">
                          Create Session
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreatingSession(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Join Session */}
              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-6 h-6 mr-2 text-blue-600" />
                    Join a Session
                  </CardTitle>
                  <CardDescription>Enter a session code to join an existing group discussion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showJoinForm ? (
                    <Button onClick={() => setShowJoinForm(true)} variant="outline" className="w-full" size="lg">
                      <Users className="w-5 h-5 mr-2" />
                      Join Existing Session
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="joinCode">Session Code</Label>
                        <Input
                          id="joinCode"
                          placeholder="Enter 6-digit code"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="text-center text-lg font-mono"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={joinSession} disabled={sessionCode.length !== 6} className="flex-1">
                          Join Session
                        </Button>
                        <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Features Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">Why Practice Group Discussions?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold mb-2">AI Judge Analysis</h3>
                    <p className="text-gray-600 text-sm">
                      Get real-time feedback on your communication skills, leadership qualities, and argument strength
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold mb-2">Live Leaderboard</h3>
                    <p className="text-gray-600 text-sm">
                      See how you rank against other participants while keeping individual analysis private
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold mb-2">Skill Development</h3>
                    <p className="text-gray-600 text-sm">
                      Improve critical thinking, teamwork, and presentation skills in a realistic group setting
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* Session Created - Waiting Room */
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center">
                  <Crown className="w-8 h-8 mr-2 text-purple-600" />
                  Session Created Successfully!
                </CardTitle>
                <CardDescription>Share the session code with your friends to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Code Display */}
                <div className="text-center">
                  <Label className="text-sm text-gray-600">Session Code</Label>
                  <div className="flex items-center justify-center space-x-4 mt-2">
                    <div className="text-4xl font-bold font-mono bg-white rounded-lg px-6 py-3 border-2 border-purple-200">
                      {sessionCode}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" variant="outline" onClick={copySessionCode}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={shareSession}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Session Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{sessionName || "Untitled Session"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Participants:</span>
                        <span className="font-medium">{maxParticipants} people</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Difficulty:</span>
                        <Badge className={difficultyLevels[difficulty as keyof typeof difficultyLevels].color}>
                          {difficultyLevels[difficulty as keyof typeof difficultyLevels].name}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Discussion Topic
                    </h3>
                    <p className="text-sm bg-white rounded-lg p-3 border">{topic}</p>
                  </div>
                </div>

                {/* Participants List */}
                <div>
                  <h3 className="font-bold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Participants ({participants.length}/{maxParticipants})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Host */}
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border-2 border-purple-200">
                      <Avatar>
                        <AvatarFallback className="bg-purple-100 text-purple-600">H</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">You (Host)</p>
                        <p className="text-sm text-gray-500">Ready to start</p>
                      </div>
                      <Crown className="w-5 h-5 text-purple-600" />
                    </div>

                    {/* Waiting slots */}
                    {Array.from({ length: Number.parseInt(maxParticipants) - 1 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
                      >
                        <Avatar>
                          <AvatarFallback className="bg-gray-200 text-gray-400">
                            <Users className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-gray-400">Waiting for participant...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-6">
                  <Button onClick={startSession} size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Play className="w-5 h-5 mr-2" />
                    Start Discussion
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setSessionCode("")}>
                    Cancel Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
