"use client"

import { Button } from "@/components/ui/button"
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Volume2,
    VolumeX,
    Play,
} from "lucide-react"
import { motion } from "framer-motion"
import type { InterviewPhase } from "./useInterviewMachine"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ControlBarProps {
    phase: InterviewPhase
    isAudioOn: boolean
    isVideoOn: boolean
    isSpeakerOn: boolean
    isAvatarSpeaking: boolean
    currentQuestion: number
    totalQuestions: number
    onToggleAudio: () => void
    onToggleVideo: () => void
    onToggleSpeaker: () => void
    onStartInterview: () => void
    onNextQuestion: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ControlBar({
    phase,
    isAudioOn,
    isVideoOn,
    isSpeakerOn,
    isAvatarSpeaking,
    currentQuestion,
    totalQuestions,
    onToggleAudio,
    onToggleVideo,
    onToggleSpeaker,
    onStartInterview,
    onNextQuestion,
}: ControlBarProps) {
    const isRecording = phase === "recording"
    const isLastQuestion = currentQuestion >= totalQuestions - 1

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
        >
            {/* Media toggles */}
            <div className="flex items-center space-x-4">
                <Button
                    id="toggle-video-btn"
                    variant={isVideoOn ? "default" : "secondary"}
                    size="sm"
                    onClick={onToggleVideo}
                    className="hover:scale-110 transition-transform"
                    aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                    {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                <Button
                    id="toggle-audio-btn"
                    variant={isAudioOn ? "default" : "secondary"}
                    size="sm"
                    onClick={onToggleAudio}
                    className="hover:scale-110 transition-transform"
                    aria-label={isAudioOn ? "Mute microphone" : "Unmute microphone"}
                >
                    {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                <Button
                    id="toggle-speaker-btn"
                    variant={isSpeakerOn ? "default" : "secondary"}
                    size="sm"
                    onClick={onToggleSpeaker}
                    className="hover:scale-110 transition-transform"
                    aria-label={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
                >
                    {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
            </div>

            {/* Primary action */}
            <div className="flex items-center space-x-3">
                {phase === "idle" || phase === "setup" ? (
                    <Button
                        id="start-interview-btn"
                        onClick={onStartInterview}
                        className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Start Interview
                    </Button>
                ) : (
                    isRecording &&
                    !isAvatarSpeaking && (
                        <Button
                            id="next-question-btn"
                            onClick={onNextQuestion}
                            className="hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                            {isLastQuestion ? "Finish Interview" : "Next Question"}
                        </Button>
                    )
                )}
            </div>
        </motion.div>
    )
}
