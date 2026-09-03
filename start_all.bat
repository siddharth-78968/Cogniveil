@echo off
title Launch CogniVeil
echo ========================================================
echo   CogniVeil Early Dementia Detection System
echo   Launching Backend and Frontend...
echo ========================================================

start "CogniVeil Backend (FastAPI)" "%~dp0run_backend.bat"
start "CogniVeil Frontend (React)" "%~dp0run_frontend.bat"

echo.
echo Both servers have been launched in separate terminal windows!
echo - Backend API:  http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo - Frontend UI:  http://localhost:3000
echo.
pause
