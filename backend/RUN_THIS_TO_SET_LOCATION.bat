@echo off
echo ============================================
echo SET PROJECT LOCATION TO YOUR LOCATION
echo ============================================
echo.
echo This will update ALL projects to use your current GPS coordinates
echo.
echo BEFORE RUNNING:
echo 1. Open your mobile app
echo 2. Go to "Today's Tasks" screen  
echo 3. Look at "Your Current Location" section
echo 4. Copy your Lat and Lng values
echo 5. Edit quick-set-my-location.js and paste your coordinates
echo.
echo Press any key to continue...
pause > nul
echo.
echo Running script...
node quick-set-my-location.js
echo.
echo ============================================
echo DONE! Now reload your mobile app.
echo ============================================
pause
