param(
  [switch]$DryRun
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
$scope = 'smiraandre2-8311s-projects'
$project = 'mentalix-preview'
$statePath = Join-Path $env:TEMP 'mentalix-preview-state.json'
$deploymentId = $null
$deploymentUrl = $null

function Get-PositiveInt {
  param(
    [string]$Value,
    [int]$Default
  )
  $parsed = 0
  if ([int]::TryParse($Value, [ref]$parsed) -and $parsed -gt 0) {
    return $parsed
  }
  return $Default
}

$verifyDeadlineSeconds = Get-PositiveInt $envValues['MENTALIX_PREVIEW_STOP_VERIFY_DEADLINE_SECONDS'] 90
$retryDelaySeconds = Get-PositiveInt $envValues['MENTALIX_PREVIEW_STOP_RETRY_DELAY_SECONDS'] 3
$retryMaxDelaySeconds = Get-PositiveInt $envValues['MENTALIX_PREVIEW_STOP_RETRY_MAX_DELAY_SECONDS'] 15
$dryRunFromEnv = $envValues['MENTALIX_PREVIEW_STOP_DRY_RUN'] -match '^(1|true|yes)$'

if ($DryRun -or $dryRunFromEnv) {
  Write-Output ("Preview stop dry-run: verify deadline seconds={0}, initial delay seconds={1}, max delay seconds={2}. No Vercel, state, process, or Telegram operations will run." -f $verifyDeadlineSeconds, $retryDelaySeconds, $retryMaxDelaySeconds)
  exit 0
}

if (Test-Path -LiteralPath $statePath) {
  try {
    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    $deploymentId = $state.deploymentId
    $deploymentUrl = $state.url
  } catch {
    $deploymentId = $null
  }
}

if ([string]::IsNullOrWhiteSpace($deploymentId)) {
  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $listOutput = & npx vercel@latest list $project --scope $scope --json 2>&1 | Out-String
  $ErrorActionPreference = $oldPreference
  $match = [regex]::Match($listOutput, 'dpl_[A-Za-z0-9]+')
  if ($match.Success) { $deploymentId = $match.Value }
  $urlMatch = [regex]::Match($listOutput, 'https://[a-z0-9-]+\.vercel\.app')
  if ($urlMatch.Success) { $deploymentUrl = $urlMatch.Value }
}

if ([string]::IsNullOrWhiteSpace($deploymentId)) {
  Write-Output 'Активный Preview не найден.'
  exit 0
}

$oldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$removeTarget = if ($deploymentUrl) { $deploymentUrl } else { $deploymentId }
$removeOutput = & npx vercel@latest remove $removeTarget --yes --scope $scope 2>&1 | Out-String
$removeExit = $LASTEXITCODE
$removedSuccessfully = [regex]::IsMatch(
  $removeOutput,
  'success! removed|removed 1 deployment|not found|does not exist',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
if (-not $removedSuccessfully -and $deploymentId -and $removeTarget -ne $deploymentId) {
  $removeOutput = & npx vercel@latest remove $deploymentId --yes --scope $scope 2>&1 | Out-String
  $removeExit = $LASTEXITCODE
  $removedSuccessfully = [regex]::IsMatch(
    $removeOutput,
    'success! removed|removed 1 deployment|not found|does not exist',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
}
$ErrorActionPreference = $oldPreference
$removeNotFound = [regex]::IsMatch(
  $removeOutput,
  'not found|does not exist',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
if (-not $removedSuccessfully -or ($removeExit -ne 0 -and -not $removeNotFound)) {
  Write-Error 'Не удалось удалить Preview deployment.'
  exit 1
}

# Vercel CLI может напечатать сообщение об удалении до фактического исчезновения
# deployment. Не очищаем state и не уведомляем Telegram, пока отсутствие не
# подтверждено обоими независимыми каналами: публичным URL и Vercel inspect.
$httpVerifiedRemoved = $false
$inspectVerifiedRemoved = $false
$verifiedRemoved = $false
$verificationDetails = @()
$verificationDeadline = (Get-Date).AddSeconds($verifyDeadlineSeconds)
$attempt = 0
$currentDelaySeconds = $retryDelaySeconds
while ((Get-Date) -lt $verificationDeadline -and -not $verifiedRemoved) {
  $attempt++

  if (-not [string]::IsNullOrWhiteSpace($deploymentUrl) -and -not $httpVerifiedRemoved) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $httpCode = (& curl.exe --noproxy '*' --http1.1 --max-time 20 -sS -o NUL -w '%{http_code}' $deploymentUrl 2>$null | Out-String).Trim()
    $curlExit = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    $verificationDetails += "HTTP attempt $attempt`: exit=$curlExit status=$httpCode"
    if ($curlExit -eq 0 -and $httpCode -match '^(404|410)$') {
      $httpVerifiedRemoved = $true
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($deploymentId) -and -not $inspectVerifiedRemoved) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $inspectOutput = & npx vercel@latest inspect $deploymentId --scope $scope 2>&1 | Out-String
    $inspectExit = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    $inspectMissing = [regex]::IsMatch(
      $inspectOutput,
      'not found|does not exist|could not find',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $verificationDetails += "Inspect attempt $attempt`: exit=$inspectExit missing=$inspectMissing"
    if ($inspectExit -ne 0 -and $inspectMissing) {
      $inspectVerifiedRemoved = $true
    }
  }

  $verifiedRemoved = $httpVerifiedRemoved -and $inspectVerifiedRemoved
  if (-not $verifiedRemoved) {
    $remainingSeconds = ($verificationDeadline - (Get-Date)).TotalSeconds
    if ($remainingSeconds -le 0) { break }
    $sleepSeconds = [math]::Min($currentDelaySeconds, [math]::Floor($remainingSeconds))
    if ($sleepSeconds -gt 0) {
      Start-Sleep -Seconds $sleepSeconds
    }
    $currentDelaySeconds = [math]::Min($currentDelaySeconds * 2, $retryMaxDelaySeconds)
  }
}

if (-not $verifiedRemoved) {
  Write-Error (
    "Vercel принял cleanup, но удаление Preview не подтверждено за deadline {0} секунд. State сохранён для повторной попытки.`nHTTP confirmed={1}; inspect confirmed={2}`n{3}" -f
    $verifyDeadlineSeconds,
    $httpVerifiedRemoved,
    $inspectVerifiedRemoved,
    ($verificationDetails -join "`n")
  )
  exit 1
}

$related = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.ProcessId -ne $PID -and
    $_.Name -match 'powershell|pwsh' -and
    $_.CommandLine -and
    ($_.CommandLine.Contains($deploymentId) -or ($deploymentUrl -and $_.CommandLine.Contains($deploymentUrl)))
  }
foreach ($process in $related) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

# State удаляется только после независимого подтверждения отсутствия deployment.
if (Test-Path -LiteralPath $statePath) {
  Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
}

$token = $envValues['TELEGRAM_MAIN_BOT_TOKEN']
$chatId = $envValues['TELEGRAM_PREVIEW_CHAT_ID']
if (-not [string]::IsNullOrWhiteSpace($token) -and -not [string]::IsNullOrWhiteSpace($chatId)) {
  $message = ConvertFrom-Json '"Preview \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d"'
  $payload = @{ chat_id = $chatId; text = $message } | ConvertTo-Json -Depth 4 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  Invoke-RestMethod -Uri ('https://api.telegram.org/bot' + $token + '/sendMessage') -Method Post -ContentType 'application/json; charset=utf-8' -Body $bytes | Out-Null
}

Write-Output 'Preview stopped.'
