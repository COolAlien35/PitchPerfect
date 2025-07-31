"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Copy,
  Share2,
  Brain,
  Settings,
  Crown,
  MessageSquare,
  Flame,
  Zap,
  AlertTriangle,
  Phone,
  Upload,
  Shield,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ExtremeGroupDiscussionPage() {
  const [sessionCode, setSessionCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("20")
  const [maxParticipants, setMaxParticipants] = useState("8")
  const [difficulty, setDifficulty] = useState("extreme")
  const [participants, setParticipants] = useState<any[]>([])
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [extremeMode, setExtremeMode] = useState(true)
  const [selectedJudgePersonality, setSelectedJudgePersonality] = useState("hostile")
  const [deepfakeEnabled, setDeepfakeEnabled] = useState(false)
  const [interruptionsEnabled, setInterruptionsEnabled] = useState(true)
  const [multipleJudges, setMultipleJudges] = useState(false)
  const router = useRouter()

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const extremeTopics = [
    "Defend why your generation is better than all others - while others attack your viewpoint",
    "You must fire 50% of your team tomorrow - justify your choices while others disagree",
    "Argue for a controversial business decision while facing hostile opposition",
    "Defend a failed product launch while competitors mock your strategy",
    "Justify a massive budget cut while department heads fight for resources",
    "Argue for remote work while traditionalists attack every point you make",
    "Defend AI replacing human jobs while facing emotional opposition",
    "Justify controversial company policies while activists challenge you",
  ]

  const judgePersonalities = [
    {
      id: "hostile",
      name: "Gordon Ramsay Style",
      description: "Aggressive, interrupting, challenging every point",
      avatar: "/placeholder.svg?height=60&width=60&text=GR",
      traits: ["Interrupts frequently", "Challenges aggressively", "High pressure"],
    },
    {
      id: "shark",
      name: "Shark Tank Panel",
      description: "Multiple judges attacking from different angles",
      avatar: "/placeholder.svg?height=60&width=60&text=ST",
      traits: ["Multiple perspectives", "Business-focused attacks", "Investment mindset"],
    },
    {
      id: "chaos",
      name: "Chaos Mode",
      description: "Random interruptions, technical glitches, hostile takeovers",
      avatar: "/placeholder.svg?height=60&width=60&text=CH",
      traits: ["Random interruptions", "Technical chaos", "Unpredictable"],
    },
    {
      id: "custom",
      name: "Upload Executive Profile",
      description: "Clone any tough interviewer from LinkedIn",
      avatar: "/placeholder.svg?height=60&width=60&text=AI",
      traits: ["Custom personality", "LinkedIn-based", "Personalized hostility"],
    },
  ]

  const extremeFeatures = [
    {
      name: "Hostile Judge Mode",
      description: "AI judge becomes aggressive and challenging",
      icon: <Flame className="w-6 h-6 text-red-500" />,
      enabled: true,
    },
    {
      name: "Random Interruptions",
      description: "Phone calls, technical glitches, door knocks",
      icon: <Phone className="w-6 h-6 text-orange-500" />,
      enabled: interruptionsEnabled,
    },
    {
      name: "Multiple Arguing Judges",
      description: "Several AI judges arguing while you present",
      icon: <Users className="w-6 h-6 text-purple-500" />,
      enabled: multipleJudges,
    },
    {
      name: "Deepfake Participants",
      description: "See photorealistic avatars of all participants",
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
      enabled: deepfakeEnabled,
    },
  ]

  const createSession = () => {
    const code = generateSessionCode()
    setSessionCode(code)
    setIsHost(true)
    setIsCreatingSession(false)
  }

  const joinSession = () => {
    if (sessionCode.length === 6) {
      router.push(`/group-discussion/extreme/room/${sessionCode}`)
    }
  }

  const startSession = () => {
    router.push(`/group-discussion/extreme/room/${sessionCode}`)
  }

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode)
  }

  const shareSession = () => {
    const shareUrl = `${window.location.origin}/group-discussion/extreme/join/${sessionCode}`
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 text-white relative overflow-hidden">
      {/* Intense Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Lightning effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              InterviewAce AI
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="text-orange-300 hover:text-white">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild className="text-orange-300 hover:text-white">
              <Link href="/group-discussion">Normal Mode</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6 animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            🔥{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              EXTREME GROUP DISCUSSION
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Face the ultimate group interview challenge with hostile AI judges, random interruptions, deepfake
            participants, and extreme pressure scenarios. Only the strongest candidates survive!
          </p>
          <div className="flex items-center justify-center space-x-4 mt-6">
            <Badge className="bg-red-500 text-white px-4 py-2">EXTREME DIFFICULTY</Badge>
            <Badge className="bg-orange-500 text-white px-4 py-2">AI PERSONALITY CLONING</Badge>
            <Badge className="bg-yellow-500 text-black px-4 py-2">DEEPFAKE ENABLED</Badge>
          </div>
        </div>

        {!sessionCode ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Create Extreme Session */}
              <Card className="border-2 border-red-400 bg-red-900/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-400">
                    <Crown className="w-6 h-6 mr-2" />
                    Host Extreme Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCreatingSession ? (
                    <Button
                      onClick={() => setIsCreatingSession(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      size="lg"
                    >
                      <Flame className="w-5 h-5 mr-2" />
                      Create Extreme Session
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sessionName">Session Name</Label>
                        <Input
                          id="sessionName"
                          placeholder="e.g., Friday Fire Challenge"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="bg-black/30 border-red-400/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="topic">Extreme Discussion Topic</Label>
                        <Select value={topic} onValueChange={setTopic}>
                          <SelectTrigger className="bg-black/30 border-red-400/50">
                            <SelectValue placeholder="Choose an extreme topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {extremeTopics.map((t, index) => (
                              <SelectItem key={index} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Extreme Topic</SelectItem>
                          </SelectContent>
                        </Select>
                        {topic === "custom" && (
                          <Textarea
                            className="mt-2 bg-black/30 border-red-400/50"
                            placeholder="Create your own extreme challenge..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="bg-black/30 border-red-400/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="20">20 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="maxParticipants">Max Participants</Label>
                          <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                            <SelectTrigger className="bg-black/30 border-red-400/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6 people</SelectItem>
                              <SelectItem value="8">8 people</SelectItem>
                              <SelectItem value="10">10 people</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={createSession} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600">
                          Create Extreme Session
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreatingSession(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Join Extreme Session */}
              <Card className="border-2 border-orange-400 bg-orange-900/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-400">
                    <Users className="w-6 h-6 mr-2" />
                    Join Extreme Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showJoinForm ? (
                    <Button
                      onClick={() => setShowJoinForm(true)}
                      variant="outline"
                      className="w-full border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
                      size="lg"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Join Extreme Challenge
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="joinCode">Extreme Session Code</Label>
                        <Input
                          id="joinCode"
                          placeholder="Enter 6-digit code"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="text-center text-lg font-mono bg-black/30 border-orange-400/50"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={joinSession}
                          disabled={sessionCode.length !== 6}
                          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                        >
                          Enter the Fire
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

            {/* AI Judge Personality Selection */}
            <Card className="mb-8 border-2 border-purple-400 bg-purple-900/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-400">
                  <Brain className="w-6 h-6 mr-2" />
                  AI Judge Personality Cloning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {judgePersonalities.map((judge) => (
                    <div
                      key={judge.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedJudgePersonality === judge.id
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-white/20 hover:border-purple-300"
                      }`}
                      onClick={() => setSelectedJudgePersonality(judge.id)}
                    >
                      <div className="text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3">
                          <AvatarImage src={judge.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{judge.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-sm mb-1">{judge.name}</h3>
                        <p className="text-xs text-gray-300 mb-2">{judge.description}</p>
                        <div className="space-y-1">
                          {judge.traits.map((trait, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedJudgePersonality === "custom" && (
                  <div className="mt-4 border-2 border-dashed border-purple-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm mb-2">Upload Executive LinkedIn Profile</p>
                    <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" id="judge-upload" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("judge-upload")?.click()}
                    >
                      Clone Tough Executive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extreme Features */}
            <Card className="mb-8 border-2 border-yellow-400 bg-yellow-900/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Zap className="w-6 h-6 mr-2" />
                  Extreme Challenge Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {extremeFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        feature.enabled ? "border-green-400 bg-green-900/20" : "border-gray-400 bg-gray-900/20"
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {feature.icon}
                        <h3 className="font-bold">{feature.name}</h3>
                        <Badge className={feature.enabled ? "bg-green-500" : "bg-gray-500"}>
                          {feature.enabled ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300">{feature.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-black/30">
                    <input
                      type="checkbox"
                      checked={interruptionsEnabled}
                      onChange={(e) => setInterruptionsEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Random Interruptions</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-black/30">
                    <input
                      type="checkbox"
                      checked={multipleJudges}
                      onChange={(e) => setMultipleJudges(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Multiple Arguing Judges</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-black/30">
                    <input
                      type="checkbox"
                      checked={deepfakeEnabled}
                      onChange={(e) => setDeepfakeEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Deepfake Participants</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-2 border-red-500 bg-red-900/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-red-400 text-xl mb-2">⚠️ EXTREME MODE WARNING</h3>
                    <p className="text-gray-300 mb-4">
                      This mode is designed to push you to your absolute limits. You will face hostile AI judges, random
                      interruptions, technical chaos, and extreme pressure scenarios. Only attempt if you're ready for
                      the ultimate challenge.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-red-500 text-white">High Stress</Badge>
                      <Badge className="bg-orange-500 text-white">Hostile Environment</Badge>
                      <Badge className="bg-yellow-500 text-black">Random Chaos</Badge>
                      <Badge className="bg-purple-500 text-white">AI Cloning</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Session Created - Extreme Waiting Room */
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-red-400 bg-gradient-to-r from-red-900/50 to-orange-900/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl flex items-center justify-center text-red-400">
                  <Flame className="w-8 h-8 mr-2 animate-pulse" />
                  EXTREME SESSION CREATED! 🔥
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Code Display */}
                <div className="text-center">
                  <Label className="text-sm text-gray-300">Extreme Session Code</Label>
                  <div className="flex items-center justify-center space-x-4 mt-2">
                    <div className="text-4xl font-bold font-mono bg-black/50 rounded-lg px-6 py-3 border-2 border-red-400 text-red-400 animate-pulse">
                      {sessionCode}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copySessionCode}
                        className="border-red-400 bg-transparent"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={shareSession}
                        className="border-orange-400 bg-transparent"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Extreme Session Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center text-orange-400">
                      <Settings className="w-5 h-5 mr-2" />
                      Extreme Settings
                    </h3>
                    <div className="space-y-2 text-sm bg-black/30 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Mode:</span>
                        <Badge className="bg-red-500 text-white">EXTREME</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Duration:</span>
                        <span className="font-medium text-red-400">{duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Participants:</span>
                        <span className="font-medium text-orange-400">{maxParticipants} people</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Judge Style:</span>
                        <Badge className="bg-purple-500 text-white">
                          {judgePersonalities.find((j) => j.id === selectedJudgePersonality)?.name}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center text-red-400">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Extreme Topic
                    </h3>
                    <p className="text-sm bg-black/30 rounded-lg p-4 border border-red-400/30 text-red-300">{topic}</p>
                  </div>
                </div>

                {/* Active Features */}
                <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                  <h3 className="font-bold text-yellow-400 mb-3">🔥 Active Extreme Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Badge className="bg-red-500 text-white justify-center py-2">Hostile Judge</Badge>
                    {interruptionsEnabled && (
                      <Badge className="bg-orange-500 text-white justify-center py-2">Interruptions</Badge>
                    )}
                    {multipleJudges && (
                      <Badge className="bg-purple-500 text-white justify-center py-2">Multiple Judges</Badge>
                    )}
                    {deepfakeEnabled && (
                      <Badge className="bg-blue-500 text-white justify-center py-2">Deepfake Mode</Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-6">
                  <Button
                    onClick={startSession}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-8 py-4 animate-pulse"
                  >
                    <Flame className="w-5 h-5 mr-2" />
                    ENTER THE FIRE 🔥
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSessionCode("")}
                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                  >
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
