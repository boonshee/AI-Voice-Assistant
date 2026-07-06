import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

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

export async function checkApiHealth(baseUrl?: string): Promise<boolean> {
  const base = normalizeBase(baseUrl ?? (await getApiBase()))
  try {
    const response = await fetch(`${base}/health`, { method: 'GET' })
    if (!response.ok) return false
    const body = (await response.json().catch(() => null)) as { status?: string } | null
    return body?.status === 'ok'
  } catch {
    return false
  }
}
