"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SkillDataPoint {
    skill: string
    score: number
    fullMark: number
}

export interface PerformanceDataPoint {
    question: string
    score: number
    ideal: number
}

export interface SkillsRadarProps {
    skillsData: SkillDataPoint[]
    performanceData: PerformanceDataPoint[]
}

// ---------------------------------------------------------------------------
// Recharts custom tooltip
// ---------------------------------------------------------------------------
function RadarTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 border text-sm">
            <p className="font-semibold text-gray-900">{data.skill}</p>
            <p className="text-blue-600">Score: {data.score}/100</p>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SkillsRadar({ skillsData, performanceData }: SkillsRadarProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
            {/* Radar chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Skills Assessment</CardTitle>
                    <CardDescription>
                        Your performance across different skill areas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {skillsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={skillsData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis
                                    dataKey="skill"
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                />
                                <Tooltip content={<RadarTooltip />} />
                                <Radar
                                    name="Your Score"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No skills data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Per-question bar chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance by Question</CardTitle>
                    <CardDescription>
                        Your score vs ideal performance for each question
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {performanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={performanceData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="question" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="score"
                                    fill="#3b82f6"
                                    name="Your Score"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="ideal"
                                    fill="#e5e7eb"
                                    name="Ideal Score"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No performance data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
