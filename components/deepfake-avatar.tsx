"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Eye } from "lucide-react"

interface DeepfakeAvatarProps {
  originalImage?: string
  name: string
  isActive: boolean
  isSpeaking: boolean
  size?: "sm" | "md" | "lg" | "xl"
  showBadge?: boolean
  className?: string
}

export function DeepfakeAvatar({
  originalImage,
  name,
  isActive,
  isSpeaking,
  size = "lg",
  showBadge = true,
  className = "",
}: DeepfakeAvatarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [deepfakeReady, setDeepfakeReady] = useState(false)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  }

  const avatarSizeClasses = {
    sm: "w-14 h-14",
    md: "w-22 h-22",
    lg: "w-30 h-30",
    xl: "w-44 h-44",
  }

  // Simulate deepfake processing
  useEffect(() => {
    if (originalImage) {
      setIsProcessing(true)
      const timer = setTimeout(() => {
        setIsProcessing(false)
        setDeepfakeReady(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [originalImage])

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-all duration-500 ${
          isSpeaking
            ? "ring-4 ring-blue-400 ring-opacity-75 scale-105 shadow-2xl shadow-blue-400/25"
            : isActive
              ? "ring-2 ring-blue-400 ring-opacity-50"
              : "hover:scale-105"
        }`}
      >
        {isProcessing ? (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-xs">Processing...</p>
          </div>
        ) : (
          <Avatar className={avatarSizeClasses[size]}>
            <AvatarImage
              src={originalImage || "/placeholder.svg"}
              className={`object-cover transition-all duration-200 ${deepfakeReady ? "filter brightness-110 contrast-110" : ""}`}
            />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Deepfake processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-blue-500/20 animate-pulse flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Deepfake active overlay */}
        {deepfakeReady && !isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse"></div>
        )}

        {/* Speaking animation overlay */}
        {isSpeaking && deepfakeReady && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse"></div>
        )}
      </div>

      {/* Status indicators */}
      {showBadge && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          {isProcessing ? (
            <Badge className="bg-blue-500 text-white text-xs animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              Processing
            </Badge>
          ) : deepfakeReady ? (
            <Badge className="bg-purple-500 text-white text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Deepfake
            </Badge>
          ) : (
            <Badge className="bg-gray-500 text-white text-xs">Standard</Badge>
          )}
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -top-2 -right-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      )}
    </div>
  )
}
