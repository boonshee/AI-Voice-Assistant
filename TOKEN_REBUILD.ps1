# 收到客户 PROXY_AUTH_TOKEN 后执行（PowerShell）

param(
  [Parameter(Mandatory = $true)]
  [string]$ProxyToken
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkerUrl = "https://voice-ai-proxy.boonshee-ai.workers.dev"

Write-Host "1. 验证 Worker /api/chat ..."
$headers = @{ "X-Proxy-Token" = $ProxyToken; "Content-Type" = "application/json" }
$body = '{"messages":[{"role":"user","content":"你好"}]}'
try {
  $r = Invoke-RestMethod -Uri "$WorkerUrl/api/chat" -Method POST -Headers $headers -Body $body -TimeoutSec 45
  Write-Host "   OK: $($r.content.Substring(0, [Math]::Min(60, $r.content.Length)))..."
} catch {
  Write-Host "   FAIL: chat 探针未通过，请核对 Token 是否与 Worker PROXY_AUTH_TOKEN 一致"
  exit 1
}

Write-Host "2. 设置 GitHub Secret VITE_PROXY_TOKEN ..."
$gitToken = (@("protocol=https", "host=github.com", "") | git credential fill | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
$env:GH_TOKEN = $gitToken
$ProxyToken | gh secret set VITE_PROXY_TOKEN --repo boonshee/AI-Voice-Assistant

Write-Host "3. 本地构建 APK ..."
Set-Location "$Root\client"
$env:VITE_API_BASE_URL = $WorkerUrl
$env:VITE_PROXY_TOKEN = $ProxyToken
npm run build
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug

$apkSrc = "$Root\client\android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "$Root\AI语音助手-交付包\release\app-debug.apk"
Copy-Item -Force $apkSrc $apkDest
Write-Host "   APK: $apkDest"

Write-Host "4. push 触发 CI（可选）..."
Set-Location $Root
git add -A
git commit -m "chore: rebuild APK with VITE_PROXY_TOKEN pairing" 2>$null
$proxy = "http://127.0.0.1:10808"
git -c http.proxy=$proxy -c https.proxy=$proxy push origin main

Write-Host "`n完成。请将 $apkDest 发给客户。"
