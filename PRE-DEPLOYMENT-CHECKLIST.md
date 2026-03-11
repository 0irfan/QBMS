# Pre-Deployment Checklist for QBMS

**Target Server**: qbms.pro (20.121.189.81)  
**Deployment Method**: GitHub Actions CI/CD  
**Status**: Ready to Deploy

---

## ✅ GitHub Secrets Verification

You mentioned you've added secrets. Please verify these 17 secrets are configured:

### Server Access (3 secrets)
- [ ] `SSH_PRIVATE_KEY` - Azure VM private key
- [ ] `SERVER_HOST` - qbms.pro or 20.121.189.81
- [ ] `SSH_USER` - azureuser

### Database (2 secrets)
- [ ] `DATABASE_URL` - postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms
- [ ] `REDIS_URL` - redis://redis:6379

### Authentication (2 secrets)
- [ ] `JWT_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `REFRESH_SECRET` - Generate: `openssl rand -base64 32`

### Azure Storage (4 secrets)
- [ ] `AZURE_ACCOUNT_NAME` - Your Azure storage account name
- [ ] `AZURE_ACCOUNT_KEY` - Your Azure storage account key
- [ ] `AZURE_BLOB_CONNECTION_STRING` - Your Azure connection string
- [ ] `AZURE_CONTAINER_NAME` - qbms

### OpenAI (1 secret)
- [ ] `OPENAI_API_KEY` - Your OpenAI API key

### SMTP Email (5 secrets)
- [ ] `SMTP_HOST` - smtp.hostinger.com
- [ ] `SMTP_PORT` - 587
- [ ] `SMTP_USER` - Your SMTP username
- [ ] `SMTP_PASS` - Your SMTP password
- [ ] `FROM_EMAIL` - info@qbms.pro

---

## ✅ Server Prerequisites

### 1. VM Setup Status
```bash
# SSH into your VM to verify
ssh azureuser@20.121.189.81

# Check if Docker is installed
docker --version
# Expected: Docker version 24.x or higher

# Check if Docker Compose is installed
docker compose version
# Expected: Docker Compose version 2.x or higher

# Check if directories exist
ls -la /opt/qbms
# Should exist and be owned by azureuser

# Check if SSL certificates exist (if DNS is configured)
ls -la /opt/qbms/ssl/
# Should have fullchain.pem and privkey.pem
```

### 2. DNS Configuration
```bash
# Check if DNS is pointing to your VM
nslookup qbms.pro
# Should return: 20.121.189.81

# Or use dig
dig qbms.pro +short
# Should return: 20.121.189.81
```

### 3. Firewall Rules
```bash
# Check UFW status
sudo ufw status
# Should show:
# - 22/tcp (SSH) ALLOW
# - 80/tcp (HTTP) ALLOW
# - 443/tcp (HTTPS) ALLOW
```

### 4. SSL Certificate (if DNS is ready)
```bash
# Generate SSL certificate (only if DNS is configured)
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Copy certificates
sudo cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
sudo cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem
```

---

## 🚀 Deployment Steps

### Option 1: Automatic Deployment (Recommended)

**Step 1: Commit and Push to Main Branch**
```bash
# Make sure all changes are committed
git add .
git commit -m "Deploy QBMS to production"
git push origin main
```

**Step 2: Monitor Deployment**
- Go to: https://github.com/0irfan/QBMS/actions
- Watch the "Deploy to Production" workflow
- It will automatically:
  1. Build Docker images
  2. Push to GitHub Container Registry
  3. Deploy to your Azure VM
  4. Run database migrations
  5. Perform health checks

### Option 2: Manual Trigger

**Step 1: Go to GitHub Actions**
- Navigate to: https://github.com/0irfan/QBMS/actions
- Click on "Deploy to Production" workflow
- Click "Run workflow" button
- Select "production" environment
- Click "Run workflow"

**Step 2: Monitor Progress**
- Watch the workflow execution
- Check each step for success/failure
- Review logs if any issues occur

---

## 🔍 Post-Deployment Verification

### 1. Check Deployment Status
```bash
# SSH into server
ssh azureuser@20.121.189.81

# Check running containers
cd /opt/qbms
docker compose ps

# Expected output:
# qbms-nginx     running   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# qbms-web       running   3000/tcp
# qbms-api       running   3001/tcp
# qbms-postgres  running   5432/tcp
# qbms-redis     running   6379/tcp
```

### 2. Check Container Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web
docker compose logs -f nginx
```

### 3. Health Check Endpoints
```bash
# Test health endpoint
curl http://20.121.189.81/health
# or if DNS is configured:
curl https://qbms.pro/health

# Expected response:
# {"status":"ok","timestamp":"..."}

# Test database health
curl https://qbms.pro/health/db

# Test Redis health
curl https://qbms.pro/health/redis
```

### 4. Test Application Access
```bash
# Open in browser
https://qbms.pro

# Or if DNS not ready:
http://20.121.189.81

# You should see the QBMS login page
```

### 5. Test Login
- Navigate to login page
- Use default credentials:
  - Email: admin@qbms.pro
  - Password: Admin@123
