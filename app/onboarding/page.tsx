"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ArrowRight, ArrowLeft, Brain, User, Briefcase, Target, GraduationCap, Globe, FileText, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth, apiFetch } from "@/hooks/use-auth"
import ParticlesBackground from "@/components/Particles"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    targetRole: "",
    industry: "",
    company: "",
    education: "",
    skills: [] as string[],
    goals: [] as string[],
    linkedinUrl: "",
    githubUrl: "",
    resume: null as File | null,
    bio: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const availableSkills = [
    "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "AWS", "Docker",
    "Machine Learning", "Data Analysis", "Project Management", "UI/UX Design",
    "Sales", "Marketing", "Finance", "Healthcare", "Consulting", "Education"
  ]

  const availableGoals = [
    "Improve confidence in interviews",
    "Practice technical questions",
    "Work on behavioral responses",
    "Prepare for specific company",
    "Enhance presentation skills",
    "Overcome interview anxiety",
    "Learn industry-specific knowledge",
    "Build networking skills"
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }))
    }
  }, [user, loading, router])

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Complete onboarding - save profile data
      if (user) {
        setIsSubmitting(true)
        try {
          const userData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            experience: formData.experience,
            targetRole: formData.targetRole,
            industry: formData.industry,
            company: formData.company,
            education: formData.education,
            skills: formData.skills,
            goals: formData.goals,
            linkedinUrl: formData.linkedinUrl,
            githubUrl: formData.githubUrl,
            bio: formData.bio,
          };

          // Save onboarding profile to backend
          const res = await apiFetch('/api/v1/users/profile', {
            method: 'POST',
            body: JSON.stringify(userData),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail?.message || err.detail || 'Failed to save profile');
          }

          router.push("/dashboard");
        } catch (error: any) {
          console.error("Error saving onboarding data:", error);
          alert(`Failed to save onboarding data: ${error.message}. Please try again.`);
        } finally {
          setIsSubmitting(false)
        }
      } else {
        alert("User not authenticated. Please log in again.");
        router.push("/login");
      }
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

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== "" && formData.email.trim() !== ""
      case 2:
        return formData.experience !== "" && formData.targetRole.trim() !== "" && formData.industry !== ""
      case 3:
        return formData.skills.length > 0
      case 4:
        return formData.goals.length > 0
      case 5:
        return true // Resume is optional
      default:
        return false
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-background">
      <ParticlesBackground />
      <div className="relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold gradient-primary-text">
                PitchPerfect
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3 gradient-primary-text">Welcome to Your Interview Journey</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let's personalize your experience and create a tailored interview preparation plan
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">
                Step {step} of {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3 bg-muted" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Background</span>
              <span>Skills</span>
              <span>Goals</span>
              <span>Resume</span>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-foreground flex items-center justify-center">
                {step === 1 && <User className="w-6 h-6 mr-2 text-primary" />}
                {step === 2 && <Briefcase className="w-6 h-6 mr-2 text-primary" />}
                {step === 3 && <GraduationCap className="w-6 h-6 mr-2 text-primary" />}
                {step === 4 && <Target className="w-6 h-6 mr-2 text-primary" />}
                {step === 5 && <FileText className="w-6 h-6 mr-2 text-primary" />}
                {step === 1 && "Basic Information"}
                {step === 2 && "Professional Background"}
                {step === 3 && "Skills & Expertise"}
                {step === 4 && "Your Goals"}
                {step === 5 && "Upload Resume"}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                {step === 1 && "Tell us about yourself and how to contact you"}
                {step === 2 && "Help us understand your experience and aspirations"}
                {step === 3 && "What are your key skills and areas of expertise?"}
                {step === 4 && "What do you want to achieve with PitchPerfect?"}
                {step === 5 && "Upload your resume for personalized interview questions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      disabled
                      className="h-12 border-border bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">Email is pre-filled from your account</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-foreground font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      className="min-h-[80px] border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-foreground font-medium">Experience Level *</Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, experience: value }))}
                    >
                      <SelectTrigger className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50">
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                        <SelectItem value="executive">Executive (10+ years)</SelectItem>
                        <SelectItem value="student">Student/Recent Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetRole" className="text-foreground font-medium">Target Role *</Label>
                    <Input
                      id="targetRole"
                      placeholder="e.g., Software Engineer, Product Manager"
                      value={formData.targetRole}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetRole: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-foreground font-medium">Industry *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground font-medium">Current Company</Label>
                    <Input
                      id="company"
                      placeholder="Where do you currently work?"
                      value={formData.company}
                      onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-foreground font-medium">Education</Label>
                    <Input
                      id="education"
                      placeholder="e.g., Bachelor's in Computer Science"
                      value={formData.education}
                      onChange={(e) => setFormData((prev) => ({ ...prev, education: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-foreground font-medium">LinkedIn Profile</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-foreground font-medium text-lg mb-4 block">
                      Select your key skills and areas of expertise *
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableSkills.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={formData.skills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={skill} className="text-sm font-normal text-foreground cursor-pointer">
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {formData.skills.length} skills
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="text-foreground font-medium">GitHub Profile</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
                      className="h-12 border-border focus:border-primary focus:ring-primary bg-background/50"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-foreground font-medium text-lg mb-4 block">
                      What are your main goals with PitchPerfect? *
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableGoals.map((goal) => (
                        <div key={goal} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors bg-background/50">
                          <Checkbox
                            id={goal}
                            checked={formData.goals.includes(goal)}
                            onCheckedChange={() => handleGoalToggle(goal)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={goal} className="text-sm font-normal text-foreground cursor-pointer flex-1">
                            {goal}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {formData.goals.length} goals
                    </p>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors bg-muted/20">
                    <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-3">
                      <p className="text-xl font-medium text-foreground">Upload Your Resume</p>
                      <p className="text-muted-foreground">PDF, DOC, or DOCX (Max 5MB)</p>
                      <p className="text-sm text-muted-foreground">
                        This helps us generate personalized interview questions based on your experience
                      </p>
                      <Button variant="outline" className="mt-4 bg-background/50 hover:bg-background border-border">
                        Choose File
                      </Button>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Resume Upload is Optional</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You can always upload or update your resume later from your profile settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-8 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="flex items-center bg-background/50 hover:bg-background border-border px-6 py-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center btn-gradient-primary px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {step === totalSteps ? "Complete Setup" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
