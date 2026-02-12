@echo off
echo ========================================
echo Photo Upload Fix - Rebuild Script
echo ========================================
echo.

echo This script will rebuild the app with photo upload fixes
echo.
echo Changes included:
echo   - Extended upload timeout (60 seconds)
echo   - Upload progress tracking
echo   - Optimized photo compression
echo   - Better error handling
echo.

echo Step 1: Clearing Metro bundler cache...
call npx react-native start --reset-cache
if errorlevel 1 (
    echo Warning: Metro cache clear failed, continuing anyway...
)

echo.
echo Step 2: Clearing npm cache...
npm cache clean --force
if errorlevel 1 (
    echo Warning: npm cache clean failed, continuing anyway...
)

echo.
echo Step 3: Reinstalling dependencies...
call npm install
if errorlevel 1 (
    echo Error: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Building Android app...
echo.
echo Choose build option:
echo   1. Debug build (faster, for testing)
echo   2. Release build (slower, for production)
echo   3. Skip build (just clear cache)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Building debug version...
    call npm run android
    if errorlevel 1 (
        echo Error: Android build failed!
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo.
    echo Building release version...
    call npm run android -- --variant=release
    if errorlevel 1 (
        echo Error: Android release build failed!
        pause
        exit /b 1
    )
) else if "%choice%"=="3" (
    echo.
    echo Skipping build...
) else (
    echo Invalid choice, skipping build...
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Test photo upload on Transport Tasks (pickup/dropoff)
echo   2. Test profile photo upload
echo   3. Monitor console logs for upload progress
echo   4. Verify error messages are user-friendly
echo.
echo Tips:
echo   - Check console for upload progress (0-100%%)
echo   - Test on both WiFi and mobile data
echo   - Try with different photo sizes
echo   - Verify operations complete even if upload fails
echo.
echo Documentation:
echo   - PHOTO_UPLOAD_FIX_SUMMARY.md
echo   - COMPLETE_PHOTO_UPLOAD_VERIFICATION.md
echo   - PHOTO_UPLOAD_TIMEOUT_FIX.md
echo.
pause
