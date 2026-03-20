"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Base shimmer primitive
// ---------------------------------------------------------------------------
function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded bg-gray-200",
                "before:absolute before:inset-0",
                "before:-translate-x-full",
                "before:animate-[shimmer_1.8s_infinite]",
                "before:bg-gradient-to-r",
                "before:from-transparent before:via-white/60 before:to-transparent",
                className
            )}
            style={style}
        />
    )
}

// ---------------------------------------------------------------------------
// Skeleton primitives
// ---------------------------------------------------------------------------
export function SkeletonLine({
    width = "w-full",
    height = "h-4",
}: {
    width?: string
    height?: string
}) {
    return <Shimmer className={`${width} ${height}`} />
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
    return <Shimmer className={`${size} rounded-full`} />
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-3">{children}</CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Analysis dashboard skeletons
// ---------------------------------------------------------------------------

/** Hero score banner placeholder */
export function ScoreBannerSkeleton() {
    return (
        <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
                <Shimmer className="w-20 h-20 rounded-full" />
            </div>
            <Shimmer className="w-80 h-10 mx-auto" />
            <Shimmer className="w-32 h-16 mx-auto" />
            <Shimmer className="w-60 h-5 mx-auto" />
        </div>
    )
}

/** Four-card overview row */
export function MetricsRowSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Shimmer className="w-5 h-5 rounded" />
                            <Shimmer className="w-24 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Shimmer className="w-16 h-8 mx-auto" />
                        <Shimmer className="w-full h-3" />
                        <Shimmer className="w-32 h-3 mx-auto" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

/** Radar / bar chart placeholder */
export function ChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Shimmer className="w-40 h-5" />
                <Shimmer className="w-64 h-4 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-center gap-3 h-[300px] pb-8">
                    {[40, 65, 55, 80, 50, 70, 45, 60].map((h, i) => (
                        <Shimmer
                            key={i}
                            className="w-8 rounded-t"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/** QA feedback card skeleton */
export function FeedbackCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <Shimmer className="w-24 h-4" />
                        <Shimmer className="w-full h-4" />
                    </div>
                    <Shimmer className="w-16 h-6 rounded-full flex-shrink-0" />
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <Shimmer className="w-full h-16" />
                <Shimmer className="w-full h-10" />
                <div className="space-y-2">
                    <Shimmer className="w-full h-4" />
                    <Shimmer className="w-3/4 h-4" />
                </div>
            </CardContent>
        </Card>
    )
}

export function FeedbackListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <FeedbackCardSkeleton key={i} />
            ))}
        </div>
    )
}

/** Improvement timeline skeleton */
export function TimelineSkeleton() {
    return (
        <div className="space-y-6">
            {/* Trend chart */}
            <Card>
                <CardHeader>
                    <Shimmer className="w-40 h-5" />
                </CardHeader>
                <CardContent>
                    <Shimmer className="w-full h-[200px]" />
                </CardContent>
            </Card>

            {/* Improvement items */}
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-l-4 border-gray-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                                <Shimmer className="w-40 h-5" />
                                <Shimmer className="w-full h-4" />
                            </div>
                            <Shimmer className="w-16 h-6 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Shimmer className="w-full h-10 rounded" />
                            <Shimmer className="w-full h-10 rounded" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

/** Full analysis page skeleton composition */
export function AnalysisDashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <ScoreBannerSkeleton />
            <MetricsRowSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
            <FeedbackListSkeleton count={2} />
        </div>
    )
}
