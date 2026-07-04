# 🤖 AI Voice Assistant（语音版 ChatGPT）

---

## 🎯 项目简介
这是一个 AI 语音助手 Android App（类似 ChatGPT + Siri）

用户可以通过语音与 AI 对话，并获得语音回复。

---

## 💰 项目预算
500（完整可运行 MVP 版本）

---

## 🎯 核心功能

- 🎤 语音输入（SpeechRecognition）
- 🤖 ChatGPT AI 对话（OpenAI API，多轮记忆）
- 🔊 AI语音播报（SpeechSynthesis）
- 🔁 自动语音循环（类似 Siri 助手模式）
- 📱 Android APK（Capacitor）

---

## 🧠 技术架构

- Vite + React（前端）
- Capacitor Android（APK打包）
- Node.js Proxy / Cloudflare Worker（API安全层）

结构：

App（前端）
  ↓
Backend Proxy（Node.js）
  ↓
OpenAI API

---

## 🔐 API安全要求（非常重要）

❌ 禁止：
- OpenAI API Key 写在前端
- API Key 提交到 GitHub
- APK 内硬编码 Key

✔ 必须：
- 使用 backend proxy
- API Key 存在 server environment
- 前端只调用 API 接口

---

## ⚙️ 后端要求

- Node.js Express 或 Cloudflare Worker
- 只做 API 转发
- 不要数据库
- 不要登录系统
- 不要复杂逻辑

---

## 📱 前端要求

- Vite + React
- Capacitor Android
- webDir = dist
- 移动端适配

---

## 🚀 APK构建流程

必须保证以下流程可运行：

1. npm install
2. npm run build
3. npx cap sync android
4. npx cap open android

---

## 📦 交付内容

✔ 完整 GitHub 源代码  
✔ 可 clone 直接运行  
✔ Vite + Capacitor 项目  
✔ 可成功 build APK  

---

## ❌ 不包含功能

- 登录系统
- 数据库
- 唤醒词（Hey AI）
- CI/CD自动部署
- 复杂UI设计

---

## 🎯 最终目标

👉 手机打开 APK 即可：
- 说话 → AI回复 → 语音播报
- 可连续语音对话（类似 Siri）
