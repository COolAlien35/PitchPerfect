"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AIAvatarProps {
  name: string
  avatar: string
  isActive: boolean
  isSpeaking: boolean
  personality: string
  size?: "sm" | "md" | "lg"
}

export function AIAvatar({ name, avatar, isActive, isSpeaking, personality, size = "lg" }: AIAvatarProps) {
  const [blinkAnimation, setBlinkAnimation] = useState(false)
  const [mouthAnimation, setMouthAnimation] = useState(false)

  // Simulate natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlinkAnimation(true)
        setTimeout(() => setBlinkAnimation(false), 150)
      },
      3000 + Math.random() * 2000,
    )

    return () => clearInterval(blinkInterval)
  }, [])

  // Mouth animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setMouthAnimation((prev) => !prev)
      }, 200)
      return () => clearInterval(mouthInterval)
    }
  }, [isSpeaking])

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  }

  const avatarSizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-44 h-44",
  }

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center transition-all duration-300 ${
          isSpeaking
            ? "ring-4 ring-green-400 ring-opacity-75 scale-105"
            : isActive
              ? "ring-2 ring-blue-400 ring-opacity-50"
              : ""
        }`}
      >
        <div className="relative">
          <Avatar className={avatarSizeClasses[size]}>
            <AvatarImage
              src={avatar || "/placeholder.svg"}
              className={`object-cover transition-all duration-200 ${blinkAnimation ? "brightness-90" : ""}`}
            />
            <AvatarFallback
              className={`text-2xl bg-gradient-to-br from-blue-500 to-indigo-500 ${
                size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-4xl"
              }`}
            >
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          {/* Speaking indicator overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <div className="bg-black/50 rounded-full px-2 py-1">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1 h-1 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {(isSpeaking || isActive) && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? "bg-green-400" : "bg-blue-400"}`}></div>
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? "bg-green-400" : "bg-blue-400"}`}
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? "bg-green-400" : "bg-blue-400"}`}
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
