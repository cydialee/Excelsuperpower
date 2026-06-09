param(
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
  Write-Host "[Excelsuperpower] No preview server is listening on port $Port." -ForegroundColor Yellow
  exit 0
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processIds) {
  Stop-Process -Id $processId -Force
  Write-Host "[Excelsuperpower] Stopped preview server process $processId." -ForegroundColor Cyan
}
