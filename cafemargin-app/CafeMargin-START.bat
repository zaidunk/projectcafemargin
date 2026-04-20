@echo off
title CafeMargin Launcher
color 0E
echo ============================================
echo       CafeMargin - One Click Launcher
echo       by PT Xolvon Kehidupan Cerdas Abadi
echo ============================================
echo.
echo [1/2] Starting Backend (FastAPI)...
start "CafeMargin Backend" /D "%~dp0" cmd /k call start_backend.bat

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Next.js)...
start "CafeMargin Frontend" /D "%~dp0" cmd /k call start_frontend.bat

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul

echo.
echo [OPEN] Membuka browser...
start http://localhost:3000

echo.
echo ============================================
echo    CafeMargin is RUNNING!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    Buat akun lewat POST /api/admin/users
echo ============================================
echo.
echo Tekan tombol apa saja untuk menutup launcher ini...
echo (Backend & Frontend tetap jalan di window terpisah)
pause >nul
