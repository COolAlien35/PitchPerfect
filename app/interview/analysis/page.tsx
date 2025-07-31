"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Target,
  Brain,
  Star,
  Clock,
  Award,
  Download,
  Share2,
  RotateCcw,
  Home,
  BookOpen,
  Youtube,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChartIcon as RechartsPieChart,
  Activity,
  Zap,
  Shield,
  MessageSquare,
  Eye,
  Mic,
  Users,
} from "lucide-react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Pie,
} from "recharts"

export default function InterviewAnalysisPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [overallScore, setOverallScore] = useState(8.2)

  useEffect(() => {
    // Load session data from localStorage or API
    const storedSession = localStorage.getItem("lastInterviewSession")
    if (storedSession) {
      setSessionData(JSON.parse(storedSession))
    } else {
      // Fallback mock data
      setSessionData({
        type: "Behavioral Interview",
        personality: "Elon Musk",
        questions: [
          "Tell me about your greatest professional achievement and how you overcame the challenges.",
          "Describe a time when you had to work under extreme pressure. How did you handle it?",
          "What would you do if you discovered a major flaw in a project just before the deadline?",
        ],
        responses: [
          "I led a team project that was behind schedule and over budget. I implemented agile methodologies and daily standups to improve communication.",
          "During a product launch, we discovered a critical bug 2 hours before release. I coordinated with the team to implement a hotfix.",
          "I would immediately assess the impact, inform stakeholders, and propose solutions with timeline estimates.",
        ],
        recoveryScore: 85,
        sessionTime: 1200,
        interruptionsHandled: 3,
        deepfakeMode: false,
        hostileMode: true,
      })
    }
  }, [])

  const detailedScores = {
    communication: 88,
    confidence: 82,
    clarity: 85,
    engagement: 79,
    storytelling: 91,
    professionalism: 86,
    technicalKnowledge: 75,
    problemSolving: 83,
    leadership: 80,
    adaptability: 87,
  }

  const correctAnswers = [
    {
      question: "Tell me about your greatest professional achievement and how you overcame the challenges.",
      userAnswer: sessionData?.responses[0] || "",
      correctAnswer:
        "A strong answer should follow the STAR method (Situation, Task, Action, Result). Start with a specific situation, explain your role and the challenges, detail the actions you took, and quantify the results. Focus on leadership, problem-solving, and measurable outcomes.",
      aiAnalysis:
        "Your answer shows good structure but lacks specific metrics. Consider adding quantifiable results like 'reduced timeline by 30%' or 'saved $50K in costs'.",
      improvementAreas: [
        "Add specific metrics and numbers",
        "Elaborate on leadership decisions",
        "Mention lessons learned",
      ],
      score: 7.5,
    },
    {
      question: "Describe a time when you had to work under extreme pressure. How did you handle it?",
      userAnswer: sessionData?.responses[1] || "",
      correctAnswer:
        "Demonstrate your ability to stay calm, prioritize tasks, and make quick decisions. Show how you managed stress, communicated with stakeholders, and maintained quality under pressure. Include the outcome and what you learned.",
      aiAnalysis:
        "Good example of crisis management. Your response shows quick thinking and coordination skills. Consider adding more about how you managed your own stress and team morale.",
      improvementAreas: [
        "Discuss stress management techniques",
        "Mention team motivation strategies",
        "Add follow-up actions taken",
      ],
      score: 8.2,
    },
    {
      question: "What would you do if you discovered a major flaw in a project just before the deadline?",
      userAnswer: sessionData?.responses[2] || "",
      correctAnswer:
        "Show your ethical standards, communication skills, and problem-solving approach. Explain how you'd assess the situation, communicate with stakeholders transparently, and propose solutions. Demonstrate accountability and forward-thinking.",
      aiAnalysis:
        "Your answer demonstrates good judgment and communication. Strengthen it by discussing how you'd prevent similar issues in the future and your approach to stakeholder management.",
      improvementAreas: [
        "Add prevention strategies",
        "Discuss stakeholder communication plan",
        "Mention quality assurance improvements",
      ],
      score: 8.0,
    },
  ]

  const improvementPlan = {
    immediate: [
      {
        skill: "STAR Method Mastery",
        description: "Perfect your storytelling structure",
        resources: [
          {
            type: "video",
            title: "STAR Method Explained",
            url: "https://youtube.com/watch?v=star-method",
            platform: "YouTube",
          },
          {
            type: "article",
            title: "STAR Method Guide",
            url: "https://harvard.edu/star-guide",
            platform: "Harvard Business Review",
          },
          { type: "book", title: "The STAR Method Workbook", author: "Interview Expert", platform: "Amazon" },
        ],
        timeToImprove: "1-2 weeks",
        priority: "High",
      },
      {
        skill: "Quantifying Achievements",
        description: "Learn to add metrics and numbers to your stories",
        resources: [
          {
            type: "video",
            title: "How to Quantify Your Impact",
            url: "https://youtube.com/watch?v=quantify",
            platform: "YouTube",
          },
          {
            type: "article",
            title: "Metrics That Matter in Interviews",
            url: "https://linkedin.com/metrics-guide",
            platform: "LinkedIn Learning",
          },
        ],
        timeToImprove: "1 week",
        priority: "High",
      },
    ],
    shortTerm: [
      {
        skill: "Leadership Communication",
        description: "Improve how you articulate leadership decisions",
        resources: [
          {
            type: "course",
            title: "Leadership Communication",
            url: "https://coursera.org/leadership-comm",
            platform: "Coursera",
          },
          { type: "book", title: "Crucial Conversations", author: "Kerry Patterson", platform: "Amazon" },
        ],
        timeToImprove: "2-4 weeks",
        priority: "Medium",
      },
      {
        skill: "Technical Depth",
        description: "Strengthen technical knowledge presentation",
        resources: [
          {
            type: "video",
            title: "Explaining Technical Concepts",
            url: "https://youtube.com/watch?v=tech-explain",
            platform: "YouTube",
          },
          {
            type: "course",
            title: "Technical Interview Prep",
            url: "https://udemy.com/tech-interviews",
            platform: "Udemy",
          },
        ],
        timeToImprove: "3-4 weeks",
        priority: "Medium",
      },
    ],
    longTerm: [
      {
        skill: "Executive Presence",
        description: "Develop senior-level communication skills",
        resources: [
          { type: "book", title: "Executive Presence", author: "Sylvia Ann Hewlett", platform: "Amazon" },
          {
            type: "course",
            title: "Executive Communication",
            url: "https://linkedin.com/exec-comm",
            platform: "LinkedIn Learning",
          },
        ],
        timeToImprove: "2-3 months",
        priority: "Low",
      },
    ],
  }

  const performanceData = [
    { question: "Q1", score: 7.5, ideal: 9.0 },
    { question: "Q2", score: 8.2, ideal: 9.0 },
    { question: "Q3", score: 8.0, ideal: 9.0 },
    { question: "Q4", score: 7.8, ideal: 9.0 },
    { question: "Q5", score: 8.5, ideal: 9.0 },
  ]

  const skillsRadarData = [
    { skill: "Communication", score: 88, fullMark: 100 },
    { skill: "Leadership", score: 80, fullMark: 100 },
    { skill: "Problem Solving", score: 83, fullMark: 100 },
    { skill: "Technical", score: 75, fullMark: 100 },
    { skill: "Adaptability", score: 87, fullMark: 100 },
    { skill: "Storytelling", score: 91, fullMark: 100 },
  ]

  const improvementTrendData = [
    { session: "Session 1", score: 6.5 },
    { session: "Session 2", score: 7.2 },
    { session: "Session 3", score: 7.8 },
    { session: "Session 4", score: 8.2 },
    { session: "Current", score: 8.2 },
  ]

  const timeAllocationData = [
    { name: "Question 1", time: 180, color: "#8884d8" },
    { name: "Question 2", time: 220, color: "#82ca9d" },
    { name: "Question 3", time: 160, color: "#ffc658" },
    { name: "Question 4", time: 200, color: "#ff7300" },
    { name: "Question 5", time: 240, color: "#00ff88" },
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Youtube className="w-4 h-4 text-red-500" />
      case "book":
        return <BookOpen className="w-4 h-4 text-blue-500" />
      case "article":
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case "course":
        return <Award className="w-4 h-4 text-purple-500" />
      default:
        return <ExternalLink className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
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

  if (!sessionData) {
    return <div className="min-h-screen flex items-center justify-center">Loading analysis...</div>
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
              InterviewAce AI
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            🎯{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Interview Analysis Complete!
            </span>
          </h1>
          <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {overallScore}/10
          </div>
          <p className="text-xl text-gray-600 mb-2">Strong Performance with Room for Growth!</p>
          <p className="text-gray-500">
            {sessionData.type} • {formatTime(sessionData.sessionTime)} • {new Date().toLocaleDateString()}
          </p>
          {sessionData.personality && (
            <Badge className="mt-2 bg-purple-100 text-purple-800">AI Personality: {sessionData.personality}</Badge>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="correct-answers">AI Mentor</TabsTrigger>
            <TabsTrigger value="improvement">Improvement Plan</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-blue-600">{overallScore}</div>
                    <Progress value={overallScore * 10} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">Above Average Performance</p>
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
                    <span className="font-medium">{formatTime(sessionData.sessionTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium">{sessionData.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <Badge variant="secondary">{sessionData.type}</Badge>
                  </div>
                  {sessionData.interruptionsHandled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interruptions</span>
                      <span className="font-medium text-orange-600">{sessionData.interruptionsHandled}</span>
                    </div>
                  )}
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
                    <p className="font-medium mb-2">Storytelling</p>
                    <div className="text-2xl font-bold text-green-600 mb-2">{detailedScores.storytelling}/100</div>
                    <p className="text-sm text-gray-600">Excellent narrative structure</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Score */}
              {sessionData.recoveryScore && (
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
                      <div className="text-2xl font-bold text-purple-600 mb-2">{sessionData.recoveryScore}%</div>
                      <p className="text-sm text-gray-600">Excellent resilience</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Question</CardTitle>
                <CardDescription>Your score vs ideal performance for each question</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                    <Bar dataKey="ideal" fill="#e5e7eb" name="Ideal Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Assessment</CardTitle>
                <CardDescription>Your performance across different skill areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillsRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Score Breakdown</CardTitle>
                <CardDescription>Performance across different evaluation criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(detailedScores).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{score}/100</span>
                          {score >= 85 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : score >= 70 ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <Progress value={score} className="h-3" />
                      <p className="text-sm text-gray-600">
                        {score >= 85
                          ? "Excellent - You're performing at a high level"
                          : score >= 70
                            ? "Good - Some room for improvement"
                            : "Needs work - Focus area for development"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress Over Time</CardTitle>
                <CardDescription>Track your improvement across interview sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={improvementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis domain={[6, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correct-answers" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-blue-600" />
                AI Mentor Analysis
              </h2>
              <p className="text-gray-600">
                Get expert feedback on your answers and learn what top candidates would say
              </p>
            </div>

            {correctAnswers.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={`${item.score >= 8 ? "bg-green-100 text-green-800" : item.score >= 7 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                      >
                        {item.score}/10
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-base font-medium">{item.question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Your Answer */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Your Answer
                    </h4>
                    <p className="text-blue-700">{item.userAnswer}</p>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Analysis
                    </h4>
                    <p className="text-purple-700">{item.aiAnalysis}</p>
                  </div>

                  {/* Ideal Answer */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      What Top Candidates Say
                    </h4>
                    <p className="text-green-700">{item.correctAnswer}</p>
                  </div>

                  {/* Improvement Areas */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Key Improvements Needed
                    </h4>
                    <ul className="space-y-2">
                      {item.improvementAreas.map((area, areaIndex) => (
                        <li key={areaIndex} className="flex items-start space-x-2 text-orange-700">
                          <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="improvement" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                Your Personalized Improvement Plan
              </h2>
              <p className="text-gray-600">Based on your performance, here's your roadmap to interview mastery</p>
            </div>

            {/* Immediate Actions */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-700">🚨 Immediate Actions (This Week)</CardTitle>
                <CardDescription>Critical skills that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvementPlan.immediate.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-red-800">{skill.skill}</h4>
                        <p className="text-sm text-red-600">{skill.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(skill.priority)}>{skill.priority}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{skill.timeToImprove}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-red-700">Recommended Resources:</h5>
                      {skill.resources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="flex items-center space-x-3 p-2 bg-white rounded border">
                          {getResourceIcon(resource.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-gray-500">{resource.platform}</p>
                            {resource.author && <p className="text-xs text-gray-500">by {resource.author}</p>}
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Short-term Goals */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-700">⏰ Short-term Goals (2-4 Weeks)</CardTitle>
                <CardDescription>Skills to develop over the next month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvementPlan.shortTerm.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-yellow-800">{skill.skill}</h4>
                        <p className="text-sm text-yellow-600">{skill.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(skill.priority)}>{skill.priority}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{skill.timeToImprove}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-yellow-700">Recommended Resources:</h5>
                      {skill.resources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="flex items-center space-x-3 p-2 bg-white rounded border">
                          {getResourceIcon(resource.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-gray-500">{resource.platform}</p>
                            {resource.author && <p className="text-xs text-gray-500">by {resource.author}</p>}
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Long-term Development */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-green-700">🎯 Long-term Development (2-3 Months)</CardTitle>
                <CardDescription>Advanced skills for career growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvementPlan.longTerm.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-green-800">{skill.skill}</h4>
                        <p className="text-sm text-green-600">{skill.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(skill.priority)}>{skill.priority}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{skill.timeToImprove}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-green-700">Recommended Resources:</h5>
                      {skill.resources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="flex items-center space-x-3 p-2 bg-white rounded border">
                          {getResourceIcon(resource.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-gray-500">{resource.platform}</p>
                            {resource.author && <p className="text-xs text-gray-500">by {resource.author}</p>}
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <RechartsPieChart className="w-5 h-5 mr-2 text-blue-600" />
                    Time Allocation per Question
                  </CardTitle>
                  <CardDescription>How you distributed your time across questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={timeAllocationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="time"
                        label={({ name, value }) =>
                          `${name}: ${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`
                        }
                      >
                        {timeAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [
                          `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`,
                          "Time",
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Communication Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Communication Metrics
                  </CardTitle>
                  <CardDescription>Analysis of your speaking patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Speaking Pace</span>
                    </div>
                    <span className="font-bold text-blue-600">145 WPM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Eye Contact</span>
                    </div>
                    <span className="font-bold text-green-600">82%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">Filler Words</span>
                    </div>
                    <span className="font-bold text-orange-600">8 instances</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Engagement Level</span>
                    </div>
                    <span className="font-bold text-purple-600">High</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Deep dive into your interview performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-bold text-blue-800">Strongest Area</h4>
                    <p className="text-blue-600">Storytelling & Structure</p>
                    <p className="text-sm text-gray-600 mt-1">91/100 score</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-bold text-orange-800">Focus Area</h4>
                    <p className="text-orange-600">Technical Knowledge</p>
                    <p className="text-sm text-gray-600 mt-1">75/100 score</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-bold text-green-800">Improvement Rate</h4>
                    <p className="text-green-600">+15% from last session</p>
                    <p className="text-sm text-gray-600 mt-1">Excellent progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-purple-600" />
                Curated Learning Resources
              </h2>
              <p className="text-gray-600">Hand-picked resources to accelerate your interview preparation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Books */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Essential Books
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Cracking the Coding Interview", author: "Gayle McDowell", rating: 4.8 },
                    { title: "Behavioral Interview Questions", author: "James Reed", rating: 4.6 },
                    { title: "The STAR Method Workbook", author: "Interview Expert", rating: 4.7 },
                    { title: "Executive Presence", author: "Sylvia Ann Hewlett", rating: 4.5 },
                  ].map((book, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{book.rating}</span>
                        </div>
                        <Button size="sm" variant="outline" className="mt-1 bg-transparent">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Online Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-600" />
                    Online Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Interview Mastery", platform: "Coursera", duration: "4 weeks", rating: 4.9 },
                    {
                      title: "Leadership Communication",
                      platform: "LinkedIn Learning",
                      duration: "2 weeks",
                      rating: 4.7,
                    },
                    { title: "Technical Interview Prep", platform: "Udemy", duration: "6 weeks", rating: 4.8 },
                    { title: "Executive Presence", platform: "MasterClass", duration: "3 weeks", rating: 4.6 },
                  ].map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-gray-600">
                          {course.platform} • {course.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{course.rating}</span>
                        </div>
                        <Button size="sm" variant="outline" className="mt-1 bg-transparent">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* YouTube Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="w-5 h-5 mr-2 text-red-600" />
                    YouTube Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Interview Success", subscribers: "2.1M", specialty: "Behavioral Questions" },
                    { title: "Tech Interview Pro", subscribers: "1.8M", specialty: "Technical Interviews" },
                    { title: "Career Coach", subscribers: "950K", specialty: "Leadership Skills" },
                    { title: "Executive Presence", subscribers: "650K", specialty: "Executive Interviews" },
                  ].map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{channel.title}</p>
                        <p className="text-sm text-gray-600">
                          {channel.subscribers} • {channel.specialty}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Youtube className="w-3 h-3 mr-1" />
                        Watch
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Practice Platforms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Practice Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "LeetCode", type: "Technical Practice", difficulty: "All Levels" },
                    { title: "Pramp", type: "Mock Interviews", difficulty: "Intermediate" },
                    { title: "InterviewBit", type: "Coding Practice", difficulty: "Advanced" },
                    { title: "Glassdoor", type: "Company Research", difficulty: "All Levels" },
                  ].map((platform, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{platform.title}</p>
                        <p className="text-sm text-gray-600">
                          {platform.type} • {platform.difficulty}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button size="lg" asChild>
            <Link href="/interview/behavioral">
              <RotateCcw className="w-5 h-5 mr-2" />
              Practice Again
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  )
}
