@echo off
echo Clearing Metro and Expo cache...

REM Clear npm cache
npm cache clean --force

REM Clear Expo cache
if exist .expo rmdir /s /q .expo
if exist .expo-shared rmdir /s /q .expo-shared

REM Clear Metro cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Clear temp directories
if exist %TEMP%\metro-* rmdir /s /q %TEMP%\metro-*
if exist %TEMP%\react-* rmdir /s /q %TEMP%\react-*

REM Clear watchman if available
watchman watch-del-all 2>nul

echo Cache cleared successfully!
echo Starting Expo with clean cache...

REM Start Expo with reset cache
npx expo start --clear