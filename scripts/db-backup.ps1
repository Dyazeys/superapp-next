param(
  [string]$ContainerName = "superapp-postgres",
  [string]$Database = "superapp",
  [string]$Username = "superapp",
  [string]$Password = "superapp",
  [string]$OutputFile
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

$containerStatus = docker inspect -f "{{.State.Status}}" $ContainerName 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerStatus)) {
  throw "Docker container '$ContainerName' was not found. Start it with 'docker compose up -d postgres'."
}

if ($containerStatus.Trim() -ne "running") {
  throw "Docker container '$ContainerName' is not running. Start it with 'docker compose up -d postgres'."
}

docker exec -e PGPASSWORD=$Password $ContainerName pg_dump `
  --username=$Username `
  --dbname=$Database `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges > $OutputFile

if ($LASTEXITCODE -ne 0) {
  throw "Database backup failed."
}

Write-Host "Backup created at $OutputFile"
