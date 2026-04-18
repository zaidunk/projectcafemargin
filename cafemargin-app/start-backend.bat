@echo off
title CafeMargin Backend - API Server
color 0A
echo ============================================
echo    CafeMargin Backend - Starting...
echo ============================================
echo.

cd /d "%~dp0backend"

set "VENV_PY=%~dp0..\.venv\Scripts\python.exe"
set "VENV_UVICORN=%~dp0..\.venv\Scripts\uvicorn.exe"

:: Check if DB exists, if not seed it
if not exist "cafemargin.db" (
    echo [INFO] Database tidak ditemukan, menjalankan seed.py...
    if exist "%VENV_PY%" (
        call "%VENV_PY%" seed.py
    ) else (
        call python seed.py
    )
    echo.
    echo [OK] Database berhasil dibuat!
    echo.
)

echo [START] Menjalankan FastAPI server di http://localhost:8000
echo.
if exist "%VENV_UVICORN%" (
    call "%VENV_UVICORN%" app.main:app --reload --host 0.0.0.0 --port 8000
) else (
    call uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
)
pause
