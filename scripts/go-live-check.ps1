param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [string]$ReportDir = "docs/reports"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
if (-not [System.IO.Path]::IsPathRooted($ReportDir)) {
  $ReportDir = Join-Path $repoRoot $ReportDir
}
if (-not (Test-Path -LiteralPath $ReportDir)) {
  New-Item -ItemType Directory -Path $ReportDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = Join-Path $ReportDir "go-live-check-$timestamp.md"

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Details
  )
  $checks.Add([PSCustomObject]@{
    Name = $Name
    Status = $Status
    Details = $Details
  })
}

function Run-CommandCheck {
  param(
    [string]$Name,
    [scriptblock]$Action,
    [string]$FailureStatus = "FAIL"
  )
  try {
    $global:LASTEXITCODE = 0
    $out = & $Action 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
      Add-Check -Name $Name -Status "PASS" -Details (($out.Trim()) -replace "`r`n", " | ")
      return $true
    }
    Add-Check -Name $Name -Status $FailureStatus -Details (($out.Trim()) -replace "`r`n", " | ")
    return $false
  } catch {
    Add-Check -Name $Name -Status $FailureStatus -Details $_.Exception.Message
    return $false
  }
}

function Run-HttpCheck {
  param(
    [string]$Name,
    [string]$Path
  )
  try {
    $resp = Invoke-WebRequest -Uri ($BaseUrl + $Path) -UseBasicParsing -TimeoutSec 20
    Add-Check -Name $Name -Status "PASS" -Details "HTTP $($resp.StatusCode) $Path"
    return $true
  } catch {
    $msg = $_.Exception.Message
    Add-Check -Name $Name -Status "FAIL" -Details $msg
    return $false
  }
}

try {
  $hasEnv = Test-Path -LiteralPath (Join-Path $repoRoot ".env")
  Add-Check -Name ".env available" -Status ($(if ($hasEnv) { "PASS" } else { "FAIL" })) -Details $(if ($hasEnv) { ".env found" } else { ".env missing" })

  $sshProc = @(Get-Process ssh -ErrorAction SilentlyContinue).Count
  Add-Check -Name "DB tunnel process" -Status ($(if ($sshProc -gt 0) { "PASS" } else { "WARN" })) -Details "ssh process count: $sshProc"

  Run-CommandCheck -Name "Lint (non-blocking)" -Action { npm run lint } -FailureStatus "WARN" | Out-Null

  Run-HttpCheck -Name "API Product Inventory" -Path "/api/product/inventory" | Out-Null
  Run-HttpCheck -Name "API Product Products" -Path "/api/product/products" | Out-Null
  Run-HttpCheck -Name "API Product Categories" -Path "/api/product/categories" | Out-Null
  Run-HttpCheck -Name "API Warehouse Stock Balances" -Path "/api/warehouse/stock-balances" | Out-Null
  Run-HttpCheck -Name "API Accounting Journals" -Path "/api/accounting/journals" | Out-Null
  Run-HttpCheck -Name "API Sales Orders" -Path "/api/sales/orders" | Out-Null
  Run-HttpCheck -Name "API Payout Records" -Path "/api/payout/records" | Out-Null

  $passCount = @($checks | Where-Object { $_.Status -eq "PASS" }).Count
  $warnCount = @($checks | Where-Object { $_.Status -eq "WARN" }).Count
  $failCount = @($checks | Where-Object { $_.Status -eq "FAIL" }).Count

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("# Go-Live Check Report")
  $lines.Add("")
  $lines.Add("Tanggal: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
  $lines.Add("Base URL: $BaseUrl")
  $lines.Add("")
  $lines.Add("Ringkasan:")
  $lines.Add("- PASS: $passCount")
  $lines.Add("- WARN: $warnCount")
  $lines.Add("- FAIL: $failCount")
  $lines.Add("")
  $lines.Add("| Check | Status | Details |")
  $lines.Add("| --- | --- | --- |")
  foreach ($c in $checks) {
    $safeDetails = ($c.Details -replace "\|", "/")
    $lines.Add("| $($c.Name) | $($c.Status) | $safeDetails |")
  }

  Set-Content -LiteralPath $reportFile -Value $lines -Encoding UTF8
  Write-Host "Go-live report written to: $reportFile"

  if ($failCount -gt 0) {
    exit 1
  }
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
