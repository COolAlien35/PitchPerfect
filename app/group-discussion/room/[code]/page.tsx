"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Brain,
  Clock,
  Trophy,
  Users,
  MessageSquare,
  Crown,
  Target,
  Sparkles,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

export default function GroupDiscussionRoomPage() {
  const params = useParams()
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20 minutes in seconds
  const [isDiscussionStarted, setIsDiscussionStarted] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [myScore, setMyScore] = useState(0)
  const [myMetrics, setMyMetrics] = useState({
    participation: 75,
    leadership: 60,
    communication: 80,
    teamwork: 70,
    criticalThinking: 65,
  })

  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock participants data
  const [participants] = useState([
    {
      id: "me",
      name: "You",
      avatar: "/placeholder.svg?height=40&width=40",
      isHost: false,
      isMe: true,
      score: 0,
      isActive: false,
      speakingTime: 0,
    },
    {
      id: "p1",
      name: "Alex Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      isHost: true,
      isMe: false,
      score: 0,
      isActive: false,
      speakingTime: 0,
    },
    {
      id: "p2",
      name: "Sarah Kim",
      avatar: "/placeholder.svg?height=40&width=40",
      isHost: false,
      isMe: false,
      score: 0,
      isActive: false,
      speakingTime: 0,
    },
    {
      id: "p3",
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      isHost: false,
      isMe: false,
      score: 0,
      isActive: false,
      speakingTime: 0,
    },
    {
      id: "p4",
      name: "Emma Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      isHost: false,
      isMe: false,
      score: 0,
      isActive: false,
      speakingTime: 0,
    },
  ])

  // Mock leaderboard data (only shows overall scores, not individual analysis)
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "Sarah Kim", score: 87, trend: "up" },
    { rank: 2, name: "You", score: 82, trend: "up" },
    { rank: 3, name: "Alex Chen", score: 79, trend: "stable" },
    { rank: 4, name: "Mike Johnson", score: 75, trend: "down" },
    { rank: 5, name: "Emma Davis", score: 71, trend: "up" },
  ])

  const aiJudge = {
    name: "Dr. Patricia Williams",
    role: "AI Discussion Judge",
    avatar: "/placeholder.svg?height=60&width=60",
    isActive: true,
  }

  const discussionTopic =
    "Should remote work be the new standard for all companies? Discuss the advantages and disadvantages from multiple perspectives."

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    if (isVideoOn) {
      initCamera()
    }
  }, [isVideoOn])

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isDiscussionStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Discussion ended
            router.push(`/group-discussion/results/${params.code}`)
            return 0
          }
          return prev - 1
        })

        // Update scores periodically
        setMyScore((prev) => Math.min(100, prev + Math.random() * 2))
        setMyMetrics((prev) => ({
          participation: Math.max(0, Math.min(100, prev.participation + (Math.random() - 0.5) * 5)),
          leadership: Math.max(0, Math.min(100, prev.leadership + (Math.random() - 0.5) * 3)),
          communication: Math.max(0, Math.min(100, prev.communication + (Math.random() - 0.5) * 4)),
          teamwork: Math.max(0, Math.min(100, prev.teamwork + (Math.random() - 0.5) * 3)),
          criticalThinking: Math.max(0, Math.min(100, prev.criticalThinking + (Math.random() - 0.5) * 4)),
        }))
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isDiscussionStarted, timeRemaining, params.code, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startDiscussion = () => {
    setIsDiscussionStarted(true)
  }

  const endDiscussion = () => {
    router.push(`/group-discussion/results/${params.code}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center animate-pulse">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Group Discussion</h1>
              <p className="text-sm text-gray-300">Session: {params.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining < 300 ? "text-red-400 font-bold" : ""}>{formatTime(timeRemaining)}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={endDiscussion}>
              End Discussion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Discussion Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Judge */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={aiJudge.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{aiJudge.name}</h3>
                    <p className="text-gray-300">{aiJudge.role}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Actively Monitoring</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">AI Judge</Badge>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                    <span className="text-sm text-gray-300">Discussion Topic</span>
                  </div>
                  <p className="text-lg leading-relaxed">{discussionTopic}</p>
                </div>

                {!isDiscussionStarted ? (
                  <div className="text-center">
                    <Button onClick={startDiscussion} size="lg" className="bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Group Discussion
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-300 mb-2">Discussion in progress...</p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          ></div>
                        ))}
                      </div>
                      <span className="text-sm text-purple-400">AI analyzing discussion</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <Card
                  key={participant.id}
                  className={`bg-white/10 border-white/20 backdrop-blur-sm transition-all duration-300 ${
                    participant.isActive ? "ring-2 ring-blue-400 scale-105" : "hover:scale-102"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="relative mb-3">
                        <div
                          className={`w-20 h-20 mx-auto rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center ${
                            participant.isActive ? "ring-2 ring-blue-400" : ""
                          }`}
                        >
                          {participant.isMe && isVideoOn ? (
                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                          ) : (
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        {participant.isHost && <Crown className="absolute -top-2 -right-2 w-5 h-5 text-yellow-400" />}
                      </div>
                      <h4 className="font-medium text-sm">{participant.name}</h4>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        {participant.isActive ? (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-400">Speaking</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-xs text-gray-400">Listening</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Controls */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant={isVideoOn ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className="hover:scale-110 transition-transform"
                  >
                    {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={isAudioOn ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setIsAudioOn(!isAudioOn)}
                    className="hover:scale-110 transition-transform"
                  >
                    {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={isSpeakerOn ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className="hover:scale-110 transition-transform"
                  >
                    {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Tabs defaultValue="leaderboard" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="myanalysis">My Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="space-y-4">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                      Live Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {leaderboard.map((participant, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                          participant.name === "You"
                            ? "bg-blue-500/20 border border-blue-400/30"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                        <div className="flex-1">
                          <p className="font-medium text-sm">{participant.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">Score: {participant.score}</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                participant.trend === "up"
                                  ? "bg-green-400"
                                  : participant.trend === "down"
                                    ? "bg-red-400"
                                    : "bg-gray-400"
                              }`}
                            ></div>
                          </div>
                        </div>
                        {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="myanalysis" className="space-y-4">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-400" />
                      Your Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {Math.round(myScore)}
                      </div>
                      <p className="text-sm text-gray-300">Overall Score</p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(myMetrics).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className="font-medium">{Math.round(value)}%</span>
                          </div>
                          <Progress value={value} className="h-2 bg-white/20" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-green-400" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-black/30 rounded-lg border-l-4 border-green-400">
                        <p className="text-sm">💡 Great leadership shown in the last 2 minutes!</p>
                      </div>
                      <div className="p-3 bg-black/30 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm">🎯 Try to engage more with other participants' ideas</p>
                      </div>
                      <div className="p-3 bg-black/30 rounded-lg border-l-4 border-purple-400">
                        <p className="text-sm">⚡ Your communication clarity is excellent!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
