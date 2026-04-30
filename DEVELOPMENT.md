# ShiftFlow - Development Guide

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js 20.x or higher
- MongoDB 6.0 or higher
- Redis 7.0 or higher
- npm or yarn
- Git

### Development Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd shiftflow
```

2. **Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Configuration**

Create `.env` files from examples:
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd frontend
cp .env.example .env
```

Edit the `.env` files with your local configuration.

4. **Start Development Services**

**Option 1: Using Docker (Recommended)**
```bash
docker-compose up -d mongodb redis
```

**Option 2: Local Services**
- Start MongoDB on port 27017
- Start Redis on port 6379

5. **Run the Application**
```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api/v1

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── redis.js         # Redis connection
│   │   ├── logger.js        # Winston logger setup
│   │   ├── queue.js         # Bull queue setup
│   │   ├── email.js         # Nodemailer config
│   │   └── s3.js            # AWS S3 config
│   │
│   ├── models/              # Mongoose models
│   │   ├── User.js          # User model
│   │   ├── Employee.js      # Employee model
│   │   ├── Shift.js         # Shift model
│   │   ├── Attendance.js    # Attendance model
│   │   ├── Leave.js         # Leave model
│   │   ├── Swap.js          # Swap request model
│   │   └── Notification.js  # Notification model
│   │
│   ├── routes/              # Express routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management
│   │   ├── employees.js     # Employee management
│   │   ├── shifts.js        # Shift management
│   │   ├── attendance.js    # Attendance tracking
│   │   ├── leaves.js        # Leave management
│   │   ├── swaps.js         # Shift swap requests
│   │   ├── reports.js       # Reporting
│   │   ├── notifications.js # Notifications
│   │   └── analytics.js     # Analytics
│   │
│   ├── controllers/         # Route controllers
│   │   └── (to be implemented)
│   │
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── error.js         # Error handler
│   │   └── rateLimiter.js   # Rate limiting
│   │
│   ├── services/            # Business logic
│   │   └── (to be implemented)
│   │
│   ├── jobs/                # Background jobs
│   │   ├── emailProcessor.js
│   │   ├── reportProcessor.js
│   │   ├── reminderProcessor.js
│   │   ├── notificationProcessor.js
│   │   └── cronJobs.js
│   │
│   ├── templates/           # Email templates
│   │   └── (to be implemented)
│   │
│   ├── utils/               # Utility functions
│   │   └── (to be implemented)
│   │
│   └── server.js            # Application entry point
│
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── Dockerfile
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   └── Header.tsx       # Top header bar
│   │
│   ├── pages/               # Page components
│   │   ├── Login.tsx        # Login page
│   │   ├── Dashboard.tsx    # Dashboard
│   │   ├── Schedule.tsx     # Schedule calendar
│   │   ├── Employees.tsx    # Employee management
│   │   ├── Attendance.tsx   # Attendance tracking
│   │   ├── Leaves.tsx       # Leave requests
│   │   ├── Swaps.tsx        # Shift swaps
│   │   ├── Reports.tsx      # Reports
│   │   ├── Profile.tsx      # User profile
│   │   └── Settings.tsx     # Settings
│   │
│   ├── context/             # React context
│   │   └── AuthContext.tsx  # Authentication context
│   │
│   ├── hooks/               # Custom hooks
│   │   └── (to be implemented)
│   │
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   │
│   ├── utils/               # Utility functions
│   │   └── api.ts           # Axios configuration
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── public/                  # Static assets
├── .env.example
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── Dockerfile
```

## Coding Standards

### Backend (JavaScript/Node.js)

**File Naming**
- Use camelCase for files: `userController.js`
- Use PascalCase for models: `User.js`

**Code Style**
```javascript
// Use async/await over promises
const getUser = async (id) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    throw error;
  }
};

// Use arrow functions
const sum = (a, b) => a + b;

// Destructuring
const { firstName, lastName, email } = user;

// Template literals
const fullName = `${firstName} ${lastName}`;
```

**Error Handling**
```javascript
// Always use try-catch with async functions
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};
```

**Validation**
```javascript
// Use Joi for validation
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const { error, value } = userSchema.validate(req.body);
```

### Frontend (TypeScript/React)

