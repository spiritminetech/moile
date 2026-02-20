@echo off
echo ========================================
echo Quick Fix for Expo Installation Issue
echo ========================================
echo.

echo Removing invalid expo installation...
rmdir /s /q node_modules\expo 2>nul
echo.

echo Reinstalling expo...
call npm install expo@54.0.33 --save
echo.

echo Verifying installation...
call npm list expo
echo.

echo Clearing Expo cache...
call npx expo start --clear
echo.

echo ========================================
echo Fix Complete!
echo ========================================
pause
