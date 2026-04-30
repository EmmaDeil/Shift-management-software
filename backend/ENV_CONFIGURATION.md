# Environment Configuration Guide

## Environment Files Created

1. **`.env.development`** - Development environment (local testing)
2. **`.env.production`** - Production environment (live server)
3. **`.env`** - Default fallback (kept for compatibility)

## Usage

### Development Mode
```bash
# Using npm scripts (recommended)
npm run dev              # Starts with .env.development
npm run start:dev        # Production build with dev config

# Manual
NODE_ENV=development node -r dotenv/config src/server.js dotenv_config_path=.env.development
```

### Production Mode
```bash
# Using npm scripts (recommended)
npm run start:prod       # Starts with .env.production
npm run dev:prod         # Nodemon with prod config (for testing)

# Manual
NODE_ENV=production node -r dotenv/config src/server.js dotenv_config_path=.env.production
```

### Using System Environment Variables (Best for Production)
```bash
# Set NODE_ENV to tell the app which mode
export NODE_ENV=production  # Linux/Mac
set NODE_ENV=production     # Windows

# Then run
npm start
```

## NPM Scripts Available

```bash
npm run dev              # Development with auto-reload (.env.development)
npm run start:dev        # Development without auto-reload
npm run start:prod       # Production mode
npm run dev:prod         # Production with auto-reload (testing)
npm run seed             # Seed database (development)
npm run seed:prod        # Seed database (production)
npm test                 # Run tests
npm run lint             # Check code quality
```

## Alternative: Use dotenv-cli

Install `dotenv-cli` for easier environment management:

```bash
npm install --save-dev dotenv-cli
```

Then update `package.json`:
```json
"scripts": {
  "dev": "dotenv -e .env.development nodemon src/server.js",
  "start:prod": "dotenv -e .env.production node src/server.js"
}
```

## Best Practice for Production Deployment

### Option 1: System Environment Variables (Most Secure)
Don't use `.env` files in production. Set environment variables directly:

**Linux/Mac (systemd, PM2, Docker):**
```bash
export MONGODB_URI="mongodb+srv://..."
export JWT_SECRET="your_strong_secret"
export NODE_ENV="production"
npm start
```

**Docker Compose:**
```yaml
environment:
  - NODE_ENV=production
  - MONGODB_URI=mongodb+srv://...
  - JWT_SECRET=your_strong_secret
```

**PM2:**
```json
{
  "apps": [{
    "name": "shiftflow",
    "script": "src/server.js",
    "env_production": {
      "NODE_ENV": "production",
      "MONGODB_URI": "mongodb+srv://...",
      "JWT_SECRET": "your_strong_secret"
    }
  }]
}
```

### Option 2: Use .env.production (Simpler)
Keep `.env.production` but:
- Never commit it to git (add to .gitignore)
- Upload it securely via SSH/SFTP
- Use strong, unique values
- Restrict file permissions: `chmod 600 .env.production`

## Security Checklist

### Development (.env.development)
- ✅ Weaker secrets are OK
- ✅ Local database (localhost)
- ✅ Mailtrap for email testing
- ✅ Lenient rate limits
- ✅ Detailed logging

### Production (.env.production)
- ⚠️ Strong random secrets (256-bit)
- ⚠️ Production database (MongoDB Atlas)
- ⚠️ Real email service (SendGrid/SES)
- ⚠️ Strict rate limits
- ⚠️ Error-only logging
- ⚠️ HTTPS URLs only
- ⚠️ Restricted CORS origins
- ⚠️ Never commit to git

## Verify Current Environment

Add this to your code to check which environment is loaded:

```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('Using MongoDB:', process.env.MONGODB_URI);
console.log('Frontend URL:', process.env.FRONTEND_URL);
```

## Troubleshooting

**Issue: Variables not loading**
- Ensure dotenv is installed: `npm install dotenv`
- Check file name spelling (case-sensitive)
- Verify file is in `backend/` directory
- Try absolute path: `dotenv_config_path=./backend/.env.development`

**Issue: Wrong environment loaded**
- Check `NODE_ENV` value: `echo $NODE_ENV` (Linux/Mac) or `echo %NODE_ENV%` (Windows)
- Explicitly set in script: `NODE_ENV=production npm start`

**Issue: Secrets not secure**
- Use environment variables on server instead of files
- Generate strong secrets: `openssl rand -base64 32`
- Never expose secrets in code or logs
