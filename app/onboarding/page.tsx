"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Upload, ArrowRight, ArrowLeft, Brain } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    experience: "",
    targetRole: "",
    industry: "",
    goals: [],
    resume: null as File | null,
  })
  const router = useRouter()

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Complete onboarding
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleGoalToggle = (goal: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InterviewAce AI
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Your Interview Journey</h1>
          <p className="text-gray-600">Let's personalize your experience in just a few steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Basic Information"}
              {step === 2 && "Professional Background"}
              {step === 3 && "Your Goals"}
              {step === 4 && "Upload Resume"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us a bit about yourself"}
              {step === 2 && "Help us understand your experience level"}
              {step === 3 && "What do you want to achieve?"}
              {step === 4 && "Upload your resume for personalized questions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                      <SelectItem value="executive">Executive (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <Input
                    id="targetRole"
                    placeholder="e.g., Software Engineer, Product Manager"
                    value={formData.targetRole}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetRole: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label>What are your main goals? (Select all that apply)</Label>
                {[
                  "Improve confidence in interviews",
                  "Practice technical questions",
                  "Work on behavioral responses",
                  "Prepare for specific company",
                  "Enhance presentation skills",
                  "Overcome interview anxiety",
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.goals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <Label htmlFor={goal} className="text-sm font-normal">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Upload Your Resume</p>
                    <p className="text-sm text-gray-500">PDF, DOC, or DOCX (Max 5MB)</p>
                    <Button variant="outline" className="mt-4 bg-transparent">
                      Choose File
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Your resume helps us generate personalized interview questions based on your experience and skills.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex items-center">
                {step === totalSteps ? "Complete Setup" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
