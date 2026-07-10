import type { VoiceAdapter, VoiceListenHandlers } from './types'

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function createWebSpeechAdapter(): VoiceAdapter {
  let recognition: SpeechRecognitionLike | null = null
  let handlers: VoiceListenHandlers | null = null

  return {
    async isSupported() {
      return !!getSpeechRecognitionCtor()
    },

    async requestPermission() {
      if (!getSpeechRecognitionCtor()) return false
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
        return true
      } catch {
        return false
      }
    },

    async start(nextHandlers) {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) {
        nextHandlers.onError('当前浏览器不支持语音识别，请使用 Chrome 或 Android 原生环境')
        return
      }

      handlers = nextHandlers
      recognition?.stop()

      const instance = new Ctor()
      instance.lang = 'zh-CN'
      instance.continuous = false
      instance.interimResults = true

      instance.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i]?.[0]?.transcript ?? ''
        }
        const last = event.results[event.results.length - 1]
        if (last?.isFinal) {
          handlers?.onFinal(transcript.trim())
        } else {
          handlers?.onPartial?.(transcript)
        }
      }

      instance.onerror = (event) => {
        if (event.error === 'no-speech') return
        const message =
          event.error === 'not-allowed'
            ? '麦克风权限被拒绝，请在系统设置中允许录音'
            : `语音识别错误：${event.error}`
        handlers?.onError(message)
      }

      instance.onend = () => {
        recognition = null
      }

      recognition = instance
      instance.start()
    },

    async stop() {
      recognition?.stop()
      recognition = null
      handlers = null
    },
  }
}
