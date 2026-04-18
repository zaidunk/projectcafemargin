@echo off
echo ========================================
echo  CafeMargin - Starting Backend
echo ========================================
cd /d "%~dp0backend"

set "VENV_PY=%~dp0..\.venv\Scripts\python.exe"
set "VENV_PIP=%~dp0..\.venv\Scripts\pip.exe"
set "VENV_UVICORN=%~dp0..\.venv\Scripts\uvicorn.exe"

echo [1/3] Installing Python dependencies...
if exist "%VENV_PIP%" (
	call "%VENV_PIP%" install -r requirements.txt
) else (
	call pip install -r requirements.txt
)

echo.
echo [2/3] Creating database and seed data...
if exist "%VENV_PY%" (
	call "%VENV_PY%" seed.py
) else (
	call python seed.py
)

echo.
echo [3/3] Starting FastAPI server...
echo Backend running at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
if exist "%VENV_UVICORN%" (
	call "%VENV_UVICORN%" app.main:app --reload --port 8000 --host 0.0.0.0
) else (
	call uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
)
