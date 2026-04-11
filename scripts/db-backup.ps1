param(
  [string]$ContainerName = "superapp-postgres",
  [string]$Database,
  [string]$Username,
  [string]$Password,
  [string]$OutputFile,
  [string]$RemoteHost = "217.15.162.20",
  [string]$RemoteUser = "opsadmin",
  [string]$RemoteDbHost = "127.0.0.1",
  [int]$RemoteDbPort = 5432,
  [string]$KeyPath = "$HOME/.ssh/id_ed25519"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $repoRoot "backups"

if (-not (Test-Path -LiteralPath $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputFile = Join-Path $backupDir "superapp-$timestamp.sql"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

function Get-DbConfigFromEnv {
  $databaseUrl = $env:PRISMA_DATABASE_URL
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = $env:DATABASE_URL
  }
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $envFile = Join-Path $repoRoot ".env"
    if (Test-Path -LiteralPath $envFile) {
      $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*PRISMA_DATABASE_URL\s*=' } | Select-Object -First 1
      if (-not $line) {
        $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
      }
      if ($line) {
        $databaseUrl = ($line -split "=", 2)[1].Trim().Trim('"')
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    return $null
  }

  try {
    $uri = [System.Uri]$databaseUrl
    $userInfo = $uri.UserInfo -split ":", 2

    return [PSCustomObject]@{
      Username = if ($userInfo.Length -ge 1) { [System.Uri]::UnescapeDataString($userInfo[0]) } else { $null }
      Password = if ($userInfo.Length -eq 2) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { $null }
      Database = $uri.AbsolutePath.TrimStart("/")
    }
  } catch {
    return $null
  }
}

function Escape-SingleQuotedBash([string]$value) {
  if ($null -eq $value) {
    return ""
  }

  return $value.Replace("'", "'""'""'")
}

$dbConfig = Get-DbConfigFromEnv
if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = if ($dbConfig -and -not [string]::IsNullOrWhiteSpace($dbConfig.Database)) { $dbConfig.Database } else { "superapp" }
}
if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = if ($dbConfig -and -not [string]::IsNullOrWhiteSpace($dbConfig.Username)) { $dbConfig.Username } else { "superapp" }
}
if ([string]::IsNullOrWhiteSpace($Password)) {
  $Password = if ($dbConfig -and $null -ne $dbConfig.Password) { $dbConfig.Password } else { "superapp" }
}

$dockerStatusExit = 1
$containerStatus = $null
if (Get-Command docker -ErrorAction SilentlyContinue) {
  $containerStatus = cmd /c "docker inspect -f ""{{.State.Status}}"" $ContainerName 2>nul"
  $dockerStatusExit = $LASTEXITCODE
}

if ($dockerStatusExit -eq 0 -and -not [string]::IsNullOrWhiteSpace($containerStatus) -and $containerStatus.Trim() -eq "running") {
  docker exec -e PGPASSWORD=$Password $ContainerName pg_dump `
    --username=$Username `
    --dbname=$Database `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges > $OutputFile

  if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed using Docker mode."
  }

  Write-Host "Backup created at $OutputFile (mode: docker)"
  exit 0
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "Docker mode unavailable and SSH key was not found at '$KeyPath'."
}

$escapedPassword = Escape-SingleQuotedBash $Password
$escapedDb = Escape-SingleQuotedBash $Database
$escapedUser = Escape-SingleQuotedBash $Username
$escapedRemoteDbHost = Escape-SingleQuotedBash $RemoteDbHost

$remoteCommand = "PGPASSWORD='$escapedPassword' pg_dump --host='$escapedRemoteDbHost' --port=$RemoteDbPort --username='$escapedUser' --dbname='$escapedDb' --clean --if-exists --no-owner --no-privileges"

& ssh `
  -i $KeyPath `
  -o IdentitiesOnly=yes `
  -o BatchMode=yes `
  -o StrictHostKeyChecking=accept-new `
  "$RemoteUser@$RemoteHost" `
  $remoteCommand > $OutputFile

if ($LASTEXITCODE -ne 0) {
  throw "Database backup failed using SSH fallback mode."
}

Write-Host "Backup created at $OutputFile (mode: ssh-fallback)"
