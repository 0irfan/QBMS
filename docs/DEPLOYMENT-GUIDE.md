# QBMS Deployment Guide

Complete guide for deploying QBMS in production environments.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for production)
- SSL certificate (for HTTPS)
- SMTP server credentials (for email functionality)
- OpenAI API key (optional, for AI question generation)

## Environment Configuration

### 1. Create environment file

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 2. Required environment variables

```bash
# Strong JWT secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-strong-random-secret-here
REFRESH_SECRET=your-different-strong-random-secret-here

# SMTP Configuration (required for password reset and registration OTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com

# Application URL (your domain)
APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### 3. Optional environment variables

```bash
# OpenAI for AI question generation
OPENAI_API_KEY=sk-...

# Database credentials (if using external PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (if using external Redis)
REDIS_URL=redis://host:6379
```

## Deployment Steps

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qbms
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   nano .env
   ```

3. **Update docker-compose.yml for production**
   - Set strong PostgreSQL password
   - Configure volumes for data persistence
   - Update nginx configuration for your domain

4. **Start services**
   ```bash
   docker-compose up -d --build
   ```

5. **Verify services are running**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

6. **Create super admin account**
   ```bash
   docker exec qbms-api node scripts/seed-superadmin.cjs
   ```

7. **Access the application**
   - Open http://your-server-ip:8080
   - Login with superadmin@qbms.local / Admin@123
   - Change the password immediately

### Option 2: Manual Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build packages**
   ```bash
   npm run build
   ```

3. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb qbms
   
   # Run migrations
   npm run db:migrate
   ```

4. **Setup Redis**
   ```bash
   # Install and start Redis
   redis-server
   ```

5. **Start API server**
   ```bash
   cd apps/api
   npm start
   ```

6. **Start web server**
   ```bash
   cd apps/web
   npm start
   ```

## HTTPS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot**
   ```bash
   apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificate**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

3. **Update nginx.conf**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       # ... rest of configuration
   }
   ```

4. **Update docker-compose.yml**
   ```yaml
   nginx:
     volumes:
       - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
       - /etc/letsencrypt:/etc/letsencrypt:ro
     ports:
       - "80:80"
       - "443:443"
   ```

## Database Backup

### Automated backup script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/qbms_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

docker exec qbms-postgres pg_dump -U qbms qbms > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Restore from backup

```bash
gunzip -c backups/qbms_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i qbms-postgres psql -U qbms qbms
```

## Monitoring

### Health checks

- API health: http://your-domain:8080/health
- Database health: http://your-domain:8080/health/db
- Redis health: http://your-domain:8080/health/redis

### Log monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
```

## Security Checklist

- [ ] Strong JWT_SECRET and REFRESH_SECRET set
- [ ] PostgreSQL password changed from default
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Regular database backups scheduled
- [ ] Super admin password changed from default
- [ ] SMTP credentials secured
- [ ] OpenAI API key secured (if used)
- [ ] Docker containers running as non-root user
- [ ] Rate limiting configured in nginx
- [ ] CORS_ORIGIN set to your domain only

## Troubleshooting

### API won't start

```bash
# Check logs
docker-compose logs api

# Verify database connection
docker exec qbms-api wget -q -O - http://localhost:4000/health/db

# Restart API
docker-compose restart api
```

### Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection from API container
docker exec qbms-api psql $DATABASE_URL -c "SELECT 1"
```

### Email not sending

1. Verify SMTP credentials in .env
2. Check SMTP_HOST and SMTP_PORT are correct
3. Test SMTP connection:
   ```bash
   docker exec qbms-api node -e "
   const nodemailer = require('nodemailer');
   const transport = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
   });
   transport.verify().then(console.log).catch(console.error);
   "
   ```

### Performance optimization

1. **Enable Redis caching**
   - Already configured for session storage and rate limiting

2. **Database indexing**
   - Indexes already created on frequently queried columns

3. **Nginx caching**
   - Add to nginx.conf:
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
   proxy_cache my_cache;
   proxy_cache_valid 200 60m;
   ```

## Scaling

### Horizontal scaling

1. **Multiple API instances**
   ```yaml
   api:
     deploy:
       replicas: 3
   ```

2. **Load balancer**
   - Use nginx upstream for multiple API instances
   - Or use external load balancer (AWS ALB, etc.)

3. **External database**
   - Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
   - Update DATABASE_URL in .env

4. **External Redis**
   - Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
   - Update REDIS_URL in .env

## Maintenance

### Update application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations if needed
docker exec qbms-api npm run db:migrate
```

### Database migrations

```bash
# Generate new migration
npm run db:generate

# Apply migrations
docker exec qbms-api npm run db:migrate
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health endpoints
3. Review this guide and README.md
4. Check CREDENTIALS.md for test accounts
