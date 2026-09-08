param(
  [int]$Port = 5173,
  [string]$Route = '/?ui_lab=practice-catalog',
  [ValidateSet('http2', 'quic')]
  [string]$Protocol = 'http2',
  [switch]$CheckOnly
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

if ($Port -lt 1 -or $Port -gt 65535) {
  throw 'Port must be between 1 and 65535.'
}

if (-not $Route.StartsWith('/')) {
  throw 'Route must start with /.'
}

$cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  throw 'Cloudflare Tunnel is not installed. Install cloudflared, then rerun npm run ui-lab:tunnel:check.'
}

$localUrl = "http://127.0.0.1:$Port"

if ($CheckOnly) {
  Write-Output ('cloudflared: ' + $cloudflared.Source)
  Write-Output ('Local UI Lab command: npm run ui-lab:local')
  Write-Output ('Tunnel command: npm run ui-lab:tunnel')
  Write-Output ('Tunnel protocol: ' + $Protocol)
  Write-Output ('UI Lab route after the generated HTTPS host: ' + $Route)
  exit 0
}

try {
  $response = Invoke-WebRequest -Uri $localUrl -Method Head -TimeoutSec 5 -UseBasicParsing
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 500) {
    throw "Unexpected local status: $($response.StatusCode)"
  }
} catch {
  throw "Local UI Lab is unavailable at $localUrl. In a separate PowerShell window run: npm run ui-lab:local"
}

Write-Output 'Starting a temporary public HTTPS tunnel for local UI review.'
Write-Output ('After cloudflared prints https://<random>.trycloudflare.com, open that host with: ' + $Route)
Write-Output 'The URL is temporary and public. Do not enter real journal data, Telegram initData, tokens, or secrets.'
Write-Output 'Press Ctrl+C to stop the tunnel.'

& $cloudflared.Source tunnel --url $localUrl --protocol $Protocol --no-autoupdate
exit $LASTEXITCODE
