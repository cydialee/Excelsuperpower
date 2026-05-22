param(
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"
$python = "C:\Users\zsgjl\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

Set-Location $PSScriptRoot
Write-Host "Excelsuperpower Web Preview running at http://127.0.0.1:$Port/" -ForegroundColor Cyan
& $python -c "from server.api import run; run(port=$Port)"
