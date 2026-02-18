@echo off
echo ========================================
echo Setting Up Expo Dev Client
echo ========================================
echo.
echo This will create a custom development build
echo that works with React Native 0.76.5
echo.
pause

cd /d "%~dp0"

echo Step 1: Installing Expo Dev Client...
call npm install expo-dev-client

echo Step 2: Creating development build...
echo.
echo IMPORTANT: Keep your Android device connected via USB
echo or make sure Android emulator is running
echo.
pause

echo Building for Android...
call npx expo run:android

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo The app is now installed on your device.
echo Next time, just run: npx expo start --dev-client
echo.
echo DO NOT use Expo Go app anymore!
echo Use the newly installed app instead.
echo.
pause
