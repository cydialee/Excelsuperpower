param(
  [int]$Port = 4173,
  [switch]$InstallDependencies
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-Step {
  param([string]$Message)
  Write-Host "[Excelsuperpower] $Message" -ForegroundColor Cyan
}

function Test-Python {
  param(
    [string]$FilePath,
    [string[]]$PrefixArguments = @()
  )

  try {
    & $FilePath @PrefixArguments -c "import sys; print(sys.executable)" *> $null
    return $LASTEXITCODE -eq 0
  }
  catch {
    return $false
  }
}

function Resolve-Python {
  $candidates = @(
    @{
      FilePath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
      Arguments = @()
      Label = "project .venv"
    },
    @{
      FilePath = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
      Arguments = @()
      Label = "project venv"
    },
    @{
      FilePath = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
      Arguments = @()
      Label = "Codex bundled Python"
    }
  )

  $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
  if ($pyLauncher) {
    $candidates += @{
      FilePath = $pyLauncher.Source
      Arguments = @("-3")
      Label = "Python Launcher"
    }
  }

  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if ($pythonCommand) {
    $candidates += @{
      FilePath = $pythonCommand.Source
      Arguments = @()
      Label = "system Python"
    }
  }

  foreach ($candidate in $candidates) {
    if ((Test-Path $candidate.FilePath) -and (Test-Python $candidate.FilePath $candidate.Arguments)) {
      return $candidate
    }
  }

  throw @"
No usable Python 3 installation was found.

Install Python 3.11+ from https://www.python.org/downloads/ and enable
"Add Python to PATH", then run this script again.
"@
}

function Test-PreviewHealth {
  param([int]$TargetPort)

  try {
    $response = Invoke-WebRequest `
      -Uri "http://127.0.0.1:$TargetPort/api/health" `
      -UseBasicParsing `
      -TimeoutSec 2
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

if (Test-PreviewHealth $Port) {
  Write-Step "Preview is already running at http://127.0.0.1:$Port/"
  exit 0
}

$python = Resolve-Python
Write-Step "Using $($python.Label): $($python.FilePath)"

$dependencyCheck = @'
import importlib.util
import sys

missing = [name for name in ("openpyxl", "reportlab") if importlib.util.find_spec(name) is None]
sys.stdout.write(",".join(missing))
sys.exit(1 if missing else 0)
'@

$missingDependencies = $dependencyCheck | & $python.FilePath @($python.Arguments) -
if ($LASTEXITCODE -ne 0) {
  if (-not $InstallDependencies) {
    throw @"
Missing Python dependencies: $missingDependencies

Run:
  .\run-web-preview.ps1 -InstallDependencies

or install them manually:
  $($python.FilePath) $($python.Arguments -join " ") -m pip install -r requirements.txt
"@
  }

  Write-Step "Installing Python dependencies..."
  & $python.FilePath @($python.Arguments) -m pip install -r requirements.txt
  if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed."
  }
}

Write-Step "Starting web preview at http://127.0.0.1:$Port/"
Write-Step "Keep this terminal open. Press Ctrl+C to stop the server."

& $python.FilePath @($python.Arguments) (Join-Path $PSScriptRoot "run_preview.py") --port $Port
if ($LASTEXITCODE -ne 0) {
  throw "Preview server exited with code $LASTEXITCODE."
}
