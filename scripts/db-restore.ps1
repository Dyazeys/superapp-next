param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [string]$ContainerName = "superapp-postgres",
  [string]$Database = "superapp",
  [string]$Username = "superapp",
  [string]$Password = "superapp"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not [System.IO.Path]::IsPathRooted($InputFile)) {
  $InputFile = Join-Path $repoRoot $InputFile
}

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Backup file '$InputFile' does not exist."
}

$containerStatus = docker inspect -f "{{.State.Status}}" $ContainerName 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerStatus)) {
  throw "Docker container '$ContainerName' was not found. Start it with 'docker compose up -d postgres'."
}

if ($containerStatus.Trim() -ne "running") {
  throw "Docker container '$ContainerName' is not running. Start it with 'docker compose up -d postgres'."
}

Get-Content -LiteralPath $InputFile -Raw | docker exec -i -e PGPASSWORD=$Password $ContainerName psql `
  --username=$Username `
  --dbname=$Database `
  --set=ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
  throw "Database restore failed."
}

Write-Host "Restore completed from $InputFile"
