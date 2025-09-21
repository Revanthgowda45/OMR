@echo off
echo 🚀 Starting OMR Development Servers...
echo ========================================

echo.
echo 🔍 Checking if dependencies are installed...

if not exist "node_modules" (
    echo ❌ Node modules not found. Running npm install...
    call npm install
)

echo.
echo 🌐 Starting development servers...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Try to use local concurrently first, then global, then npx
if exist "node_modules\.bin\concurrently.cmd" (
    call node_modules\.bin\concurrently.cmd "npm run dev:client" "npm run dev:server"
) else (
    echo 🔧 Using npx concurrently...
    call npx concurrently "npm run dev:client" "npm run dev:server"
)
