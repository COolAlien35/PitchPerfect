"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Upload,
  FileText,
  Brain,
  Clock,
  Target,
  TrendingUp,
  Eye,
  MessageSquare,
  Zap,
  Play,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function TechnicalInterviewPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    preferredIndustry: "",
    desiredRole: "",
    jobDescription: "",
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or DOC/DOCX file")
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      
      setResumeFile(file)
      setError("")
      setSuccess("Resume uploaded successfully!")
    }
  }

  const simulateFileUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setUploadProgress(i)
    }
    
    setIsUploading(false)
    setSuccess("Resume processed successfully!")
  }

  const generateQuestions = async () => {
    if (!resumeFile || !formData.preferredIndustry || !formData.desiredRole || !formData.jobDescription) {
      setError("Please fill in all fields and upload your resume")
      return
    }

    setIsGeneratingQuestions(true)
    setError("")
    
    try {
      // Create FormData to send to Python backend
      const formDataToSend = new FormData()
      formDataToSend.append('resume', resumeFile)
      formDataToSend.append('preferredIndustry', formData.preferredIndustry)
      formDataToSend.append('desiredRole', formData.desiredRole)
      formDataToSend.append('jobDescription', formData.jobDescription)
      
      // Send to Python backend for Gemini API processing
      const response = await fetch('/api/generate-technical-questions', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format from server')
      }
      
      // Store the generated questions, ideal answers, and form data for the interview
      const interviewData = {
        questions: data.questions,
        ideal_answers: data.ideal_answers,
        formData: formData,
        resumeFileName: resumeFile.name,
        timestamp: Date.now()
      }
      
      localStorage.setItem('technicalInterviewData', JSON.stringify(interviewData))
      
      // Redirect to the behavioral interview page with technical questions
      router.push('/interview/behavioral?mode=technical')
      
    } catch (err) {
      console.error('Error generating questions:', err)
      setError(err instanceof Error ? err.message : "Failed to generate questions. Please try again.")
      setIsGeneratingQuestions(false)
    }
  }

  const canProceedToStep2 = () => {
    return formData.preferredIndustry && formData.desiredRole && formData.jobDescription
  }

  const canGenerateQuestions = () => {
    return resumeFile && !isUploading && !isGeneratingQuestions
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical Interview Setup</h1>
          <p className="text-gray-600">Configure your personalized technical interview</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm text-gray-500">{step}/3</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Step 1: Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="preferredIndustry">Preferred Industry *</Label>
                <Input
                  id="preferredIndustry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={formData.preferredIndustry}
                  onChange={(e) => handleInputChange('preferredIndustry', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="desiredRole">Desired Role *</Label>
                <Input
                  id="desiredRole"
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  value={formData.desiredRole}
                  onChange={(e) => handleInputChange('desiredRole', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here..."
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>
              
              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
                className="w-full"
              >
                Continue to Resume Upload
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Resume Upload */}
        {step === 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Step 2: Resume Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Resume</h3>
                <p className="text-gray-600 mb-4">
                  Upload your resume in PDF or DOC/DOCX format (max 10MB)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  Choose File
                </Button>
                
                {resumeFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{resumeFile.name}</span>
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing resume...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!resumeFile}
                  className="flex-1"
                >
                  Continue to Generate Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generate Questions */}
        {step === 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                Step 3: Generate Interview Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your resume will be analyzed using AI</li>
                  <li>• Custom questions will be generated based on your profile</li>
                  <li>• You'll start your technical interview with real-time analysis</li>
                  <li>• Get detailed feedback and improvement suggestions</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">Industry: {formData.preferredIndustry}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">Role: {formData.desiredRole}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">Resume: {resumeFile?.name}</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button 
                  onClick={generateQuestions}
                  disabled={!canGenerateQuestions()}
                  className="flex-1"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Technical Interview
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error and Success Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
