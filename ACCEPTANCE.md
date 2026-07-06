# 验收清单

## 环境

- [ ] Node.js 20+
- [ ] `server` 目录 `npm install`，`.env.example` 复制为 `.env` 并填写 Key
- [ ] `npm start` 正常，终端有局域网地址
- [ ] `http://localhost:3001/health` 返回 ok
- [ ] 手机与电脑同 WiFi（Node 方案）
- [ ] 防火墙放行 3001（连不上时）

## 构建

- [ ] `client` 目录 `npm install`、`npm run build` 成功
- [ ] `npx cap sync android` 成功
- [ ] `gradlew assembleDebug` 产出 APK，或直接使用 `release/app-debug.apk`
- [ ] APK 已装到手机

## App

- [ ] 设置里填 Proxy 地址，测试连接通过并保存
- [ ] 重启 App 后地址仍在
- [ ] 麦克风可用，状态显示聆听中
- [ ] 有文字回复
- [ ] 有语音播报
- [ ] 自动模式下播报结束后继续听
- [ ] 连续 3 轮不用手动发送
- [ ] 播报中点静音后，自动模式仍进入下一轮

## Worker 方案（可选）

- [ ] `wrangler secret put OPENAI_API_KEY` 后 deploy 成功
- [ ] App 填 Worker HTTPS 地址，功能同上
