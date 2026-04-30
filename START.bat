@echo off
echo ========================================
echo   ShiftFlow - Starting Services
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker found! Starting MongoDB and Redis...
    echo.
    docker-compose up -d mongodb redis
    echo.
    echo ✓ MongoDB started on port 27017
    echo ✓ Redis started on port 6379
    echo.
) else (
    echo ⚠ Docker not found!
    echo.
    echo Please ensure MongoDB and Redis are running manually:
    echo   - MongoDB on port 27017
    echo   - Redis on port 6379
    echo.
    echo Or install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.
cd backend
start "ShiftFlow Backend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Starting Frontend Dev Server
echo ========================================
echo.
cd ..\frontend
start "ShiftFlow Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo   ShiftFlow Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Default Login Credentials:
echo   Admin:    admin@shiftflow.com / password
echo   Manager:  manager@shiftflow.com / password
echo   Employee: employee@shiftflow.com / password
echo.
echo Press any key to open frontend in browser...
pause >nul
start http://localhost:5173
