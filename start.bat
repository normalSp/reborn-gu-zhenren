@echo off
chcp 65001 >nul 2>&1
title GuZhenRen World v0.5.0

echo ========================================
echo   GuZhenRen World v0.5.0
echo ========================================
echo.

:: --- Archive old logs ---
if not exist "doc\logs\archive" mkdir "doc\logs\archive"
if exist "doc\logs\*.log" (
    echo [LOG] Archiving old logs to doc\logs\archive\
    move "doc\logs\*.log" "doc\logs\archive\" >nul 2>nul
    echo [LOG] Done
    echo.
)

:: --- Check Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERR] Node.js not found. Please install Node.js 16+
    echo       https://nodejs.org/
    pause
    exit /b 1
)

:: --- Check dependencies ---
if not exist "node_modules" (
    echo [DEP] Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERR] npm install failed
        pause
        exit /b 1
    )
    echo [DEP] Done
    echo.
)

:: --- Clear storage tip ---
echo ========================================
echo   FIRST-TIME TEST: Clear old saves first!
echo   The browser will open with ?clear param
echo   to auto-wipe localStorage & sessionStorage
echo   Then reopen http://localhost:5173/
echo ========================================
echo.
echo   DEBUG: Press F12 in browser for Console
echo   Search [PIPE] to see pipeline flow
echo   Bottom-right corner: DebugOverlay status
echo ========================================
echo.

echo [VITE] Starting dev server...
echo.

start http://localhost:5173/?clear
npx vite --port 5173 --host

pause
