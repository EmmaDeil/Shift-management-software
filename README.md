# ShiftFlow - Enterprise Shift Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![MongoDB](https://img.shields.io/badge/mongodb-6.0-green.svg)

A comprehensive, enterprise-grade workforce scheduling and management platform with advanced analytics, real-time notifications, attendance tracking, and mobile optimization.

## 🎯 Overview

ShiftFlow is a production-ready shift management system built with modern technologies, featuring:

- **Smart Scheduling** - AI-powered auto-assignment with constraint satisfaction
- **Real-time Updates** - WebSocket-based live notifications and updates
- **Advanced Analytics** - ML-based predictions and comprehensive reporting
- **Mobile Optimized** - Full mobile API with offline sync capabilities
- **Enterprise Security** - 2FA, API keys, password policies, and audit logging
- **Background Processing** - Queue-based job system for emails, reports, and reminders
- **Professional Exports** - PDF and Excel reports with customizable templates

## ✨ Key Features

### Core Functionality
- 📅 **Visual Schedule Calendar** - Interactive month/week/day views with drag-and-drop
- 👥 **Employee Management** - Comprehensive profiles with skills, qualifications, and availability
- 🔄 **Shift Swapping** - Peer-to-peer shift exchange with manager approval workflow
- ✅ **Attendance Tracking** - Clock in/out with GPS, break tracking, and late detection
- 🏖️ **Leave Management** - Request and approval system with conflict detection
- 📊 **Advanced Analytics** - Trends, predictions, cost analysis, and compliance tracking

### Enterprise Features
- 🔐 **Multi-factor Authentication** - TOTP-based 2FA with backup codes
- 🔑 **API Key Management** - Granular permissions for integrations
- 🔒 **Security Hardening** - Password policies, account lockout, CSRF protection
- 📧 **Email Notifications** - 12+ notification templates with HTML/text versions
- 🔔 **Real-time Notifications** - WebSocket push for instant updates
- 📈 **Reports & Analytics** - 6+ report types with filters and exports
- 💾 **Redis Caching** - Performance optimization with intelligent cache invalidation
- 🎯 **Background Jobs** - Bull queue system for async processing
- ⏰ **Automated Tasks** - Cron jobs for reminders, summaries, and cleanup
- 📄 **File Management** - AWS S3 integration for uploads and attachments
- 🔍 **Audit Logging** - Complete trail of all system actions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS (fully responsive, dark mode support)
- **Routing**: React Router v6
- **Charts**: Chart.js + react-chartjs-2
- **State Management**: React Context API + Hooks
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi
- **Email**: Nodemailer
- **WebSocket**: Socket.io
- **Queue System**: Bull + Redis
- **Caching**: Redis
- **File Storage**: Multer + AWS S3
- **PDF Generation**: jsPDF + jspdf-autotable
- **Excel Export**: xlsx
- **2FA**: speakeasy + qrcode
- **Security**: helmet, express-rate-limit, csurf

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Manager**: PM2 (production)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 6.0+
- Redis 7.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd shiftflow
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB and Redis**
```bash
# Option 1: Using Docker
docker-compose up -d mongodb redis

# Option 2: Local installation
# Start MongoDB on port 27017
# Start Redis on port 6379
```

5. **Run the Application**

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Docker Mode:**
```bash
docker-compose up
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/v1

### Default Credentials
```
Email: admin@shiftflow.com
Password: password
```

## 📁 Project Structure

```
shiftflow/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── jobs/            # Background jobs
│   │   ├── templates/       # Email templates
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Entry point
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # App component
│   │   └── main.tsx         # Entry point
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── docker-compose.yml
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/shiftflow

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=15m

# Email (SMTP)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=shiftflow-uploads

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

## 🎨 Features In Detail

### 1. Smart Scheduling
- Drag-and-drop calendar interface
- Automatic shift assignment based on:
  - Employee availability
  - Skills and qualifications
  - Working hour limits
  - Labor cost optimization
- Conflict detection and warnings
- Recurring shift patterns

### 2. Employee Management
- Complete employee profiles
- Skills and certification tracking
- Availability schedules
- Performance metrics
- Document management

### 3. Attendance Tracking
- Mobile clock in/out
- GPS location tracking
- Break management
- Late arrival detection
- Automatic overtime calculation

### 4. Leave Management
- Leave request workflow
- Balance tracking
- Conflict resolution
- Manager approval system
- Multiple leave types

### 5. Shift Swapping
- Peer-to-peer swap requests
- Manager approval workflow
- Automatic eligibility checking
- Notification system

### 6. Analytics & Reporting
- Labor cost analysis
- Attendance trends
- Productivity metrics
- Compliance reports
- Export to PDF/Excel

## 🔒 Security Features

- **Authentication**: JWT-based with refresh tokens
- **2FA**: TOTP-based two-factor authentication
- **Password Policy**: Minimum length, complexity requirements
- **Account Lockout**: After failed login attempts
- **Rate Limiting**: API request throttling
- **Data Sanitization**: SQL injection and XSS prevention
- **HTTPS**: SSL/TLS encryption
- **Audit Logging**: Complete activity tracking

## 📱 API Endpoints

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password/:token
```

### Employees
```
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/employees/:id
PUT    /api/v1/employees/:id
DELETE /api/v1/employees/:id
```

### Shifts
```
GET    /api/v1/shifts
POST   /api/v1/shifts
GET    /api/v1/shifts/:id
PUT    /api/v1/shifts/:id
DELETE /api/v1/shifts/:id
```

### Attendance
```
GET    /api/v1/attendance
POST   /api/v1/attendance/clock-in
POST   /api/v1/attendance/clock-out
POST   /api/v1/attendance/break-start
POST   /api/v1/attendance/break-end
```

### Leaves
```
GET    /api/v1/leaves
POST   /api/v1/leaves
GET    /api/v1/leaves/:id
PUT    /api/v1/leaves/:id/approve
PUT    /api/v1/leaves/:id/reject
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. **Set environment variables**
2. **Build frontend**
```bash
cd frontend
npm run build
```

3. **Start backend with PM2**
```bash
cd backend
npm install -g pm2
pm2 start src/server.js --name shiftflow-api
pm2 save
pm2 startup
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- ShiftFlow Team

## 🙏 Acknowledgments

- Built with React and Node.js
- Icons from React Icons
- UI components styled with Tailwind CSS

## 📞 Support

For support, email support@shiftflow.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced ML predictions
- [ ] Integration with payroll systems
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Biometric authentication
- [ ] Custom reporting builder
- [ ] API webhooks
# Shift-management-software
