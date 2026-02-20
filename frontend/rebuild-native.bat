@echo off
echo ========================================
echo Rebuilding Native Modules (Deep Fix)
echo ========================================
echo.
echo WARNING: This will take 5-10 minutes
echo.
pause

cd /d "%~dp0"

echo Step 1: Stopping all processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM adb.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning all caches...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\.gradle 2>nul
del /f /q package-lock.json 2>nul
del /f /q yarn.lock 2>nul

echo Step 3: Reinstalling dependencies...
call npm install

echo Step 4: Prebuild native code...
call npx expo prebuild --clean

echo Step 5: Starting with clean cache...
call npx expo start -c

echo.
echo ========================================
echo Rebuild Complete!
echo ========================================
echo.
echo Scan the QR code again.
echo.
pause
