"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Download, Share2, Home, RotateCcw } from "lucide-react"
import Link from "next/link"

// Modular sub-components
import {
    OverallScoreCard,
    SkillsRadar,
    AIFeedbackList,
    ImprovementTimeline,
} from "@/components/interview/analysis"
import type {
    QAFeedback,
    SkillDataPoint,
    PerformanceDataPoint,
    TrendPoint,
    ImprovementItem,
} from "@/components/interview/analysis"
import { AnalysisDashboardSkeleton } from "@/components/shared/loading-skeletons"

// TanStack Query hook (architected in previous step)
import { useInterview } from "@/frontend/hooks/use-interviews"

// ---------------------------------------------------------------------------
// Score calculation helpers (extracted from the monolith)
// ---------------------------------------------------------------------------
function calculateScores(data: any) {
    if (!data) return null

    const scores: Record<string, number> = {
        communication: 75,
        confidence: 70,
        clarity: 75,
        engagement: 70,
        storytelling: 75,
        professionalism: 75,
        technicalKnowledge: 70,
        problemSolving: 75,
        leadership: 70,
        adaptability: 75,
    }

    if (data.voiceAnalysisHistory?.length) {
        const vd = data.voiceAnalysisHistory
        const avgWPM = vd.reduce((s: number, i: any) => s + (i.wpm || 0), 0) / vd.length
        const avgVol = vd.reduce((s: number, i: any) => s + (i.volume || 0), 0) / vd.length
        const fillers = vd.reduce((s: number, i: any) => s + (i.fillerWords || 0), 0)

        if (avgWPM >= 140 && avgWPM <= 160) scores.communication += 10
        else if (avgWPM < 120 || avgWPM > 180) scores.communication -= 5

        if (avgVol >= 60) scores.confidence += 8
        else if (avgVol < 30) scores.confidence -= 10

        if (fillers < 5) scores.clarity += 10
        else if (fillers > 10) scores.clarity -= 8

        const highConfRatio = vd.filter((i: any) => i.confidence === "High").length / vd.length
        scores.confidence += Math.round(highConfRatio * 15)
    }

    if (data.emotionHistory?.length) {
        const ed = data.emotionHistory
        const avgHappy = ed.reduce((s: number, i: any) => s + (i.happy || 0), 0) / ed.length
        const avgNeutral = ed.reduce((s: number, i: any) => s + (i.neutral || 0), 0) / ed.length
        if (avgHappy > 0.3) scores.engagement += 10
        if (avgNeutral > 0.4) scores.professionalism += 8
    }

    if (data.responses?.length) {
        const responses = data.responses.filter((r: string) => r?.length > 0)
        responses.forEach((r: string) => {
            const wc = r.split(" ").length
            const hasStar = /situation|task|action|result/i.test(r)
            if (wc >= 50 && wc <= 200) scores.storytelling += 5
            if (hasStar) scores.storytelling += 10
            if (wc >= 30) scores.communication += 3
            if (/led|managed|coordinated/.test(r)) scores.leadership += 5
            if (/problem|solve|challenge/.test(r)) scores.problemSolving += 5
        })
    }

    if (data.sessionTime) {
        const tpq = data.sessionTime / (data.questions?.length || 1)
        if (tpq >= 120 && tpq <= 300) scores.engagement += 5
    }

    if (data.interruptionsHandled) {
        if (data.interruptionsHandled <= 2) scores.adaptability += 10
        else if (data.interruptionsHandled > 5) scores.adaptability -= 5
    }

    Object.keys(scores).forEach((k) => {
        scores[k] = Math.min(100, Math.max(0, scores[k]))
    })

    return scores
}

function overallFromScores(scores: Record<string, number> | null): number {
    if (!scores) return 8.2
    const vals = Object.values(scores)
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 10) * 10) / 10
}

