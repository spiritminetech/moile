@echo off
echo ========================================
echo Adding Firewall Rule for Expo
echo ========================================
echo.
echo This requires Administrator privileges
echo Right-click and "Run as Administrator"
echo.
pause

netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=19000-19001

echo.
echo Firewall rules added!
echo.
pause
