@echo off
echo ========================================
echo Starting Expo with Tunnel Mode
echo ========================================
echo.
echo This works even if phone and PC are on different networks
echo Requires Expo account (free)
echo.
pause

cd /d "%~dp0"

echo Step 1: Logging into Expo...
call npx expo login

echo Step 2: Starting with tunnel...
call npx expo start --tunnel

echo.
echo ========================================
echo Tunnel Started!
echo ========================================
echo.
echo Scan the QR code with Expo Go
echo This should work now!
echo.
pause
