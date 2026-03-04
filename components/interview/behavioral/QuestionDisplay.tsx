"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface QuestionDisplayProps {
    currentQuestionText: string
    currentQuestion: number
    totalQuestions: number
    isAvatarSpeaking: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function QuestionDisplay({
    currentQuestionText,
    currentQuestion,
    totalQuestions,
    isAvatarSpeaking,
}: QuestionDisplayProps) {
    const progress = ((currentQuestion + 1) / totalQuestions) * 100

    return (
        <div className="space-y-4">
            {/* Question text card */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                    <div className="bg-black/30 rounded-lg p-6 relative overflow-hidden">
                        {/* Animated background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse" />

                        <div className="flex items-center mb-3 relative z-10">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                            <span className="text-sm text-gray-300">Current Question</span>

                            <AnimatePresence>
                                {isAvatarSpeaking && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="ml-auto flex items-center space-x-2"
                                    >
                                        <div className="flex space-x-1">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: `${i * 0.2}s` }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-green-400">AI Speaking</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <p className="text-lg leading-relaxed min-h-[3rem] relative z-10 text-white">
                            {currentQuestionText}
                            {isAvatarSpeaking && (
                                <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse" />
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Progress bar */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex justify-between text-sm mb-2 text-white">
                        <span>Interview Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-white/20" />
                </CardContent>
            </Card>
        </div>
    )
}
