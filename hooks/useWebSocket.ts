/**
 * hooks/useWebSocket.ts
 *
 * Manages a Socket.IO connection to the PitchPerfect Node.js relay server.
 *
 * Responsibilities:
 *  - Connect / disconnect lifecycle tied to component or session lifecycle
 *  - Exponential-backoff reconnection handling
 *  - Typed event helpers: sendVideoFrame, sendAudioChunk, sendTranscript
 *  - Incoming event subscription with automatic teardown
 *  - Connection state exposed for UI (connecting / connected / error / offline)
 *
 * Usage:
 *   const { connectionState, sendVideoFrame, sendAudioChunk, on } =
 *     useWebSocket({ sessionId, autoConnect: true });
 *
 *   useEffect(() => {
 *     return on('facial_analysis', (data) => {
 *       updateEmotionData(data);
 *     });
 *   }, [on]);
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface WebSocketOptions {
  /** Session ID to tag outgoing events with */
  sessionId: string;
  /** WebSocket server URL — defaults to NEXT_PUBLIC_WS_URL or localhost:3001 */
  serverUrl?: string;
  /** Connect immediately on mount — defaults to false */
  autoConnect?: boolean;
  /** Max reconnection attempts — defaults to 5 */
  maxReconnectAttempts?: number;
}

export interface VideoFramePayload {
  sessionId: string;
  frame: string;       // base64-encoded
  timestamp: number;
}

export interface AudioChunkPayload {
  sessionId: string;
  chunk: ArrayBuffer | string;  // raw or base64
  timestamp: number;
}

export interface TranscriptPayload {
  sessionId: string;
  questionIndex: number;
  transcript: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWebSocket(options: WebSocketOptions) {
  const {
    sessionId,
    serverUrl,
    autoConnect = false,
    maxReconnectAttempts = 5,
  } = options;

  const url =
    serverUrl ??
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001'
      : 'http://localhost:3001');

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Connect
  // -------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnectionState('connecting');
    setError(null);

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: false,           // We manage reconnection ourselves
      timeout: 10_000,
      query: { sessionId },
    });

    socket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      setConnectionState('connected');
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      setConnectionState('disconnected');

      // Attempt automatic reconnection with exponential back-off
      if (
        reason !== 'io client disconnect' &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1_000 * 2 ** reconnectAttemptsRef.current, 30_000);
        setConnectionState('reconnecting');
        setTimeout(() => connect(), delay);
      }
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setConnectionState('error');
      }
    });

    socketRef.current = socket;
  }, [url, sessionId, maxReconnectAttempts]);

  // -------------------------------------------------------------------------
  // Disconnect
  // -------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnectionState('idle');
  }, []);

  // -------------------------------------------------------------------------
  // Auto-connect
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [autoConnect, connect]);

  // -------------------------------------------------------------------------
  // Typed senders
  // -------------------------------------------------------------------------
  const sendVideoFrame = useCallback(
    (frame: string) => {
      if (!socketRef.current?.connected) return;
      const payload: VideoFramePayload = {
        sessionId,
        frame,
        timestamp: Date.now(),
      };
      socketRef.current.emit('video_frame', payload);
    },
    [sessionId]
  );

  const sendAudioChunk = useCallback(
    (chunk: ArrayBuffer | string) => {
      if (!socketRef.current?.connected) return;
      const payload: AudioChunkPayload = {
        sessionId,
        chunk,
        timestamp: Date.now(),
      };
      socketRef.current.emit('audio_chunk', payload);
    },
    [sessionId]
  );

  const sendTranscript = useCallback(
    (questionIndex: number, transcript: string) => {
      if (!socketRef.current?.connected) return;
      const payload: TranscriptPayload = { sessionId, questionIndex, transcript };
      socketRef.current.emit('transcript', payload);
    },
    [sessionId]
  );

  // -------------------------------------------------------------------------
  // Generic event subscription — returns a cleanup function
  // -------------------------------------------------------------------------
  const on = useCallback(
    <T = unknown>(event: string, handler: (data: T) => void): (() => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    []
  );

  // -------------------------------------------------------------------------
  // Emit a raw event
  // -------------------------------------------------------------------------
  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    connectionState,
    error,
    connect,
    disconnect,
    sendVideoFrame,
    sendAudioChunk,
    sendTranscript,
    on,
    emit,
    isConnected: connectionState === 'connected',
  };
}
