#!/bin/bash

echo "========================================"
echo "  ShiftFlow - Starting Services"
echo "========================================"
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "Docker found! Starting MongoDB and Redis..."
    echo ""
    docker-compose up -d mongodb redis
    echo ""
    echo "✓ MongoDB started on port 27017"
    echo "✓ Redis started on port 6379"
    echo ""
else
    echo "⚠ Docker not found!"
    echo ""
    echo "Please ensure MongoDB and Redis are running manually:"
    echo "  - MongoDB on port 27017"
    echo "  - Redis on port 6379"
    echo ""
    echo "Or install Docker: https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "  Starting Backend Server"
echo "========================================"
echo ""
cd backend
npm run dev &
BACKEND_PID=$!

echo ""
echo "========================================"
echo "  Starting Frontend Dev Server"
echo "========================================"
echo ""
cd ../frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================="
echo "  ShiftFlow Started Successfully!"
echo "========================================="
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Default Login Credentials:"
echo "  Admin:    admin@shiftflow.com / password"
echo "  Manager:  manager@shiftflow.com / password"
echo "  Employee: employee@shiftflow.com / password"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down" EXIT
wait
