@echo off
rem Jerry Site DevTools Launcher - ASCII only (cmd-safe)
cd /d "%~dp0"
title Jerry CMS DevTools Launcher

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org/
  pause
  exit /b 1
)

set "BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

echo ==========================================
echo   Jerry Site - DevTools Launcher
echo   http://127.0.0.1:5858/
echo ==========================================

echo [1/3] Starting server in a separate window...
start "JerryCMS Server" cmd /k node server.js

echo [2/3] Waiting for server...
timeout /t 2 /nobreak >nul

echo [3/3] Opening site with DevTools auto-open...
if defined BROWSER (
  start "" "%BROWSER%" --auto-open-devtools-for-tabs "http://127.0.0.1:5858/"
) else (
  start "" "http://127.0.0.1:5858/"
  echo [i] Chrome/Edge not found - opened default browser WITHOUT DevTools.
)

echo.
echo Done. To STOP the site: close the "JerryCMS Server" window.
timeout /t 4 >nul
