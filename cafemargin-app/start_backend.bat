@echo off
echo ========================================
echo  CafeMargin - Starting Backend
echo ========================================
cd /d "%~dp0backend"

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Creating database and seed data...
python seed.py

echo.
echo [3/3] Starting FastAPI server...
echo Backend running at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
