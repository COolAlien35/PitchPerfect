"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AIAvatar3D } from "@/components/3d-ai-avatar"
import RealTimeAnalysis from "@/components/real-time-analysis"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InterviewerPersonality {
    name: string
    role: string
    company: string
    personality: string
    avatar?: string
}

export interface MediaContainerProps {
    interviewer: InterviewerPersonality
    isAvatarSpeaking: boolean
    isListeningForSpeech: boolean
    isUserSpeaking: boolean
    emotionData: Record<string, number> | null
    audioLevel: number
    onAnalysis: (data: any) => void
    onAvatarReaction: (reaction: any) => void
    userStream: MediaStream | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MediaContainer({
    interviewer,
    isAvatarSpeaking,
    isListeningForSpeech,
    isUserSpeaking,
    emotionData,
    audioLevel,
    onAnalysis,
    onAvatarReaction,
    userStream,
}: MediaContainerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && userStream) {
            videoRef.current.srcObject = userStream
        }
    }, [userStream])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Interviewer – 3D Avatar */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <AIAvatar3D
                    name={interviewer.name}
                    role={interviewer.role}
                    company={interviewer.company}
                    personality={interviewer.personality}
                    isSpeaking={isAvatarSpeaking}
                    isListening={isListeningForSpeech}
                    userEmotion={emotionData || undefined}
                    userVolume={audioLevel}
                    userSpeaking={isUserSpeaking}
                    onReactionChange={onAvatarReaction}
                />
            </motion.div>

            {/* User Video + Real-time facial analysis */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-6">
                        <RealTimeAnalysis onAnalysis={onAnalysis} />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
