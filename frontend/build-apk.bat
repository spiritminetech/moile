@echo off
echo ========================================
echo Building APK for Direct Installation
echo ========================================
echo.
echo This creates an APK you can install on any device
echo Build time: 10-15 minutes
echo.
pause

cd /d "%~dp0"

echo Step 1: Installing EAS CLI...
call npm install -g eas-cli

echo Step 2: Logging into Expo...
call eas login

echo Step 3: Configuring build...
call eas build:configure

echo Step 4: Building APK...
call eas build -p android --profile preview

echo.
echo ========================================
echo Build Started!
echo ========================================
echo.
echo The build happens on Expo servers.
echo You'll get a download link when done.
echo Install the APK on your phone.
echo.
pause
