"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Brain, Sparkles, CheckCircle, AlertCircle } from "lucide-react"

interface PersonalityClonerProps {
  onPersonalitySelected: (personality: any) => void
  selectedPersonality?: string
}

export function PersonalityCloner({ onPersonalitySelected, selectedPersonality }: PersonalityClonerProps) {
  const [uploadedProfile, setUploadedProfile] = useState<string | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cloneReady, setCloneReady] = useState(false)

  const presetPersonalities = [
    {
      id: "elon",
      name: "Elon Musk",
      company: "Tesla/SpaceX",
      style: "Direct, Technical, Visionary",
      avatar: "/placeholder.svg?height=60&width=60&text=EM",
      traits: ["First principles thinking", "Technical deep-dives", "Mars colonization questions"],
      difficulty: "Extreme",
    },
    {
      id: "satya",
      name: "Satya Nadella",
      company: "Microsoft",
      style: "Empathetic, Growth-minded",
      avatar: "/placeholder.svg?height=60&width=60&text=SN",
      traits: ["Growth mindset focus", "Collaboration emphasis", "Cultural transformation"],
      difficulty: "Hard",
    },
    {
      id: "jensen",
      name: "Jensen Huang",
      company: "NVIDIA",
      style: "Technical, Passionate, Intense",
      avatar: "/placeholder.svg?height=60&width=60&text=JH",
      traits: ["AI/GPU technical questions", "Innovation obsession", "High-energy delivery"],
      difficulty: "Extreme",
    },
    {
      id: "tim",
      name: "Tim Cook",
      company: "Apple",
      style: "Strategic, Values-driven",
      avatar: "/placeholder.svg?height=60&width=60&text=TC",
      traits: ["Privacy focus", "Supply chain expertise", "Values alignment"],
      difficulty: "Hard",
    },
  ]

  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedProfile(e.target?.result as string)
        processCustomProfile(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const processCustomProfile = (file: File) => {
    setIsProcessing(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      setCloneReady(true)
      const customPersonality = {
        id: "custom",
        name: "Custom Executive",
        company: "AI-Cloned Profile",
        style: "Cloned from uploaded profile",
        avatar: uploadedProfile,
        traits: ["Personalized questioning", "Industry-specific focus", "Cloned mannerisms"],
        difficulty: "Extreme",
      }
      onPersonalitySelected(customPersonality)
    }, 4000)
  }

  const processLinkedInUrl = () => {
    if (!linkedinUrl) return
    setIsProcessing(true)
    // Simulate LinkedIn scraping and AI processing
    setTimeout(() => {
      setIsProcessing(false)
      setCloneReady(true)
      const linkedinPersonality = {
        id: "linkedin",
        name: "LinkedIn Executive",
        company: "Scraped from LinkedIn",
        style: "AI-generated from profile data",
        avatar: "/placeholder.svg?height=60&width=60&text=LI",
        traits: ["Profile-based questions", "Career-focused", "Industry expertise"],
        difficulty: "Extreme",
      }
      onPersonalitySelected(linkedinPersonality)
    }, 6000)
  }

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-400" />
          AI Personality Cloning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Personalities */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Choose Executive to Clone</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetPersonalities.map((personality) => (
              <div
                key={personality.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPersonality === personality.id
                    ? "border-purple-400 bg-purple-500/20"
                    : "border-white/20 hover:border-purple-300"
                }`}
                onClick={() => onPersonalitySelected(personality)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={personality.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{personality.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{personality.name}</h3>
                    <p className="text-xs text-gray-300">{personality.company}</p>
                    <Badge
                      className={`text-xs mt-1 ${
                        personality.difficulty === "Extreme" ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                      }`}
                    >
                      {personality.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  {personality.traits.slice(0, 2).map((trait, index) => (
                    <p key={index} className="text-xs text-purple-300">
                      • {trait}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Upload Executive Photo/Resume</Label>
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
            {isProcessing ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-400">🧠 AI Cloning in Progress...</p>
                  <p className="text-xs text-gray-400">Analyzing personality patterns</p>
                  <p className="text-xs text-gray-400">Extracting speaking style</p>
                  <p className="text-xs text-gray-400">Generating interview questions</p>
                </div>
              </div>
            ) : cloneReady ? (
              <div className="space-y-3">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                <p className="text-sm font-medium text-green-400">✅ Personality Clone Ready!</p>
                <p className="text-xs text-gray-400">AI has successfully cloned the executive's interview style</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-purple-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium mb-2">Upload Photo or Resume</p>
                  <p className="text-xs text-gray-400 mb-4">
                    AI will analyze and clone their personality for interviews
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleProfileUpload}
                    className="hidden"
                    id="profile-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("profile-upload")?.click()}
                    className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LinkedIn URL */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Or Enter LinkedIn Profile URL</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="https://linkedin.com/in/executive-name"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="bg-black/30 border-purple-400/50"
            />
            <Button
              onClick={processLinkedInUrl}
              disabled={!linkedinUrl || isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Clone
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>AI will scrape public profile data to clone personality</span>
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-400/30">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-400">AI Personality Cloning Active</p>
                <p className="text-xs text-gray-400">This may take 30-60 seconds...</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
