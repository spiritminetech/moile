@echo off
echo ========================================
echo Installing Expo Go Compatible Versions
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Stopping processes...
taskkill /F /IM node.exe 2>nul

echo Step 2: Cleaning...
if exist node_modules rmdir /s /q node_modules
if exist .expo rmdir /s /q .expo
if exist package-lock.json del /f /q package-lock.json

echo Step 3: Installing with legacy peer deps...
call npm install --legacy-peer-deps

echo.
echo Step 4: Starting Expo...
call npx expo start -c

pause
