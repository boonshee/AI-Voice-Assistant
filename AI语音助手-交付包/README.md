# 语音助手

React 前端 + Cloudflare Worker 云端 Proxy + Android APK。OpenAI Key 写在 Worker Secret 或 `server/.env`，不要放进 `client`。

**客户默认**：装 APK 即用，有网即可，无需开电脑。对话自动保存在本机。

## 目录

- `client/` — 前端与 Android 工程
- `server/` — 本地调试 Proxy（可选）
- `worker/` — **生产默认** Cloudflare Worker Proxy
- `release/app-debug.apk` — 调试包（须用 Actions 最新构建或本地重新打包）

## 客户使用（3 步）

1. 安装 APK，授予麦克风
2. 开「自动对话」→ 点麦克风（WiFi 或 4G）
3. 无需填 Proxy、无需开电脑

## 维护方部署

见 [`worker/README.md`](worker/README.md) 与 [`CUSTOMER_GUIDE.md`](CUSTOMER_GUIDE.md)。

**GitHub Secrets（构建 APK 必填）**：`VITE_API_BASE_URL`；若启用 Token 还须 `VITE_PROXY_TOKEN`。
