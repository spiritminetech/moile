@echo off
echo ========================================
echo USB Direct Connection Setup
echo ========================================
echo.
echo REQUIREMENTS:
echo 1. Connect phone via USB cable
echo 2. Enable USB Debugging on phone
echo 3. Allow USB debugging when prompted
echo.
pause

cd /d "%~dp0"

echo Checking ADB connection...
call adb devices

echo.
echo If you see your device listed above, press any key
echo If not, check USB debugging is enabled
echo.
pause

echo Installing app directly via USB...
call npx expo run:android

echo.
echo ========================================
echo App installed via USB!
echo ========================================
echo.
echo The app is now on your phone.
echo You can disconnect USB and use it.
echo.
pause
