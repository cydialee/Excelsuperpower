@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-web-preview.ps1" -InstallDependencies %*
if errorlevel 1 (
  echo.
  echo Excelsuperpower preview failed to start.
  pause
)
