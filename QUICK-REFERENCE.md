# QBMS Quick Reference Card

Essential commands and information for QBMS.

## 🚀 Quick Start

```bash
# Start everything
docker-compose up -d --build

# Create super admin
docker exec qbms-api node scripts/seed-superadmin.cjs

# Access application
# http://localhost:8080
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@qbms.local | Admin@123 |
| Instructor | instructor@qbms.local | Admin@123 |
| Student | student@qbms.local | Admin@123 |

**⚠️ Change passwords immediately in production!**

## 📦 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Check service status
docker-compose ps

# Execute command in container
docker exec qbms-api <command>
```

## 🗄️ Database Commands

```bash
# Run migrations
npm run db:migrate
# or
docker exec qbms-api npm run db:migrate

# Generate new migration
npm run db:generate

# Seed database
npm run db:seed

# Open Drizzle Studio
npm run db:studio

# Backup database
docker exec qbms-postgres pg_dump -U qbms qbms > backup.sql

# Restore database
cat backup.sql | docker exec -i qbms-postgres psql -U qbms qbms
```

## 🧪 Testing Commands

```bash
# Check project completeness
npm run check

# Run API tests
npm run test:api

# Run frontend tests
npm run test:frontend

# Run all tests
npm test
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## 🌐 URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:8080 |
| API | http://localhost:8080/api |
| Health Check | http://localhost:8080/health |
| DB Health | http://localhost:8080/health/db |
| Redis Health | http://localhost:8080/health/redis |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## 📝 Environment Variables

### Required
```bash
DATABASE_URL=postgresql://qbms:qbms@localhost:5432/qbms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
REFRESH_SECRET=your-refresh-secret-here
```

### Optional
```bash
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
FROM_EMAIL=noreply@qbms.local
APP_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

## 🔍 Health Checks

```bash
# API health
curl http://localhost:8080/health

# Database health
curl http://localhost:8080/health/db

# Redis health
curl http://localhost:8080/health/redis
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -an | grep 8080
netstat -an | grep 5432
netstat -an | grep 6379

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d --build
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection
docker exec qbms-api psql $DATABASE_URL -c "SELECT 1"
```

### API errors
```bash
# View API logs
docker-compose logs -f api

# Restart API
docker-compose restart api

# Check environment variables
docker exec qbms-api env | grep DATABASE_URL
```

### Frontend not loading
```bash
# View web logs
docker-compose logs -f web

# Restart web service
docker-compose restart web

# Check nginx logs
docker-compose logs -f nginx
```

## 📊 Monitoring

```bash
# View all container stats
docker stats

# View specific container stats
docker stats qbms-api

# Check disk usage
docker system df

# Check container resource usage
docker-compose top
```

## 🔒 Security

### Generate strong secrets
```bash
# JWT secret
openssl rand -base64 32

# Refresh secret
openssl rand -base64 32
```

### Change super admin password
```bash
# Via API
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"reset-token","password":"NewPassword123!"}'

# Or use the forgot password flow
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview |
| [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) | Complete project summary |
| [CREDENTIALS.md](CREDENTIALS.md) | Test accounts |
| [docs/API-DOCUMENTATION.md](docs/API-DOCUMENTATION.md) | API reference |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | User manual |
| [docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md) | Deployment instructions |
| [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) | Production deployment checklist |

## 🆘 Common Issues

### "Port already in use"
```bash
# Find process using port
lsof -i :8080  # Linux/Mac
netstat -ano | findstr :8080  # Windows

# Kill process or change port in docker-compose.yml
```

### "Cannot connect to Docker daemon"
```bash
# Start Docker service
sudo systemctl start docker  # Linux
# Or start Docker Desktop (Windows/Mac)
```

### "Permission denied"
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

### "Out of disk space"
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## 📞 Support

- Check logs: `docker-compose logs -f`
- Review documentation in `docs/` folder
- Run completeness check: `npm run check`
- Test API: `npm run test:api`

## 🎯 Quick Tasks

### Add a new super admin
```bash
docker exec qbms-api node scripts/seed-superadmin.cjs
```

### Backup everything
```bash
# Database
docker exec qbms-postgres pg_dump -U qbms qbms > backup_$(date +%Y%m%d).sql

# Uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/
```

### Update application
```bash
git pull
docker-compose down
docker-compose up -d --build
docker exec qbms-api npm run db:migrate
```

### View recent logs
```bash
# Last 100 lines
docker-compose logs --tail=100

# Last 10 minutes
docker-compose logs --since 10m
```

## 🔢 Port Reference

| Port | Service | Access |
|------|---------|--------|
| 8080 | Nginx (Web) | Public |
| 4000 | API | Internal |
| 5432 | PostgreSQL | Internal |
| 6379 | Redis | Internal |

## 📋 File Locations

| Path | Contents |
|------|----------|
| `/apps/api` | Backend API code |
| `/apps/web` | Frontend code |
| `/packages/database` | Database schema & migrations |
| `/packages/shared` | Shared types & schemas |
| `/docs` | Documentation |
| `/scripts` | Utility scripts |
| `/docker` | Docker configs |
| `/uploads` | Uploaded files |

---

**Print this page for quick reference during development and deployment!**