- Should successfully login and see dashboard

---

## 🐛 Troubleshooting

### Issue 1: Deployment Fails at SSH Step

**Symptoms**: "Permission denied" or "Connection refused"

**Solutions**:
```bash
# 1. Verify SSH key is correct
cat ~/.ssh/id_rsa  # or your key file
# Copy entire content including BEGIN and END lines

# 2. Test SSH connection manually
ssh azureuser@20.121.189.81
# Should connect without password

# 3. Check SSH_PRIVATE_KEY secret in GitHub
# Make sure it includes:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key content ...
# -----END OPENSSH PRIVATE KEY-----
```

### Issue 2: Docker Images Not Pulling

**Symptoms**: "Error response from daemon: pull access denied"

**Solutions**:
```bash
# 1. Login to GitHub Container Registry on server
ssh azureuser@20.121.189.81
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 2. Make sure repository packages are public or accessible
# Go to: https://github.com/0irfan/QBMS/packages
# Set visibility to public or configure access
```

### Issue 3: Containers Not Starting

**Symptoms**: Containers exit immediately or show "unhealthy"

**Solutions**:
```bash
# 1. Check container logs
docker compose logs api
docker compose logs web

# 2. Check .env file exists and has correct values
cat /opt/qbms/.env

# 3. Verify database connection
docker compose exec api npm run migrate

# 4. Restart containers
docker compose down
docker compose up -d
```

### Issue 4: Health Check Fails

**Symptoms**: Deployment fails at health check step

**Solutions**:
```bash
# 1. Wait longer (containers may need time to start)
sleep 30
curl http://20.121.189.81/health

# 2. Check nginx configuration
docker compose logs nginx

# 3. Check if ports are accessible
sudo netstat -tulpn | grep -E '80|443'

# 4. Check firewall
sudo ufw status
```

### Issue 5: SSL Certificate Issues

**Symptoms**: "Certificate not found" or HTTPS not working

**Solutions**:
```bash
# 1. Make sure DNS is configured first
nslookup qbms.pro

# 2. Generate certificate (only after DNS is ready)
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# 3. Copy certificates to correct location
sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem

# 4. Restart nginx
docker compose restart nginx
```

---

## 📋 Quick Commands Reference

### Deployment Commands
```bash
# View deployment status
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose ps"

# View logs
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose logs -f"

# Restart services
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose restart"

# Stop services
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose down"

# Start services
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose up -d"

# Update to latest
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose pull && docker compose up -d"
```

### Monitoring Commands
```bash
# Check health
curl https://qbms.pro/health

# Check resource usage
ssh azureuser@20.121.189.81 "docker stats --no-stream"

# Check disk space
ssh azureuser@20.121.189.81 "df -h"

# Check memory
ssh azureuser@20.121.189.81 "free -h"
```

### Backup Commands
```bash
# Backup database
ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose exec -T postgres pg_dump -U qbms qbms > backup-$(date +%Y%m%d).sql"

# Backup .env file
ssh azureuser@20.121.189.81 "sudo cp /opt/qbms/.env /opt/qbms-backups/.env-$(date +%Y%m%d)"
```

---

## ✅ Deployment Checklist

### Before Deployment
- [ ] All GitHub secrets configured (17 total)
- [ ] VM is accessible via SSH
- [ ] Docker and Docker Compose installed on VM
- [ ] Directories created (/opt/qbms, /opt/qbms/ssl)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] DNS configured (optional, can use IP initially)
- [ ] SSL certificates generated (optional, can add later)

### During Deployment
- [ ] Code committed and pushed to main branch
- [ ] GitHub Actions workflow triggered
- [ ] Build step completed successfully
- [ ] Images pushed to registry
- [ ] Deployment to server completed
- [ ] Database migrations ran successfully
- [ ] Health checks passed

### After Deployment
- [ ] All containers running
- [ ] Health endpoints responding
- [ ] Application accessible in browser
- [ ] Login working with test credentials
- [ ] Dashboard loads correctly
- [ ] API endpoints responding
- [ ] Database connected
- [ ] Redis connected
- [ ] Azure Blob Storage connected (if configured)

---

## 🎯 Expected Timeline

- **Build & Push Images**: 5-10 minutes
- **Deploy to Server**: 2-3 minutes
- **Database Migrations**: 1 minute
- **Health Checks**: 30 seconds
- **Total**: ~10-15 minutes

---

## 📞 Support

If deployment fails:

1. **Check GitHub Actions logs**: https://github.com/0irfan/QBMS/actions
2. **Check server logs**: `ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose logs"`
3. **Verify secrets**: Make sure all 17 secrets are correctly configured
4. **Test SSH**: `ssh azureuser@20.121.189.81` should work without password
5. **Check VM status**: Make sure VM is running in Azure Portal

---

## 🚀 Ready to Deploy!

Once you've verified the checklist above, you can deploy by:

**Option 1**: Push to main branch
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**Option 2**: Manual trigger from GitHub Actions UI

The deployment will happen automatically! 🎉

---

*Last Updated: [Current Date]*
