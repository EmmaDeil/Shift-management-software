# ShiftFlow - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Prerequisites

Make sure you have installed:
- **Node.js 20+** - [Download](https://nodejs.org/)
- **MongoDB 6.0+** - [Download](https://www.mongodb.com/try/download/community)
- **Redis 7.0+** - [Download](https://redis.io/download)

### Step 2: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd shiftflow

# Setup backend
cd backend
npm install
cp .env.example .env

# Setup frontend
cd ../frontend
npm install
cp .env.example .env
```

### Step 3: Configure Environment

**Edit `backend/.env`:**
```env
# Minimum required configuration
MONGODB_URI=mongodb://localhost:27017/shiftflow
REDIS_HOST=localhost
JWT_SECRET=your_secret_key_here_change_in_production
```

**Edit `frontend/.env`:** (Usually works as-is)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### Step 4: Start Services

**Option A: Using Docker (Easiest)**
```bash
docker-compose up
```
That's it! Everything starts automatically.

**Option B: Manual Start**
```bash
# Terminal 1 - Start MongoDB (if not running)
mongod

# Terminal 2 - Start Redis (if not running)
redis-server

# Terminal 3 - Start Backend
cd backend
npm run dev

# Terminal 4 - Start Frontend
cd frontend
npm run dev
```

### Step 5: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Step 6: Login

Use the demo credentials:
```
Email: admin@shiftflow.com
Password: password
```

## 📋 What's Working

After initial setup, you have:

✅ **Authentication System**
- User registration and login
- JWT token-based auth
- Protected routes

✅ **Frontend Interface**
- Modern, responsive UI
- Dark mode support
- Navigation between pages
- Dashboard layout

✅ **Backend API**
- RESTful API endpoints
- Database models
- Middleware (auth, errors, rate limiting)
- Real-time WebSocket support
- Background job queues

✅ **Infrastructure**
- Docker configuration
- Environment setup
- Logging system
- Error handling

## 🔨 What Needs Implementation

The structure is ready, but business logic needs to be added:

🔄 **In Progress**
- Controller implementations for all routes
- Service layer for business logic
- Email templates
- Data validation schemas
- Report generation
- Analytics calculations

## 📚 Common Commands

### Development
```bash
# Start backend dev server
cd backend && npm run dev

# Start frontend dev server
cd frontend && npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Docker
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild images
docker-compose build
```

### Database
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/shiftflow

# Connect to Redis
redis-cli
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod`
- Check connection string in `backend/.env`
- Try: `mongodb://localhost:27017/shiftflow`

### Redis Connection Error
- Make sure Redis is running: `redis-server`
- Check Redis host/port in `backend/.env`

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env`
- Check CORS settings in `backend/src/server.js`

### npm install Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📖 Documentation

- **README.md** - Full project documentation
- **API_DOCUMENTATION.md** - Complete API reference with examples
- **DEVELOPMENT.md** - Development guide and best practices

## 🎯 Next Steps

1. **Explore the codebase**
   - Check `backend/src/models/` for database schemas
   - Look at `frontend/src/pages/` for UI components
   - Review `backend/src/routes/` for API endpoints

2. **Implement features**
   - Start with controllers in `backend/src/controllers/`
   - Add business logic in `backend/src/services/`
   - Create reusable components in `frontend/src/components/`

3. **Test everything**
   - Write unit tests for backend
   - Write component tests for frontend
   - Test API endpoints with Postman

4. **Deploy**
   - Set up production environment variables
   - Configure production database
   - Deploy with Docker or cloud platform

## 💡 Tips

- Use the logger instead of console.log: `logger.info('message')`
- Always validate user input with Joi
- Use TypeScript types for better development experience
- Test API endpoints with tools like Postman or Insomnia
- Check browser console for frontend errors
- Check terminal logs for backend errors

## 🆘 Need Help?

1. Check the documentation files
2. Review existing code for examples
3. Check GitHub issues
4. Contact the development team

## 🎉 You're Ready!

Your ShiftFlow development environment is set up and ready to go. Start building amazing features!

Happy coding! 🚀
