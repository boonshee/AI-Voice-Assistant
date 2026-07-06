# 环境自查报告

执行时间：2026-07-06

## 摘要

| 类别 | 结果 |
|------|------|
| 源码与构建 | **通过** |
| 本机环境修复 | **已完成** |
| Server 健康检查 | **通过** |
| OpenAI 真实对话 | **跳过**（`.env` 为占位 Key） |
| APK 命令行构建 | **通过** |
| 真机语音验收 | **待用户实测** |

---

## 阶段 1：环境修复

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| JAVA_HOME | JDK 8 (`Eclipse Adoptium`) | **JDK 25** (`C:\Program Files\Java\jdk-25`) |
| ANDROID_HOME | 未设置 | **D:\JAVA**（完整 Android SDK） |
| server/.env | 不存在 | 已从 `.env.example` 创建（占位 Key） |
| Android Studio | 未在默认路径找到 | 未定位；可用 `npx cap open android` 或命令行 `gradlew` |

---

## 阶段 2：构建与服务

| 检查项 | 结果 |
|--------|------|
| `npm run build` (client) | ✅ tsc + vite 成功 |
| `dist/index.html` | ✅ 存在 |
| `npx cap sync android` | ✅ 2 插件：speech-recognition + preferences |
| `npm start` (server) | ✅ 监听 `http://0.0.0.0:3001` |
| `GET /health` | ✅ `{"status":"ok"}` |
| `POST /api/chat` | ⏭ 跳过（占位 Key 返回 500，属预期） |

Server 打印的局域网地址示例：`http://10.21.106.94:3001`

---

## 阶段 3：APK 构建

| 检查项 | 结果 |
|--------|------|
| `gradlew assembleDebug` | ✅ BUILD SUCCESSFUL |
| `app-debug.apk` | ✅ 约 3.6 MB |

**构建过程中修复的问题（已写入项目）：**

1. Gradle 8.2.1 不支持 JDK 25 → 升级至 **Gradle 8.14.4**
2. Gradle 官方源下载超时 → `gradle-wrapper.properties` 使用腾讯云镜像
3. 项目路径含中文 → `gradle.properties` 添加 `android.overridePathCheck=true`

---

## 阶段 4：静态回归（对照 ACCEPTANCE.md）

### 可自动化验证 — 通过

| 验收项 | 状态 | 依据 |
|--------|------|------|
| Node.js 20+ | ✅ | v22.22.0 |
| client build 产物 | ✅ | `client/dist/index.html` |
| cap sync | ✅ | 插件齐全 |
| `/health` | ✅ | 实测通过 |
| 前端无 API Key | ✅ | `client/src` 无硬编码 Key |
| `.env` 未提交 Git | ✅ | 根 `.gitignore` 含 `.env` |
| 语音 Native/Web 分流 | ✅ | `voiceAdapter.ts` |
| 多轮记忆 trimMessages | ✅ | `App.tsx` + `trimMessages.ts` |
| 自动循环 FSM | ✅ | `useVoiceSession.ts` `autoVoiceMode: true` |
| 静音后继续聆听 | ✅ | `skipSpeakingAndContinue` |
| Proxy 配置持久化 | ✅ | `apiBase.ts` + Preferences |
| 首启引导 | ✅ | `App.tsx` 检测 Proxy |

### 需真机 / 有效 Key — 待完成

| 验收项 | 状态 |
|--------|------|
| 填入有效 OPENAI_API_KEY | ⏭ 用户需在 `server/.env` 填写 |
| 手机 WiFi + 防火墙 | ⏭ 用户操作 |
| APK 安装到手机 | ⏭ 用户操作 |
| 语音输入 / TTS / 连续 3 轮 | ⏭ 真机实测 |
| Cloudflare Worker 路径 | ⏭ 可选，未测 |

---

## 真机验收还需你做的 2 步

1. **填写 API Key**：编辑 `server/.env`，将 `OPENAI_API_KEY` 改为有效 Key，重启 `npm start`
2. **手机配置**：安装 `client/android/app/build/outputs/apk/debug/app-debug.apk` → 设置填入 `http://<电脑IP>:3001` → 授权麦克风 → 开启自动模式测试连续对话

---

## 环境变量（当前终端会话）

PowerShell 新开终端后需重新设置：

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
$env:ANDROID_HOME = "D:\JAVA"
$env:ANDROID_SDK_ROOT = "D:\JAVA"
```

`client/android/local.properties` 已本地生成（gitignore，含 `sdk.dir=D\:\\JAVA`）。
