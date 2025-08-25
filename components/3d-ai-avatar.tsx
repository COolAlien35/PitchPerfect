"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles } from "lucide-react"

interface AvatarEmotion {
  happy: number
  sad: number
  angry: number
  surprised: number
  neutral: number
  disgusted: number
  fearful: number
}

interface AvatarReaction {
  type: "happy" | "annoyed" | "surprised" | "neutral" | "thinking" | "listening" | "speaking"
  intensity: number
  duration: number
}

interface AIAvatar3DProps {
  name: string
  role: string
  company: string
  personality: string
  isSpeaking: boolean
  isListening: boolean
  userEmotion?: AvatarEmotion
  userVolume?: number
  userSpeaking?: boolean
  onReactionChange?: (reaction: AvatarReaction) => void
}

export function AIAvatar3D({
  name,
  role,
  company,
  personality,
  isSpeaking,
  isListening,
  userEmotion,
  userVolume = 0,
  userSpeaking = false,
  onReactionChange,
}: AIAvatar3DProps) {
  const [currentReaction, setCurrentReaction] = useState<AvatarReaction>({
    type: "neutral",
    intensity: 0.5,
    duration: 0,
  })
  const [avatarMood, setAvatarMood] = useState("neutral")
  const [eyeBlink, setEyeBlink] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(false)
  const [headTilt, setHeadTilt] = useState(0)
  const [eyebrowRaise, setEyebrowRaise] = useState(0)
  const [headBob, setHeadBob] = useState(0)
  const [microExpressions, setMicroExpressions] = useState("neutral")

  // Simulate natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true)
      setTimeout(() => setEyeBlink(false), 150)
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(blinkInterval)
  }, [])

  // Mouth animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setMouthOpen((prev) => !prev)
      }, 200)
      return () => clearInterval(mouthInterval)
    } else {
      setMouthOpen(false)
    }
  }, [isSpeaking])

  // React to user behavior
  useEffect(() => {
    let newReaction: AvatarReaction = { ...currentReaction }

    if (userSpeaking) {
      if (userVolume > 80) {
        // User is speaking too loudly - show annoyance
        newReaction = {
          type: "annoyed",
          intensity: Math.min(userVolume / 100, 1),
          duration: 2000,
        }
        setAvatarMood("annoyed")
        setEyebrowRaise(0.8)
        setHeadTilt(-0.2)
        setHeadBob(0.1)
        setMicroExpressions("frown")
      } else if (userVolume > 60) {
        // User is speaking at good volume - show interest
        newReaction = {
          type: "listening",
          intensity: 0.7,
          duration: 1500,
        }
        setAvatarMood("interested")
        setEyebrowRaise(0.3)
        setHeadTilt(0.1)
        setHeadBob(0.05)
        setMicroExpressions("attentive")
      } else {
        // User is speaking softly - show encouragement
        newReaction = {
          type: "happy",
          intensity: 0.6,
          duration: 1000,
        }
        setAvatarMood("encouraging")
        setEyebrowRaise(0.2)
        setHeadTilt(0.05)
        setHeadBob(0.02)
        setMicroExpressions("smile")
      }
    } else if (userEmotion) {
      // React to user's facial expressions
      const { happy, sad, angry, surprised } = userEmotion

      if (happy > 0.6) {
        newReaction = {
          type: "happy",
          intensity: happy,
          duration: 1500,
        }
        setAvatarMood("happy")
        setEyebrowRaise(0.1)
        setHeadTilt(0.05)
        setHeadBob(0.03)
        setMicroExpressions("smile")
      } else if (sad > 0.6) {
        newReaction = {
          type: "thinking",
          intensity: 0.7,
          duration: 2000,
        }
        setAvatarMood("concerned")
        setEyebrowRaise(0.4)
        setHeadTilt(0.15)
        setHeadBob(0.01)
        setMicroExpressions("concerned")
      } else if (angry > 0.6) {
        newReaction = {
          type: "surprised",
          intensity: 0.8,
          duration: 1000,
        }
        setAvatarMood("surprised")
        setEyebrowRaise(0.9)
        setHeadTilt(0.2)
        setHeadBob(0.15)
        setMicroExpressions("shocked")
      } else if (surprised > 0.6) {
        newReaction = {
          type: "surprised",
          intensity: surprised,
          duration: 1200,
        }
        setAvatarMood("surprised")
        setEyebrowRaise(0.7)
        setHeadTilt(0.1)
        setHeadBob(0.08)
        setMicroExpressions("surprised")
      } else {
        // Default to neutral
        newReaction = {
          type: "neutral",
          intensity: 0.5,
          duration: 1000,
        }
        setAvatarMood("neutral")
        setEyebrowRaise(0)
        setHeadTilt(0)
        setHeadBob(0)
        setMicroExpressions("neutral")
      }
    } else if (isListening) {
      newReaction = {
        type: "listening",
        intensity: 0.6,
        duration: 1000,
      }
      setAvatarMood("attentive")
      setEyebrowRaise(0.2)
      setHeadTilt(0.05)
      setHeadBob(0.02)
      setMicroExpressions("attentive")
    } else {
      newReaction = {
        type: "neutral",
        intensity: 0.5,
        duration: 1000,
      }
      setAvatarMood("neutral")
      setEyebrowRaise(0)
      setHeadTilt(0)
      setHeadBob(0)
      setMicroExpressions("neutral")
    }

    setCurrentReaction(newReaction)
    onReactionChange?.(newReaction)
  }, [userSpeaking, userVolume, userEmotion, isListening, onReactionChange])

  const getMoodColor = () => {
    switch (avatarMood) {
      case "happy": return "text-green-400"
      case "annoyed": return "text-red-400"
      case "surprised": return "text-yellow-400"
      case "concerned": return "text-orange-400"
      case "attentive": return "text-blue-400"
      default: return "text-gray-400"
    }
  }

  const getMoodIcon = () => {
    switch (avatarMood) {
      case "happy": return "😊"
      case "annoyed": return "😤"
      case "surprised": return "😲"
      case "concerned": return "🤔"
      case "attentive": return "👂"
      default: return "😐"
    }
  }

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="relative inline-block">
            {/* 3D Avatar with CSS transforms */}
            <div className="relative w-48 h-48 mx-auto">
              <div
                className={`w-48 h-48 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-500 transform avatar-3d ${
                  isSpeaking
                    ? "ring-4 ring-green-400 ring-opacity-75 scale-105 shadow-2xl shadow-green-400/25 avatar-speaking"
                    : "hover:scale-105 shadow-lg"
                }`}
                style={{
                  transform: `rotate(${headTilt * 10}deg) translateY(${headBob * 10}px)`,
                  filter: `drop-shadow(0 0 20px ${
                    currentReaction.type === "happy" ? "rgba(34, 197, 94, 0.3)" :
                    currentReaction.type === "annoyed" ? "rgba(239, 68, 68, 0.3)" :
                    currentReaction.type === "surprised" ? "rgba(245, 158, 11, 0.3)" :
                    "rgba(59, 130, 246, 0.3)"
                  })`,
                  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
                }}
              >
                {/* Realistic 3D Face */}
                <div className="relative w-44 h-44">
                  {/* Head shape - more realistic proportions */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 rounded-full transform scale-90 shadow-inner"></div>
                  
                  {/* Professional hairstyle */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-full transform scale-80 -translate-y-3 shadow-lg"></div>
                  
                  {/* Hair details */}
                  <div className="absolute top-0 left-1/2 w-32 h-16 bg-gradient-to-b from-slate-800 to-slate-700 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
                  
                  {/* Realistic eyes with depth */}
                  <div className="absolute top-1/3 left-1/4 w-8 h-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-inner">
                    {/* Eye white */}
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                    {/* Iris */}
                    <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
                    {/* Pupil */}
                    <div className="absolute inset-3 bg-black rounded-full"></div>
                    {/* Eye shine */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80"></div>
                  </div>
                  
                  <div className="absolute top-1/3 right-1/4 w-8 h-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-inner">
                    {/* Eye white */}
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                    {/* Iris */}
                    <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
                    {/* Pupil */}
                    <div className="absolute inset-3 bg-black rounded-full"></div>
                    {/* Eye shine */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80"></div>
                  </div>
                  
                  {/* Realistic eyebrows */}
                  <div className="absolute top-1/4 left-1/4 w-10 h-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                       style={{ transform: `translate(-50%, -50%) rotate(${eyebrowRaise * 15}deg)` }}></div>
                  <div className="absolute top-1/4 right-1/4 w-10 h-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                       style={{ transform: `translate(50%, -50%) rotate(${-eyebrowRaise * 15}deg)` }}></div>
                  
                  {/* Realistic nose */}
                  <div className="absolute top-1/2 left-1/2 w-3 h-6 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md"></div>
                  
                  {/* Realistic mouth */}
                  <div className="absolute bottom-1/4 left-1/2 w-14 h-8 transform -translate-x-1/2 translate-y-1/2">
                    {mouthOpen ? (
                      <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-inner"></div>
                    ) : (
                      <div className={`w-full h-3 bg-gradient-to-r from-rose-300 to-rose-400 rounded-full transform shadow-sm ${
                        microExpressions === "smile" ? "scale-y-120 scale-x-110" : 
                        microExpressions === "frown" ? "scale-y-80 scale-x-90" : 
                        microExpressions === "shocked" ? "scale-y-150 scale-x-130" :
                        microExpressions === "surprised" ? "scale-y-130 scale-x-120" :
                        "scale-y-100"
                      }`}></div>
                    )}
                  </div>
                  
                  {/* Cheek highlights */}
                  <div className="absolute top-1/2 left-1/6 w-4 h-2 bg-gradient-to-r from-pink-200 to-transparent rounded-full opacity-60"></div>
                  <div className="absolute top-1/2 right-1/6 w-4 h-2 bg-gradient-to-l from-pink-200 to-transparent rounded-full opacity-60"></div>
                  
                  {/* Professional makeup/features */}
                  <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-40"></div>
                </div>

                {/* Speaking animation overlay */}
                {isSpeaking && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse rounded-lg"></div>
                )}
              </div>

              {/* Professional mood indicator */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-3 border border-gray-200 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700">
                    {avatarMood.charAt(0).toUpperCase() + avatarMood.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {microExpressions !== "neutral" && microExpressions}
                  </span>
                </div>
              </div>

              {/* Reaction intensity indicator */}
              {currentReaction.intensity > 0.7 && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    {[...Array(Math.floor(currentReaction.intensity * 5))].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${
                          currentReaction.type === "happy" ? "bg-green-400" :
                          currentReaction.type === "annoyed" ? "bg-red-400" :
                          currentReaction.type === "surprised" ? "bg-yellow-400" :
                          "bg-blue-400"
                        }`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-gray-300">{role}</p>
              <p className="text-sm text-gray-400">{company}</p>
              <Badge variant="secondary" className="mt-2 bg-white/20 hover:bg-white/30 transition-colors">
                {personality}
              </Badge>
            </div>

            <div className="flex items-center justify-center space-x-3 mt-4">
              {isSpeaking ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Speaking</span>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-3 bg-green-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      ></div>
                    ))}
                  </div>
                </>
              ) : isListening ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Listening</span>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-3 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      ></div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-500 font-medium">Ready</span>
                </>
              )}
            </div>

            {/* Professional reaction display */}
            <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Reaction Analysis</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  currentReaction.type === "happy" ? "bg-green-100 text-green-700" :
                  currentReaction.type === "annoyed" ? "bg-red-100 text-red-700" :
                  currentReaction.type === "surprised" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {currentReaction.type.charAt(0).toUpperCase() + currentReaction.type.slice(1)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Engagement Level</span>
                  <span className="font-medium">{Math.round(currentReaction.intensity * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentReaction.type === "happy" ? "bg-green-500" :
                      currentReaction.type === "annoyed" ? "bg-red-500" :
                      currentReaction.type === "surprised" ? "bg-yellow-500" :
                      "bg-blue-500"
                    }`}
                    style={{ width: `${currentReaction.intensity * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
