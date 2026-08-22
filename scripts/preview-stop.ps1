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

Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue

$oldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$removeTarget = if ($deploymentUrl) { $deploymentUrl } else { $deploymentId }
$removeOutput = & npx vercel@latest remove $removeTarget --yes --scope $scope 2>&1 | Out-String
$removeExit = $LASTEXITCODE
$removedSuccessfully = $removeOutput -match '(?i)success! removed|removed 1 deployment|not found|does not exist'
if (-not $removedSuccessfully -and $deploymentId -and $removeTarget -ne $deploymentId) {
  $removeOutput = & npx vercel@latest remove $deploymentId --yes --scope $scope 2>&1 | Out-String
  $removeExit = $LASTEXITCODE
  $removedSuccessfully = $removeOutput -match '(?i)success! removed|removed 1 deployment|not found|does not exist'
}
$ErrorActionPreference = $oldPreference
if (-not $removedSuccessfully -or ($removeExit -ne 0 -and $removeOutput -notmatch '(?i)not found|does not exist')) {
  Write-Error 'Не удалось удалить Preview deployment.'
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
