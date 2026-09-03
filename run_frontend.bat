@echo off
title CogniVeil Frontend
echo ========================================================
echo Starting CogniVeil React Frontend...
echo URL: http://localhost:3000
echo ========================================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

call npm start
pause
