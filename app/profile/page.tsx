"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/src/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User as UserIcon, Mail, Link as LinkIcon, FileText, Briefcase } from "lucide-react"
import Image from "next/image"

interface UserProfile {
  name?: string;
  email: string;
  photo?: string;
  linkedinUrl?: string;
  resumeDriveUrl?: string;
  roles?: string[];
}

export default function ProfilePage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch("/api/users/profile", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch user profile");
          }

          const data: UserProfile = await res.json();
          setUserProfile(data);
        } catch (err: any) {
          console.error("Error fetching profile:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login") // Redirect to login if not authenticated
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <p>No user information available.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
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
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <p className="text-lg font-medium">Name:</p>
                </div>
                <p className="text-gray-800 ml-7">{userProfile.name}</p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <p className="text-lg font-medium">Email:</p>
              </div>
              <p className="text-gray-800 ml-7">{userProfile.email}</p>
            </div>
            {userProfile.linkedinUrl && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-5 w-5 text-gray-600" />
                  <p className="text-lg font-medium">LinkedIn:</p>
                </div>
                <a
                  href={userProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-7"
                >
                  {userProfile.linkedinUrl}
                </a>
              </div>
            )}
            {userProfile.resumeDriveUrl && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <p className="text-lg font-medium">Resume:</p>
                </div>
                <a
                  href={userProfile.resumeDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-7"
                >
                  View Resume
                </a>
              </div>
            )}
            {userProfile.roles && userProfile.roles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                  <p className="text-lg font-medium">Roles:</p>
                </div>
                <p className="text-gray-800 ml-7">{userProfile.roles.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
