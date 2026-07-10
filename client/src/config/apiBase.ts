import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { getProxyAuthHeaders } from './proxyAuth'

const STORAGE_KEY = 'voice_ai_api_base'
const DEFAULT_BASE = 'http://localhost:3001'

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function getDefaultApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return normalizeBase(fromEnv)
  }
  return DEFAULT_BASE
}

export function isValidProxyUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim())
}

async function readStoredBase(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (value) return normalizeBase(value)
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return normalizeBase(stored)
  } catch {
    // WebView localStorage 不可用时忽略
  }

  return null
}

async function writeStoredBase(url: string): Promise<void> {
  const normalized = normalizeBase(url)

  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: STORAGE_KEY, value: normalized })
  }

  try {
    localStorage.setItem(STORAGE_KEY, normalized)
  } catch {
    // 浏览器隐私模式等场景下 localStorage 可能不可用
  }
}

async function removeStoredBase(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: STORAGE_KEY })
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export async function getApiBase(): Promise<string> {
  const stored = await readStoredBase()
  return stored ?? getDefaultApiBase()
}

export async function setApiBase(url: string): Promise<void> {
  await writeStoredBase(url)
}

export async function clearApiBase(): Promise<void> {
  await removeStoredBase()
}

export type HealthCheckResult = { ok: true } | { ok: false; error: string }

export type ChatProbeResult =
  | { ok: true }
  | { ok: false; error: string; authFailure?: boolean }

export type ConnectivityCheckResult =
  | { ok: true }
  | { ok: false; error: string; authFailure?: boolean; healthOk?: boolean }

export async function checkApiHealth(baseUrl?: string): Promise<HealthCheckResult> {
  const base = normalizeBase(baseUrl ?? (await getApiBase()))
  try {
    const response = await fetch(`${base}/health`, { method: 'GET' })
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }
    const body = (await response.json().catch(() => null)) as { status?: string } | null
    if (body?.status === 'ok') return { ok: true }
    return { ok: false, error: '响应格式异常' }
  } catch (err) {
    const message = err instanceof Error ? err.message : '网络请求失败'
    return { ok: false, error: message }
  }
}

/** 最小对话探针：health 通过不代表 chat 可用（如 Worker 启用了 PROXY_AUTH_TOKEN） */
export async function checkApiChatProbe(baseUrl?: string): Promise<ChatProbeResult> {
  const base = normalizeBase(baseUrl ?? (await getApiBase()))
  try {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getProxyAuthHeaders() },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
    })

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        authFailure: true,
        error: '云端鉴权失败，当前安装包与服务器 Token 不一致，请联系客服获取新版',
      }
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string; error?: string }
      return { ok: false, error: body.detail || body.error || `HTTP ${response.status}` }
    }

    const body = (await response.json().catch(() => null)) as { content?: string } | null
    if (body?.content) return { ok: true }
    return { ok: false, error: '对话接口响应异常' }
  } catch (err) {
    const message = err instanceof Error ? err.message : '网络请求失败'
    return { ok: false, error: message }
  }
}

/** 首启/设置用：先 health 再 chat，区分网络问题与鉴权问题 */
export async function checkApiConnectivity(baseUrl?: string): Promise<ConnectivityCheckResult> {
  const health = await checkApiHealth(baseUrl)
  if (!health.ok) {
    return { ok: false, error: health.error, healthOk: false }
  }

  const chat = await checkApiChatProbe(baseUrl)
  if (!chat.ok) {
    return { ok: false, error: chat.error, authFailure: chat.authFailure, healthOk: true }
  }

  return { ok: true }
}
