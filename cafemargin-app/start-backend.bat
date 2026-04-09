@echo off
title CafeMargin Backend - API Server
color 0A
echo ============================================
echo    CafeMargin Backend - Starting...
echo ============================================
echo.

cd /d "%~dp0backend"

:: Check if DB exists, if not seed it
if not exist "cafemargin.db" (
    echo [INFO] Database tidak ditemukan, menjalankan seed.py...
    python seed.py
    echo.
    echo [OK] Database berhasil dibuat!
    echo.
)

echo [START] Menjalankan FastAPI server di http://localhost:8000
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
