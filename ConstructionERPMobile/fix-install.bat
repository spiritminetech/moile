@echo off
echo ========================================
echo Fixing npm installation issues
echo ========================================
echo.

echo Step 1: Killing any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Removing node_modules directory...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed
) else (
    echo node_modules not found, skipping
)

echo Step 3: Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo package-lock.json removed
) else (
    echo package-lock.json not found, skipping
)

echo Step 4: Cleaning npm cache...
call npm cache clean --force

echo Step 5: Installing dependencies with legacy peer deps...
call npm install --legacy-peer-deps

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo You can now run: npm start
pause
