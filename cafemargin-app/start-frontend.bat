@echo off
title CafeMargin Frontend - Next.js App
color 0B
echo ============================================
echo    CafeMargin Frontend - Starting...
echo ============================================
echo.

cd /d "%~dp0frontend"

echo [START] Menjalankan Next.js dev server di http://localhost:3000
echo.
call npm run dev
pause
