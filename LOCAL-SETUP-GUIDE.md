# QBMS - Local Development Setup Guide

This guide will help you set up and run the QBMS project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/0irfan/QBMS.git
cd QBMS
git checkout local-setup
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Database
DATABASE_URL=postgresql://qbms:qbms@localhost:5432/qbms

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
REFRESH_SECRET=your-super-secret-refresh-key-change-this

# API Configuration
PORT=4000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=your-openai-api-key

# Azure Storage (Optional - for file uploads)
AZURE_ACCOUNT_NAME=
AZURE_ACCOUNT_KEY=
AZURE_CONTAINER_NAME=qbms
```

### 4. Start Database Services

Start PostgreSQL and Redis using Docker:

```bash
docker compose up -d postgres redis
```

Verify they're running:

```bash
docker compose ps
```

### 5. Run Database Migrations

```bash
npm run migrate
```

### 6. Seed Super Admin (Optional)

Create a default super admin account:

```bash
npm run seed:superadmin
```

Default credentials:
- Email: `admin@qbms.pro`
- Password: `Admin@123`

### 7. Start Development Servers

Open two terminal windows:

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Web Server:**
```bash
cd apps/web
npm run dev
```

### 8. Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## Development Workflow

### Project Structure

```
qbms/
├── apps/
│   ├── api/          # Backend API (Express + TypeScript)
│   └── web/          # Frontend (Next.js + React)
├── packages/
│   ├── database/     # Database schema (Drizzle ORM)
│   └── shared/       # Shared types and utilities
├── docker/           # Docker configuration files
└── docs/             # Documentation
```

### Available Scripts

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run migrations
npm run migrate

# Seed super admin
npm run seed:superadmin

# Start API dev server
cd apps/api && npm run dev

# Start Web dev server
cd apps/web && npm run dev

# Build all packages
npm run build

# Lint code
npm run lint

# Run tests
npm run test
```

### Database Management

**View database with Drizzle Studio:**
```bash
cd packages/database
npm run studio
```

**Create new migration:**
```bash
cd packages/database
npm run generate
```

**Apply migrations:**
```bash
npm run migrate
```

**Reset database (WARNING: deletes all data):**
```bash
docker compose down -v
docker compose up -d postgres redis
npm run migrate
npm run seed:superadmin
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**For API (port 4000):**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

**For Web (port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

1. Ensure Docker containers are running:
   ```bash
   docker compose ps
   ```

2. Check container logs:
   ```bash
   docker compose logs postgres
   docker compose logs redis
   ```

3. Restart containers:
   ```bash
   docker compose restart postgres redis
   ```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install --legacy-peer-deps
```

### Build Errors

```bash
# Clean build
npm run clean
npm run build
```

## Features Available Locally

All features work locally including:

✅ User authentication and authorization  
✅ Subject and topic management  
✅ Question bank (MCQ, Short, Essay)  
✅ Class management  
✅ Exam creation and taking  
✅ Automatic grading  
✅ Analytics and reporting  
✅ AI question generation (requires OpenAI API key)  
✅ Question extraction from papers (requires OpenAI API key)  
✅ File uploads (local storage fallback)  

## Optional Features

### Enable Email Features

1. Get SMTP credentials (Gmail example):
   - Enable 2FA on your Google account
   - Generate an App Password
   - Use it in `.env` as `SMTP_PASS`

2. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

### Enable AI Features

1. Get OpenAI API key from https://platform.openai.com/api-keys

2. Update `.env`:
   ```env
   OPENAI_API_KEY=sk-...your-key-here
   ```

### Enable Azure Storage

1. Create Azure Storage account
2. Get connection string
3. Update `.env`:
   ```env
   AZURE_ACCOUNT_NAME=your-account-name
   AZURE_ACCOUNT_KEY=your-account-key
   AZURE_CONTAINER_NAME=qbms
   ```

## Testing

### Manual Testing

1. Register a new student account
2. Create subjects and topics
3. Add questions
4. Create a class
5. Create an exam
6. Take the exam
7. View results

### API Testing

Use tools like Postman or curl:

```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qbms.pro","password":"Admin@123"}'
```

## Production Deployment

When ready to deploy to production:

1. Switch back to main branch:
   ```bash
   git checkout main
   ```

2. Follow the deployment guide in `docs/DEPLOYMENT-GUIDE.md`

## Getting Help

- Check documentation in `/docs` folder
- Review API documentation: `docs/API-DOCUMENTATION.md`
- Check user guide: `docs/USER-GUIDE.md`

## Common Issues

### "Cannot find module" errors
- Run `npm install --legacy-peer-deps` in root directory
- Ensure all workspace packages are built: `npm run build`

### Database schema mismatch
- Run migrations: `npm run migrate`
- If issues persist, reset database (see Database Management section)

### Hot reload not working
- Restart the dev server
- Clear Next.js cache: `rm -rf apps/web/.next`

---

**Happy coding! 🚀**
