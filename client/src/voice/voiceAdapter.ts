import { Capacitor } from '@capacitor/core'
import { createNativeSpeechAdapter } from './nativeSpeechAdapter'
import { createWebSpeechAdapter } from './webSpeechAdapter'
import type { VoiceAdapter } from './types'

let cachedAdapter: VoiceAdapter | null = null

export function getVoiceAdapter(): VoiceAdapter {
  if (!cachedAdapter) {
    cachedAdapter = Capacitor.isNativePlatform()
      ? createNativeSpeechAdapter()
      : createWebSpeechAdapter()
  }
  return cachedAdapter
}
