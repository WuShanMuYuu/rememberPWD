@echo off
chcp 65001 >nul
title Remember Password Manager Build

setlocal enabledelayedexpansion

:: Switch to the directory where this script is located
cd /d "%~dp0"

echo ==========================================
echo  Remember Password Manager Build Script
echo ==========================================
echo.

:: Check and terminate any running instance
echo [1/3] Checking for running instances...
tasklist | findstr /i "remember-password-manager.exe" >nul
if %errorlevel% == 0 (
    echo       Found running instance, terminating...
    taskkill /f /im remember-password-manager.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo       Terminated.
) else (
    echo       No running instance found.
)
echo.

:: Clean old release cache
echo [2/3] Cleaning old build cache...
if exist "src-tauri\target\release\remember-password-manager.exe" (
    del /f /q "src-tauri\target\release\remember-password-manager.exe" >nul 2>&1
)
echo       Done.
echo.

:: Run Tauri build
echo [3/3] Starting Tauri build...
echo.
npm run tauri:build

if %errorlevel% == 0 (
    echo.
    echo ==========================================
    echo  Build succeeded!
    echo ==========================================
    echo.
    echo Executable:
    echo   src-tauri\target\release\remember-password-manager.exe
    echo.
    echo Installer:
    echo   src-tauri\target\release\bundle\nsis\RememberPasswordManager_1.0.0_x64-setup.exe
    echo.
) else (
    echo.
    echo ==========================================
    echo  Build failed. See error messages above.
    echo ==========================================
    echo.
)

pause
endlocal
