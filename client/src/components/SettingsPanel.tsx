import { useEffect, useState } from 'react'
import {
  checkApiHealth,
  clearApiBase,
  getApiBase,
  getDefaultApiBase,
  isValidProxyUrl,
  setApiBase,
} from '../config/apiBase'

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: (url: string) => void
}

export function SettingsPanel({ open, onClose, onSaved }: Props) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) return

    void (async () => {
      setUrl(await getApiBase())
      setStatus('idle')
      setMessage('')
    })()
  }, [open])

  if (!open) return null

  const validateUrl = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return '请输入 Proxy 地址'
    if (!isValidProxyUrl(trimmed)) return '地址须以 http:// 或 https:// 开头'
    return null
  }

  const handleTest = async () => {
    const validationError = validateUrl(url)
    if (validationError) {
      setMessage(validationError)
      setStatus('fail')
      return
    }

    setStatus('checking')
    setMessage('正在检测连接…')
    const result = await checkApiHealth(url.trim())
    if (result.ok) {
      setStatus('ok')
      setMessage('连接成功，可以保存')
    } else {
      setStatus('fail')
      setMessage(`无法连接：${result.error}。请确认 server 已启动且地址正确`)
    }
  }

  const handleSave = async () => {
    const validationError = validateUrl(url)
    if (validationError) {
      setMessage(validationError)
      setStatus('fail')
      return
    }

    setStatus('checking')
    const result = await checkApiHealth(url.trim())
    if (!result.ok) {
      setStatus('fail')
      setMessage(`保存失败：${result.error}`)
      return
    }

    await setApiBase(url.trim())
    setStatus('ok')
    setMessage('已保存')
    onSaved?.(url.trim())
    onClose()
  }

  const handleReset = async () => {
    await clearApiBase()
    const fallback = getDefaultApiBase()
    setUrl(fallback)
    setStatus('idle')
    setMessage('已恢复默认地址')
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <h2>Proxy 设置</h2>
        <p className="settings-desc">
          真机 APK 需填写电脑局域网 IP 或 Cloudflare Worker 地址，例如：
          <br />
          <code>http://192.168.1.100:3001</code>
        </p>

        <label className="settings-label" htmlFor="proxy-url">
          后端 Proxy 地址
        </label>
        <input
          id="proxy-url"
          className="text-input settings-input"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="http://192.168.1.100:3001"
        />

        {message && <p className={`settings-status settings-status-${status}`}>{message}</p>}

        <div className="settings-actions">
          <button type="button" className="settings-btn" onClick={handleTest} disabled={status === 'checking'}>
            测试连接
          </button>
          <button type="button" className="settings-btn settings-btn-primary" onClick={handleSave}>
            保存
          </button>
          <button type="button" className="settings-btn" onClick={handleReset}>
            恢复默认
          </button>
          <button type="button" className="settings-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
