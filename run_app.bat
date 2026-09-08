@echo off
title Personal AI Companion Launcher
echo ========================================================
echo   Starting Personal AI Companion (Backend + Frontend)
echo ========================================================

:: Jalankan Backend FastAPI di jendela command prompt terpisah
start "Companion Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Jalankan Frontend Vite
start "Companion Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend berjalan di:  http://127.0.0.1:8000
echo Frontend berjalan di: http://localhost:5173
echo.
echo Menunggu frontend siap lalu membuka browser...
timeout /t 3 >nul
start http://localhost:5173
