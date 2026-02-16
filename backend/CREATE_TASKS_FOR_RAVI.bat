@echo off
echo ================================================================================
echo Creating Tasks for Employee 2 (Ravi Smith)
echo ================================================================================
echo.
echo This will:
echo   1. Delete any old assignments for Employee 2
echo   2. Create 3 new tasks in the tasks collection
echo   3. Create 3 new assignments for Employee 2
echo.
echo Press Ctrl+C to cancel, or
pause

node create-tasks-for-employee-2.js

echo.
echo ================================================================================
echo NEXT STEPS - CLEAR MOBILE APP CACHE
echo ================================================================================
echo.
echo 1. LOGOUT from the mobile app
echo 2. FORCE CLOSE the app (swipe away from recent apps)
echo 3. REOPEN the app
echo 4. LOGIN again with your credentials
echo 5. PULL TO REFRESH on Today's Tasks screen
echo.
echo You should now see 3 new tasks for Ravi Smith!
echo.
pause
