"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Brain,
  Clock,
  Target,
  TrendingUp,
  Eye,
  MessageSquare,
  Zap,
  Play,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function BehavioralInterviewPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(75)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [userStream, setUserStream] = useState<MediaStream | null>(null)
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [currentQuestionText, setCurrentQuestionText] = useState("")
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const [isListeningForSpeech, setIsListeningForSpeech] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const router = useRouter()

  const questions = [
    "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
    "Describe a situation where you had to meet a tight deadline. What was your approach?",
    "Can you give me an example of a time when you had to adapt to a significant change at work?",
    "Tell me about a project you're particularly proud of. What made it successful?",
    "Describe a time when you had to give constructive feedback to a colleague.",
  ]

  const interviewerPersonality = {
    name: "Sarah Chen",
    role: "Senior Hiring Manager",
    company: "TechCorp",
    personality: "Professional & Analytical",
    avatar: "/placeholder.svg?height=200&width=200",
  }

  const realTimeMetrics = {
    eyeContact: 82,
    speechPace: 78,
    fillerWords: 3,
    energy: 85,
  }

  // Initialize camera and audio analysis
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        })
        setUserStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Setup audio analysis for speech detection
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 256
        microphone.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Start monitoring audio levels
        monitorAudioLevel()
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    if (isVideoOn) {
      initCamera()
    }

    return () => {
      if (userStream) {
        userStream.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isVideoOn])

  // Setup speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsListeningForSpeech(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("")

        if (transcript.length > 10) {
          // User is actively speaking
          setIsUserSpeaking(true)
        }
      }

      recognition.onend = () => {
        setIsListeningForSpeech(false)
        if (isInterviewStarted && !isAvatarSpeaking) {
          // Restart recognition if interview is ongoing
          setTimeout(() => recognition.start(), 1000)
        }
      }

      setSpeechRecognition(recognition)
    }
  }, [])

  // Monitor audio levels for visual feedback
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const checkAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)

        // Detect if user is speaking based on audio level
        if (average > 20 && !isAvatarSpeaking) {
          setIsUserSpeaking(true)
        } else if (average < 10) {
          setIsUserSpeaking(false)
        }
      }
      requestAnimationFrame(checkAudioLevel)
    }

    checkAudioLevel()
  }

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isInterviewStarted) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1)
        setConfidenceScore((prev) => Math.max(60, Math.min(95, prev + (Math.random() - 0.5) * 10)))
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isInterviewStarted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const speakQuestion = async (questionText: string) => {
    setIsAvatarSpeaking(true)
    setCurrentQuestionText("")
    setIsUserSpeaking(false)

    // Stop speech recognition while AI is speaking
    if (speechRecognition && isListeningForSpeech) {
      speechRecognition.stop()
    }

    // Animated typing effect
    for (let i = 0; i <= questionText.length; i++) {
      setCurrentQuestionText(questionText.slice(0, i))
      await new Promise((resolve) => setTimeout(resolve, 30))
    }

    // Start speaking immediately as text appears
    if ("speechSynthesis" in window && isSpeakerOn) {
      const utterance = new SpeechSynthesisUtterance(questionText)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.voice =
        speechSynthesis.getVoices().find((voice) => voice.name.includes("Female") || voice.name.includes("Samantha")) ||
        speechSynthesis.getVoices()[0]

      utterance.onend = () => {
        setIsAvatarSpeaking(false)
        // Start listening for user response immediately
        if (speechRecognition) {
          setTimeout(() => speechRecognition.start(), 500)
        }
      }

      speechSynthesis.speak(utterance)
    } else {
      // Fallback timing
      setTimeout(() => {
        setIsAvatarSpeaking(false)
        if (speechRecognition) {
          speechRecognition.start()
        }
      }, questionText.length * 60)
    }
  }

  const startInterview = () => {
    setIsInterviewStarted(true)
    speakQuestion(questions[currentQuestion])
  }

  const handleNextQuestion = () => {
    setIsUserSpeaking(false)

    // Stop speech recognition
    if (speechRecognition && isListeningForSpeech) {
      speechRecognition.stop()
    }

    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1
      setCurrentQuestion(nextQuestion)
      setTimeout(() => {
        speakQuestion(questions[nextQuestion])
      }, 1500)
    } else {
      router.push("/interview/results")
    }
  }

  const handleEndInterview = () => {
    if (userStream) {
      userStream.getTracks().forEach((track) => track.stop())
    }
    if (speechRecognition && isListeningForSpeech) {
      speechRecognition.stop()
    }
    router.push("/interview/results")
  }

  const toggleVideo = () => {
    if (userStream) {
      const videoTrack = userStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
      }
    }
    setIsVideoOn(!isVideoOn)
  }

  const toggleAudio = () => {
    if (userStream) {
      const audioTrack = userStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn
      }
    }
    setIsAudioOn(!isAudioOn)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Behavioral Interview</h1>
              <p className="text-sm text-gray-300">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(sessionTime)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndInterview}
              className="hover:scale-105 transition-transform"
            >
              End Interview
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Interview Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Interviewer */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="relative inline-block">
                      <div
                        className={`w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center transition-all duration-500 ${
                          isAvatarSpeaking
                            ? "ring-4 ring-green-400 ring-opacity-75 scale-105 shadow-2xl shadow-green-400/25"
                            : "hover:scale-105"
                        }`}
                      >
                        <Avatar className="w-44 h-44">
                          <AvatarImage
                            src={interviewerPersonality.avatar || "/placeholder.svg"}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-indigo-500">
                            SC
                          </AvatarFallback>
                        </Avatar>

                        {/* Speaking animation overlay */}
                        {isAvatarSpeaking && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse"></div>
                        )}
                      </div>

                      {/* Floating speaking indicators */}
                      {isAvatarSpeaking && (
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-lg"></div>
                            <div
                              className="w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-lg"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-lg"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 space-y-2">
                      <h3 className="font-bold text-lg">{interviewerPersonality.name}</h3>
                      <p className="text-gray-300">{interviewerPersonality.role}</p>
                      <p className="text-sm text-gray-400">{interviewerPersonality.company}</p>
                      <Badge variant="secondary" className="mt-2 bg-white/20 hover:bg-white/30 transition-colors">
                        {interviewerPersonality.personality}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center space-x-2 mt-4">
                      {isAvatarSpeaking ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-400 font-medium">Speaking</span>
                          <Sparkles className="w-4 h-4 text-green-400 animate-spin" />
                        </>
                      ) : isListeningForSpeech ? (
                        <>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-blue-400 font-medium">Listening</span>
                          <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              ></div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm text-gray-400">Waiting</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Video */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div
                      className={`w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center transition-all duration-500 ${
                        isUserSpeaking
                          ? "ring-4 ring-blue-400 ring-opacity-75 scale-105 shadow-2xl shadow-blue-400/25"
                          : "hover:scale-105"
                      }`}
                    >
                      {isVideoOn ? (
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400">
                          <VideoOff className="w-12 h-12 mb-2" />
                          <p className="text-sm">Camera Off</p>
                        </div>
                      )}

                      {/* Audio level visualization */}
                      {isUserSpeaking && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                      )}
                    </div>

                    <div className="mt-6 space-y-2">
                      <h3 className="font-bold text-lg">You</h3>
                      <p className="text-gray-300">Candidate</p>
                    </div>

                    <div className="flex items-center justify-center space-x-2 mt-4">
                      {isUserSpeaking ? (
                        <>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-blue-400 font-medium">Speaking</span>
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-blue-400 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.max(8, audioLevel / 10 + Math.random() * 16)}px`,
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              ></div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm text-gray-400">Ready</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question Display */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="bg-black/30 rounded-lg p-6 mb-6 relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>

                  <div className="flex items-center mb-3 relative z-10">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                    <span className="text-sm text-gray-300">Current Question</span>
                    {isAvatarSpeaking && (
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            ></div>
                          ))}
                        </div>
                        <span className="text-xs text-green-400">AI Speaking</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg leading-relaxed min-h-[3rem] relative z-10">
                    {currentQuestionText}
                    {isAvatarSpeaking && <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse"></span>}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={isVideoOn ? "default" : "secondary"}
                      size="sm"
                      onClick={toggleVideo}
                      className="hover:scale-110 transition-transform"
                    >
                      {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={isAudioOn ? "default" : "secondary"}
                      size="sm"
                      onClick={toggleAudio}
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

                  <div className="flex items-center space-x-3">
                    {!isInterviewStarted ? (
                      <Button
                        onClick={startInterview}
                        className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Interview
                      </Button>
                    ) : (
                      <>
                        {!isAvatarSpeaking && (
                          <Button
                            onClick={handleNextQuestion}
                            className="hover:scale-105 transition-all duration-300 shadow-lg"
                          >
                            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Interview"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Interview Progress</span>
                  <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-3 bg-white/20" />
              </CardContent>
            </Card>
          </div>

          {/* Real-time Metrics Sidebar */}
          <div className="space-y-6">
            {/* Confidence Score */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-400" />
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    {Math.round(confidenceScore)}%
                  </div>
                  <Progress value={confidenceScore} className="h-3 mb-2 bg-white/20" />
                  <p className="text-sm text-gray-300">Looking great!</p>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Metrics */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-purple-400" />
                    <span className="text-sm">Eye Contact</span>
                  </div>
                  <span className="font-bold text-purple-400">{realTimeMetrics.eyeContact}%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-green-400" />
                    <span className="text-sm">Speech Pace</span>
                  </div>
                  <span className="font-bold text-green-400">{realTimeMetrics.speechPace}%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                    <span className="text-sm">Energy Level</span>
                  </div>
                  <span className="font-bold text-yellow-400">{realTimeMetrics.energy}%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-sm">Filler Words</span>
                  <span className="font-bold text-orange-400">{realTimeMetrics.fillerWords}</span>
                </div>
              </CardContent>
            </Card>

            {/* Live Coaching Tips */}
            <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-sm hover:from-purple-900/60 hover:to-pink-900/60 transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-400" />
                  AI Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isAvatarSpeaking && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-green-400 animate-pulse">
                      <p className="text-sm">👂 Listen carefully to the question</p>
                    </div>
                  )}
                  {isListeningForSpeech && !isUserSpeaking && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-blue-400 animate-pulse">
                      <p className="text-sm">🎯 Take a moment to structure your response</p>
                    </div>
                  )}
                  {isUserSpeaking && (
                    <>
                      <div className="p-3 bg-black/30 rounded-lg border-l-4 border-purple-400 animate-pulse">
                        <p className="text-sm">💡 Great eye contact! Keep it up.</p>
                      </div>
                      <div className="p-3 bg-black/30 rounded-lg border-l-4 border-yellow-400 animate-pulse">
                        <p className="text-sm">⚡ Your energy is perfect for this question type!</p>
                      </div>
                    </>
                  )}
                  {!isInterviewStarted && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-green-400">
                      <p className="text-sm">🚀 Ready to start? Click "Start Interview" when you're prepared!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
