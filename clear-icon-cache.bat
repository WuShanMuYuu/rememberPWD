@echo off
chcp 65001 >nul
echo 正在清理 Windows 图标缓存...
echo.

:: 终止资源管理器
taskkill /f /im explorer.exe >nul 2>&1

:: 清理图标缓存文件
del /f /q "%localappdata%\IconCache.db" >nul 2>&1
del /f /q /s "%localappdata%\Microsoft\Windows\Explorer\iconcache*" >nul 2>&1
del /f /q /s "%localappdata%\Microsoft\Windows\Explorer\thumbcache*" >nul 2>&1

:: 重启资源管理器
start explorer.exe

echo 图标缓存已清理，桌面和文件图标会重新生成。
pause
