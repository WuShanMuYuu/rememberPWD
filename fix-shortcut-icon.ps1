#Requires -RunAsAdministrator

$ErrorActionPreference = 'SilentlyContinue'

Write-Host 'Clearing Windows icon cache...' -ForegroundColor Cyan

Stop-Process -Name explorer -Force

$paths = @(
    "$env:LOCALAPPDATA\IconCache.db"
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*.db"
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache*.db"
)

foreach ($p in $paths) {
    Remove-Item -Path $p -Force -Recurse
}

ie4uinit.exe -ClearIconCache
ie4uinit.exe -show

$shortcutPath = "$env:USERPROFILE\Desktop\RememberPassword.lnk"
$exePath = 'D:\soft\RememberPassword\remember-password-manager.exe'

if (Test-Path $shortcutPath) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.IconLocation = "$exePath,0"
    $shortcut.Save()
    Write-Host 'Desktop shortcut icon refreshed' -ForegroundColor Green
}

Start-Process explorer.exe

Write-Host 'Done. Please reboot your computer now.' -ForegroundColor Yellow
