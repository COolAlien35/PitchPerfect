import React, { useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';

interface RealTimeAnalysisProps {
    onAnalysis: (data: any) => void;
    /** Override the WebSocket URL. Defaults to NEXT_PUBLIC_API_URL. */
    sessionId?: string;
}

/**
 * Captures webcam frames every 2 seconds and sends them to the FastAPI
 * WebSocket for facial-emotion analysis.  Results are passed to the parent
 * via `onAnalysis`.
 *
 * Transport: native browser WebSocket (replaces legacy Socket.IO client).
 */
const RealTimeAnalysis: React.FC<RealTimeAnalysisProps> = ({
    onAnalysis,
    sessionId = 'default',
}) => {
    const webcamRef = useRef<Webcam>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Stable reference so the interval closure always calls the latest callback.
    const onAnalysisRef = useRef(onAnalysis);
    useEffect(() => {
        onAnalysisRef.current = onAnalysis;
    }, [onAnalysis]);

    const connect = useCallback(() => {
        // Derive WS URL from the public API base URL (e.g. http://localhost:8000 → ws://localhost:8000)
        const apiBase =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = apiBase
            .replace(/^https:/, 'wss:')
            .replace(/^http:/, 'ws:');

        const ws = new WebSocket(
            `${wsUrl}/ws/interview/${sessionId}`
        );

        ws.onopen = () => {
            console.log('[RealTimeAnalysis] WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'analysis_result') {
                    onAnalysisRef.current(msg);
                } else if (msg.type === 'error') {
                    console.error('[RealTimeAnalysis] Server error:', msg.detail);
                }
            } catch (e) {
                console.error('[RealTimeAnalysis] Failed to parse message:', e);
            }
        };

        ws.onerror = (err) => {
            console.error('[RealTimeAnalysis] WebSocket error:', err);
        };

        ws.onclose = () => {
            console.log('[RealTimeAnalysis] WebSocket closed');
        };

        wsRef.current = ws;
    }, [sessionId]);

    useEffect(() => {
        connect();

        // Send a video frame every 2 seconds (same cadence as the old Socket.IO version)
        intervalRef.current = setInterval(() => {
            if (webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    // Strip data-URL prefix ("data:image/jpeg;base64,") — backend expects raw base64
                    const base64 = imageSrc.includes(',')
                        ? imageSrc.split(',')[1]
                        : imageSrc;

                    try {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'video_frame',
                                data: base64,
                                metadata: {},
                            })
                        );
                    } catch (e) {
                        console.error('[RealTimeAnalysis] Failed to send frame:', e);
                    }
                }
            }
        }, 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-auto rounded-lg"
                mirrored
            />
        </div>
    );
};

export default RealTimeAnalysis;
