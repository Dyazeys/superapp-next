param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [string]$ContainerName = "superapp-postgres",
  [string]$Database,
  [string]$Username,
  [string]$Password,
  [string]$RemoteHost = "217.15.162.20",
  [string]$RemoteUser = "opsadmin",
  [string]$RemoteDbHost = "127.0.0.1",
  [int]$RemoteDbPort = 5432,
  [string]$KeyPath = "$HOME/.ssh/id_ed25519"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not [System.IO.Path]::IsPathRooted($InputFile)) {
  $InputFile = Join-Path $repoRoot $InputFile
}

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Backup file '$InputFile' does not exist."
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
  Get-Content -LiteralPath $InputFile -Raw | docker exec -i -e PGPASSWORD=$Password $ContainerName psql `
    --username=$Username `
    --dbname=$Database `
    --set=ON_ERROR_STOP=1

  if ($LASTEXITCODE -ne 0) {
    throw "Database restore failed using Docker mode."
  }

  Write-Host "Restore completed from $InputFile (mode: docker)"
  exit 0
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "Docker mode unavailable and SSH key was not found at '$KeyPath'."
}

$escapedPassword = Escape-SingleQuotedBash $Password
$escapedDb = Escape-SingleQuotedBash $Database
$escapedUser = Escape-SingleQuotedBash $Username
$escapedRemoteDbHost = Escape-SingleQuotedBash $RemoteDbHost

$remoteCommand = "PGPASSWORD='$escapedPassword' psql --host='$escapedRemoteDbHost' --port=$RemoteDbPort --username='$escapedUser' --dbname='$escapedDb' --set=ON_ERROR_STOP=1"

Get-Content -LiteralPath $InputFile -Raw | & ssh `
  -i $KeyPath `
  -o IdentitiesOnly=yes `
  -o BatchMode=yes `
  -o StrictHostKeyChecking=accept-new `
  "$RemoteUser@$RemoteHost" `
  $remoteCommand

if ($LASTEXITCODE -ne 0) {
  throw "Database restore failed using SSH fallback mode."
}

Write-Host "Restore completed from $InputFile (mode: ssh-fallback)"
