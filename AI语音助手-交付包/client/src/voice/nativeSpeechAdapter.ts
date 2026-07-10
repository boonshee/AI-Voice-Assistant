import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import type { PluginListenerHandle } from '@capacitor/core'
import type { VoiceAdapter, VoiceListenHandlers } from './types'

export function createNativeSpeechAdapter(): VoiceAdapter {
  let partialHandle: PluginListenerHandle | null = null
  let stateHandle: PluginListenerHandle | null = null
  let handlers: VoiceListenHandlers | null = null
  let latestPartial = ''
  let finalized = false

  const removeListeners = async () => {
    if (partialHandle) {
      await partialHandle.remove()
      partialHandle = null
    }
    if (stateHandle) {
      await stateHandle.remove()
      stateHandle = null
    }
  }

  const finalizeIfNeeded = () => {
    if (finalized || !handlers) return
    const text = latestPartial.trim()
    if (!text) return

    finalized = true
    const activeHandlers = handlers
    handlers = null
    activeHandlers.onFinal(text)
  }

  return {
    async isSupported() {
      try {
        const { available } = await SpeechRecognition.available()
        return available
      } catch {
        return false
      }
    },

    async requestPermission() {
      const result = await SpeechRecognition.requestPermissions()
      return result.speechRecognition === 'granted'
    },

    async start(nextHandlers) {
      handlers = nextHandlers
      latestPartial = ''
      finalized = false
      await removeListeners()

      const granted = await this.requestPermission()
      if (!granted) {
        handlers.onError('麦克风权限被拒绝，请在系统设置中允许录音')
        handlers = null
        return
      }

      partialHandle = await SpeechRecognition.addListener('partialResults', (event) => {
        const text = event.matches?.[0] ?? ''
        if (!text) return
        latestPartial = text
        handlers?.onPartial?.(text)
      })

      stateHandle = await SpeechRecognition.addListener('listeningState', (event) => {
        if (event.status === 'stopped') {
          finalizeIfNeeded()
        }
      })

      await SpeechRecognition.start({
        language: 'zh-CN',
        partialResults: true,
        popup: false,
        maxResults: 1,
      })
    },

    async stop() {
      try {
        await SpeechRecognition.stop()
      } catch {
        // 忽略重复 stop
      }

      finalizeIfNeeded()
      await removeListeners()
      latestPartial = ''
      handlers = null
    },
  }
}
