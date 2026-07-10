/** 构建时注入的 Proxy 门禁 Token，与 Worker/Server 的 PROXY_AUTH_TOKEN 对应 */
export function getProxyAuthHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_PROXY_TOKEN
  if (typeof token === 'string' && token.trim()) {
    return { 'X-Proxy-Token': token.trim() }
  }
  return {}
}
