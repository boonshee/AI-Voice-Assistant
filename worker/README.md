# Cloudflare Worker Proxy

与 `server/` 等价的 OpenAI Proxy，Key 仅存 Worker Secret。

## 部署

```bash
npm install -g wrangler
cd worker
wrangler login
wrangler secret put OPENAI_API_KEY
wrangler deploy
```

部署成功后得到地址，例如：`https://voice-ai-proxy.your-subdomain.workers.dev`

## 在 APK 中使用

1. 打开 App → **设置**
2. 填入 Worker 地址（无需末尾斜杠）
3. 点击 **测试连接** → **保存**

## 接口

- `GET /health` → `{ "status": "ok" }`
- `POST /api/chat` → `{ "messages": [...] }` → `{ "content": "..." }`

## 安全说明

- MVP 阶段 CORS 为 `*`，生产环境应收紧 origin
- `OPENAI_API_KEY` 仅通过 `wrangler secret put` 配置，勿写入代码或 Git
