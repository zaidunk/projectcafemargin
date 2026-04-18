@echo off
title CafeMargin Deploy
color 0A
echo ============================================
echo   CafeMargin - Full Deploy Script
echo ============================================
echo.

set REPO_ROOT=C:\Users\farsya\projectcafemargin2
set BACKEND_DIR=%REPO_ROOT%\cafemargin-app\backend
set HF_TEMP=C:\temp\hf-pcm2

echo [1/4] Git commit + push ke GitHub (auto-deploy Firebase)...
cd /D "%REPO_ROOT%"

git add cafemargin-app\backend\app\models\transaction.py
git add cafemargin-app\backend\app\routers\transactions.py
git add cafemargin-app\backend\app\services\transaction_loader.py
git add cafemargin-app\backend\app\services\analytics_engine.py
git add cafemargin-app\backend\app\services\pcm2\ml_engine.py
git add cafemargin-app\backend\app\routers\analytics.py
git add cafemargin-app\backend\app\routers\advanced.py
git add cafemargin-app\backend\Dockerfile
git add cafemargin-app\backend\README.md
git add cafemargin-app\frontend\src\

git commit -m "feat: pipeline fixes + TipsCard all screens + pcm2 analytics overhaul"
git push origin main

echo.
echo [1/4] DONE - Firebase akan auto-build dalam beberapa menit.
echo.

echo [2/4] Clone HF Space...
if exist "%HF_TEMP%" rmdir /S /Q "%HF_TEMP%"
git clone https://huggingface.co/spaces/xolvon/pcm2 "%HF_TEMP%"
if errorlevel 1 (
    echo ERROR: Gagal clone HF Space. Pastikan sudah login HF.
    echo Jalankan dulu: huggingface-cli login
    pause
    exit /b 1
)

echo.
echo [3/4] Copy kode backend terbaru ke HF Space...
rmdir /S /Q "%HF_TEMP%\app"
xcopy /E /I /Y "%BACKEND_DIR%\app" "%HF_TEMP%\app"
copy /Y "%BACKEND_DIR%\requirements.txt" "%HF_TEMP%\requirements.txt"

echo.
echo [4/4] Commit + push ke HF Space...
cd /D "%HF_TEMP%"
git add -A
git commit -m "feat: add pcm2 ml engine + pipeline fixes (collected_by, receipt accuracy)"
git push

echo.
echo ============================================
echo   DEPLOY SELESAI!
echo   Firebase: https://cafemargin-web--cafe-margin.asia-southeast1.hosted.app
echo   HF Space: https://xolvon-pcm2.hf.space (rebuild ~2-3 menit)
echo ============================================
echo.
echo JANGAN LUPA: Jalankan SQL ini di Supabase SQL Editor:
echo   ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collected_by VARCHAR;
echo   URL: https://supabase.com/dashboard/project/xxlowsbiqqeqauwybzre/sql/new
echo.
pause
