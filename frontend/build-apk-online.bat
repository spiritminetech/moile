@echo off
echo ========================================
echo Building APK Online with EAS
echo ========================================
echo.
echo This builds your app on Expo servers
echo You'll get a download link to install on your phone
echo.
pause

cd /d "%~dp0"

echo Step 1: Installing EAS CLI...
call npm install -g eas-cli

echo Step 2: Login to Expo (create free account if needed)...
call eas login

echo Step 3: Configure build...
call eas build:configure

echo Step 4: Building APK (takes 10-15 minutes)...
call eas build -p android --profile preview

echo.
echo ========================================
echo Build submitted!
echo ========================================
echo.
echo Check your email or the Expo website for the download link
echo Install the APK on your phone
echo.
pause
