"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Clock } from "lucide-react"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InterviewHeaderProps {
    title: string
    currentQuestion: number
    totalQuestions: number
    sessionTime: number
    onEndInterview: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InterviewHeader({
    title,
    currentQuestion,
    totalQuestions,
    sessionTime,
    onEndInterview,
}: InterviewHeaderProps) {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="border-b border-white/10 bg-black/20 backdrop-blur-sm relative z-10"
        >
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Left – Branding + progress */}
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">{title}</h1>
                        <p className="text-sm text-gray-300">
                            Question {currentQuestion + 1} of {totalQuestions}
                        </p>
                    </div>
                </div>

                {/* Right – Timer + end button */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm text-white">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(sessionTime)}</span>
                    </div>
                    <Button
                        id="end-interview-btn"
                        variant="destructive"
                        size="sm"
                        onClick={onEndInterview}
                        className="hover:scale-105 transition-transform"
                    >
                        End Interview
                    </Button>
                </div>
            </div>
        </motion.header>
    )
}
