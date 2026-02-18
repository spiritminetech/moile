@echo off
echo ========================================
echo Running on Android Emulator
echo ========================================
echo.
echo Make sure Android Studio is installed
echo and you have created an emulator
echo.
pause

cd /d "%~dp0"

echo Step 1: Starting emulator...
echo Opening Android Studio AVD Manager...
echo Please start an emulator manually if not running
echo.
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe"
timeout /t 5 /nobreak >nul

echo Step 2: Waiting for emulator to boot...
echo (This may take 1-2 minutes)
timeout /t 30 /nobreak >nul

echo Step 3: Installing and running app...
call npx expo run:android

echo.
echo ========================================
echo App should now be running in emulator!
echo ========================================
echo.
pause
