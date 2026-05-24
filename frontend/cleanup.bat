@echo off
REM Frontend Cache & Build Cleanup

echo.
echo ========================================
echo Cleaning Frontend Cache and Build
echo ========================================
echo.

cd /d "%~dp0" || exit /b 1

REM Remove node_modules and lock files (forces fresh install)
echo Removing node_modules and lock files...
if exist node_modules rmdir /s /q node_modules
if exist .vite rmdir /s /q .vite
if exist package-lock.json del /q package-lock.json
if exist yarn.lock del /q yarn.lock

REM Remove dist folder (build output)
echo Removing build output...
if exist dist rmdir /s /q dist

echo.
echo √ Cleanup complete
echo.
echo Next steps:
echo 1. Install dependencies: npm install
echo 2. Start dev server: npm run dev
echo 3. Clear browser cache (Ctrl+Shift+Delete)
echo 4. Restart frontend (Ctrl+R in browser)
