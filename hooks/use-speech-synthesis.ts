"use client"

import { useState, useEffect, useCallback } from "react"

interface UseSpeechSynthesisProps {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export function useSpeechSynthesis({ onStart, onEnd, onError }: UseSpeechSynthesisProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)

      const updateVoices = () => {
        setVoices(speechSynthesis.getVoices())
      }

      updateVoices()
      speechSynthesis.addEventListener("voiceschanged", updateVoices)

      return () => {
        speechSynthesis.removeEventListener("voiceschanged", updateVoices)
      }
    }
  }, [])

  const speak = useCallback(
    (
      text: string,
      options: {
        rate?: number
        pitch?: number
        volume?: number
        voice?: string
      } = {},
    ) => {
      if (!isSupported || !text) return

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set voice preferences
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.name.toLowerCase().includes(options.voice?.toLowerCase() || "female") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("karen") ||
            voice.gender === "female",
        ) ||
        voices.find((voice) => voice.lang.startsWith("en")) ||
        voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1.1
      utterance.volume = options.volume || 1

      utterance.onstart = () => {
        setIsSpeaking(true)
        onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        onEnd?.()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        onError?.(new Error(`Speech synthesis error: ${event.error}`))
      }

      speechSynthesis.speak(utterance)
    },
    [isSupported, voices, onStart, onEnd, onError],
  )

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported) {
      speechSynthesis.pause()
    }
  }, [isSupported])

  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume()
    }
  }, [isSupported])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  }
}
