"use client"

import type React from "react"

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
  Zap,
  AlertTriangle,
  Phone,
  Wifi,
  Users,
  Target,
  Sparkles,
  Shield,
  Flame,
  Upload,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"

export default function InterruptRecoverChallengePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [recoveryScore, setRecoveryScore] = useState(85)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [currentInterruption, setCurrentInterruption] = useState<string | null>(null)
  const [interruptionActive, setInterruptionActive] = useState(false)
  const [recoveryTime, setRecoveryTime] = useState(0)
  const [selectedPersonality, setSelectedPersonality] = useState("elon")
  const [uploadedProfile, setUploadedProfile] = useState<string | null>(null)
  const [deepfakeMode, setDeepfakeMode] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [multipleInterviewers, setMultipleInterviewers] = useState(false)
  const [hostileMode, setHostileMode] = useState(false)
  const [currentQuestionText, setCurrentQuestionText] = useState("")
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [userStream, setUserStream] = useState<MediaStream | null>(null)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const [isListeningForSpeech, setIsListeningForSpeech] = useState(false)
  const [userResponses, setUserResponses] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const router = useRouter()

  const { speak, stop, isSpeaking } = useSpeechSynthesis({
    onStart: () => setIsAvatarSpeaking(true),
    onEnd: () => {
      setIsAvatarSpeaking(false)
      if (speechRecognition && isInterviewStarted) {
        setTimeout(() => speechRecognition.start(), 500)
      }
    },
  })

  const questions = [
    "Tell me about your greatest professional achievement and how you overcame the challenges.",
    "Describe a time when you had to work under extreme pressure. How did you handle it?",
    "What would you do if you discovered a major flaw in a project just before the deadline?",
    "How do you handle criticism and negative feedback from supervisors?",
    "Explain a complex technical concept to someone with no technical background.",
  ]

  const interruptionTypes = [
    {
      type: "phone",
      name: "Phone Call Interruption",
      description: "Sudden phone ring during your answer",
      icon: <Phone className="w-6 h-6" />,
      sound: "📞 *RING RING*",
    },
    {
      type: "technical",
      name: "Technical Glitch",
      description: "Video freezes, audio cuts out",
      icon: <Wifi className="w-6 h-6" />,
      sound: "⚠️ *CONNECTION LOST*",
    },
    {
      type: "hostile",
      name: "Hostile Takeover",
      description: "Interviewer becomes aggressive",
      icon: <Flame className="w-6 h-6" />,
      sound: "😠 *AGGRESSIVE TONE*",
    },
    {
      type: "multiple",
      name: "Multiple Voices",
      description: "Multiple interviewers arguing",
      icon: <Users className="w-6 h-6" />,
      sound: "🗣️ *OVERLAPPING VOICES*",
    },
  ]

  const personalityProfiles = [
    {
      id: "elon",
      name: "Elon Musk",
      company: "Tesla/SpaceX",
      style: "Direct, Technical, Visionary",
      avatar: "/placeholder.svg?height=60&width=60&text=EM",
      traits: ["Asks about first principles", "Technical deep-dives", "Future-focused questions"],
      voice: "male",
    },
    {
      id: "satya",
      name: "Satya Nadella",
      company: "Microsoft",
      style: "Empathetic, Growth-minded",
      avatar: "/placeholder.svg?height=60&width=60&text=SN",
      traits: ["Growth mindset questions", "Collaboration focus", "Cultural fit assessment"],
      voice: "male",
    },
    {
      id: "jensen",
      name: "Jensen Huang",
      company: "NVIDIA",
      style: "Technical, Passionate, Intense",
      avatar: "/placeholder.svg?height=60&width=60&text=JH",
      traits: ["AI/GPU technical questions", "Innovation focus", "High-energy delivery"],
      voice: "male",
    },
    {
      id: "custom",
      name: "Upload LinkedIn Profile",
      company: "Custom Clone",
      style: "AI-Generated from Profile",
      avatar: "/placeholder.svg?height=60&width=60&text=AI",
      traits: ["Cloned from LinkedIn data", "Personalized style", "Industry-specific"],
      voice: "female",
    },
  ]

  const currentPersonality = personalityProfiles.find((p) => p.id === selectedPersonality) || personalityProfiles[0]

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
          setIsUserSpeaking(true)
          // Store user response
          if (event.results[event.results.length - 1].isFinal) {
            setUserResponses((prev) => {
              const newResponses = [...prev]
              newResponses[currentQuestion] = transcript
              return newResponses
            })
          }
        }
      }

      recognition.onend = () => {
        setIsListeningForSpeech(false)
        setIsUserSpeaking(false)
        if (isInterviewStarted && !isAvatarSpeaking) {
          setTimeout(() => recognition.start(), 1000)
        }
      }

      setSpeechRecognition(recognition)
    }
  }, [currentQuestion, isInterviewStarted, isAvatarSpeaking])

  // Monitor audio levels for visual feedback
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const checkAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)

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

  // Session timer and random interruptions
  useEffect(() => {
    let timer: NodeJS.Timeout
    let interruptionTimer: NodeJS.Timeout

    if (isInterviewStarted) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1)
        setRecoveryScore((prev) => Math.max(60, Math.min(100, prev + (Math.random() - 0.3) * 5)))
      }, 1000)

      // Random interruptions every 30-90 seconds
      const scheduleInterruption = () => {
        const delay = Math.random() * 60000 + 30000
        interruptionTimer = setTimeout(() => {
          triggerRandomInterruption()
          scheduleInterruption()
        }, delay)
      }

      scheduleInterruption()
    }

    return () => {
      clearInterval(timer)
      clearTimeout(interruptionTimer)
    }
  }, [isInterviewStarted])

  const triggerRandomInterruption = () => {
    const randomInterruption = interruptionTypes[Math.floor(Math.random() * interruptionTypes.length)]
    setCurrentInterruption(randomInterruption.type)
    setInterruptionActive(true)
    setRecoveryTime(Date.now())

    // Stop current speech
    stop()

    // Auto-resolve after 3-8 seconds if user doesn't handle it
    setTimeout(
      () => {
        if (interruptionActive) {
          handleInterruptionRecovery()
        }
      },
      Math.random() * 5000 + 3000,
    )
  }

  const handleInterruptionRecovery = () => {
    const recoveryTimeMs = Date.now() - recoveryTime
    const recoveryBonus = Math.max(0, 20 - recoveryTimeMs / 1000)
    setRecoveryScore((prev) => Math.min(100, prev + recoveryBonus))
    setInterruptionActive(false)
    setCurrentInterruption(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const speakQuestion = (questionText: string) => {
    setCurrentQuestionText(questionText)
    if (isSpeakerOn) {
      const personalizedQuestion = getPersonalizedQuestion(questionText)
      speak(personalizedQuestion, {
        voice: currentPersonality.voice,
        rate: 0.9,
        pitch: currentPersonality.id === "elon" ? 1.2 : 1.0,
      })
    }
  }

  const getPersonalizedQuestion = (question: string) => {
    const personalityIntros = {
      elon: "Let me ask you this from a first principles perspective: ",
      satya: "I'm curious about your growth mindset here: ",
      jensen: "This is crucial for innovation: ",
      custom: "Based on industry standards: ",
    }
    return personalityIntros[selectedPersonality as keyof typeof personalityIntros] + question
  }

  const startInterview = () => {
    setIsInterviewStarted(true)
    setTimeout(() => {
      speakQuestion(questions[currentQuestion])
    }, 1000)
  }

  const handleNextQuestion = () => {
    setIsUserSpeaking(false)
    stop()

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
      // Store session data for analysis
      const sessionData = {
        type: "Interrupt & Recover Challenge",
        personality: currentPersonality.name,
        questions,
        responses: userResponses,
        recoveryScore,
        sessionTime,
        interruptionsHandled: Math.floor(sessionTime / 45), // Estimate interruptions
        deepfakeMode,
        hostileMode,
      }
      localStorage.setItem("lastInterviewSession", JSON.stringify(sessionData))
      router.push("/interview/analysis")
    }
  }

  const handleEndInterview = () => {
    if (userStream) {
      userStream.getTracks().forEach((track) => track.stop())
    }
    if (speechRecognition && isListeningForSpeech) {
      speechRecognition.stop()
    }
    stop()
    router.push("/interview/analysis")
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

  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedProfile(e.target?.result as string)
        setSelectedPersonality("custom")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeepfakeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserAvatar(e.target?.result as string)
        setDeepfakeMode(true)
      }
      reader.readAsDataURL(file)
    }
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

        {/* Lightning effects during interruptions */}
        {interruptionActive && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-400" />
                Interrupt & Recover Challenge
              </h1>
              <p className="text-sm text-gray-300">
                Question {currentQuestion + 1} of {questions.length} • Extreme Mode
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm bg-red-500/20 rounded-full px-3 py-1 backdrop-blur-sm border border-red-400/30">
              <Clock className="w-4 h-4" />
              <span>{formatTime(sessionTime)}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleEndInterview}>
              Emergency Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {!isInterviewStarted ? (
          /* Setup Phase */
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                🔥{" "}
                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Extreme Challenge Mode
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Face the ultimate interview challenge with random interruptions, hostile scenarios, and AI personality
                cloning. Only the strongest candidates survive!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Personality Cloning */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-6 h-6 mr-2 text-purple-400" />
                    AI Personality Cloning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {personalityProfiles.slice(0, 3).map((profile) => (
                      <div
                        key={profile.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPersonality === profile.id
                            ? "border-purple-400 bg-purple-500/20"
                            : "border-white/20 hover:border-purple-300"
                        }`}
                        onClick={() => setSelectedPersonality(profile.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-bold">{profile.name}</h3>
                            <p className="text-sm text-gray-300">{profile.company}</p>
                            <p className="text-xs text-purple-300">{profile.style}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm mb-2">Upload LinkedIn Profile</p>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleProfileUpload}
                      className="hidden"
                      id="profile-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("profile-upload")?.click()}
                    >
                      Clone Any Executive
                    </Button>
                    {uploadedProfile && (
                      <p className="text-xs text-green-400 mt-2">✅ Profile uploaded - AI cloning in progress</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Deepfake Candidate Testing */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-blue-400" />
                    Deepfake Candidate Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center mb-4">
                      {userAvatar ? (
                        <img
                          src={userAvatar || "/placeholder.svg"}
                          alt="Your Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">
                          <Users className="w-12 h-12 mb-2" />
                          <p className="text-sm">Upload Your Photo</p>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDeepfakeUpload}
                      className="hidden"
                      id="deepfake-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("deepfake-upload")?.click()}
                      className="mb-4"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Photo
                    </Button>

                    {deepfakeMode && (
                      <div className="space-y-2">
                        <Badge className="bg-blue-100 text-blue-800">Deepfake Mode Active</Badge>
                        <p className="text-xs text-blue-300">
                          You'll see yourself being interviewed from a third-person perspective
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Challenge Settings */}
            <Card className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-red-400">
                  <AlertTriangle className="w-6 h-6 mr-2" />
                  Extreme Challenge Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-orange-400">Interruption Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {interruptionTypes.map((interruption) => (
                        <div
                          key={interruption.type}
                          className="p-3 bg-black/30 rounded-lg border border-red-400/30 text-center"
                        >
                          <div className="text-red-400 mb-2">{interruption.icon}</div>
                          <p className="text-xs font-medium">{interruption.name}</p>
                          <p className="text-xs text-gray-400">{interruption.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-orange-400">Challenge Modes</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hostileMode}
                          onChange={(e) => setHostileMode(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Hostile Takeover Mode</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={multipleInterviewers}
                          onChange={(e) => setMultipleInterviewers(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Multiple Arguing Interviewers</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-8 py-4"
                  >
                    <Flame className="w-5 h-5 mr-2" />
                    Enter the Fire 🔥
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Interview Phase */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Interview Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Interruption Alert */}
              {interruptionActive && (
                <Card className="bg-red-500/20 border-red-400 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
                        <div>
                          <h3 className="font-bold text-red-400">INTERRUPTION DETECTED!</h3>
                          <p className="text-sm text-red-300">
                            {interruptionTypes.find((i) => i.type === currentInterruption)?.sound}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleInterruptionRecovery}
                        variant="destructive"
                        size="sm"
                        className="animate-pulse"
                      >
                        Handle It!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Interviewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={`bg-white/10 border-white/20 backdrop-blur-sm transition-all duration-300 ${
                    hostileMode && interruptionActive ? "bg-red-500/20 border-red-400" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div
                        className={`w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center transition-all duration-500 ${
                          isAvatarSpeaking
                            ? "ring-4 ring-green-400 scale-110 shadow-2xl shadow-green-400/25"
                            : hostileMode && interruptionActive
                              ? "ring-4 ring-red-400 scale-110"
                              : "hover:scale-105"
                        }`}
                      >
                        <Avatar className="w-44 h-44">
                          <AvatarImage
                            src={uploadedProfile || currentPersonality.avatar || "/placeholder.svg"}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-500 to-pink-500">
                            {currentPersonality.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Speaking animation overlay */}
                        {isAvatarSpeaking && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse"></div>
                        )}

                        {/* Hostile mode overlay */}
                        {hostileMode && interruptionActive && (
                          <div className="absolute inset-0 bg-red-500/30 animate-pulse flex items-center justify-center">
                            <Flame className="w-12 h-12 text-red-400 animate-bounce" />
                          </div>
                        )}
                      </div>

                      <div className="mt-6 space-y-2">
                        <h3 className="font-bold text-lg">{currentPersonality.name}</h3>
                        <p className="text-gray-300">{currentPersonality.company}</p>
                        <Badge
                          className={`mt-2 ${
                            hostileMode && interruptionActive
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {hostileMode && interruptionActive ? "HOSTILE MODE" : currentPersonality.style}
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

                {/* User Video (Deepfake or Regular) */}
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div
                        className={`w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center transition-all duration-500 ${
                          isUserSpeaking
                            ? "ring-4 ring-blue-400 ring-opacity-75 scale-105 shadow-2xl shadow-blue-400/25"
                            : "hover:scale-105"
                        }`}
                      >
                        {deepfakeMode && userAvatar ? (
                          <img
                            src={userAvatar || "/placeholder.svg"}
                            alt="Deepfake You"
                            className="w-full h-full object-cover"
                          />
                        ) : isVideoOn ? (
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
                        <h3 className="font-bold text-lg">{deepfakeMode ? "Deepfake You" : "You"}</h3>
                        <p className="text-gray-300">Candidate</p>
                        {deepfakeMode && <Badge className="bg-blue-100 text-blue-800">Third-Person View</Badge>}
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
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="bg-black/30 rounded-lg p-6 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>

                    <div className="flex items-center mb-3 relative z-10">
                      <Target className="w-5 h-5 mr-2 text-orange-400" />
                      <span className="text-sm text-gray-300">Extreme Challenge Question</span>
                      {interruptionActive && (
                        <Badge className="ml-auto bg-red-500 text-white animate-pulse">INTERRUPTION ACTIVE</Badge>
                      )}
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

                    <p className="text-lg leading-relaxed min-h-[3rem] relative z-10">{currentQuestionText}</p>
                  </div>

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
                      {!isAvatarSpeaking && (
                        <Button
                          onClick={handleNextQuestion}
                          className="bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                          {currentQuestion < questions.length - 1 ? "Survive & Continue" : "Complete Challenge"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Challenge Metrics Sidebar */}
            <div className="space-y-6">
              {/* Recovery Score */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-400" />
                    Recovery Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {Math.round(recoveryScore)}%
                    </div>
                    <Progress value={recoveryScore} className="h-3 mb-2 bg-white/20" />
                    <p className="text-sm text-gray-300">Handling pressure like a pro!</p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Challenges */}
              <Card className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Flame className="w-5 h-5 mr-2 text-red-400" />
                    Active Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-black/30 rounded-lg">
                    <p className="text-sm font-medium text-orange-400">🎯 Personality Clone Active</p>
                    <p className="text-xs text-gray-400">{currentPersonality.name} interview style</p>
                  </div>
                  {deepfakeMode && (
                    <div className="p-3 bg-black/30 rounded-lg">
                      <p className="text-sm font-medium text-blue-400">👤 Deepfake Mode Active</p>
                      <p className="text-xs text-gray-400">Third-person perspective enabled</p>
                    </div>
                  )}
                  {hostileMode && (
                    <div className="p-3 bg-black/30 rounded-lg">
                      <p className="text-sm font-medium text-red-400">😠 Hostile Mode Ready</p>
                      <p className="text-xs text-gray-400">Aggressive scenarios enabled</p>
                    </div>
                  )}
                  {multipleInterviewers && (
                    <div className="p-3 bg-black/30 rounded-lg">
                      <p className="text-sm font-medium text-purple-400">👥 Multiple Voices Ready</p>
                      <p className="text-xs text-gray-400">Overlapping conversations enabled</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Survival Tips */}
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-yellow-400" />
                    Survival Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-sm">🛡️ Stay calm during interruptions</p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-orange-400">
                      <p className="text-sm">⚡ Quick recovery = higher scores</p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-red-400">
                      <p className="text-sm">🔥 Hostile mode tests your resilience</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
