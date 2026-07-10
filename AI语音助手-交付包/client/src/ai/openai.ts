import { getApiBase } from '../config/apiBase'
import { getProxyAuthHeaders } from '../config/proxyAuth'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
}

interface ChatResponse {
  content?: string
  error?: string
  detail?: string
}

function getErrorMessage(status: number, body: ChatResponse): string {
  if (status === 401 || status === 403) return 'Proxy 鉴权失败，请检查 VITE_PROXY_TOKEN 配置'
  if (status === 429) return '请求过于频繁，请稍后再试'
  if (status === 422) return body.detail || '请求格式错误'
  if (status >= 500) return '服务端异常，请稍后重试'
  return body.detail || body.error || `请求失败 (${status})`
}

export async function askAI(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  const base = await getApiBase()
  let response: Response

  try {
    response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getProxyAuthHeaders() },
      body: JSON.stringify({ messages }),
      signal,
    })
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new Error('请求已取消')
    }
    throw new Error('无法连接云端 Proxy，请检查网络或在设置中修改地址')
  }

  const body = (await response.json().catch(() => ({}))) as ChatResponse

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, body))
  }

  return body.content ?? '无回复'
}
