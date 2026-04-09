@echo off
title CafeMargin Frontend - React App
color 0B
echo ============================================
echo    CafeMargin Frontend - Starting...
echo ============================================
echo.

cd /d "%~dp0frontend"

echo [START] Menjalankan Vite dev server di http://localhost:5173
echo.
npm run dev
pause
