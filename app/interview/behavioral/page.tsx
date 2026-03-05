"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
import RealTimeAnalysis from "@/components/real-time-analysis";
import VoiceAnalysis from "@/components/voice-analysis";
import { AIAvatar3D } from "@/components/3d-ai-avatar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

// Fallback questions kept outside render to avoid new references every render
const FALLBACK_BEHAVIORAL_QUESTIONS = [
  "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
  "Describe a situation where you had to meet a tight deadline. What was your approach?",
  "Can you give me an example of a time when you had to adapt to a significant change at work?",
  "Tell me about a project you're particularly proud of. What made it successful?",
  "Describe a time when you had to give constructive feedback to a colleague.",
]

export default function BehavioralInterviewPage() {
  const { userProfile } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(75)
  const [emotionData, setEmotionData] = useState(null);
  const [voiceData, setVoiceData] = useState<any>(null);
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
  const [avatarReaction, setAvatarReaction] = useState<any>(null)

  // New state variables for tracking interview data
  const [userResponses, setUserResponses] = useState<string[]>([])
  const [questionStartTimes, setQuestionStartTimes] = useState<number[]>([])
  const [voiceAnalysisHistory, setVoiceAnalysisHistory] = useState<any[]>([])
  const [emotionHistory, setEmotionHistory] = useState<any[]>([])
  const [interruptionsHandled, setInterruptionsHandled] = useState(0)
  const [recoveryScore, setRecoveryScore] = useState(85)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const router = useRouter()

  // Check if this is a technical interview
  const [isTechnicalInterview, setIsTechnicalInterview] = useState(false)
  const [technicalInterviewData, setTechnicalInterviewData] = useState<any>(null)

  // Server-generated behavioral questions
  const [behavioralQuestions, setBehavioralQuestions] = useState<string[] | null>(null)
  const hasFetchedQuestionsRef = useRef(false)

  // Fetch dynamic questions from the server (Gemini)
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const payload: any = {
          industry: userProfile?.industry,
          role: userProfile?.targetRole,
          experienceLevel: userProfile?.experience,
          skills: userProfile?.skills || [],
        }

        const res = await fetch('/api/generate-behavioral-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) throw new Error('Failed to fetch behavioral questions')
        const data = await res.json()
        if (Array.isArray(data?.questions) && data.questions.length > 0) {
          setBehavioralQuestions(data.questions)
        }
      } catch (err) {
        console.warn('Using fallback behavioral questions due to error:', err)
        setBehavioralQuestions([...FALLBACK_BEHAVIORAL_QUESTIONS].sort(() => Math.random() - 0.5))
      }
    }

    // Only fetch for behavioral mode
    if (!isTechnicalInterview && !hasFetchedQuestionsRef.current) {
      hasFetchedQuestionsRef.current = true
      fetchQuestions()
    }
  }, [isTechnicalInterview, userProfile?.industry, userProfile?.targetRole, userProfile?.experience])

  // Get questions based on interview type
  const questions = useMemo(() => {
    if (isTechnicalInterview && technicalInterviewData?.questions) {
      return technicalInterviewData.questions as string[]
    }
    return behavioralQuestions || FALLBACK_BEHAVIORAL_QUESTIONS
  }, [isTechnicalInterview, technicalInterviewData?.questions, behavioralQuestions])

  const getInterviewerPersonality = () => {
    if (isTechnicalInterview) {
      return {
        name: "Alex Rodriguez",
        role: "Senior Technical Hiring Manager",
        company: "TechCorp",
        personality: "Technical & Analytical",
        avatar: "/placeholder.svg?height=200&width=200",
      }
    }
    return {
      name: "Sarah Chen",
      role: "Senior Hiring Manager",
      company: "TechCorp",
      personality: "Professional & Analytical",
      avatar: "/placeholder.svg?height=200&width=200",
    }
  }

  const interviewerPersonality = getInterviewerPersonality()

  const handleAnalysis = useCallback((data: any) => {
    if (data.emotion) {
      const { happy, neutral } = data.emotion;
      const total = Object.values(data.emotion).reduce((acc: any, val: any) => acc + (val as number), 0) as number;
      const confidence = ((happy + neutral) / total) * 100;
      setConfidenceScore(confidence);
      setEmotionData(data.emotion);

      // Store emotion history for analysis
      setEmotionHistory(prev => [...prev, { ...data.emotion, timestamp: Date.now() }]);
    }
  }, []);

  const handleVoiceAnalysis = useCallback((data: any) => {
    setVoiceData(data);

    // Store voice analysis history for analysis
    setVoiceAnalysisHistory(prev => [...prev, { ...data, timestamp: Date.now() }]);
  }, []);

  const handleAvatarReaction = useCallback((reaction: any) => {
    setAvatarReaction(reaction);

    // Track interruptions based on avatar reactions
    if (reaction.type === 'interruption') {
      setInterruptionsHandled(prev => prev + 1);
    }
  }, []);

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

          // Store the response for the current question
          if (isInterviewStarted && currentQuestion < questions.length) {
            setUserResponses(prev => {
              const newResponses = [...prev]
              newResponses[currentQuestion] = transcript
              return newResponses
            })
          }
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
  }, [isInterviewStarted, currentQuestion, questions.length])

  // Check for technical interview data on component mount
  useEffect(() => {
    const checkTechnicalInterview = () => {
      // Check URL parameters for technical mode
      const urlParams = new URLSearchParams(window.location.search)
      const isTechnicalMode = urlParams.get('mode') === 'technical'

      if (isTechnicalMode) {
        const technicalData = localStorage.getItem('technicalInterviewData')
        if (technicalData) {
          try {
            const parsedData = JSON.parse(technicalData)
            setTechnicalInterviewData(parsedData)
            setIsTechnicalInterview(true)
          } catch (error) {
            console.error('Error parsing technical interview data:', error)
          }
        }
      }
    }

    checkTechnicalInterview()
  }, [])

  // Monitor audio levels for visual feedback (throttled to avoid render storms)
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    let lastUpdateTime = 0

    const checkAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        // Throttle state updates to every 100ms to prevent render storms
        const now = Date.now()
        if (now - lastUpdateTime > 100) {
          lastUpdateTime = now
          setAudioLevel(average)

          // Detect if user is speaking based on audio level
          if (average > 20 && !isAvatarSpeaking) {
            setIsUserSpeaking(true)
          } else if (average < 10) {
            setIsUserSpeaking(false)
          }
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

    // Use a more efficient typing effect with requestAnimationFrame
    const animateTyping = () => {
      let i = 0
      const animate = () => {
        if (i <= questionText.length) {
          setCurrentQuestionText(questionText.slice(0, i))
          i++
          setTimeout(animate, 30)
        } else {
          // Start speaking after typing animation completes
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
      }
      animate()
    }

    animateTyping()
  }

  const startInterview = () => {
    setIsInterviewStarted(true)
    setSessionStartTime(Date.now())
    setQuestionStartTimes([Date.now()])
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
      setQuestionStartTimes(prev => [...prev, Date.now()])
      setTimeout(() => {
        speakQuestion(questions[nextQuestion])
      }, 1500)
    } else {
      // Store session data for analysis
      const sessionData = {
        type: isTechnicalInterview ? "Technical Interview" : "Behavioral Interview",
        personality: interviewerPersonality.name,
        questions,
        ideal_answers: isTechnicalInterview && technicalInterviewData?.ideal_answers ? technicalInterviewData.ideal_answers : [],
        responses: userResponses,
        recoveryScore,
        sessionTime,
        interruptionsHandled,
        deepfakeMode: false,
        hostileMode: false,
        voiceAnalysisHistory,
        emotionHistory,
        questionStartTimes,
        sessionStartTime,
        confidenceScore,
        audioLevel,
        avatarReaction,
        technicalInterviewData: isTechnicalInterview ? technicalInterviewData : null
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

    // Store session data for analysis even if ending early
    const sessionData = {
      type: isTechnicalInterview ? "Technical Interview" : "Behavioral Interview",
      personality: interviewerPersonality.name,
      questions,
      ideal_answers: isTechnicalInterview && technicalInterviewData?.ideal_answers ? technicalInterviewData.ideal_answers : [],
      responses: userResponses,
      recoveryScore,
      sessionTime,
      interruptionsHandled,
      deepfakeMode: false,
      hostileMode: false,
      voiceAnalysisHistory,
      emotionHistory,
      questionStartTimes,
      sessionStartTime,
      confidenceScore,
      audioLevel,
      avatarReaction,
      technicalInterviewData: isTechnicalInterview ? technicalInterviewData : null
    }
    localStorage.setItem("lastInterviewSession", JSON.stringify(sessionData))
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
              <AIAvatar3D
                name={interviewerPersonality.name}
                role={interviewerPersonality.role}
                company={interviewerPersonality.company}
                personality={interviewerPersonality.personality}
                isSpeaking={isAvatarSpeaking}
                isListening={isListeningForSpeech}
                userEmotion={emotionData || undefined}
                userVolume={audioLevel}
                userSpeaking={isUserSpeaking}
                onReactionChange={handleAvatarReaction}
              />

              {/* User Video */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
                <CardContent className="p-6">
                  <RealTimeAnalysis onAnalysis={handleAnalysis} />
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
                  Live Facial Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emotionData && Object.entries(emotionData).map(([emotion, value]) => (
                  <div key={emotion} className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center">
                      <span className="text-sm">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                    </div>
                    <span className="font-bold text-purple-400">{`${Number(value).toFixed(2)}%`}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Live Voice Analysis */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-blue-400" />
                  Live Voice Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VoiceAnalysis onAnalysis={handleVoiceAnalysis} isInterviewStarted={isInterviewStarted} />
                {voiceData && (
                  <>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-sm">Filler Words</span>
                      <span className="font-bold text-purple-400">{voiceData.fillerWords}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-sm">WPM</span>
                      <span className="font-bold text-purple-400">{voiceData.wpm}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-sm">Volume</span>
                      <span className="font-bold text-purple-400">{voiceData.volume}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-sm">Confidence</span>
                      <span className="font-bold text-purple-400">{voiceData.confidence}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-sm">Clarity</span>
                      <span className="font-bold text-purple-400">{voiceData.clarity}</span>
                    </div>
                  </>
                )}
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
                  {avatarReaction && avatarReaction.type === "annoyed" && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-red-400 animate-pulse">
                      <p className="text-sm">🔇 Try speaking a bit softer - the interviewer seems bothered by the volume</p>
                    </div>
                  )}
                  {avatarReaction && avatarReaction.type === "happy" && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-green-400 animate-pulse">
                      <p className="text-sm">😊 Excellent! The interviewer is responding positively to your answer</p>
                    </div>
                  )}
                  {avatarReaction && avatarReaction.type === "surprised" && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-yellow-400 animate-pulse">
                      <p className="text-sm">😲 Wow! Your answer really caught their attention - great job!</p>
                    </div>
                  )}
                  {avatarReaction && avatarReaction.type === "thinking" && (
                    <div className="p-3 bg-black/30 rounded-lg border-l-4 border-orange-400 animate-pulse">
                      <p className="text-sm">🤔 The interviewer is processing your response - this is a good sign!</p>
                    </div>
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
