@echo off
echo ========================================
echo Testing New Alias Endpoints
echo ========================================
echo.
echo This will test:
echo   - GET /api/supervisor/assigned-sites
echo   - GET /api/supervisor/team-list
echo.
echo Make sure the backend server is running!
echo.
pause
echo.
node test-new-alias-endpoints.js
echo.
pause
