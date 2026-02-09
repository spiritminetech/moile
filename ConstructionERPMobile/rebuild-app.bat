@echo off
echo ========================================
echo   DPR Fields Update - App Rebuild
echo ========================================
echo.
echo This will rebuild the app to show new DPR fields
echo.
echo New fields added:
echo   - Overtime Hours
echo   - Absent Workers  
echo   - Late Workers
echo   - Issue Location
echo   - Issue Action Taken
echo   - Material Planned Consumption
echo   - Material Wastage
echo   - Material Notes
echo.
echo ========================================
echo.

echo Clearing Metro bundler cache...
call npm start -- --clear

echo.
echo ========================================
echo Rebuild complete!
echo.
echo Press 'a' for Android
echo Press 'i' for iOS  
echo Press 'w' for Web
echo ========================================
