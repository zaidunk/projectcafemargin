# ============================================================
# Push backend terbaru ke HuggingFace Space xolvon/pcm2
# Jalankan: .\push-to-hf.ps1 -Token "hf_TOKEN_BARU_KAMU"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"

$backend = "C:\Users\farsya\projectcafemargin2\cafemargin-app\backend"
$pcm2    = "C:\Users\farsya\projectcafemargin2\cafemargin-app\backend\app\services\pcm2"

# ── Step 1: Copy files ────────────────────────────────────────
Write-Host "`n=== Step 1: Copy requirements.txt & Dockerfile ===" -ForegroundColor Cyan
Copy-Item "$backend\requirements.txt" "$pcm2\" -Force
Copy-Item "$backend\Dockerfile"       "$pcm2\" -Force

Write-Host "=== Step 2: Sync app/ (exclude pcm2 & __pycache__) ===" -ForegroundColor Cyan
robocopy "$backend\app" "$pcm2\app" /MIR /XD "pcm2" "__pycache__" /NFL /NDL /NJH /NJS

# ── Step 2b: Create app/services/pcm2/ with ML engine ────────
Write-Host "`n=== Step 2b: Copy ML engine ke app/services/pcm2/ ===" -ForegroundColor Cyan
$svcPcm2 = "$pcm2\app\services\pcm2"
New-Item -ItemType Directory -Path $svcPcm2 -Force | Out-Null
Copy-Item "$pcm2\__init__.py" "$svcPcm2\" -Force
Copy-Item "$pcm2\ml_engine.py" "$svcPcm2\" -Force
Write-Host "  Copied __init__.py + ml_engine.py → app/services/pcm2/" -ForegroundColor Green

# ── Step 3: Remove nested .git yang bikin git add gagal ──────
Write-Host "`n=== Step 3: Remove nested .git jika ada ===" -ForegroundColor Cyan
$nestedGit = "$pcm2\app\services\pcm2"
if (Test-Path $nestedGit) {
    Remove-Item $nestedGit -Recurse -Force
    Write-Host "  Removed $nestedGit" -ForegroundColor Yellow
} else {
    Write-Host "  Tidak ada nested git, skip." -ForegroundColor Gray
}

# ── Step 3: Git ───────────────────────────────────────────────
Write-Host "`n=== Step 4: Git commit & force push ke HuggingFace ===" -ForegroundColor Cyan
Set-Location $pcm2

git remote set-url origin "https://xolvon:$Token@huggingface.co/spaces/xolvon/pcm2"

git add -A

$changes = git status --porcelain
if ($changes) {
    git commit -m "fix: sync latest backend - low_memory, JSX fixes"
} else {
    Write-Host "  Tidak ada file baru, pakai commit sebelumnya." -ForegroundColor Yellow
}

# Force push karena remote mungkin punya auto-commits dari HF
git push --force origin main

Write-Host "`n=== DONE! HF Space rebuild otomatis (~3-5 menit) ===" -ForegroundColor Green
Write-Host "Monitor di: https://huggingface.co/spaces/xolvon/pcm2" -ForegroundColor Cyan
