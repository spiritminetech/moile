@echo off
echo ========================================
echo Fixing for Expo Go Compatibility
echo ========================================
echo.
echo Downgrading to Expo 51 + React Native 0.74.5
echo This version works perfectly with Expo Go
echo.
pause

cd /d "%~dp0"

echo Step 1: Stopping all processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning everything...
rmdir /s /q node_modules 2>nul
rmdir /s /q .expo 2>nul
rmdir /s /q android 2>nul
rmdir /s /q ios 2>nul
del /f /q package-lock.json 2>nul
del /f /q yarn.lock 2>nul

echo Step 3: Installing compatible versions...
call npm install

echo Step 4: Clearing Metro cache...
call npx expo start -c

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now scan the QR code with Expo Go app
echo The error should be gone!
echo.
pause
