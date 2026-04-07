param(
  [int]$LocalPort = 55432,
  [string]$RemoteHost = "217.15.162.20",
  [string]$RemoteUser = "opsadmin",
  [string]$RemoteDbHost = "127.0.0.1",
  [int]$RemoteDbPort = 5432,
  [string]$KeyPath = "$HOME/.ssh/id_ed25519"
)

if (-not (Test-Path -LiteralPath $KeyPath)) {
  Write-Error "SSH private key not found at $KeyPath"
  exit 1
}

Write-Host "Opening SSH tunnel on localhost:${LocalPort} -> ${RemoteDbHost}:${RemoteDbPort} via ${RemoteUser}@${RemoteHost}"

ssh `
  -i $KeyPath `
  -o IdentitiesOnly=yes `
  -o ExitOnForwardFailure=yes `
  -o ServerAliveInterval=30 `
  -o ServerAliveCountMax=3 `
  -o StrictHostKeyChecking=accept-new `
  -N `
  -L "${LocalPort}:${RemoteDbHost}:${RemoteDbPort}" `
  "${RemoteUser}@${RemoteHost}"
