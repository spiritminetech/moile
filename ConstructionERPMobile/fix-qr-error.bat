@echo off
echo ========================================
echo Fixing QR Code Runtime Error
echo ========================================
echo.

echo Step 1: Stopping Metro bundler and Expo processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Metro bundler cache...
cd /d "%~dp0"
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
del /f /q .expo-shared\* 2>nul

echo Step 3: Clearing watchman cache (if installed)...
watchman watch-del-all 2>nul

echo Step 4: Reinstalling dependencies...
call npm install

echo Step 5: Clearing Expo cache...
call npx expo start -c

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now scan the QR code again.
echo If the error persists, run: rebuild-native.bat
echo.
pause
