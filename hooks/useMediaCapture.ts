/**
 * hooks/useMediaCapture.ts
 *
 * Abstracts all browser media (camera + microphone) acquisition and analysis.
 *
 * Responsibilities:
 *  - Requests getUserMedia with sensible constraints
 *  - Sets up Web Audio API analyser for real-time audio level monitoring
 *  - Exposes controls: start, stop, toggleVideo, toggleAudio
 *  - Automatically cleans up tracks and AudioContext on unmount
 *  - Throttles audio-level state updates via requestAnimationFrame to
 *    prevent render storms (same pattern already used in the behavioral page)
 *
 * Usage:
 *   const { stream, audioLevel, isVideoOn, isAudioOn, start, stop,
 *           toggleVideo, toggleAudio, error } = useMediaCapture();
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaCaptureOptions {
  /** Desired video resolution — defaults to 640×480 */
  video?: boolean | MediaTrackConstraints;
  /** Include audio — defaults to true */
  audio?: boolean | MediaTrackConstraints;
  /** Milliseconds between audio-level state updates (throttle) */
  audioThrottleMs?: number;
  /** Audio level threshold above which the user is considered "speaking" */
  speakingThreshold?: number;
}

export interface MediaCaptureState {
  stream: MediaStream | null;
  isVideoOn: boolean;
  isAudioOn: boolean;
  audioLevel: number;         // 0–255 raw RMS from AnalyserNode
  isUserSpeaking: boolean;
  isReady: boolean;           // true once getUserMedia resolves
  error: string | null;
}

export interface MediaCaptureControls {
  start: () => Promise<void>;
  stop: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  attachToVideo: (el: HTMLVideoElement | null) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediaCapture(
  options: MediaCaptureOptions = {}
): MediaCaptureState & MediaCaptureControls {
  const {
    video = { width: 640, height: 480, facingMode: 'user' },
    audio = true,
    audioThrottleMs = 100,
    speakingThreshold = 20,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // -------------------------------------------------------------------------
  // Audio-level monitoring loop (RAF-based, throttled)
  // -------------------------------------------------------------------------
  const startAudioMonitor = useCallback(
    (ctx: AudioContext, analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;

        const now = performance.now();
        if (now - lastUpdateRef.current > audioThrottleMs) {
          lastUpdateRef.current = now;
          setAudioLevel(avg);
          setIsUserSpeaking(avg > speakingThreshold);
        }

        rafIdRef.current = requestAnimationFrame(loop);
      };

      rafIdRef.current = requestAnimationFrame(loop);
    },
    [audioThrottleMs, speakingThreshold]
  );

  // -------------------------------------------------------------------------
  // Acquire media
  // -------------------------------------------------------------------------
  const start = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Attach to a pre-registered video element if available
      if (videoElRef.current) {
        videoElRef.current.srcObject = mediaStream;
      }

      // Set up audio analysis
      const AudioContextClass =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const source = ctx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      setIsVideoOn(true);
      setIsAudioOn(true);
      setIsReady(true);

      startAudioMonitor(ctx, analyser);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied. Please allow access and try again.'
          : `Failed to access media devices: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      setIsReady(false);
    }
  }, [audio, video, startAudioMonitor]);

  // -------------------------------------------------------------------------
  // Release media
  // -------------------------------------------------------------------------
  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsReady(false);
    setIsVideoOn(false);
    setAudioLevel(0);
    setIsUserSpeaking(false);
  }, []);

  // -------------------------------------------------------------------------
  // Toggle video/audio tracks
  // -------------------------------------------------------------------------
  const toggleVideo = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOn((prev) => !prev);
  }, []);

  const toggleAudio = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsAudioOn((prev) => !prev);
  }, []);

  // -------------------------------------------------------------------------
  // Attach stream to a video element imperatively (avoids ref-timing issues)
  // -------------------------------------------------------------------------
  const attachToVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return {
    stream,
    isVideoOn,
    isAudioOn,
    audioLevel,
    isUserSpeaking,
    isReady,
    error,
    start,
    stop,
    toggleVideo,
    toggleAudio,
    attachToVideo,
  };
}
