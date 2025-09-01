"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User as UserIcon, Mail, Link as LinkIcon, FileText, Briefcase } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl text-center flex items-center justify-center text-foreground">
              <UserIcon className="mr-2 h-6 w-6" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userProfile.photo && (
              <div className="flex justify-center mb-4">
                <Image
                  src={userProfile.photo}
                  alt="Profile Photo"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              </div>
            )}
            {userProfile.name && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">Name:</p>
                </div>
                <p className="text-muted-foreground ml-7">{userProfile.name}</p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">Email:</p>
              </div>
              <p className="text-muted-foreground ml-7">{userProfile.email}</p>
            </div>
            {userProfile.linkedinUrl && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">LinkedIn:</p>
                </div>
                <a
                  href={userProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-7"
                >
                  {userProfile.linkedinUrl}
                </a>
              </div>
            )}
            {userProfile.resumeDriveUrl && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">Resume:</p>
                </div>
                <a
                  href={userProfile.resumeDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-7"
                >
                  View Resume
                </a>
              </div>
            )}
            {userProfile.roles && userProfile.roles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">Roles:</p>
                </div>
                <p className="text-muted-foreground ml-7">{userProfile.roles.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
