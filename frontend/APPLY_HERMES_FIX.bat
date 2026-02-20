@echo off
echo ========================================
echo React Native Hermes Debugger Fix
echo ========================================
echo.

echo Step 1: Verifying Hermes configuration...
node verify-hermes.js
echo.

echo Step 2: Instructions to apply the fix
echo ========================================
echo.
echo 1. Stop the current Metro bundler (press Ctrl+C in the terminal)
echo.
echo 2. Clear Expo cache:
echo    npx expo start -c
echo.
echo 3. Rebuild the app:
echo    npx expo run:android
echo.
echo 4. After rebuild, press 'j' to open debugger
echo.
echo ========================================
echo.
echo Alternative: If you don't want to rebuild now
echo ========================================
echo.
echo Use console.log() for debugging:
echo - Add console.log() statements in your code
echo - View output in Metro bundler terminal
echo.
echo Press 'm' in Metro terminal and select:
echo - "Open React DevTools" for component inspection
echo.
echo ========================================
pause
