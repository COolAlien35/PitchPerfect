import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Webcam from 'react-webcam';

interface RealTimeAnalysisProps {
    onAnalysis: (data: any) => void;
}

const RealTimeAnalysis: React.FC<RealTimeAnalysisProps> = ({ onAnalysis }) => {
    const webcamRef = useRef<Webcam>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to the Socket.IO server
        socketRef.current = io('http://localhost:3000', { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });

        socketRef.current.on('analysis-result', (data) => {
            onAnalysis(data); // Pass analysis data to parent
        });

        socketRef.current.on('analysis-error', (data) => {
            console.error('Analysis Error:', data?.error || 'Unknown error');
        });

        // Send a frame for analysis every 2 seconds
        const interval = setInterval(() => {
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    try {
                        socketRef.current?.emit('video-frame', imageSrc);
                    } catch (e) {
                        console.error('Failed to emit frame:', e);
                    }
                }
            }
        }, 2000);

        return () => {
            clearInterval(interval);
            socketRef.current?.disconnect();
        };
    }, [onAnalysis]);

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
