@echo off
title CogniVeil Backend
echo ========================================================
echo Starting CogniVeil FastAPI Backend...
echo URL: http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo ========================================================

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe run_server.py
) else (
    echo [WARNING] venv not found in backend directory. Using system python...
    python run_server.py
)
pause