function generateAIAnalysis(question: string, answer: string) {
    if (!answer || answer.length < 10) {
        return {
            score: 5.0,
            analysis: "No response detected. Please ensure your microphone is working and try speaking clearly.",
            improvements: ["Speak clearly", "Ensure mic connected", "Provide detailed responses"],
        }
    }
    const wc = answer.split(" ").length
    const hasStar = /situation|task|action|result/i.test(answer)
    const hasMetrics = /\d+%|\d+ percent|\$\d+|\d+ people|\d+ team/.test(answer)
    let score = 6.0
    let analysis = ""
    const improvements: string[] = []

    if (wc >= 50 && wc <= 200) score += 1.5
    else if (wc < 30) { score -= 1; improvements.push("Provide more detailed responses") }

    if (hasStar) { score += 1.5; analysis += "Good use of STAR method. " }
    else { score -= 1; improvements.push("Use STAR method") }

    if (hasMetrics) { score += 1; analysis += "Excellent use of metrics. " }
    else { score -= 0.5; improvements.push("Include specific numbers") }

    score = Math.min(10, Math.max(0, score))
    if (!analysis) analysis = "Solid structure – add more specific details and metrics."
    return { score: Math.round(score * 10) / 10, analysis, improvements }
}

// ---------------------------------------------------------------------------
// Static improvement plan (unchanged from the monolith – kept as data)
// ---------------------------------------------------------------------------
const IMPROVEMENT_IMMEDIATE: ImprovementItem[] = [
    {
        skill: "STAR Method Mastery",
        description: "Perfect your storytelling structure",
        resources: [
            { type: "video", title: "STAR Method Explained", platform: "YouTube" },
            { type: "article", title: "STAR Method Guide", platform: "Harvard Business Review" },
        ],
        timeToImprove: "1-2 weeks",
        priority: "High",
    },
    {
        skill: "Quantifying Achievements",
        description: "Learn to add metrics and numbers to your stories",
        resources: [
            { type: "video", title: "How to Quantify Your Impact", platform: "YouTube" },
            { type: "article", title: "Metrics That Matter", platform: "LinkedIn Learning" },
        ],
        timeToImprove: "1 week",
        priority: "High",
    },
]

const IMPROVEMENT_SHORT: ImprovementItem[] = [
    {
        skill: "Leadership Communication",
        description: "Improve how you articulate leadership decisions",
        resources: [
            { type: "course", title: "Leadership Communication", platform: "Coursera" },
            { type: "book", title: "Crucial Conversations", author: "Kerry Patterson", platform: "Amazon" },
        ],
        timeToImprove: "2-4 weeks",
        priority: "Medium",
    },
]

const IMPROVEMENT_LONG: ImprovementItem[] = [
    {
        skill: "Executive Presence",
        description: "Develop senior-level communication skills",
        resources: [
            { type: "book", title: "Executive Presence", author: "Sylvia Ann Hewlett", platform: "Amazon" },
            { type: "course", title: "Executive Communication", platform: "LinkedIn Learning" },
        ],
        timeToImprove: "2-3 months",
        priority: "Low",
    },
]

const TREND_DATA: TrendPoint[] = [
    { session: "Session 1", score: 6.5 },
    { session: "Session 2", score: 7.2 },
    { session: "Session 3", score: 7.8 },
    { session: "Session 4", score: 8.2 },
    { session: "Current", score: 8.2 },
]

