"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Clock, Star, Shield } from "lucide-react"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface OverallScoreCardProps {
    overallScore: number
    sessionTime: number
    totalQuestions: number
    interviewType: string
    recoveryScore?: number
    topStrength: { name: string; score: number }
    personality?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

function getScoreColor(score: number): string {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-blue-600"
    if (score >= 4) return "text-yellow-600"
    return "text-red-600"
}

function getScoreLabel(score: number): string {
    if (score >= 9) return "Outstanding"
    if (score >= 8) return "Excellent"
    if (score >= 7) return "Strong Performance"
    if (score >= 6) return "Good with Room to Grow"
    return "Needs Improvement"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OverallScoreCard({
    overallScore,
    sessionTime,
    totalQuestions,
    interviewType,
    recoveryScore,
    topStrength,
    personality,
}: OverallScoreCardProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            {/* Hero score banner */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6"
                >
                    <Trophy className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold mb-4">
                    🎯{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Interview Analysis Complete!
                    </span>
                </h1>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-6xl font-bold mb-4 ${getScoreColor(overallScore)}`}
                >
                    {overallScore}/10
                </motion.div>
                <p className="text-xl text-gray-600 mb-2">{getScoreLabel(overallScore)}</p>
                <p className="text-gray-500">
                    {interviewType} • {formatTime(sessionTime)} •{" "}
                    {new Date().toLocaleDateString()}
                </p>
                {personality && (
                    <Badge className="mt-2 bg-purple-100 text-purple-800">
                        AI Personality: {personality}
                    </Badge>
                )}
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Overall Score */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Target className="w-5 h-5 mr-2 text-blue-600" />
                            Overall Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2 text-blue-600">
                                {overallScore}
                            </div>
                            <Progress value={overallScore * 10} className="h-3 mb-2" />
                            <p className="text-sm text-gray-600">{getScoreLabel(overallScore)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Session Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-green-600" />
                            Session Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium">{formatTime(sessionTime)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Questions</span>
                            <span className="font-medium">{totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Type</span>
                            <Badge variant="secondary">{interviewType}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Strength */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-600" />
                            Top Strength
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-2xl mb-2">📚</div>
                            <p className="font-medium mb-2">{topStrength.name}</p>
                            <div className="text-2xl font-bold text-green-600 mb-2">
                                {topStrength.score}/100
                            </div>
                            <p className="text-sm text-gray-600">Excellent performance</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recovery Score */}
                {recoveryScore !== undefined && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                                Recovery Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className="text-2xl mb-2">🛡️</div>
                                <p className="font-medium mb-2">Pressure Handling</p>
                                <div className="text-2xl font-bold text-purple-600 mb-2">
                                    {recoveryScore}%
                                </div>
                                <p className="text-sm text-gray-600">
                                    {recoveryScore >= 80 ? "Excellent resilience" : "Room to improve"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </motion.div>
    )
}
