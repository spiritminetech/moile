@echo off
echo ========================================
echo Starting Expo with Tunnel Mode
echo ========================================
echo.
echo This creates a public URL that works
echo even with firewall/network issues
echo.

cd /d "%~dp0"

echo Starting Expo with tunnel...
call npx expo start --tunnel

pause
