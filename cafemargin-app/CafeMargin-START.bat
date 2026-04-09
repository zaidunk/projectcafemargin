@echo off
title CafeMargin Launcher
color 0E
echo ============================================
echo       CafeMargin - One Click Launcher
echo       by PT Xolvon Kehidupan Cerdas Abadi
echo ============================================
echo.
echo [1/2] Starting Backend (FastAPI)...
start "CafeMargin Backend" cmd /k "cd /d "%~dp0backend" && (if not exist cafemargin.db (echo Seeding database... && python seed.py && echo Database ready!)) && echo. && echo Starting API server... && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React + Vite)...
start "CafeMargin Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul

echo.
echo [OPEN] Membuka browser...
start http://localhost:5173

echo.
echo ============================================
echo    CafeMargin is RUNNING!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    Login:    admin / admin
echo ============================================
echo.
echo Tekan tombol apa saja untuk menutup launcher ini...
echo (Backend & Frontend tetap jalan di window terpisah)
pause >nul
