import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { askAI, type ChatMessage } from './ai/openai'
import { useVoiceSession } from './voice/useVoiceSession'
import { speak, stopSpeaking } from './utils/tts'
import { trimMessages } from './utils/trimMessages'
import { PHASE_LABELS } from './voice/types'
import { ChatMessageBubble } from './components/ChatMessage'
import { InputBar } from './components/InputBar'
import { SettingsPanel } from './components/SettingsPanel'
import { checkApiHealth, getApiBase } from './config/apiBase'

export default function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)
  const [apiBaseLabel, setApiBaseLabel] = useState('…')
  const listRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef(messages)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    void getApiBase().then((base) => setApiBaseLabel(base))
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    void (async () => {
      const ok = await checkApiHealth()
      if (!ok) {
        setSetupRequired(true)
        setSettingsOpen(true)
      }
    })()
  }, [])

  const handleVoiceSend = useCallback(async (text: string, signal?: AbortSignal) => {
    setError(null)
    const userMessage: ChatMessage = { role: 'user', content: text }
    const nextMessages = trimMessages([...messagesRef.current, userMessage])
    setMessages(nextMessages)
    const reply = await askAI(nextMessages, signal)
    setMessages([...nextMessages, { role: 'assistant', content: reply }])
    return reply
  }, [])

  const voice = useVoiceSession({
    onSend: handleVoiceSend,
    onInputPreview: setInput,
  })

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, voice.phase])

  const sendText = async () => {
    const text = input.trim()
    if (!text || voice.isBusy) return

    stopSpeaking()
    await voice.stop()
    setError(null)

    const userMessage: ChatMessage = { role: 'user', content: text }
    const nextMessages = trimMessages([...messages, userMessage])
    setMessages(nextMessages)
    setInput('')

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      const reply = await askAI(nextMessages, signal)
      setMessages([...nextMessages, { role: 'assistant', content: reply }])
      void speak(reply)
    } catch (err) {
      if (signal.aborted) return
      const message = err instanceof Error ? err.message : '请求失败，请稍后重试'
      setError(message)
    }
  }

  const handleStopSpeaking = () => {
    if (voice.autoVoiceMode && voice.phase === 'speaking') {
      void voice.skipSpeakingAndContinue()
      return
    }
    stopSpeaking()
  }

  const handleSettingsSaved = (url: string) => {
    setApiBaseLabel(url)
    setSetupRequired(false)
  }

  const displayError = error ?? voice.error

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>Voice AI Assistant</h1>
            <p>语音对话助手 · {apiBaseLabel.replace(/^https?:\/\//, '').slice(0, 32)}</p>
          </div>
          <div className="header-actions">
            <button type="button" className="settings-button" onClick={() => setSettingsOpen(true)}>
              设置
            </button>
            <span className={`phase-pill phase-pill-${voice.phase}`}>{PHASE_LABELS[voice.phase]}</span>
          </div>
        </div>
      </header>

      {setupRequired && (
        <div className="setup-banner">
          请先配置 Proxy 地址（真机需填电脑 IP 或 Worker HTTPS 地址）
          <button type="button" className="setup-banner-btn" onClick={() => setSettingsOpen(true)}>
            去设置
          </button>
        </div>
      )}

      <main className="chat-area" ref={listRef}>
        {messages.length === 0 && !voice.isBusy && (
          <div className="empty-state">
            <p>开启「自动对话」后，像 Siri 一样连续语音聊天</p>
            <p className="empty-hint">真机首次使用请先在右上角「设置」中配置 Proxy</p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessageBubble key={`${message.role}-${index}`} message={message} />
        ))}

        {voice.phase === 'thinking' && (
          <div className="loading-row">
            <span className="loading-dot" />
            AI 思考中...
          </div>
        )}
      </main>

      {displayError && (
        <div className="error-banner">
          {displayError}
          {voice.error && (
            <button type="button" className="error-dismiss" onClick={voice.dismissError}>
              关闭
            </button>
          )}
        </div>
      )}

      <InputBar
        input={input}
        loading={voice.isBusy}
        listening={voice.isListening}
        autoVoiceMode={voice.autoVoiceMode}
        phase={voice.phase}
        onInputChange={setInput}
        onSend={sendText}
        onVoiceStart={voice.start}
        onVoiceStop={voice.stop}
        onAutoVoiceToggle={voice.toggleAutoVoiceMode}
        onStopSpeaking={handleStopSpeaking}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
      />
    </div>
  )
}