// ---------------------------------------------------------------------------
// Page component – thin entry point
// ---------------------------------------------------------------------------
export default function AnalysisPage() {
    const params = useParams()
    const interviewId = (params?.id as string) ?? ""

    // Fetch from TanStack Query if id is available
    const { data: interviewDetail, isLoading } = useInterview(interviewId)

    // Also support legacy localStorage fallback
    const sessionData = useMemo(() => {
        if (interviewDetail) {
            // Map API data into the shape the scoring functions expect
            const session = interviewDetail.sessions?.[0]
            return {
                type: interviewDetail.title || "Interview",
                questions: session?.qa_records?.map((q) => q.question) ?? [],
                responses: session?.qa_records?.map((q) => q.transcript) ?? [],
                sessionTime: 0,
                voiceAnalysisHistory: session?.qa_records?.map((q) => q.audio_metrics) ?? [],
                emotionHistory: session?.qa_records?.map((q) => q.video_metrics) ?? [],
                recoveryScore: undefined,
                interruptionsHandled: 0,
                personality: undefined,
            }
        }

        // Fallback: read from localStorage (legacy path)
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("lastInterviewSession")
            if (stored) return JSON.parse(stored)
        }
        return null
    }, [interviewDetail])

    const scores = useMemo(() => calculateScores(sessionData), [sessionData])
    const overall = useMemo(() => overallFromScores(scores), [scores])

    // Derived chart data
    const skillsData: SkillDataPoint[] = useMemo(
        () =>
            scores
                ? [
                    { skill: "Communication", score: scores.communication, fullMark: 100 },
                    { skill: "Leadership", score: scores.leadership, fullMark: 100 },
                    { skill: "Problem Solving", score: scores.problemSolving, fullMark: 100 },
                    { skill: "Technical", score: scores.technicalKnowledge, fullMark: 100 },
                    { skill: "Adaptability", score: scores.adaptability, fullMark: 100 },
                    { skill: "Storytelling", score: scores.storytelling, fullMark: 100 },
                ]
                : [],
        [scores]
    )

    const performanceData: PerformanceDataPoint[] = useMemo(
        () =>
            sessionData?.questions?.map((q: string, i: number) => {
                const a = generateAIAnalysis(q, sessionData.responses?.[i] || "")
                return { question: `Q${i + 1}`, score: a.score, ideal: 9.0 }
            }) ?? [],
        [sessionData]
    )

    const qaFeedback: QAFeedback[] = useMemo(
        () =>
            sessionData?.questions?.map((q: string, i: number) => {
                const answer = sessionData.responses?.[i] || ""
                const a = generateAIAnalysis(q, answer)
                return {
                    question: q,
                    userAnswer: answer,
                    correctAnswer: "Use the STAR method with specific examples and quantifiable results.",
                    aiAnalysis: a.analysis,
                    improvementAreas: a.improvements,
                    score: a.score,
                }
            }) ?? [],
        [sessionData]
    )

    const topStrength = useMemo(() => {
        if (!scores) return { name: "Storytelling", score: 91 }
        const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
        return {
            name: best[0].replace(/([A-Z])/g, " $1").trim(),
            score: best[1],
        }
    }, [scores])

    // Loading state → shimmer skeleton
    if (isLoading || !sessionData) {
        return <AnalysisDashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            PitchPerfect
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" size="sm" id="export-report-btn">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                        <Button variant="outline" size="sm" id="share-results-btn">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Results
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="feedback">AI Mentor</TabsTrigger>
                        <TabsTrigger value="improvement">Improvement Plan</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    {/* ---- Overview ---- */}
                    <TabsContent value="overview" className="space-y-6">
                        <OverallScoreCard
                            overallScore={overall}
                            sessionTime={sessionData.sessionTime}
                            totalQuestions={sessionData.questions?.length ?? 0}
                            interviewType={sessionData.type}
                            recoveryScore={sessionData.recoveryScore}
                            topStrength={topStrength}
                            personality={sessionData.personality}
                        />
                        <SkillsRadar
                            skillsData={skillsData}
                            performanceData={performanceData}
                        />
                    </TabsContent>

                    {/* ---- AI Feedback ---- */}
                    <TabsContent value="feedback">
                        <AIFeedbackList items={qaFeedback} />
                    </TabsContent>

                    {/* ---- Improvement ---- */}
                    <TabsContent value="improvement">
                        <ImprovementTimeline
                            trendData={TREND_DATA}
                            immediate={IMPROVEMENT_IMMEDIATE}
                            shortTerm={IMPROVEMENT_SHORT}
                            longTerm={IMPROVEMENT_LONG}
                        />
                    </TabsContent>

                    {/* ---- Analytics (charts reused) ---- */}
                    <TabsContent value="analytics" className="space-y-6">
                        <SkillsRadar
                            skillsData={skillsData}
                            performanceData={performanceData}
                        />
                    </TabsContent>
                </Tabs>

                {/* Footer actions */}
                <div className="flex items-center justify-center space-x-4 mt-12">
                    <Link href="/dashboard">
                        <Button variant="outline">
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/interview/behavioral">
                        <Button>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Practice Again
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
