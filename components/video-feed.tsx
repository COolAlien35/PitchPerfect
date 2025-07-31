"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, Mic, MicOff } from "lucide-react"

interface VideoFeedProps {
  isVideoOn: boolean
  isAudioOn: boolean
  onVideoToggle: () => void
  onAudioToggle: () => void
  isRecording?: boolean
  className?: string
}

export function VideoFeed({
  isVideoOn,
  isAudioOn,
  onVideoToggle,
  onAudioToggle,
  isRecording = false,
  className = "",
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initCamera = async () => {
      if (!isVideoOn) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          setStream(null)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        })

        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
        setError("Unable to access camera. Please check permissions.")
      } finally {
        setIsLoading(false)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isVideoOn])

  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]

      if (videoTrack) {
        videoTrack.enabled = isVideoOn
      }
      if (audioTrack) {
        audioTrack.enabled = isAudioOn
      }
    }
  }, [stream, isVideoOn, isAudioOn])

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full h-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center transition-all duration-300 ${
          isRecording ? "ring-4 ring-red-400 ring-opacity-75" : ""
        }`}
      >
        {isLoading ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Starting camera...</p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center p-4">
            <VideoOff className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : isVideoOn && stream ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 text-center">
            <VideoOff className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Camera Off</p>
          </div>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>REC</span>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
        <Button
          size="sm"
          variant={isVideoOn ? "default" : "secondary"}
          onClick={onVideoToggle}
          className="rounded-full w-10 h-10 p-0"
        >
          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant={isAudioOn ? "default" : "secondary"}
          onClick={onAudioToggle}
          className="rounded-full w-10 h-10 p-0"
        >
          {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
