/** 播报前去掉 Markdown，避免 TTS 读出符号 */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function waitForVoices(): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve()

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) return Promise.resolve()

  return new Promise((resolve) => {
    const onChange = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange)
      resolve()
    }
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    setTimeout(resolve, 300)
  })
}

export function speak(text: string): Promise<void> {
  const clean = stripMarkdown(text)
  if (!clean.trim()) return Promise.resolve()
  if (!('speechSynthesis' in window)) return Promise.resolve()

  return waitForVoices().then(
    () =>
      new Promise((resolve) => {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(clean)
        utterance.lang = 'zh-CN'
        utterance.rate = 1
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.speak(utterance)
      }),
  )
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window
}
