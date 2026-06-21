@echo off
setlocal
cd /d "%~dp0.."

echo [Teacher's Dashboard] Membersihkan port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo   Menghentikan PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

echo [Teacher's Dashboard] Memulai dev server di http://localhost:3000
echo   Tekan Ctrl+C untuk berhenti.
echo.

if not exist "node_modules\next\dist\bin\next" (
  echo ERROR: node_modules belum terinstall. Jalankan: npm install
  exit /b 1
)

node node_modules\next\dist\bin\next dev --webpack -p 3000