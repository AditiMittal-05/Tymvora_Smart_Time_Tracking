@echo off
title Tymvora Launcher
color 0A

echo.
echo  ==========================================
echo   Tymvora - Tymvora Technologies
echo   Starting backend and frontend...
echo  ==========================================
echo.

echo [1/2] Opening Backend Server (port 8000)...
start "Tymvora - BACKEND - Port 8000" cmd /k "%~dp0start_backend.bat"

echo [2/2] Opening Frontend Server (port 5173)...
start "Tymvora - FRONTEND - Port 5173" cmd /k "%~dp0start_frontend.bat"

echo.
echo  Waiting for both servers to be ready...
echo  (This may take 15-60 seconds on first run while migrations run)
echo.

:: Poll backend then frontend using PowerShell health-checks
powershell -NoProfile -Command ^
  "$backendOk=$false; $frontendOk=$false;" ^
  "Write-Host '  Checking backend  ...' -NoNewline;" ^
  "for($i=0;$i-lt 90;$i++){" ^
     "try{$r=Invoke-WebRequest 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop;" ^
     "if($r.StatusCode -eq 200){$backendOk=$true;break}}catch{}" ^
     "Start-Sleep 2}" ^
  "if($backendOk){Write-Host ' OK'}" ^
  "else{Write-Host ' TIMEOUT - backend may still be starting'}" ^
  "Write-Host '  Checking frontend ...' -NoNewline;" ^
  "for($i=0;$i-lt 60;$i++){" ^
     "try{$r=Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop;" ^
     "if($r.StatusCode -eq 200){$frontendOk=$true;break}}catch{}" ^
     "Start-Sleep 2}" ^
  "if($frontendOk){Write-Host ' OK'}" ^
  "else{Write-Host ' TIMEOUT - frontend may still be starting'}" ^
  "if($backendOk -and $frontendOk){" ^
     "Write-Host ''; Write-Host '  Both servers are ready! Opening browser...';" ^
     "Start-Process 'http://localhost:5173'}" ^
  "else{" ^
     "Write-Host ''; Write-Host '  One or more servers are not responding.';" ^
     "Write-Host '  Check the backend/frontend windows for errors.';" ^
     "Write-Host '  Then open: http://localhost:5173'}"

echo.
echo  ==========================================
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:5173
echo   API Docs : http://localhost:8000/docs
echo.
echo   Keep BOTH server windows open while using.
echo   Close them to stop the application.
echo  ==========================================
echo.
pause
