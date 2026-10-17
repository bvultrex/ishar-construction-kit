@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 oder neuer wird fuer diesen Test-Build benoetigt.
  echo https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installiere Laufzeit-Abhaengigkeiten...
  call npm install --omit=dev --no-audit --no-fund
  if errorlevel 1 (
    echo Installation fehlgeschlagen.
    pause
    exit /b 1
  )
)
start "" "http://127.0.0.1:4173"
node scripts\serve-build.mjs
pause
