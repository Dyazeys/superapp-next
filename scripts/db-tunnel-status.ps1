param(
  [int]$LocalPort = 55432
)

$ErrorActionPreference = "Stop"

$listenerLine = netstat -ano -p tcp | Select-String "127.0.0.1:$LocalPort" | Select-String "LISTENING" | Select-Object -First 1

if (-not $listenerLine) {
  Write-Host "DOWN: no listener on 127.0.0.1:$LocalPort"
  exit 1
}

$parts = ($listenerLine.ToString().Trim() -split "\s+")
$ownerPid = [int]$parts[-1]
$proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
$procName = if ($proc) { $proc.ProcessName } else { "unknown" }

Write-Host "UP: 127.0.0.1:$LocalPort is listening (PID $ownerPid, process $procName)"
exit 0
