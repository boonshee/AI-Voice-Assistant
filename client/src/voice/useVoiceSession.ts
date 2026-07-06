import { useCallback, useEffect, useReducer, useRef } from 'react'
import { speak, stopSpeaking } from '../utils/tts'
import { getVoiceAdapter } from './voiceAdapter'
import type { VoicePhase } from './types'

const RESTART_DELAY_MS = 300

interface State {
  phase: VoicePhase
  error: string | null
  partialText: string
  autoVoiceMode: boolean
}

type Action =
  | { type: 'SET_AUTO'; value: boolean }
  | { type: 'SET_PHASE'; phase: VoicePhase }
  | { type: 'SET_PARTIAL'; text: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_AUTO':
      return { ...state, autoVoiceMode: action.value }
    case 'SET_PHASE':
      return { ...state, phase: action.phase }
    case 'SET_PARTIAL':
      return { ...state, partialText: action.text }
    case 'SET_ERROR':
      return { ...state, phase: 'error', error: action.message }
    case 'CLEAR_ERROR':
      return { ...state, phase: 'idle', error: null }
    default:
      return state
  }
}

interface Options {
  onSend: (text: string, signal?: AbortSignal) => Promise<string>
  onInputPreview?: (text: string) => void
}

export function useVoiceSession({ onSend, onInputPreview }: Options) {
  const [state, dispatch] = useReducer(reducer, {
    phase: 'idle',
    error: null,
    partialText: '',
    autoVoiceMode: true,
  })

  const adapterRef = useRef(getVoiceAdapter())
  const sessionActiveRef = useRef(false)
  const phaseRef = useRef<VoicePhase>('idle')
  const autoVoiceRef = useRef(true)
  const onSendRef = useRef(onSend)
  const onInputPreviewRef = useRef(onInputPreview)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    phaseRef.current = state.phase
  }, [state.phase])

  useEffect(() => {
    autoVoiceRef.current = state.autoVoiceMode
  }, [state.autoVoiceMode])

  useEffect(() => {
    onSendRef.current = onSend
  }, [onSend])

  useEffect(() => {
    onInputPreviewRef.current = onInputPreview
  }, [onInputPreview])

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const startListeningInternal = useCallback(async () => {
    if (!sessionActiveRef.current) return
    if (phaseRef.current === 'thinking' || phaseRef.current === 'speaking') return

    await adapterRef.current.stop()

    const supported = await adapterRef.current.isSupported()
    if (!supported) {
      dispatch({ type: 'SET_ERROR', message: '当前环境不支持语音识别' })
      sessionActiveRef.current = false
      return
    }

    dispatch({ type: 'CLEAR_ERROR' })
    dispatch({ type: 'SET_PHASE', phase: 'listening' })

    await adapterRef.current.start({
      onPartial: (partial) => {
        dispatch({ type: 'SET_PARTIAL', text: partial })
        onInputPreviewRef.current?.(partial)
      },
      onFinal: (finalText) => {
        void (async () => {
          if (!sessionActiveRef.current) return

          const trimmed = finalText.trim()
          dispatch({ type: 'SET_PARTIAL', text: trimmed })
          onInputPreviewRef.current?.(trimmed)

          if (!trimmed) {
            if (autoVoiceRef.current && sessionActiveRef.current) {
              await delay(RESTART_DELAY_MS)
              if (sessionActiveRef.current) await startListeningInternal()
            } else {
              dispatch({ type: 'SET_PHASE', phase: 'idle' })
            }
            return
          }

          if (!autoVoiceRef.current) {
            sessionActiveRef.current = false
            await adapterRef.current.stop()
            dispatch({ type: 'SET_PHASE', phase: 'idle' })
            return
          }

          await adapterRef.current.stop()
          dispatch({ type: 'SET_PHASE', phase: 'thinking' })

          abortControllerRef.current?.abort()
          abortControllerRef.current = new AbortController()
          const signal = abortControllerRef.current.signal

          try {
            const reply = await onSendRef.current(trimmed, signal)
            if (!sessionActiveRef.current || signal.aborted) return

            dispatch({ type: 'SET_PHASE', phase: 'speaking' })
            dispatch({ type: 'SET_PARTIAL', text: '' })
            onInputPreviewRef.current?.('')

            await speak(reply)
            if (!sessionActiveRef.current) return

            if (autoVoiceRef.current) {
              await delay(RESTART_DELAY_MS)
              if (sessionActiveRef.current) await startListeningInternal()
            } else {
              dispatch({ type: 'SET_PHASE', phase: 'idle' })
            }
          } catch (err) {
            if (signal.aborted) {
              dispatch({ type: 'SET_PHASE', phase: 'idle' })
              return
            }
            const message = err instanceof Error ? err.message : '语音对话失败，请重试'
            dispatch({ type: 'SET_ERROR', message })
            sessionActiveRef.current = false
          }
        })()
      },
      onError: (message) => {
        dispatch({ type: 'SET_ERROR', message })
        sessionActiveRef.current = false
      },
    })
  }, [])

  const stopSession = useCallback(async () => {
    sessionActiveRef.current = false
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    stopSpeaking()
    await adapterRef.current.stop()
    dispatch({ type: 'SET_PHASE', phase: 'idle' })
    dispatch({ type: 'SET_PARTIAL', text: '' })
    onInputPreviewRef.current?.('')
  }, [])

  const start = useCallback(async () => {
    if (phaseRef.current === 'thinking' || phaseRef.current === 'speaking') return

    sessionActiveRef.current = true
    stopSpeaking()
    await adapterRef.current.stop()
    await startListeningInternal()
  }, [startListeningInternal])

  const stop = useCallback(async () => {
    await stopSession()
  }, [stopSession])

  const skipSpeakingAndContinue = useCallback(async () => {
    if (phaseRef.current !== 'speaking') {
      stopSpeaking()
      return
    }

    stopSpeaking()

    if (!sessionActiveRef.current || !autoVoiceRef.current) {
      dispatch({ type: 'SET_PHASE', phase: 'idle' })
      return
    }

    await delay(RESTART_DELAY_MS)
    if (sessionActiveRef.current) await startListeningInternal()
  }, [startListeningInternal])

  const toggleAutoVoiceMode = useCallback((value: boolean) => {
    dispatch({ type: 'SET_AUTO', value })
  }, [])

  const dismissError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  return {
    phase: state.phase,
    error: state.error,
    partialText: state.partialText,
    autoVoiceMode: state.autoVoiceMode,
    isBusy: state.phase === 'thinking' || state.phase === 'speaking',
    isListening: state.phase === 'listening',
    start,
    stop,
    skipSpeakingAndContinue,
    toggleAutoVoiceMode,
    dismissError,
  }
}
