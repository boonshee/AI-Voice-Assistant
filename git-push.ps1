# Git push 到 boonshee/AI-Voice-Assistant（需开代理 + 仓库写权限）
# 用法：PowerShell 里执行 .\git-push.ps1

$proxy = "http://127.0.0.1:10808"   # Clash 常见端口；若是 7890 请改这里
$env:HTTP_PROXY = $proxy
$env:HTTPS_PROXY = $proxy

Set-Location $PSScriptRoot

Write-Host "使用代理: $proxy"
Write-Host "当前分支:"
git status -sb

git -c http.proxy=$proxy -c https.proxy=$proxy push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n成功。请打开: https://github.com/boonshee/AI-Voice-Assistant/actions"
} else {
    Write-Host "`n失败。若是 403：GitHub 账号无写权限，请确认 FHY12345-ALT 已 Accept 协作者邀请。"
    Write-Host "若是连接超时：确认代理已开，并检查端口是否为 10808 或 7890。"
}
