@echo off
echo ========================================
echo Force Clean Installation
echo ========================================
echo.
echo IMPORTANT: Close VS Code and any file explorers
echo showing the project folder before continuing!
echo.
pause

cd /d "%~dp0"

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM Code.exe 2>nul
ping 127.0.0.1 -n 3 >nul

echo Step 2: Removing node_modules (this may take a minute)...
if exist node_modules (
    echo Deleting node_modules...
    rd /s /q node_modules 2>nul
    if exist node_modules (
        echo Trying alternative deletion method...
        rmdir /s /q node_modules 2>nul
    )
)

echo Step 3: Cleaning other files...
if exist .expo rd /s /q .expo 2>nul
if exist package-lock.json del /f /q package-lock.json 2>nul
if exist yarn.lock del /f /q yarn.lock 2>nul

echo Step 4: Clearing npm cache...
call npm cache clean --force

echo Step 5: Installing (this will take 5-10 minutes)...
call npm install --legacy-peer-deps --verbose

if errorlevel 1 (
    echo.
    echo Installation failed. Trying with different registry...
    call npm install --legacy-peer-deps --registry=https://registry.npmmirror.com
)

echo.
echo Step 6: Verifying installation...
call npm list expo react-native

echo.
echo Step 7: Starting Expo...
call npx expo start -c

pause
