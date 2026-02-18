@echo off
echo ========================================
echo Downgrading to Expo Go Compatible Version
echo ========================================
echo.
echo This will downgrade React Native to work with Expo Go
echo.
pause

cd /d "%~dp0"

echo Step 1: Stopping processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning...
rmdir /s /q node_modules 2>nul
rmdir /s /q .expo 2>nul
del /f /q package-lock.json 2>nul

echo Step 3: Installing Expo Go compatible version...
call npm install expo@~51.0.0 react-native@0.74.5

echo Step 4: Reinstalling dependencies...
call npm install

echo Step 5: Starting with clean cache...
call npx expo start -c

echo.
echo ========================================
echo Downgrade Complete!
echo ========================================
echo.
echo Now scan QR code with Expo Go app
echo.
pause
