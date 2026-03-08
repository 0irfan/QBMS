# QBMS Deployment Summary

Complete summary of CI/CD setup for deploying QBMS to Azure VM at qbms.pro.

---

## ✅ What's Been Configured

### 1. CI/CD Pipeline
- ✅ Continuous Integration workflow (`.github/workflows/ci.yml`)
- ✅ Continuous Deployment workflow (`.github/workflows/deploy.yml`)
- ✅ Automatic deployment on push to main branch
- ✅ Docker image building and publishing
- ✅ SSH deployment to Azure VM
- ✅ Health checks and automatic rollback

### 2. Azure VM Configuration
- ✅ Configured for `azureuser` (not root)
- ✅ Uses Azure-provided SSH key
- ✅ Deployment directory: `/opt/qbms`
- ✅ Automated setup script available

### 3. Production Setup
- ✅ Production Docker Compose configuration
- ✅ Nginx with SSL/TLS support
- ✅ Rate limiting and security headers
- ✅ Gzip compression
- ✅ WebSocket support
- ✅ Static file caching

### 4. Documentation
- ✅ Complete CI/CD guide (500+ lines)
- ✅ Azure VM setup guide
- ✅ Azure quick start guide
- ✅ SSH key setup guide with diagrams
- ✅ Deployment checklist
- ✅ Troubleshooting guide

---

## 🎯 Your Configuration

### Server Details
```
Cloud Provider:  Azure
VM User:         azureuser
SSH Key:         Azure-provided private key (qbms_key.pem)
Domain:          qbms.pro
Deploy Path:     /opt/qbms
```

### GitHub Repository
```
Repository:      https://github.com/0irfan/QBMS
Branch:          main
Registry:        GitHub Container Registry (ghcr.io)
```

---

## 📋 Setup Steps

### Step 1: Prepare Azure Private Key

Your Azure private key is in your Downloads folder (downloaded when you created the VM).

```bash
# Find the key
# On Windows
dir %USERPROFILE%\Downloads\*.pem

# On Mac/Linux
ls ~/Downloads/*.pem

# Example: qbms_key.pem
```

### Step 2: Test SSH Connection

```bash
# Test connection to your Azure VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# If successful, you'll be logged in
# Type 'exit' to disconnect
```

### Step 3: Add SSH Key to GitHub Secrets

```bash
# Display the private key
# On Windows (PowerShell)
Get-Content ~\Downloads\qbms_key.pem

# On Mac/Linux
cat ~/Downloads/qbms_key.pem

# Copy the ENTIRE output
```

**Add to GitHub**:
1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the entire key content
5. Click "Add secret"

### Step 4: Configure All GitHub Secrets

Add these 17 secrets to GitHub:

#### Server Access (3)
```
SSH_PRIVATE_KEY     = [Azure private key content]
SERVER_HOST         = qbms.pro
SSH_USER            = azureuser
```

#### Database (2)
```
DATABASE_URL        = postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms
REDIS_URL           = redis://redis:6379
```

#### Authentication (2)
```
JWT_SECRET          = [Generate: openssl rand -base64 32]
REFRESH_SECRET      = [Generate: openssl rand -base64 32]
```

#### Azure Storage (4)
```
AZURE_ACCOUNT_NAME              = your-account-name
AZURE_ACCOUNT_KEY               = your-account-key
AZURE_BLOB_CONNECTION_STRING    = your-connection-string
AZURE_CONTAINER_NAME            = qbms
```

#### OpenAI (1)
```
OPENAI_API_KEY      = your-openai-key
```

#### SMTP (5)
```
SMTP_HOST           = smtp.hostinger.com
SMTP_PORT           = 587
SMTP_USER           = your-smtp-username
SMTP_PASS           = your-smtp-password
FROM_EMAIL          = info@qbms.pro
```

### Step 5: Setup Azure VM

**Option A: Automated Setup (Recommended)**

```bash
# SSH into your VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Run automated setup script
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Logout and login for docker group changes
exit
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
```

**Option B: Manual Setup**

```bash
# SSH into VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Certbot
sudo apt install certbot -y

# Configure firewall
sudo apt install ufw -y
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create directories
sudo mkdir -p /opt/qbms /opt/qbms-backups /opt/qbms/ssl
sudo chown -R azureuser:azureuser /opt/qbms /opt/qbms-backups

# Logout and login
exit
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
```

### Step 6: Configure Azure Network Security Group

In Azure Portal:
1. Go to your VM → Networking → Network Security Group
2. Add inbound security rules:
   - **SSH**: Port 22, Source: Your IP (for security)
   - **HTTP**: Port 80, Source: Any
   - **HTTPS**: Port 443, Source: Any

### Step 7: Setup SSL Certificate

```bash
# SSH into VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Generate certificate
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Copy certificates
sudo cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
sudo cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/

# Set ownership and permissions
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem

# Setup auto-renewal
echo "0 2 * * * sudo certbot renew --quiet && sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/ && cd /opt/qbms && docker compose restart nginx" | crontab -
```

### Step 8: Create .env File on VM

```bash
# Create .env file
nano /opt/qbms/.env

# Copy content from .env.example
# Update with actual credentials
# Save: Ctrl+X, Y, Enter
```

### Step 9: Deploy!

```bash
# On your local machine
git add .
git commit -m "Deploy to Azure VM"
git push origin main

# Watch deployment
# Go to: https://github.com/0irfan/QBMS/actions
```

### Step 10: Verify Deployment

```bash
# Check health
curl https://qbms.pro/health

# Open browser
https://qbms.pro
```

---

## 📚 Documentation Files

### Quick Start
- **AZURE-QUICK-START.md** - 5-minute setup guide
- **DEPLOYMENT-SUMMARY.md** - This file

