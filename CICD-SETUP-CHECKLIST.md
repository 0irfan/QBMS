# CI/CD Setup Checklist for qbms.pro

Quick checklist to set up CI/CD for QBMS deployment.

---

## ✅ Pre-Deployment Checklist

### 1. Server Setup
- [ ] Ubuntu 20.04+ server provisioned
- [ ] Server accessible at qbms.pro
- [ ] DNS A record pointing to server IP
- [ ] SSH access configured
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Firewall configured (ports 22, 80, 443 open)

### 2. SSL Certificate
- [ ] SSL certificate obtained (Let's Encrypt or other)
- [ ] Certificate files copied to `/opt/qbms/ssl/`
- [ ] Certificate auto-renewal configured

### 3. GitHub Repository
- [ ] Code pushed to https://github.com/0irfan/QBMS
- [ ] Repository is private or public as needed
- [ ] GitHub Actions enabled

### 4. GitHub Secrets Configuration
- [ ] `SSH_PRIVATE_KEY` - SSH private key for server access
- [ ] `SERVER_HOST` - qbms.pro
- [ ] `SSH_USER` - root or deployment user
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `JWT_SECRET` - JWT secret key
- [ ] `REFRESH_SECRET` - Refresh token secret
- [ ] `AZURE_ACCOUNT_NAME` - Azure storage account name
- [ ] `AZURE_ACCOUNT_KEY` - Azure storage account key
- [ ] `AZURE_BLOB_CONNECTION_STRING` - Azure connection string
- [ ] `AZURE_CONTAINER_NAME` - Azure container name (qbms)
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `SMTP_HOST` - SMTP server host
- [ ] `SMTP_PORT` - SMTP server port (587)
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password
- [ ] `FROM_EMAIL` - Sender email address

### 5. Server Configuration
- [ ] Deployment directory created: `/opt/qbms`
- [ ] Backup directory created: `/opt/qbms-backups`
- [ ] SSL certificates in place: `/opt/qbms/ssl/`
- [ ] `.env` file created on server (use `.env.example` as template)
- [ ] Docker login to GitHub Container Registry configured

---

## 🚀 Deployment Steps

### Step 1: Generate SSH Key for GitHub Actions

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/qbms_deploy.pub root@qbms.pro

# Copy private key content for GitHub Secret
cat ~/.ssh/qbms_deploy
# Copy the entire output and add to GitHub Secrets as SSH_PRIVATE_KEY
```

### Step 2: Setup Server

```bash
# SSH into server
ssh root@qbms.pro

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create directories
mkdir -p /opt/qbms /opt/qbms-backups /opt/qbms/ssl

# Configure firewall
apt install ufw -y
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 3: Setup SSL Certificate

```bash
# Install Certbot
apt install certbot -y

# Generate certificate
certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Copy certificates
cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/

# Setup auto-renewal
echo "0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/ && docker-compose -f /opt/qbms/docker-compose.yml restart nginx" | crontab -
```

### Step 4: Create .env File on Server

```bash
# Create .env file
nano /opt/qbms/.env

# Add all environment variables (use .env.example as template)
# Make sure to use actual credentials, not placeholders!
```

### Step 5: Configure GitHub Secrets

1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Add all secrets from the checklist above

### Step 6: Test Deployment

```bash
# Push a commit to main branch
git add .
git commit -m "Test deployment"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/0irfan/QBMS/actions

# Monitor deployment on server
ssh root@qbms.pro "cd /opt/qbms && docker-compose logs -f"
```

### Step 7: Verify Deployment

```bash
# Check application is running
curl https://qbms.pro/health

# Check all services
curl https://qbms.pro/health/db
curl https://qbms.pro/health/redis

# Access application
# Open browser: https://qbms.pro
```

---

## 🔍 Verification Commands

### On Server

```bash
# Check Docker is running
docker --version
docker compose version

# Check containers
docker ps

# Check logs
docker-compose -f /opt/qbms/docker-compose.yml logs

# Check disk space
df -h

# Check SSL certificate
openssl x509 -in /opt/qbms/ssl/fullchain.pem -text -noout | grep "Not After"
```

### From Local Machine

```bash
# Test SSH connection
ssh root@qbms.pro "echo 'SSH working'"

# Test HTTPS
curl -I https://qbms.pro

# Test API
curl https://qbms.pro/api/health

# Test health endpoints
curl https://qbms.pro/health
curl https://qbms.pro/health/db
curl https://qbms.pro/health/redis
```

---

## 📊 Post-Deployment

### 1. Setup Monitoring

```bash
# Install monitoring tools
ssh root@qbms.pro "apt install htop iotop nethogs -y"

# Setup log rotation
ssh root@qbms.pro "cat > /etc/docker/daemon.json << 'EOF'
{
  \"log-driver\": \"json-file\",
  \"log-opts\": {
    \"max-size\": \"10m\",
    \"max-file\": \"3\"
  }
}
EOF"

ssh root@qbms.pro "systemctl restart docker"
```

### 2. Setup Automated Backups

```bash
# Create backup script on server
ssh root@qbms.pro "cat > /opt/backup-qbms.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/opt/qbms-backups\"
TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
cd /opt/qbms
docker-compose exec -T postgres pg_dump -U qbms qbms > \"\$BACKUP_DIR/db-\$TIMESTAMP.sql\"
find \$BACKUP_DIR -name \"*.sql\" -mtime +7 -delete
EOF"

ssh root@qbms.pro "chmod +x /opt/backup-qbms.sh"
ssh root@qbms.pro "echo '0 2 * * * /opt/backup-qbms.sh' | crontab -"
```

### 3. Test Rollback Procedure

```bash
# Create a test backup
ssh root@qbms.pro "cd /opt/qbms && cp -r . /opt/qbms-backups/test-backup"

# Test rollback
ssh root@qbms.pro "cd /opt/qbms && docker-compose down && cp -r /opt/qbms-backups/test-backup/* . && docker-compose up -d"
```

---

## 🎯 Quick Commands Reference

### Deployment

```bash
# Manual deployment
./scripts/deploy.sh

# View deployment logs
ssh root@qbms.pro "cd /opt/qbms && docker-compose logs -f"

# Restart services
ssh root@qbms.pro "cd /opt/qbms && docker-compose restart"
```

### Monitoring

```bash
# Check status
ssh root@qbms.pro "cd /opt/qbms && docker-compose ps"

# View logs
ssh root@qbms.pro "cd /opt/qbms && docker-compose logs --tail=100"

# Check resources
ssh root@qbms.pro "docker stats --no-stream"
```

### Maintenance

```bash
# Update containers
ssh root@qbms.pro "cd /opt/qbms && docker-compose pull && docker-compose up -d"

# Clean old images
ssh root@qbms.pro "docker image prune -af"

# Backup database
ssh root@qbms.pro "cd /opt/qbms && docker-compose exec postgres pg_dump -U qbms qbms > backup-\$(date +%Y%m%d).sql"
```

---

## 🆘 Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs: https://github.com/0irfan/QBMS/actions
2. Verify all GitHub Secrets are set correctly
3. Check SSH connection: `ssh root@qbms.pro`
4. Verify .env file exists on server: `ssh root@qbms.pro "cat /opt/qbms/.env"`

### Application Not Accessible

1. Check containers are running: `ssh root@qbms.pro "docker ps"`
2. Check nginx logs: `ssh root@qbms.pro "docker logs qbms-nginx"`
3. Verify SSL certificate: `curl -I https://qbms.pro`
4. Check firewall: `ssh root@qbms.pro "ufw status"`

### Database Connection Error

1. Check PostgreSQL is running: `ssh root@qbms.pro "docker ps | grep postgres"`
2. Verify DATABASE_URL in .env
3. Check database logs: `ssh root@qbms.pro "docker logs qbms-postgres"`

---

## 📚 Documentation

- **Full CI/CD Guide**: `docs/CICD-GUIDE.md`
- **Deployment Guide**: `docs/DEPLOYMENT-GUIDE.md`
- **API Documentation**: `docs/API-DOCUMENTATION.md`
- **User Guide**: `docs/USER-GUIDE.md`

---

## ✅ Final Checklist

Before going live:

- [ ] All GitHub Secrets configured
- [ ] Server setup complete
- [ ] SSL certificate installed and auto-renewal configured
- [ ] .env file created on server with actual credentials
- [ ] Test deployment successful
- [ ] Application accessible at https://qbms.pro
- [ ] Health checks passing
- [ ] Automated backups configured
- [ ] Monitoring setup complete
- [ ] Rollback procedure tested
- [ ] Documentation reviewed

---

## 🎉 Success!

Once all items are checked, your CI/CD pipeline is ready!

Every push to the `main` branch will automatically:
1. Run tests
2. Build Docker images
3. Deploy to qbms.pro
4. Run health checks
5. Auto-rollback if anything fails

**Application URL**: https://qbms.pro

---

*Setup Date: [Current Date]*
