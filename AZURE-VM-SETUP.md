# Azure VM Setup for QBMS Deployment

Guide for deploying QBMS to Azure VM using Azure-provided SSH key and `azureuser`.

---

## 🔧 Azure VM Configuration

### Your Setup
- **Cloud Provider**: Azure
- **VM User**: `azureuser` (default Azure user)
- **SSH Key**: Azure-provided key (downloaded during VM creation)
- **Domain**: qbms.pro

---

## 📋 Prerequisites

### 1. Azure VM Requirements
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **Size**: Standard B2s or larger (2 vCPU, 4GB RAM minimum)
- **Disk**: 30GB+ Premium SSD
- **Network**: Public IP with DNS name or custom domain (qbms.pro)

### 2. SSH Key from Azure
When you created the Azure VM, you downloaded a private key file:
- **File name**: Usually `qbms_key.pem` or similar
- **Location**: Your Downloads folder
- **Format**: PEM format (OpenSSH private key)

---

## 🚀 Quick Setup Steps

### Step 1: Locate Your Azure SSH Key

```bash
# Find your Azure private key (usually in Downloads)
# On Windows
dir %USERPROFILE%\Downloads\*.pem

# On Mac/Linux
ls ~/Downloads/*.pem

# Example output: qbms_key.pem
```

### Step 2: Test Connection to Azure VM

```bash
# Test SSH connection (replace with your VM's public IP or domain)
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# If successful, you'll be logged into the VM
# Type 'exit' to disconnect
```

### Step 3: Add Azure Private Key to GitHub Secrets

```bash
# Display the private key content
# On Windows (PowerShell)
Get-Content ~\Downloads\qbms_key.pem

# On Mac/Linux
cat ~/Downloads/qbms_key.pem

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (all content)
# -----END OPENSSH PRIVATE KEY-----
```

**Add to GitHub**:
1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the entire private key content
5. Click "Add secret"

### Step 4: Configure GitHub Secrets

Add these secrets to GitHub:

```
SSH_PRIVATE_KEY     = [Content of your Azure private key file]
SERVER_HOST         = qbms.pro (or your VM's public IP)
SSH_USER            = azureuser
```

---

## 🔧 Azure VM Initial Setup

### Step 1: Connect to Your VM

```bash
# SSH into your Azure VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
```

### Step 2: Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add azureuser to docker group (no sudo needed for docker commands)
sudo usermod -aG docker azureuser

# Apply group changes (logout and login, or use newgrp)
newgrp docker

# Verify Docker installation
docker --version
```

### Step 4: Install Docker Compose

```bash
# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker compose version
```

### Step 5: Configure Firewall (Azure NSG)

**In Azure Portal**:
1. Go to your VM → Networking → Network Security Group
2. Add inbound security rules:
   - **HTTP**: Port 80, Source: Any, Priority: 100
   - **HTTPS**: Port 443, Source: Any, Priority: 110
   - **SSH**: Port 22, Source: Your IP (for security), Priority: 120

**On VM (UFW)**:
```bash
# Install and configure UFW
sudo apt install ufw -y

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Step 6: Create Deployment Directories

```bash
# Create deployment directory
sudo mkdir -p /opt/qbms
sudo chown -R azureuser:azureuser /opt/qbms

# Create backup directory
sudo mkdir -p /opt/qbms-backups
sudo chown -R azureuser:azureuser /opt/qbms-backups

# Create SSL directory
sudo mkdir -p /opt/qbms/ssl
sudo chown -R azureuser:azureuser /opt/qbms/ssl
```

### Step 7: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot -y

# Stop any running web servers
docker compose down 2>/dev/null || true

# Generate certificate for qbms.pro
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Copy certificates to deployment directory
sudo cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
sudo cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/

# Set ownership
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem

# Set permissions
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem

# Setup auto-renewal (runs daily at 2 AM)
echo "0 2 * * * sudo certbot renew --quiet && sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/ && cd /opt/qbms && docker compose restart nginx" | crontab -
```

### Step 8: Create .env File

```bash
# Create .env file
nano /opt/qbms/.env

# Add all environment variables (paste from .env.example)
# Make sure to use actual credentials!
```

**Example .env content**:
```env
# Database
DATABASE_URL=postgresql://qbms:YOUR_STRONG_PASSWORD@postgres:5432/qbms
REDIS_URL=redis://redis:6379

# Auth
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here

# CORS
CORS_ORIGIN=https://qbms.pro

# Azure Blob Storage
AZURE_ACCOUNT_NAME=your-account-name
AZURE_ACCOUNT_KEY=your-account-key
AZURE_BLOB_CONNECTION_STRING=your-connection-string
AZURE_CONTAINER_NAME=qbms

# OpenAI
OPENAI_API_KEY=your-openai-key

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=info@qbms.pro
SMTP_PASS=your-smtp-password
FROM_EMAIL=info@qbms.pro

# Application
APP_URL=https://qbms.pro
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

### Step 9: Configure Docker for azureuser

```bash
# Ensure azureuser can run docker without sudo
sudo usermod -aG docker azureuser

# Logout and login again for changes to take effect
exit

# SSH back in
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Test docker without sudo
docker ps
```

---

## 🔐 GitHub Secrets Configuration

### Required Secrets

Go to: https://github.com/0irfan/QBMS/settings/secrets/actions

Add these secrets:

#### Server Access
```
SSH_PRIVATE_KEY     = [Content of your Azure private key file]
SERVER_HOST         = qbms.pro
SSH_USER            = azureuser
```

#### Database
```
DATABASE_URL        = postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms
REDIS_URL           = redis://redis:6379
```

