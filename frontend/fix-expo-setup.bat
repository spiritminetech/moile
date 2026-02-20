@echo off
echo ========================================
echo Fixing Expo Setup Issues
echo ========================================
echo.

echo Step 1: Cleaning up...
echo Removing node_modules...
if exist node_modules rmdir /s /q node_modules
echo Removing package-lock.json...
if exist package-lock.json del /f /q package-lock.json
echo.

echo Step 2: Installing dependencies...
echo This may take a few minutes...
call npm install
echo.

echo Step 3: Verifying Expo installation...
call npm list expo
echo.

echo Step 4: Clearing Expo cache...
call npx expo start --clear
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now run: npx expo start
echo.
pause
