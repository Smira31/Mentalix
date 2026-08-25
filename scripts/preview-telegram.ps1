param(
  [string]$Path = ''
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

function Read-EnvFile {
  param([string]$Path)
  $values = @{}
  if (Test-Path -LiteralPath $Path) {
    foreach ($line in Get-Content -LiteralPath $Path) {
      if ($line -match '^\s*([^#=]+)=(.*)$') {
        $values[$matches[1].Trim()] = $matches[2].Trim().Trim('<','>')
      }
    }
  }
  return $values
}

$root = Split-Path -Parent $PSScriptRoot
$envValues = Read-EnvFile (Join-Path $root '.env.local')
$required = @('TELEGRAM_MAIN_BOT_TOKEN', 'TELEGRAM_PREVIEW_CHAT_ID')
$missing = @($required | Where-Object { [string]::IsNullOrWhiteSpace($envValues[$_]) })
if ($missing.Count -gt 0) {
  Write-Error ('Add these variables to .env.local: ' + ($missing -join ', ') + '. Do not send secrets in chat.')
  exit 1
}

$scope = 'smiraandre2-8311s-projects'
$project = 'mentalix-preview'
$statePath = Join-Path $env:TEMP 'mentalix-preview-state.json'
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$deployOutput = & npx vercel@latest deploy --yes --target preview --project $project --scope $scope --cwd $root 2>&1 | Out-String
$ErrorActionPreference = $previousErrorActionPreference
$urlMatch = [regex]::Match($deployOutput, 'https://[a-z0-9-]+\.vercel\.app')
if (-not $urlMatch.Success) {
  Write-Error 'Could not obtain the Vercel deployment URL.'
  exit 1
}
$previewUrl = $urlMatch.Value
$deploymentIdMatch = [regex]::Match($deployOutput, 'dpl_[A-Za-z0-9]+')
$deploymentId = if ($deploymentIdMatch.Success) { $deploymentIdMatch.Value } else { $null }
$branch = (& git -C $root branch --show-current).Trim()
$shortSha = (& git -C $root rev-parse --short HEAD).Trim()

$health = & curl.exe --noproxy '*' --http1.1 --max-time 20 -sS ($previewUrl + '/api/health')
if ($health -notmatch '"status"\s*:\s*"ok"') {
  Write-Error 'Preview was created, but /api/health did not return status=ok.'
  exit 1
}

$targetUrl = $previewUrl + $Path

$expiresAt = (Get-Date).ToUniversalTime().AddHours(1).ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'
$header = ConvertFrom-Json '"Mentalix Preview \u0433\u043e\u0442\u043e\u0432"'
$openLabel = ConvertFrom-Json '"\u041e\u0442\u043a\u0440\u044b\u0442\u044c Preview"'
$availability = ConvertFrom-Json '"\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e 1 \u0447\u0430\u0441"'
$branchLabel = ConvertFrom-Json '"\u0412\u0435\u0442\u043a\u0430:"'
$commitLabel = ConvertFrom-Json '"Commit:"'
$note = ConvertFrom-Json '"\u042d\u0442\u043e \u0442\u0435\u0441\u0442\u043e\u0432\u0430\u044f \u0432\u0435\u0440\u0441\u0438\u044f, production \u043d\u0435 \u0438\u0437\u043c\u0435\u043d\u0451\u043d."'
$pathLine = if ($Path) { "`n" + $targetUrl } else { '' }
$message = "$header`n`n$openLabel`n$availability`n`n$branchLabel $branch`n$commitLabel $shortSha$pathLine`n`n$note"
$button = @{ text = $openLabel; web_app = @{ url = $targetUrl } }
$payload = @{
  chat_id = $envValues['TELEGRAM_PREVIEW_CHAT_ID']
  text = $message
  disable_web_page_preview = $false
  reply_markup = @{ inline_keyboard = @(,@($button)) }
} | ConvertTo-Json -Depth 8 -Compress
$payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

$botBase = 'https://api.telegram.org/bot' + $envValues['TELEGRAM_MAIN_BOT_TOKEN']
$send = Invoke-RestMethod -Uri ($botBase + '/sendMessage') -Method Post -ContentType 'application/json; charset=utf-8' -Body $payloadBytes
if (-not $send.ok) {
  Write-Error 'Telegram did not accept the message.'
  exit 1
}

@{ deploymentId = $deploymentId; url = $previewUrl; createdAt = (Get-Date).ToUniversalTime().ToString('o') } |
  ConvertTo-Json -Compress | Set-Content -LiteralPath $statePath -Encoding UTF8

if ($deploymentId) {
  $stopScript = Join-Path $PSScriptRoot 'preview-stop.ps1'
  $cleanup = "Start-Sleep -Seconds 3600; & '$stopScript' | Out-Null"
  Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile', '-Command', $cleanup) | Out-Null
}

Write-Output ('Preview URL: ' + $previewUrl)
Write-Output ('Telegram message sent: ' + $send.ok)
Write-Output 'Telegram message:'
Write-Output $send.result.text
Write-Output ('Expires at: ' + $expiresAt)
