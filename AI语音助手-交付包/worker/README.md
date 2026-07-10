# Cloudflare Worker Proxy

与 `server/` 等价的 OpenAI Proxy，Key 仅存 Worker Secret。  
**客户默认方案**：部署 Worker 后，APK 构建时预置 HTTPS 地址，装完即用，无需开电脑。

## 部署

```bash
npm install -g wrangler
cd worker
wrangler login
wrangler secret put OPENAI_API_KEY
# 可选：防滥用门禁（与 APK 构建 VITE_PROXY_TOKEN 一致，双端须同时配置）
wrangler secret put PROXY_AUTH_TOKEN
wrangler deploy
```

> **Token 配对**：若设置了 `PROXY_AUTH_TOKEN`，GitHub Secret `VITE_PROXY_TOKEN` 必须填相同值，否则 APK 请求返回 401。

部署成功后得到地址，例如：`https://voice-ai-proxy.your-subdomain.workers.dev`

## 可选：KV 限流

每分钟 60 次（与 Express rateLimit 对齐）：

```bash
wrangler kv namespace create RATE_LIMIT_KV
# 将返回的 id 填入 wrangler.toml 中 [[kv_namespaces]]
wrangler deploy
```

未绑定 KV 时仅 Token 鉴权，不限流。

## 在 APK 中使用

**推荐（零配置）**：构建 APK 时设置 `VITE_API_BASE_URL` 为 Worker 地址，客户装完直接用。

**高级调试**：App → 设置 → 修改 Proxy 地址 → 测试连接 → 保存

## 接口

- `GET /health` → `{ "status": "ok" }`
- `POST /api/chat` → `{ "messages": [...] }` → `{ "content": "..." }`
  - 若配置了 `PROXY_AUTH_TOKEN`，请求头需带 `X-Proxy-Token`

## 安全说明

- `OPENAI_API_KEY` 仅通过 `wrangler secret put` 配置，勿写入代码或 Git
- MVP 阶段 CORS 为 `*`，绑定自定义域名后可收紧 origin
