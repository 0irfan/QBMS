# CI/CD Guide for QBMS

Complete guide for setting up Continuous Integration and Continuous Deployment for QBMS on qbms.pro.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Secrets Setup](#github-secrets-setup)
4. [Server Setup](#server-setup)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Deployment Workflows](#deployment-workflows)
7. [Manual Deployment](#manual-deployment)
8. [Monitoring](#monitoring)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### CI/CD Pipeline Architecture

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       │ Push to main
       ▼
┌─────────────────────────────────────┐
│      GitHub Actions (CI)            │
│  ├─ Lint code                       │
│  ├─ Build packages                  │
│  ├─ Run tests                       │
│  ├─ Security audit                  │
│  └─ Build Docker images             │
└──────┬──────────────────────────────┘
       │
       │ All checks pass
       ▼
┌─────────────────────────────────────┐
│    GitHub Actions (CD)              │
│  ├─ Build & push Docker images      │
│  ├─ Deploy to production server     │
│  ├─ Run database migrations         │
│  └─ Health check                    │
└──────┬──────────────────────────────┘
       │
       │ Deployment successful
       ▼
┌─────────────────────────────────────┐
│      Production Server              │
│         (qbms.pro)                  │
│  ├─ Nginx (reverse proxy + SSL)    │
│  ├─ Next.js Web App                 │
│  ├─ Express API                     │
│  ├─ PostgreSQL Database             │
│  └─ Redis Cache                     │
└─────────────────────────────────────┘
```

### Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Lints code
   - Builds packages
   - Runs tests
   - Security audit
   - Docker build test

2. **CD Workflow** (`.github/workflows/deploy.yml`)
   - Runs on push to main branch
   - Builds and pushes Docker images to GitHub Container Registry
   - Deploys to production server
   - Runs database migrations
   - Performs health checks
   - Auto-rollback on failure

---

## Prerequisites

### Required Tools

- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Domain**: qbms.pro (with DNS configured)
- **SSL Certificate**: Let's Encrypt or similar
- **GitHub Account**: With repository access

### Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **Network**: Public IP with ports 80, 443 open

---

## GitHub Secrets Setup

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: https://github.com/0irfan/QBMS
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Required Secrets

Add the following secrets one by one:

#### Server Access Secrets

```bash
SSH_PRIVATE_KEY
# Your SSH private key for server access
# Generate with: ssh-keygen -t ed25519 -C "github-actions@qbms.pro"
# Copy private key: cat ~/.ssh/id_ed25519

SERVER_HOST
# Value: qbms.pro (or your server IP)

SSH_USER
# Value: root (or your deployment user)
```

#### Database Secrets

```bash
DATABASE_URL
# Value: postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms

REDIS_URL
# Value: redis://redis:6379
```

#### Authentication Secrets

```bash
JWT_SECRET
# Generate with: openssl rand -base64 32

REFRESH_SECRET
# Generate with: openssl rand -base64 32
```

#### Azure Blob Storage Secrets

```bash
AZURE_ACCOUNT_NAME
# Your Azure storage account name

AZURE_ACCOUNT_KEY
# Your Azure storage account key

AZURE_BLOB_CONNECTION_STRING
# Your Azure connection string

AZURE_CONTAINER_NAME
# Value: qbms (or your container name)
```

#### OpenAI Secret

```bash
OPENAI_API_KEY
# Your OpenAI API key
```

#### SMTP Secrets

```bash
SMTP_HOST
# Value: smtp.hostinger.com (or your SMTP server)

SMTP_PORT
# Value: 587

SMTP_USER
# Your SMTP username

SMTP_PASS
# Your SMTP password

FROM_EMAIL
# Value: info@qbms.pro (or your email)
```

### Step 3: Verify Secrets

After adding all secrets, you should have approximately 15 secrets configured.

---

## Server Setup

### Step 1: Initial Server Configuration

```bash
# SSH into your server
ssh root@qbms.pro

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 2: Create Deployment User (Optional but Recommended)

```bash
# Create deployment user
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Setup SSH for deployment user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Add your GitHub Actions public key
nano /home/deploy/.ssh/authorized_keys
# Paste your public key (from ssh-keygen earlier)

chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### Step 3: Create Deployment Directory

```bash
# Create deployment directory
mkdir -p /opt/qbms
chown -R deploy:deploy /opt/qbms

# Create backup directory
mkdir -p /opt/qbms-backups
chown -R deploy:deploy /opt/qbms-backups
```

### Step 4: Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## SSL Certificate Setup

### Option 1: Let's Encrypt with Certbot (Recommended)

```bash
# Install Certbot
apt install certbot -y

# Stop nginx if running
docker-compose down || true

# Generate certificate
certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Certificates will be in:
# /etc/letsencrypt/live/qbms.pro/fullchain.pem
# /etc/letsencrypt/live/qbms.pro/privkey.pem

# Copy certificates to deployment directory
mkdir -p /opt/qbms/ssl
cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/

# Set permissions
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem

# Setup auto-renewal
echo "0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/ && docker-compose -f /opt/qbms/docker-compose.yml restart nginx" | crontab -
```

### Option 2: Manual SSL Certificate

If you have SSL certificates from another provider:

```bash
# Copy your certificates to the server
scp fullchain.pem root@qbms.pro:/opt/qbms/ssl/
scp privkey.pem root@qbms.pro:/opt/qbms/ssl/

# Set permissions
ssh root@qbms.pro "chmod 644 /opt/qbms/ssl/fullchain.pem && chmod 600 /opt/qbms/ssl/privkey.pem"
```

---

## Deployment Workflows

### Automatic Deployment (Recommended)

Every push to the `main` branch automatically triggers deployment:

1. **Developer pushes code** to main branch
2. **CI workflow runs** (lint, test, build)
3. **CD workflow triggers** if CI passes
4. **Docker images built** and pushed to GitHub Container Registry
5. **Deployment to server** via SSH
6. **Health check** performed
7. **Auto-rollback** if health check fails

### Manual Deployment Trigger

You can manually trigger deployment from GitHub:

1. Go to **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Choose environment (production/staging)
5. Click **Run workflow**

---

## Manual Deployment

### Using Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Set environment variables
export SERVER_HOST=qbms.pro
export SERVER_USER=root

# Run deployment
./scripts/deploy.sh
```

### Manual Step-by-Step Deployment

```bash
# 1. SSH into server
ssh root@qbms.pro

# 2. Navigate to deployment directory
cd /opt/qbms

# 3. Pull latest images
docker-compose pull

# 4. Stop old containers
docker-compose down

# 5. Start new containers
docker-compose up -d

# 6. Run migrations
docker-compose exec api npm run migrate

# 7. Check status
docker-compose ps

# 8. View logs
docker-compose logs -f
```

---

## Monitoring

### Check Application Status

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f nginx

# Check resource usage
docker stats
```

### Health Checks

```bash
# Application health
curl https://qbms.pro/health

# Database health
curl https://qbms.pro/health/db

# Redis health
curl https://qbms.pro/health/redis

# API health
curl https://qbms.pro/api/health
```

### Monitor Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs from specific time
docker-compose logs --since 30m

# Save logs to file
docker-compose logs > logs.txt
```

---

## Rollback Procedures

### Automatic Rollback

The CD workflow automatically rolls back if:
- Health check fails
- Deployment fails
- Container fails to start

### Manual Rollback

#### Option 1: Rollback to Previous Backup

```bash
# SSH into server
ssh root@qbms.pro

# List backups
ls -lh /opt/qbms-backups/

# Rollback to specific backup
cd /opt/qbms
docker-compose down
cp -r /opt/qbms-backups/qbms-backup-YYYYMMDD-HHMMSS/* /opt/qbms/
docker-compose up -d
```

#### Option 2: Rollback to Previous Docker Image

```bash
# SSH into server
ssh root@qbms.pro
cd /opt/qbms

# Pull previous version (replace with actual tag)
docker-compose pull ghcr.io/0irfan/qbms/api:previous-tag
docker-compose pull ghcr.io/0irfan/qbms/web:previous-tag

# Restart with previous images
docker-compose down
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with "Permission Denied"

**Solution**:
```bash
# Check SSH key is added to server
ssh root@qbms.pro "cat ~/.ssh/authorized_keys"

# Verify SSH key in GitHub Secrets
# Settings → Secrets → SSH_PRIVATE_KEY
```

#### 2. Health Check Fails

**Solution**:
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs api

# Verify environment variables
docker-compose exec api env | grep DATABASE_URL

# Test health endpoint manually
docker-compose exec api curl http://localhost:4000/health
```

#### 3. Database Connection Error

**Solution**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec api env | grep DATABASE_URL

# Test database connection
docker-compose exec postgres psql -U qbms -d qbms -c "SELECT 1;"
```

#### 4. SSL Certificate Error

**Solution**:
```bash
# Check certificate files exist
ls -lh /opt/qbms/ssl/

# Verify certificate validity
openssl x509 -in /opt/qbms/ssl/fullchain.pem -text -noout

# Renew certificate
certbot renew --force-renewal
cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/
docker-compose restart nginx
```

#### 5. Out of Disk Space

**Solution**:
```bash
# Check disk usage
df -h

# Clean Docker images
docker image prune -af

# Clean Docker volumes (CAUTION: This removes data!)
docker volume prune -f

# Clean old backups
cd /opt/qbms-backups
ls -t | tail -n +6 | xargs rm -rf
```

### Debug Mode

Enable debug logging:

```bash
# Edit .env file
nano /opt/qbms/.env

# Add debug flag
DEBUG=*
LOG_LEVEL=debug

# Restart containers
docker-compose restart
```

---

## Best Practices

### 1. Regular Backups

```bash
# Setup automated backups
cat > /opt/backup-qbms.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/qbms-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U qbms qbms > "$BACKUP_DIR/db-$TIMESTAMP.sql"

# Backup volumes
docker run --rm -v qbms_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres-$TIMESTAMP.tar.gz /data

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-qbms.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/backup-qbms.sh" | crontab -
```

### 2. Monitor Resource Usage

```bash
# Install monitoring tools
apt install htop iotop nethogs -y

# Check system resources
htop

# Monitor Docker resources
docker stats
```

### 3. Security Updates

```bash
# Setup automatic security updates
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades

# Manual updates
apt update && apt upgrade -y
```

### 4. Log Rotation

```bash
# Configure Docker log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

---

## Useful Commands

```bash
# View all containers
docker ps -a

# View all images
docker images

# View all volumes
docker volume ls

# Clean everything (CAUTION!)
docker system prune -af --volumes

# Export logs
docker-compose logs > /tmp/qbms-logs-$(date +%Y%m%d).txt

# Database backup
docker-compose exec postgres pg_dump -U qbms qbms > backup.sql

# Database restore
docker-compose exec -T postgres psql -U qbms qbms < backup.sql

# Restart specific service
docker-compose restart api

# Scale service (if needed)
docker-compose up -d --scale api=2

# Update single service
docker-compose up -d --no-deps --build api
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation: `/docs` folder
- Check GitHub Actions: https://github.com/0irfan/QBMS/actions

---

*Last updated: [Current Date]*
