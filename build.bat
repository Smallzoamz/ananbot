@echo off
echo ==========================================
echo   An An Bot v4.1 - EXE Build Wizard 🪄
echo ==========================================
echo.
echo [1/3] Checking dependencies...
pip install pyinstaller disnake python-dotenv

echo.
echo [2/3] Building executable...
echo Please wait, this might take a few minutes...
pyinstaller --onefile --name "AnAnBot_v4.1" --clean --icon=NONE anan_bot.py

echo.
echo [3/3] Finalizing...
if exist "dist\AnAnBot_v4.1.exe" (
    echo.
    echo ==========================================
    echo   ✨ SUCCESS! An An is now a program! ✨
    echo ==========================================
    echo Your file is in: dist\AnAnBot_v4.1.exe
    echo.
    echo IMPORTANT: 
    echo 1. Copy your .env file into the 'dist' folder.
    echo 2. Run AnAnBot_v4.1.exe to start the bot!
    echo ==========================================
) else (
    echo.
    echo [!] Build failed. Please check the errors above.
)
pause