### Detailed Guides
- **AZURE-VM-SETUP.md** - Complete Azure VM setup guide
- **docs/CICD-GUIDE.md** - Full CI/CD documentation (500+ lines)
- **CICD-SETUP-CHECKLIST.md** - Step-by-step checklist
- **CICD-IMPLEMENTATION-SUMMARY.md** - Implementation overview

### SSH Setup
- **SSH-SETUP-GUIDE.md** - Complete SSH key guide
- **SSH-KEY-FLOW.md** - Visual diagrams and flow charts

### Scripts
- **scripts/azure-vm-setup.sh** - Automated VM setup script
- **scripts/deploy.sh** - Manual deployment script

---

## 🔍 Verification Checklist

### Before Deployment
- [ ] Azure VM created and running
- [ ] Can SSH to VM: `ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro`
- [ ] Docker installed on VM
- [ ] Docker Compose installed on VM
- [ ] azureuser in docker group
- [ ] Azure NSG configured (ports 22, 80, 443)
- [ ] UFW configured on VM
- [ ] Directories created: `/opt/qbms`, `/opt/qbms-backups`, `/opt/qbms/ssl`
- [ ] SSL certificate generated and copied
- [ ] .env file created on VM with actual credentials
- [ ] All 17 GitHub Secrets configured

### After Deployment
- [ ] GitHub Actions workflow completed successfully
- [ ] Docker containers running on VM
- [ ] Health check passes: `curl https://qbms.pro/health`
- [ ] Database health: `curl https://qbms.pro/health/db`
- [ ] Redis health: `curl https://qbms.pro/health/redis`
- [ ] Application accessible at https://qbms.pro
- [ ] SSL certificate valid (no browser warnings)
- [ ] Can login to application
- [ ] Can create/view data

---

## 🆘 Common Issues

### Issue 1: Can't SSH to VM

**Solution**:
```bash
# Fix key permissions
# On Windows
icacls qbms_key.pem /inheritance:r
icacls qbms_key.pem /grant:r "%USERNAME%:R"

# On Mac/Linux
chmod 600 ~/Downloads/qbms_key.pem

# Test with verbose
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro -v
```

### Issue 2: GitHub Actions Deployment Fails

**Check**:
1. All GitHub Secrets configured correctly
2. SSH_USER is set to "azureuser" (not "root")
3. SSH_PRIVATE_KEY contains the Azure private key
4. Can SSH manually from local machine

### Issue 3: Port 80/443 Not Accessible

**Solution**:
1. Check Azure NSG has inbound rules for ports 80, 443
2. Check UFW on VM: `sudo ufw status`
3. Add rules if missing: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`

### Issue 4: Docker Permission Denied

**Solution**:
```bash
# SSH to VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Add to docker group
sudo usermod -aG docker azureuser

# Logout and login
exit
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Test
docker ps
```

---

## 📝 Useful Commands

### Connect to VM
```bash
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
```

### View Deployment Logs
```bash
cd /opt/qbms
docker compose logs -f
```

### Check Container Status
```bash
docker ps
docker compose ps
```

### Restart Services
```bash
cd /opt/qbms
docker compose restart
```

### Update Application
```bash
cd /opt/qbms
docker compose pull
docker compose up -d
```

### View Nginx Logs
```bash
docker logs qbms-nginx
```

### View API Logs
```bash
docker logs qbms-api
```

### Check Health
```bash
curl https://qbms.pro/health
curl https://qbms.pro/health/db
curl https://qbms.pro/health/redis
```

---

## 🎯 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer                                                  │
│  ├─ Make changes                                            │
│  ├─ Commit: git commit -m "Update"                          │
│  └─ Push: git push origin main                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (CI)                                        │
│  ├─ Run tests                                               │
│  ├─ Lint code                                               │
│  ├─ Build packages                                          │
│  └─ Security audit                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ All checks pass
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (CD)                                        │
│  ├─ Build Docker images                                     │
│  ├─ Push to GitHub Container Registry                       │
│  ├─ SSH to Azure VM (azureuser@qbms.pro)                    │
│  ├─ Pull latest images                                      │
│  ├─ Stop old containers                                     │
│  ├─ Start new containers                                    │
│  ├─ Run database migrations                                 │
│  └─ Health check                                            │
└────────────────────┬────────────────────────────────────────┘
                     │ Deployment successful
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Azure VM (qbms.pro)                                        │
│  ├─ Nginx (reverse proxy + SSL)                            │
│  ├─ Next.js Web App                                         │
│  ├─ Express API                                             │
│  ├─ PostgreSQL Database                                     │
│  └─ Redis Cache                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Success!

Once everything is set up, your deployment workflow will be:

1. **Make changes** to your code
2. **Commit and push** to main branch
3. **GitHub Actions** automatically:
   - Runs tests
   - Builds Docker images
   - Deploys to Azure VM
   - Runs health checks
4. **Application updated** at https://qbms.pro

**Zero manual deployment needed!**

---

## 📞 Support

### Documentation
- Quick Start: `AZURE-QUICK-START.md`
- Full Guide: `docs/CICD-GUIDE.md`
- Azure Setup: `AZURE-VM-SETUP.md`
- SSH Guide: `SSH-SETUP-GUIDE.md`

### GitHub
- Repository: https://github.com/0irfan/QBMS
- Actions: https://github.com/0irfan/QBMS/actions
- Secrets: https://github.com/0irfan/QBMS/settings/secrets/actions

### Monitoring
- Application: https://qbms.pro
- Health: https://qbms.pro/health
- API: https://qbms.pro/api/health

---

*Deployment configured for Azure VM with azureuser*  
*Last updated: [Current Date]*
