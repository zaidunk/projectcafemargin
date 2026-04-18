@echo off
echo ========================================
echo  CafeMargin - Starting Frontend
echo ========================================
cd /d "%~dp0frontend"

echo [1/2] Installing Node.js dependencies...
call npm install

echo.
echo [2/2] Starting Next.js dev server...
echo Frontend running at: http://localhost:3000
echo.
call npm run dev
