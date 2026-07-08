# AI Voice Assistant（语音版 ChatGPT）

**客户验收请读 [CUSTOMER_GUIDE.md](CUSTOMER_GUIDE.md)**（含 server 启动、Proxy 填写、完整流程）。

默认 Proxy 方案：**本机 Node.js**（`server/`），Cloudflare Worker **未预部署**。  
APK 下载：GitHub **Actions** → 最新 run → **Artifacts** → `app-debug`。

---

Android 语音助手：语音输入、ChatGPT 多轮对话、语音播报、自动循环。技术栈 Vite + React + Capacitor + Node.js Proxy。

OpenAI Key 只写在 `server/.env`，不进前端、不进 GitHub。

## 目录

- `client/` — 前端与 Android 工程
- `server/` — 后端，提供 `/health` 和 `/api/chat`
- `worker/` — Cloudflare Worker 备选 Proxy

## 环境

Node.js 20+。打 APK 需 JDK 17+、Android SDK（`JAVA_HOME`、`ANDROID_HOME`）。OpenAI Key 验收时自行准备。

## 后端

```powershell
cd server
npm install
copy .env.example .env
```

编辑 `.env` 填入 `OPENAI_API_KEY`，然后：

```powershell
npm start
```

本机访问 `http://localhost:3001/health` 应返回 `{"status":"ok"}`。终端会打印手机可用的局域网地址。

接口：`GET /health`；`POST /api/chat`（body: `{"messages":[{"role":"user","content":"你好"}]}`）。

## 前端（浏览器）

```powershell
cd client
npm install
npm run dev
```

## 构建 APK

```powershell
cd client
npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

产物：`client/android/app/build/outputs/apk/debug/app-debug.apk`

## 手机联调

1. `server` 目录 `npm start`
2. 安装 APK
3. App 设置填 `http://电脑局域网IP:3001` → 测试连接 → 保存
4. 开「自动」，点麦克风连续对话

## GitHub Actions

push 到 `main` 自动构建 APK，在 Actions → Artifacts 下载 `app-debug`。

## 核心功能

- 语音输入（Web + Android 原生识别）
- ChatGPT 多轮记忆
- 语音播报与自动循环
- Android APK

## 安全

- API Key 仅 `server/.env` 或 Worker Secret
- 前端只调 `/api/chat`，不直连 OpenAI

## 不包含

登录、数据库、唤醒词、复杂 UI
