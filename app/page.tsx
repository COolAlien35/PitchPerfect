

"use client";
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, Target, Trophy, Users, Zap, Shield, Star } from "lucide-react"
import Link from "next/link"
import ParticlesBackground from "@/components/Particles"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-background">
      <ParticlesBackground />
      {/* Header */}
      <header className="sticky top-0 z-20 w-full border-b bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">PitchPerfect</span>
          </div>
          <nav className="hidden items-center gap-3 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Login</Link>
            <Button asChild className="ml-1">
              <Link href="/onboarding">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary">AI-powered interview training</Badge>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight md:text-5xl">PitchPerfect</h1>
          <h2 className="mb-4 text-xl text-muted-foreground md:text-2xl">Your Personal Interview & Pitch Assistant</h2>
          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground md:text-lg">
            Transform your interview performance with AI-powered coaching, real-time feedback, and personalized practice sessions. Master any pitch with confidence.
          </p>
          <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/onboarding">Start free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See features</Link>
            </Button>
          </div>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[{v:"95%", l:"Improvement"},{v:"50k+", l:"Sessions"},{v:"4.9★", l:"Rating"}].map((s, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <div className="mb-1 text-3xl font-semibold">{s.v}</div>
                <div className="text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-2 text-3xl font-semibold md:text-4xl">Powerful Features</h2>
            <p className="text-muted-foreground">Comprehensive tools and AI-powered features designed to transform your interview performance and boost your confidence.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[{
              icon: Users,
              title: 'AI interview panels',
              desc: 'Practice with diverse AI interviewers and styles.'
            },{
              icon: Zap,
              title: 'Real-time coaching',
              desc: 'Instant feedback on delivery and body language.'
            },{
              icon: Target,
              title: 'Smart questions',
              desc: 'Resume-aware, role-specific question sets.'
            },{
              icon: Trophy,
              title: 'Progress that matters',
              desc: 'Track improvement without noisy gamification.'
            },{
              icon: Shield,
              title: 'Pressure practice',
              desc: 'Simulate tough scenarios calmly and safely.'
            },{
              icon: Star,
              title: 'Skill verification',
              desc: 'Share credible proof of your interview skills.'
            }].map((f, i) => (
              <Card key={i} className="rainbow-hover group border bg-card/60 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-semibold md:text-4xl">Ready to improve with less noise?</h2>
          <p className="mb-8 text-muted-foreground">Join thousands leveling up their interview skills with clarity and focus.</p>
          <Button size="lg" asChild>
            <Link href="/onboarding">Start your free trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">PitchPerfect</span>
          </div>
          <div className="text-sm text-muted-foreground">© 2025 PitchPerfect. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
