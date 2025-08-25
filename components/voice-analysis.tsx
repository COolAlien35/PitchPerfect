import React, { useEffect, useRef } from 'react';

interface VoiceAnalysisProps {
    onAnalysis: (data: any) => void;
    isInterviewStarted: boolean;
}

const VoiceAnalysis: React.FC<VoiceAnalysisProps> = ({ onAnalysis, isInterviewStarted }) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    
    // Use refs for persistent values to avoid infinite re-renders
    const fillerWordsCountRef = useRef(0);
    const totalWordsRef = useRef(0);
    const speechStartTimeRef = useRef<number | null>(null);
    const lastAnalysisTimeRef = useRef(0);

    useEffect(() => {
        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioStreamRef.current = stream;
                
                // Setup audio analysis
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                
                analyser.fftSize = 256;
                microphone.connect(analyser);
                
                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                // Reset counters when interview starts
                fillerWordsCountRef.current = 0;
                totalWordsRef.current = 0;
                speechStartTimeRef.current = Date.now();
                lastAnalysisTimeRef.current = 0;

                // Start monitoring audio levels
                monitorAudioLevel();
                
            } catch (error) {
                console.error("Error starting audio recording:", error);
            }
        };

        const stopRecording = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };

        const monitorAudioLevel = () => {
            if (!analyserRef.current) return;

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            
            const checkAudioLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    
                    // Calculate volume percentage
                    const volume = Math.min((average / 128) * 100, 100);
                    
                    // Detect speech activity
                    const isSpeaking = average > 20;
                    const currentTime = Date.now();
                    
                    // Only update metrics every 2 seconds to avoid rapid changes
                    if (currentTime - lastAnalysisTimeRef.current > 2000) {
                        lastAnalysisTimeRef.current = currentTime;
                        
                        // Simulate realistic speech patterns
                        if (isSpeaking && speechStartTimeRef.current) {
                            // Estimate words spoken based on speech duration
                            const speechDuration = (currentTime - speechStartTimeRef.current) / 1000; // seconds
                            const estimatedWordsPerSecond = 2.5; // Average speaking rate
                            const newTotalWords = Math.floor(speechDuration * estimatedWordsPerSecond);
                            
                            // Only increase total words if we're actually speaking
                            if (newTotalWords > totalWordsRef.current) {
                                totalWordsRef.current = newTotalWords;
                            }
                            
                            // Calculate WPM based on total words and time
                            const minutesElapsed = speechDuration / 60;
                            const wpm = minutesElapsed > 0 ? Math.round(totalWordsRef.current / minutesElapsed) : 0;
                            
                            // Simulate filler words detection (occasional increases)
                            // 10% chance of detecting a filler word every 2 seconds when speaking
                            if (isSpeaking && Math.random() < 0.1) {
                                fillerWordsCountRef.current += 1;
                            }
                            
                            // Calculate confidence based on volume and consistency
                            let confidence = "Medium";
                            if (volume > 60 && fillerWordsCountRef.current < 3) {
                                confidence = "High";
                            } else if (volume < 30 || fillerWordsCountRef.current > 5) {
                                confidence = "Low";
                            }
                            
                            // Calculate clarity based on WPM and filler words
                            let clarity = "Good";
                            if (wpm > 180 || wpm < 100) {
                                clarity = "Pacing Issue";
                            } else if (fillerWordsCountRef.current > 3) {
                                clarity = "Consider Pausing";
                            }
                            
                            const analysisData = {
                                fillerWords: fillerWordsCountRef.current,
                                wpm: wpm,
                                volume: Math.round(volume),
                                confidence: confidence,
                                clarity: clarity
                            };
                            
                            onAnalysis(analysisData);
                        }
                    }
                }
                
                if (isInterviewStarted) {
                    requestAnimationFrame(checkAudioLevel);
                }
            };
            
            checkAudioLevel();
        };

        if (isInterviewStarted) {
            startRecording();
        } else {
            stopRecording();
        }

        return () => {
            stopRecording();
        };
    }, [isInterviewStarted, onAnalysis]); // Removed problematic dependencies

    // This component no longer renders anything itself
    return null;
};

export default VoiceAnalysis;