#### Authentication
```
JWT_SECRET          = [Generate with: openssl rand -base64 32]
REFRESH_SECRET      = [Generate with: openssl rand -base64 32]
```

#### Azure Storage
```
AZURE_ACCOUNT_NAME              = your-account-name
AZURE_ACCOUNT_KEY               = your-account-key
AZURE_BLOB_CONNECTION_STRING    = your-connection-string
AZURE_CONTAINER_NAME            = qbms
```

#### OpenAI
```
OPENAI_API_KEY      = your-openai-key
```

#### SMTP
```
SMTP_HOST           = smtp.hostinger.com
SMTP_PORT           = 587
SMTP_USER           = info@qbms.pro
SMTP_PASS           = your-smtp-password
FROM_EMAIL          = info@qbms.pro
```

---

## 🧪 Test Deployment

### Manual Test Deployment

```bash
# SSH into VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Navigate to deployment directory
cd /opt/qbms

# Create a test docker-compose.yml (or wait for GitHub Actions to deploy)
# For now, verify directories exist
ls -la

# Check .env file exists
cat .env

# Check SSL certificates
ls -la ssl/
```

### Test GitHub Actions Deployment

```bash
# On your local machine, make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test Azure VM deployment"
git push origin main

# Watch deployment
# Go to: https://github.com/0irfan/QBMS/actions

# Monitor on VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
cd /opt/qbms
watch docker compose ps
```

---

## 📊 Verification

### Check Services

```bash
# SSH into VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Check Docker containers
docker ps

# Check logs
cd /opt/qbms
docker compose logs -f

# Check specific service
docker compose logs api
docker compose logs web
docker compose logs nginx
```

### Health Checks

```bash
# From your local machine
curl https://qbms.pro/health
curl https://qbms.pro/health/db
curl https://qbms.pro/health/redis

# Or from VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
curl http://localhost/health
```

### Access Application

Open browser: https://qbms.pro

---

## 🔧 Azure-Specific Considerations

### 1. Azure Network Security Group (NSG)

Ensure these ports are open in Azure Portal:
- **Port 22** (SSH) - Restrict to your IP for security
- **Port 80** (HTTP) - Open to internet
- **Port 443** (HTTPS) - Open to internet

### 2. Azure DNS Configuration

If using Azure DNS:
1. Go to Azure Portal → DNS zones
2. Add A record: `@` → Your VM's public IP
3. Add A record: `www` → Your VM's public IP

Or configure your domain registrar to point to Azure VM's public IP.

### 3. Azure VM Auto-Shutdown

Disable auto-shutdown for production:
1. Go to VM → Auto-shutdown
2. Turn off auto-shutdown

### 4. Azure Backup

Enable Azure Backup for VM:
1. Go to VM → Backup
2. Configure backup policy
3. Enable backup

### 5. Azure Monitoring

Enable monitoring:
1. Go to VM → Insights
2. Enable VM insights
3. Configure alerts for CPU, memory, disk

---

## 🛠️ Troubleshooting

### Issue 1: Can't SSH to VM

**Check**:
```bash
# Verify VM is running in Azure Portal
# Check NSG allows SSH from your IP
# Verify you're using correct private key

# Test connection
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro -v
```

### Issue 2: Permission Denied

**Fix**:
```bash
# On Windows, fix key permissions
icacls qbms_key.pem /inheritance:r
icacls qbms_key.pem /grant:r "%USERNAME%:R"

# On Mac/Linux
chmod 600 ~/Downloads/qbms_key.pem
```

### Issue 3: Docker Permission Denied

**Fix**:
```bash
# Add azureuser to docker group
sudo usermod -aG docker azureuser

# Logout and login
exit
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Test
docker ps
```

### Issue 4: Port 80/443 Not Accessible

**Check Azure NSG**:
1. Azure Portal → VM → Networking
2. Verify inbound rules for ports 80 and 443
3. Add rules if missing

**Check UFW**:
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 📝 Quick Commands

### Connect to VM
```bash
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro
```

### View Logs
```bash
cd /opt/qbms
docker compose logs -f
```

### Restart Services
```bash
cd /opt/qbms
docker compose restart
```

### Update Deployment
```bash
cd /opt/qbms
docker compose pull
docker compose up -d
```

### Check Status
```bash
docker ps
docker compose ps
```

---

## ✅ Deployment Checklist

- [ ] Azure VM created and running
- [ ] SSH key downloaded from Azure
- [ ] Can connect to VM: `ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro`
- [ ] Docker installed on VM
- [ ] Docker Compose installed on VM
- [ ] azureuser added to docker group
- [ ] Firewall configured (Azure NSG + UFW)
- [ ] Directories created: `/opt/qbms`, `/opt/qbms-backups`, `/opt/qbms/ssl`
- [ ] SSL certificate generated and copied
- [ ] .env file created with actual credentials
- [ ] GitHub Secrets configured (SSH_PRIVATE_KEY, SERVER_HOST, SSH_USER, etc.)
- [ ] Test deployment successful
- [ ] Application accessible at https://qbms.pro

---

## 🎯 Summary

**Your Configuration**:
- VM User: `azureuser`
- SSH Key: Azure-provided private key
- Domain: qbms.pro
- Deployment Directory: `/opt/qbms`

**GitHub Secrets to Set**:
- `SSH_PRIVATE_KEY` = Content of Azure private key file
- `SERVER_HOST` = qbms.pro
- `SSH_USER` = azureuser
- Plus all other application secrets (database, Azure storage, etc.)

**Next Steps**:
1. Add Azure private key to GitHub Secrets
2. Set SSH_USER to "azureuser" in GitHub Secrets
3. Complete VM setup following this guide
4. Push to main branch to trigger deployment

---

*Azure VM Setup Guide for QBMS*
