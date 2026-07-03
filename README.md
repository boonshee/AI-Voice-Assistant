# 🤖 AI Voice Assistant（语音版ChatGPT）

---

## 🎯 项目简介
这是一个 AI 语音助手 Android APP（类似 ChatGPT + Siri）

---

## 🎯 核心功能

- 🎤 语音输入（SpeechRecognition）
- 🤖 ChatGPT AI 回复（OpenAI API）
- 🔊 语音播报（SpeechSynthesis）
- 🔁 自动语音对话（类似Siri循环模式）

---

## 🧠 技术架构

- Vite + React（前端）
- Capacitor Android（打包APK）
- Node.js Proxy（API安全层）

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
- APK内硬编码 Key

✔ 必须：
- 使用 backend proxy
- API Key 存在 server environment
- 前端只调用接口

---

## ⚙️ 后端要求

- Node.js Express 或 Fastify
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

✔ 完整源代码  
✔ 可运行 Vite 项目  
✔ Capacitor Android 项目  
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

👉 一个可以运行的 Android AI语音助手 APK
