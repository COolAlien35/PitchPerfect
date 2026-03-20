"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Link as LinkIcon,
  FileText,
  Briefcase,
  Phone,
  MapPin,
  GraduationCap,
  Target,
  Github,
  Globe,
  Edit,
  Save,
  X,
  Calendar
} from "lucide-react"
import Image from "next/image"
import { useAuth, apiFetch } from "@/hooks/use-auth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  // Refresh profile data when component mounts
  useEffect(() => {
    if (user && !loading) {
      refreshProfile()
    }
  }, [user, loading, refreshProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    router.push("/login")
    return null
  }

  const getExperienceLabel = (experience: string) => {
    switch (experience) {
      case 'entry': return 'Entry Level (0-2 years)'
      case 'mid': return 'Mid Level (3-5 years)'
      case 'senior': return 'Senior Level (6-10 years)'
      case 'executive': return 'Executive (10+ years)'
      case 'student': return 'Student/Recent Graduate'
      default: return experience
    }
  }

  const getIndustryLabel = (industry: string) => {
    const industryMap: { [key: string]: string } = {
      'technology': 'Technology',
      'finance': 'Finance',
      'healthcare': 'Healthcare',
      'consulting': 'Consulting',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'education': 'Education',
      'manufacturing': 'Manufacturing',
      'retail': 'Retail',
      'other': 'Other'
    }
    return industryMap[industry] || industry
  }

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

  const handleEdit = () => {
    const editDataToSet = {
      name: userProfile.name || '',
      phone: userProfile.phone || '',
      bio: userProfile.bio || '',
      experience: userProfile.experience || '',
      targetRole: userProfile.targetRole || '',
      industry: userProfile.industry || '',
      company: userProfile.company || '',
      education: userProfile.education || '',
      skills: userProfile.skills || [],
      goals: userProfile.goals || [],
      linkedinUrl: userProfile.linkedinUrl || '',
      githubUrl: userProfile.githubUrl || '',
    }
    setEditData(editDataToSet)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Save profile update to backend
      const res = await apiFetch('/api/v1/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail?.message || err.detail || 'Failed to update profile');
      }

      // Refresh the profile data
      await refreshProfile()
      setIsEditing(false)

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setEditData((prev: any) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s: string) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const handleGoalToggle = (goal: string) => {
    setEditData((prev: any) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g: string) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          {!isEditing ? (
            <Button variant="outline" className="flex items-center" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="btn-gradient-primary">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {userProfile.photo ? (
                  <Image
                    src={userProfile.photo}
                    alt="Profile Photo"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-2 ring-white/40">
                    {userProfile.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-foreground font-medium">Full Name *</Label>
                      <Input
                        id="edit-name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="mt-1 bg-background/50 border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-bio" className="text-foreground font-medium">Bio</Label>
                      <Textarea
                        id="edit-bio"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        className="mt-1 bg-background/50 border-border"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {userProfile.name || 'User'}
                    </h1>
                    {userProfile.bio && (
                      <p className="text-muted-foreground text-lg mb-4">{userProfile.bio}</p>
                    )}
                    {!userProfile.bio && (
                      <p className="text-muted-foreground text-lg mb-4">No bio added yet</p>
                    )}
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  {userProfile.targetRole && (
                    <Badge variant="secondary" className="text-sm">
                      <Target className="h-3 w-3 mr-1" />
                      {userProfile.targetRole}
                    </Badge>
                  )}
                  {userProfile.industry && (
                    <Badge variant="outline" className="text-sm">
                      <Globe className="h-3 w-3 mr-1" />
                      {getIndustryLabel(userProfile.industry)}
                    </Badge>
                  )}
                  {userProfile.experience && (
                    <Badge variant="outline" className="text-sm">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {getExperienceLabel(userProfile.experience)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-foreground">
                  <UserIcon className="mr-2 h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-foreground">{userProfile.email}</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-foreground font-medium">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="bg-background/50 border-border"
                      />
                    </div>
                  ) : (
                    userProfile.phone && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="text-foreground">{userProfile.phone}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-linkedin" className="text-foreground font-medium">LinkedIn Profile</Label>
                    <Input
                      id="edit-linkedin"
                      value={editData.linkedinUrl}
                      onChange={(e) => setEditData({ ...editData, linkedinUrl: e.target.value })}
                      className="bg-background/50 border-border"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                ) : (
                  userProfile.linkedinUrl && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                        <a
                          href={userProfile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userProfile.linkedinUrl}
                        </a>
                      </div>
                    </div>
                  )
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-github" className="text-foreground font-medium">GitHub Profile</Label>
                    <Input
                      id="edit-github"
                      value={editData.githubUrl}
                      onChange={(e) => setEditData({ ...editData, githubUrl: e.target.value })}
                      className="bg-background/50 border-border"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                ) : (
                  userProfile.githubUrl && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                      <Github className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">GitHub</p>
                        <a
                          href={userProfile.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userProfile.githubUrl}
                        </a>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Professional Background */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-foreground">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" />
                  Professional Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-company" className="text-foreground font-medium">Current Company</Label>
                        <Input
                          id="edit-company"
                          value={editData.company}
                          onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                          className="bg-background/50 border-border"
                          placeholder="Where do you currently work?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-education" className="text-foreground font-medium">Education</Label>
                        <Input
                          id="edit-education"
                          value={editData.education}
                          onChange={(e) => setEditData({ ...editData, education: e.target.value })}
                          className="bg-background/50 border-border"
                          placeholder="e.g., Bachelor's in Computer Science"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-experience" className="text-foreground font-medium">Experience Level</Label>
                        <Select
                          value={editData.experience}
                          onValueChange={(value) => setEditData({ ...editData, experience: value })}
                        >
                          <SelectTrigger className="bg-background/50 border-border">
                            <SelectValue placeholder="Select experience level" />
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
                        <Label htmlFor="edit-targetRole" className="text-foreground font-medium">Target Role</Label>
                        <Input
                          id="edit-targetRole"
                          value={editData.targetRole}
                          onChange={(e) => setEditData({ ...editData, targetRole: e.target.value })}
                          className="bg-background/50 border-border"
                          placeholder="e.g., Software Engineer, Product Manager"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-industry" className="text-foreground font-medium">Industry</Label>
                        <Select
                          value={editData.industry}
                          onValueChange={(value) => setEditData({ ...editData, industry: value })}
                        >
                          <SelectTrigger className="bg-background/50 border-border">
                            <SelectValue placeholder="Select industry" />
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
                    </>
                  ) : (
                    <>
                      {userProfile.company && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Company</p>
                            <p className="text-foreground">{userProfile.company}</p>
                          </div>
                        </div>
                      )}
                      {userProfile.education && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Education</p>
                            <p className="text-foreground">{userProfile.education}</p>
                          </div>
                        </div>
                      )}
                      {!userProfile.company && !userProfile.education && (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground mb-2">No professional background added yet</p>
                          <p className="text-sm text-muted-foreground">Click "Edit Profile" to add your work experience and education</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {userProfile.createdAt && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                      <p className="text-foreground">
                        {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableSkills.map((skill) => (
                          <div key={skill} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-skill-${skill}`}
                              checked={editData.skills.includes(skill)}
                              onCheckedChange={() => handleSkillToggle(skill)}
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label htmlFor={`edit-skill-${skill}`} className="text-sm font-normal text-foreground cursor-pointer">
                              {skill}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selected: {editData.skills.length} skills
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Goals */}
            {userProfile.goals && userProfile.goals.length > 0 && (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Target className="mr-2 h-5 w-5 text-primary" />
                    Your Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableGoals.map((goal) => (
                          <div key={goal} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors bg-background/50">
                            <Checkbox
                              id={`edit-goal-${goal}`}
                              checked={editData.goals.includes(goal)}
                              onCheckedChange={() => handleGoalToggle(goal)}
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label htmlFor={`edit-goal-${goal}`} className="text-sm font-normal text-foreground cursor-pointer flex-1">
                              {goal}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selected: {editData.goals.length} goals
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userProfile.goals.map((goal, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-foreground">{goal}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Actions & Resume */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isEditing ? (
                  <Button className="w-full justify-start" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button className="w-full justify-start" variant="outline" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Update Resume
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
              </CardContent>
            </Card>

            {/* Resume Section */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-foreground">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile.resumeDriveUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Resume uploaded</span>
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <a
                        href={userProfile.resumeDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Resume
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-700">No resume uploaded</span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Upload Resume
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Upload your resume to get personalized interview questions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  )
}
