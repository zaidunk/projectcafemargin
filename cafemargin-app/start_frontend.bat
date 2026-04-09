@echo off
echo ========================================
echo  CafeMargin - Starting Frontend
echo ========================================
cd /d "%~dp0frontend"

echo [1/2] Installing Node.js dependencies...
npm install

echo.
echo [2/2] Starting React dev server...
echo Frontend running at: http://localhost:5173
echo.
npm run dev
