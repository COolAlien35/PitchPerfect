// ---------------------------------------------------------------------------
// Interview session finite-state machine hook
// States: idle → setup → recording → evaluating → completed
// ---------------------------------------------------------------------------
"use client"

import { useCallback, useReducer, useRef } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type InterviewPhase =
    | "idle"
    | "setup"
    | "recording"
    | "evaluating"
    | "completed"

export interface InterviewMachineState {
    phase: InterviewPhase
    currentQuestion: number
    totalQuestions: number
    sessionTime: number
    isAvatarSpeaking: boolean
    isUserSpeaking: boolean
    isAudioOn: boolean
    isVideoOn: boolean
    isSpeakerOn: boolean
    userResponses: string[]
    questionStartTimes: number[]
    sessionStartTime: number | null
    audioLevel: number
    confidenceScore: number
}

type Action =
    | { type: "START_SETUP" }
    | { type: "START_INTERVIEW"; totalQuestions: number }
    | { type: "AVATAR_SPEAK_START" }
    | { type: "AVATAR_SPEAK_END" }
    | { type: "USER_SPEAK_START" }
    | { type: "USER_SPEAK_END" }
    | { type: "SET_RESPONSE"; index: number; transcript: string }
    | { type: "NEXT_QUESTION" }
    | { type: "FINISH" }
    | { type: "TOGGLE_AUDIO" }
    | { type: "TOGGLE_VIDEO" }
    | { type: "TOGGLE_SPEAKER" }
    | { type: "SET_AUDIO_LEVEL"; level: number }
    | { type: "SET_CONFIDENCE"; score: number }
    | { type: "TICK" }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const initialState: InterviewMachineState = {
    phase: "idle",
    currentQuestion: 0,
    totalQuestions: 0,
    sessionTime: 0,
    isAvatarSpeaking: false,
    isUserSpeaking: false,
    isAudioOn: true,
    isVideoOn: true,
    isSpeakerOn: true,
    userResponses: [],
    questionStartTimes: [],
    sessionStartTime: null,
    audioLevel: 0,
    confidenceScore: 75,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function interviewReducer(
    state: InterviewMachineState,
    action: Action
): InterviewMachineState {
    switch (action.type) {
        case "START_SETUP":
            return { ...state, phase: "setup" }

        case "START_INTERVIEW":
            return {
                ...state,
                phase: "recording",
                totalQuestions: action.totalQuestions,
                sessionStartTime: Date.now(),
                questionStartTimes: [Date.now()],
                userResponses: new Array(action.totalQuestions).fill(""),
            }

        case "AVATAR_SPEAK_START":
            return { ...state, isAvatarSpeaking: true, isUserSpeaking: false }

        case "AVATAR_SPEAK_END":
            return { ...state, isAvatarSpeaking: false }

        case "USER_SPEAK_START":
            return { ...state, isUserSpeaking: true }

        case "USER_SPEAK_END":
            return { ...state, isUserSpeaking: false }

        case "SET_RESPONSE": {
            const responses = [...state.userResponses]
            responses[action.index] = action.transcript
            return { ...state, userResponses: responses }
        }

        case "NEXT_QUESTION": {
            const next = state.currentQuestion + 1
            if (next >= state.totalQuestions) {
                return { ...state, phase: "evaluating" }
            }
            return {
                ...state,
                currentQuestion: next,
                questionStartTimes: [...state.questionStartTimes, Date.now()],
                isUserSpeaking: false,
            }
        }

        case "FINISH":
            return { ...state, phase: "completed" }

        case "TOGGLE_AUDIO":
            return { ...state, isAudioOn: !state.isAudioOn }
        case "TOGGLE_VIDEO":
            return { ...state, isVideoOn: !state.isVideoOn }
        case "TOGGLE_SPEAKER":
            return { ...state, isSpeakerOn: !state.isSpeakerOn }

        case "SET_AUDIO_LEVEL":
            return { ...state, audioLevel: action.level }

        case "SET_CONFIDENCE":
            return { ...state, confidenceScore: action.score }

        case "TICK":
            return { ...state, sessionTime: state.sessionTime + 1 }

        default:
            return state
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useInterviewMachine() {
    const [state, dispatch] = useReducer(interviewReducer, initialState)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const startSetup = useCallback(() => dispatch({ type: "START_SETUP" }), [])

    const startInterview = useCallback((totalQuestions: number) => {
        dispatch({ type: "START_INTERVIEW", totalQuestions })
        // begin session timer
        timerRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000)
    }, [])

    const nextQuestion = useCallback(() => dispatch({ type: "NEXT_QUESTION" }), [])

    const finish = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        dispatch({ type: "FINISH" })
    }, [])

    const setResponse = useCallback(
        (index: number, transcript: string) =>
            dispatch({ type: "SET_RESPONSE", index, transcript }),
        []
    )

    const avatarSpeakStart = useCallback(
        () => dispatch({ type: "AVATAR_SPEAK_START" }),
        []
    )
    const avatarSpeakEnd = useCallback(
        () => dispatch({ type: "AVATAR_SPEAK_END" }),
        []
    )
    const userSpeakStart = useCallback(
        () => dispatch({ type: "USER_SPEAK_START" }),
        []
    )
    const userSpeakEnd = useCallback(
        () => dispatch({ type: "USER_SPEAK_END" }),
        []
    )

    const toggleAudio = useCallback(() => dispatch({ type: "TOGGLE_AUDIO" }), [])
    const toggleVideo = useCallback(() => dispatch({ type: "TOGGLE_VIDEO" }), [])
    const toggleSpeaker = useCallback(() => dispatch({ type: "TOGGLE_SPEAKER" }), [])

    const setAudioLevel = useCallback(
        (level: number) => dispatch({ type: "SET_AUDIO_LEVEL", level }),
        []
    )
    const setConfidence = useCallback(
        (score: number) => dispatch({ type: "SET_CONFIDENCE", score }),
        []
    )

    return {
        state,
        startSetup,
        startInterview,
        nextQuestion,
        finish,
        setResponse,
        avatarSpeakStart,
        avatarSpeakEnd,
        userSpeakStart,
        userSpeakEnd,
        toggleAudio,
        toggleVideo,
        toggleSpeaker,
        setAudioLevel,
        setConfidence,
    } as const
}
