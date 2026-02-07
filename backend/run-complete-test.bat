@echo off
echo ========================================
echo  COMPREHENSIVE API TEST WITH SAMPLE DATA
echo ========================================
echo.
echo This script will:
echo 1. Insert sample data into the database
echo 2. Test all API endpoints
echo 3. Generate a test report
echo.
echo Press any key to continue...
pause > nul

cd /d "%~dp0"

echo.
echo Starting test execution...
echo.

node test-all-apis-with-sample-data.js

echo.
echo ========================================
echo  TEST EXECUTION COMPLETED
echo ========================================
echo.
pause