**Component Structure**
```typescript
import { useState, useEffect } from 'react';
import { SomeType } from '../types';

interface Props {
  title: string;
  onAction: () => void;
}

const MyComponent = ({ title, onAction }: Props) => {
  const [data, setData] = useState<SomeType[]>([]);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
};

export default MyComponent;
```

**Naming Conventions**
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with 'use' prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase (`User`, `ShiftData`)

**Type Safety**
```typescript
// Define interfaces for all data structures
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Use types for function parameters
const greetUser = (user: User): string => {
  return `Hello, ${user.firstName}!`;
};
```

## API Development

### Creating a New Endpoint

1. **Define the Model** (`backend/src/models/`)
```javascript
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

module.exports = mongoose.model('Example', exampleSchema);
```

2. **Create Controller** (`backend/src/controllers/`)
```javascript
const Example = require('../models/Example');

exports.getExamples = async (req, res, next) => {
  try {
    const examples = await Example.find();
    res.json({ status: 'success', data: { examples } });
  } catch (error) {
    next(error);
  }
};
```

3. **Define Routes** (`backend/src/routes/`)
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getExamples } = require('../controllers/exampleController');

router.get('/', protect, getExamples);

module.exports = router;
```

4. **Register Routes** (`backend/src/server.js`)
```javascript
const exampleRoutes = require('./routes/examples');
app.use('/api/v1/examples', exampleRoutes);
```

## Testing

### Backend Testing
```javascript
// Using Jest and Supertest
const request = require('supertest');
const { app } = require('../src/server');

describe('User API', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });
});
```

### Frontend Testing
```typescript
// Using Jest and React Testing Library
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  it('renders user name', () => {
    const user = { name: 'John Doe' };
    render(<UserProfile user={user} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Database

### MongoDB Schema Design

**Best Practices**
- Use references for one-to-many relationships
- Embed data for frequently accessed related data
- Create indexes for frequently queried fields
- Use virtual fields for computed properties

**Example**
```javascript
// Using references
const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  // ... other fields
});

// Create indexes
shiftSchema.index({ employee: 1, startTime: 1 });

// Virtual fields
shiftSchema.virtual('durationHours').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60);
});
```

### Migrations

For schema changes, create migration scripts in `backend/src/migrations/`:

```javascript
// 001_add_field_to_users.js
const mongoose = require('mongoose');
const User = require('../models/User');

const migrate = async () => {
  await User.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: 'default' } }
  );
};

module.exports = { migrate };
```

## Performance Optimization

### Backend
- Use Redis caching for frequently accessed data
- Implement pagination for list endpoints
- Use database indexes
- Enable gzip compression
- Use connection pooling

### Frontend
- Lazy load components with React.lazy()
- Memoize expensive computations with useMemo()
- Optimize re-renders with React.memo()
- Use code splitting
- Optimize images

## Security Best Practices

1. **Never commit `.env` files**
2. **Use environment variables for secrets**
3. **Validate all user input**
4. **Sanitize data before database operations**
5. **Use HTTPS in production**
6. **Implement rate limiting**
7. **Use helmet for security headers**
8. **Keep dependencies updated**

## Debugging

### Backend
```javascript
// Use logger instead of console.log
const logger = require('./config/logger');
logger.info('User logged in');
logger.error('Error occurred', { error });
```

### Frontend
- Use React DevTools
- Use Redux DevTools (if applicable)
- Browser network tab for API debugging
- Use TypeScript for type checking

## Git Workflow

1. **Create feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Make commits**
```bash
git add .
git commit -m "feat: add new feature"
```

3. **Push to remote**
```bash
git push origin feature/new-feature
```

4. **Create Pull Request**
5. **Code review**
6. **Merge to main**

### Commit Message Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Update all environment variables
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up error tracking
- [ ] Configure CDN (if needed)
- [ ] Run security audit
- [ ] Load testing

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string in .env
- Check network/firewall settings

**Redis Connection Failed**
- Check Redis is running
- Verify Redis host/port in .env

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Frontend Not Connecting to Backend**
- Check VITE_API_URL in frontend .env
- Verify CORS settings in backend
- Check backend is running

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For questions or issues:
1. Check existing documentation
2. Search GitHub issues
3. Create a new issue with detailed description
4. Contact the development team
