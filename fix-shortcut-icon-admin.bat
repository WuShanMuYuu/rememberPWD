@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: Request admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 需要管理员权限，正在请求提升...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

powershell -ExecutionPolicy Bypass -File "%~dp0fix-shortcut-icon.ps1"
pause
