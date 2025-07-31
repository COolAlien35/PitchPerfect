import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, Target, Trophy, Users, Zap, Shield, Star } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InterviewAce AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Button asChild>
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            🚀 AI-Powered Interview Preparation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            Master Your Next Interview with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transform your interview skills through immersive AI simulations, real-time coaching, and gamified learning.
            Build confidence with realistic practice scenarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/onboarding">
                Start Free Practice <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">50K+</div>
              <div className="text-gray-600">Interviews Practiced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.9★</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful AI-Driven Features</h2>
            <p className="text-xl text-gray-600">Everything you need to ace your next interview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>AI Interview Panels</CardTitle>
                <CardDescription>
                  Practice with diverse AI interviewers featuring different personalities and questioning styles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Real-Time Coaching</CardTitle>
                <CardDescription>
                  Get instant feedback on your speech, body language, and confidence levels during practice
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Smart Question Generation</CardTitle>
                <CardDescription>
                  AI analyzes your resume to generate personalized, role-specific interview questions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Gamified Learning</CardTitle>
                <CardDescription>
                  Earn XP, unlock badges, and compete on leaderboards while improving your skills
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Pressure Mode</CardTitle>
                <CardDescription>
                  Simulate high-stress interview environments with time pressure and challenging scenarios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pink-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle>Skill Verification</CardTitle>
                <CardDescription>
                  Earn blockchain-verified skill badges that employers can trust and validate
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Interview Skills?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who have already improved their interview performance with InterviewAce AI
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
            <Link href="/onboarding">
              Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">InterviewAce AI</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 InterviewAce AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
