# 客户验收指南

本文档回答验收常见问题，并给出从安装到连续语音对话的完整步骤。

---

## 交付物

| 内容 | 位置 |
|------|------|
| 完整源码 | https://github.com/boonshee/AI-Voice-Assistant |
| Debug APK | 仓库 **Actions** → 最新成功 run → **Artifacts** → 下载 `app-debug` |
| 后端 Proxy | `server/`（Node.js Express） |
| 前端 + Android | `client/` |
| Worker（可选） | `worker/`（源码在仓库内，**未预部署**） |

目录说明：

- `client/` — App 与 Android 工程
- `server/` — 本地/局域网 OpenAI 代理（验收默认用这个）
- `worker/` — 公网 HTTPS 代理（可选，需自行部署）

---

## 快速答疑

### Q1：server 怎么启动？

在电脑上（Windows PowerShell）：

```powershell
cd server
npm install
copy .env.example .env
```

用记事本打开 `server\.env`，填入你的 `OPENAI_API_KEY`，保存后：

```powershell
npm start
```

成功时终端显示 `listening on http://0.0.0.0:3001`，并打印手机可填的局域网地址，例如 `http://192.168.1.100:3001`。

本机验证：浏览器打开 `http://localhost:3001/health`，应看到 `{"status":"ok"}`。

### Q2：App 里 Proxy 填什么？

**默认用 Node 方案（推荐验收）：**

```
http://<你电脑的局域网IP>:3001
```

示例：`http://192.168.1.100:3001`

- IP 以 `npm start` 终端打印为准
- 不要加末尾斜杠
- 手机与电脑必须在**同一 WiFi**

### Q3：Cloudflare Worker 部署了吗？

**没有。** 仓库里只有 `worker/` 源码，没有替你部署公网地址。

验收请用 **Node.js 本机 Proxy**（上一节）。若要用 Worker，需自行按 `worker/README.md` 执行 `wrangler deploy`，再在 App 填 `https://xxx.workers.dev`。

### Q4：不用 Worker，局域网怎么配？

1. 电脑运行 `cd server && npm start`
2. 记下终端打印的 `http://192.168.x.x:3001`
3. 手机连**同一 WiFi**
4. Windows 防火墙允许 Node.js 入站 **3001**（连不上时）
5. App → **设置** → 填入上述地址 → **测试连接** → **保存**

---

## 环境要求

- Node.js 20 及以上
- OpenAI API Key（你自己申请，只写在 `server/.env`）
- Android 手机 + 与电脑同一 WiFi（Node 方案）
- 已安装 APK（从 Actions Artifacts 下载）

---

## `.env` 配置说明

复制 `server/.env.example` 为 `server/.env`，各字段含义：

| 字段 | 说明 |
|------|------|
| `OPENAI_API_KEY` | **必填**。你的 OpenAI Key，勿提交 Git |
| `OPENAI_MODEL` | 模型，默认 `gpt-4o-mini` |
| `OPENAI_TIMEOUT_MS` | 请求超时毫秒，默认 30000 |
| `HOST` | 监听地址，保持 `0.0.0.0`（允许手机访问） |
| `PORT` | 端口，默认 3001 |
| `CORS_ORIGIN` | 跨域来源，默认值即可 |

`.env` 文件已在 `.gitignore` 中，不会上传到 GitHub。

---

## Proxy 地址对照表

| 场景 | App 设置里填写的地址 |
|------|---------------------|
| 真机 + Node（**验收用这个**） | `http://<电脑局域网IP>:3001` |
| 本机浏览器调试 | `http://localhost:3001` |
| Android 模拟器 | `http://10.0.2.2:3001` |
| Cloudflare Worker（可选，需自部署） | `https://xxx.workers.dev` |

填写后务必点 **测试连接**，成功再 **保存**。

---

## 完整验收流程（6 步）

### 第 1 步：准备 Key 并启动 server

```powershell
cd server
npm install
copy .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY
npm start
```

确认 `/health` 返回 ok，记下局域网 IP。

### 第 2 步：安装 APK

从 GitHub Actions Artifacts 下载 `app-debug`，传到手机安装。首次安装需允许「未知来源」。

### 第 3 步：配置 Proxy

打开 App → **设置** → 填入 `http://<电脑IP>:3001` → **测试连接** → **保存**。

若 Proxy 未连通，App 可能自动弹出设置页。

### 第 4 步：授权麦克风

系统提示时允许麦克风权限。

### 第 5 步：单次对话

开启「自动」→ 点麦克风 → 说话 → 应出现：

1. 状态显示「聆听中」
2. 聊天区出现 AI 文字回复
3. 手机朗读 AI 回复（TTS）

### 第 6 步：连续 3 轮

保持「自动」开启，播报结束后应自动再次聆听。连续对话至少 3 轮，无需每次手动点发送。

可选：播报中点「静音」，自动模式应继续下一轮聆听。

---

## Cloudflare Worker（可选，非默认）

未预部署。若需公网 HTTPS、无需电脑同 WiFi：

```bash
cd worker
wrangler login
wrangler secret put OPENAI_API_KEY
wrangler deploy
```

部署成功后，App 设置填 Worker 的 HTTPS 地址。详见 `worker/README.md`。

---

## 常见问题

**测试连接失败**

- server 是否在运行？
- 手机与电脑是否同一 WiFi？
- Proxy 地址是否为 `http://IP:3001`（不是 https）？
- Windows 防火墙是否放行 3001？
- 若浏览器能打开 `http://IP:3001/health` 但 App 测试连接失败，请重新下载 **最新 APK**（GitHub Actions 产物）。旧版 APK 未启用原生 HTTP，无法访问局域网 http:// Proxy。

**AI 无回复 / 鉴权错误**

- `server/.env` 中 `OPENAI_API_KEY` 是否正确？
- Key 是否有余额、未过期？

**没有语音播报**

- 手机媒体音量是否打开？
- 是否误触「静音」？

**想自己从源码打 APK**

```powershell
cd client
npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

产物：`client/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 验收勾选

详细清单见仓库内 `ACCEPTANCE.md`。
