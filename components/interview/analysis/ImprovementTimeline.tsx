"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import {
    BookOpen,
    Youtube,
    MessageSquare as ArticleIcon,
    Award,
    ExternalLink,
} from "lucide-react"
import { motion } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TrendPoint {
    session: string
    score: number
}

export interface Resource {
    type: "video" | "book" | "article" | "course"
    title: string
    url?: string
    author?: string
    platform?: string
}

export interface ImprovementItem {
    skill: string
    description: string
    resources: Resource[]
    timeToImprove: string
    priority: "High" | "Medium" | "Low"
}

export interface ImprovementTimelineProps {
    trendData: TrendPoint[]
    immediate: ImprovementItem[]
    shortTerm: ImprovementItem[]
    longTerm: ImprovementItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getResourceIcon(type: string) {
    switch (type) {
        case "video":
            return <Youtube className="w-4 h-4 text-red-500" />
        case "book":
            return <BookOpen className="w-4 h-4 text-blue-500" />
        case "article":
            return <ArticleIcon className="w-4 h-4 text-green-500" />
        case "course":
            return <Award className="w-4 h-4 text-purple-500" />
        default:
            return <ExternalLink className="w-4 h-4 text-gray-500" />
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case "High":
            return "bg-red-100 text-red-800"
        case "Medium":
            return "bg-yellow-100 text-yellow-800"
        case "Low":
            return "bg-green-100 text-green-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ImprovementSection({
    title,
    items,
    borderColor,
}: {
    title: string
    items: ImprovementItem[]
    borderColor: string
}) {
    if (!items.length) return null

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className={`border-l-4 ${borderColor}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-semibold">{item.skill}</p>
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge className={getPriorityColor(item.priority)}>
                                            {item.priority}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {item.timeToImprove}
                                        </span>
                                    </div>
                                </div>

                                {/* Resources */}
                                <div className="mt-3 space-y-2">
                                    {item.resources.map((res, rIdx) => (
                                        <div
                                            key={rIdx}
                                            className="flex items-center gap-2 text-sm text-gray-600 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            {getResourceIcon(res.type)}
                                            <span className="flex-1">{res.title}</span>
                                            {res.platform && (
                                                <span className="text-xs text-gray-400">
                                                    {res.platform}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ImprovementTimeline({
    trendData,
    immediate,
    shortTerm,
    longTerm,
}: ImprovementTimelineProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-8"
        >
            {/* Trend line */}
            <Card>
                <CardHeader>
                    <CardTitle>Improvement Trend</CardTitle>
                    <CardDescription>
                        Your scores across recent practice sessions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="session" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: "#3b82f6", r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            Complete more sessions to see your trend
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Grouped improvement plan */}
            <ImprovementSection
                title="🔥 Immediate Actions (This Week)"
                items={immediate}
                borderColor="border-red-400"
            />
            <ImprovementSection
                title="📈 Short-Term Goals (2–4 Weeks)"
                items={shortTerm}
                borderColor="border-yellow-400"
            />
            <ImprovementSection
                title="🎯 Long-Term Development (1–3 Months)"
                items={longTerm}
                borderColor="border-green-400"
            />
        </motion.div>
    )
}
