@echo off
title Personal AI Companion Launcher
echo ========================================================
echo   Starting DevCompanion (Backend + Frontend Mobile Ready)
echo ========================================================

:: Jalankan Backend FastAPI
start "Companion Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Jalankan Frontend Vite
start "Companion Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Desktop URL: http://localhost:5173
echo.
timeout /t 2 >nul
start http://localhost:5173
