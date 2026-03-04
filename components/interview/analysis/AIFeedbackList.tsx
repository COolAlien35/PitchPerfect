"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle,
    AlertCircle,
    Lightbulb,
    MessageSquare,
} from "lucide-react"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface QAFeedback {
    question: string
    userAnswer: string
    correctAnswer: string
    aiAnalysis: string
    improvementAreas: string[]
    score: number
}

export interface AIFeedbackListProps {
    items: QAFeedback[]
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------
function ScoreBadge({ score }: { score: number }) {
    if (score >= 8)
        return (
            <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {score}/10
            </Badge>
        )
    if (score >= 6)
        return (
            <Badge className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                {score}/10
            </Badge>
        )
    return (
        <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {score}/10
        </Badge>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AIFeedbackList({ items }: AIFeedbackListProps) {
    if (!items.length) return null

    return (
        <div className="space-y-6">
            {items.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.08 }}
                >
                    <Card className="overflow-hidden">
                        {/* Question header */}
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        Question {idx + 1}
                                    </CardTitle>
                                    <p className="text-sm text-gray-700 mt-1">{item.question}</p>
                                </div>
                                <ScoreBadge score={item.score} />
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            {/* Your answer */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                                    Your Answer
                                </h4>
                                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400">
                                    {item.userAnswer || (
                                        <span className="italic text-gray-400">
                                            No response detected
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* AI analysis */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                                    AI Analysis
                                </h4>
                                <p className="text-sm text-gray-800">{item.aiAnalysis}</p>
                            </div>

                            {/* Ideal answer */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                                    Ideal Approach
                                </h4>
                                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                                    {item.correctAnswer}
                                </p>
                            </div>

                            {/* Improvement areas */}
                            {item.improvementAreas.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-1 mb-2">
                                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                                        Improvement Areas
                                    </h4>
                                    <ul className="space-y-1">
                                        {item.improvementAreas.map((area, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-gray-700 flex items-start gap-2"
                                            >
                                                <span className="text-blue-500 mt-1">•</span>
                                                {area}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
