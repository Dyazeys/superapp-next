param(
  [int]$LocalPort = 55432,
  [string]$RemoteHost = "217.15.162.20",
  [string]$RemoteUser = "opsadmin",
  [string]$RemoteDbHost = "127.0.0.1",
  [int]$RemoteDbPort = 5432,
  [string]$KeyPath = "$HOME/.ssh/id_ed25519"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $KeyPath)) {
  Write-Error "SSH private key not found at $KeyPath"
  exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot ".db-tunnel-$LocalPort.pid"
$outLogFile = Join-Path $repoRoot ".db-tunnel-$LocalPort.out.log"
$errLogFile = Join-Path $repoRoot ".db-tunnel-$LocalPort.err.log"

$listenerLine = netstat -ano -p tcp | Select-String "127.0.0.1:$LocalPort" | Select-String "LISTENING" | Select-Object -First 1
if ($listenerLine) {
  $parts = ($listenerLine.ToString().Trim() -split "\s+")
  $existingPid = [int]$parts[-1]
  $existingProc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue

  if ($existingProc -and $existingProc.ProcessName -eq "ssh") {
    Set-Content -LiteralPath $pidFile -Value $existingPid -Encoding ASCII
    Write-Host "SSH tunnel already running on 127.0.0.1:$LocalPort (PID $existingPid)"
    exit 0
  }

  Write-Error "Port 127.0.0.1:$LocalPort is already in use by PID $existingPid ($($existingProc.ProcessName))."
  exit 1
}

$args = @(
  "-i", $KeyPath,
  "-o", "IdentitiesOnly=yes",
  "-o", "ExitOnForwardFailure=yes",
  "-o", "ServerAliveInterval=30",
  "-o", "ServerAliveCountMax=3",
  "-o", "StrictHostKeyChecking=accept-new",
  "-N",
  "-L", "${LocalPort}:${RemoteDbHost}:${RemoteDbPort}",
  "${RemoteUser}@${RemoteHost}"
)

$proc = Start-Process -FilePath "ssh" -ArgumentList $args -PassThru -WindowStyle Hidden -RedirectStandardOutput $outLogFile -RedirectStandardError $errLogFile

$maxAttempts = 10
for ($i = 0; $i -lt $maxAttempts; $i++) {
  Start-Sleep -Seconds 1

  if ($proc.HasExited) {
    $tailOut = if (Test-Path -LiteralPath $outLogFile) { (Get-Content -LiteralPath $outLogFile -Tail 20 | Out-String).Trim() } else { "" }
    $tailErr = if (Test-Path -LiteralPath $errLogFile) { (Get-Content -LiteralPath $errLogFile -Tail 20 | Out-String).Trim() } else { "" }
    $tail = @($tailOut, $tailErr) -join " "
    Write-Error "Failed to start SSH tunnel (process exited with code $($proc.ExitCode)). $tail"
    exit 1
  }

  $isListening = netstat -ano -p tcp | Select-String "127.0.0.1:$LocalPort" | Select-String "LISTENING"
  if ($isListening) {
    Set-Content -LiteralPath $pidFile -Value $proc.Id -Encoding ASCII
    Write-Host "SSH tunnel started: 127.0.0.1:$LocalPort -> $RemoteDbHost`:$RemoteDbPort via $RemoteUser@$RemoteHost (PID $($proc.Id))"
    Write-Host "Log files: $outLogFile and $errLogFile"
    exit 0
  }
}

Write-Error "SSH tunnel process started (PID $($proc.Id)) but port 127.0.0.1:$LocalPort is still not listening."
exit 1
