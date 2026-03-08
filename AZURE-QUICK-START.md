# Azure VM Quick Start Guide

Fast setup guide for deploying QBMS to Azure VM with `azureuser`.

---

## ⚡ 5-Minute Setup

### 1. Get Your Azure SSH Key

```bash
# Your Azure private key is in Downloads folder
# File name: qbms_key.pem (or similar name you chose)

# On Windows
dir %USERPROFILE%\Downloads\*.pem

# On Mac/Linux  
ls ~/Downloads/*.pem
```

### 2. Test Connection

```bash
# Replace with your VM's public IP or domain
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# If it works, type 'exit' to disconnect
```

### 3. Add Key to GitHub Secrets

```bash
# Display the key content
# On Windows (PowerShell)
Get-Content ~\Downloads\qbms_key.pem

# On Mac/Linux
cat ~/Downloads/qbms_key.pem

# Copy ALL the output (including BEGIN and END lines)
```

**Add to GitHub**:
1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the key content
5. Click "Add secret"

### 4. Add Other GitHub Secrets

Add these three secrets:

```
SSH_USER        = azureuser
SERVER_HOST     = qbms.pro
DATABASE_URL    = postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms
```

Plus all other secrets from `.env.example`

### 5. Setup Azure VM

```bash
# SSH into VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Run this setup script
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Or manually:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser
sudo apt install docker-compose-plugin certbot ufw -y
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw --force enable
sudo mkdir -p /opt/qbms /opt/qbms-backups /opt/qbms/ssl
sudo chown -R azureuser:azureuser /opt/qbms /opt/qbms-backups
```

### 6. Setup SSL Certificate

```bash
# Still on the VM
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro
sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem
```

### 7. Create .env File

```bash
# Create .env file on VM
nano /opt/qbms/.env

# Paste content from .env.example
# Update with actual credentials
# Save: Ctrl+X, Y, Enter
```

### 8. Deploy!

```bash
# On your local machine
git add .
git commit -m "Deploy to Azure VM"
git push origin main

# Watch deployment
# https://github.com/0irfan/QBMS/actions
```

### 9. Verify

```bash
# Check health
curl https://qbms.pro/health

# Open browser
# https://qbms.pro
```

---

## 🔧 Azure Portal Configuration

### Network Security Group (NSG)

1. Go to: Azure Portal → Your VM → Networking
2. Add inbound rules:
   - **SSH**: Port 22, Source: Your IP
   - **HTTP**: Port 80, Source: Any
   - **HTTPS**: Port 443, Source: Any

### DNS Configuration

**Option 1: Azure DNS**
1. Azure Portal → DNS zones
2. Add A record: `@` → VM Public IP
3. Add A record: `www` → VM Public IP

**Option 2: External DNS**
1. Go to your domain registrar
2. Add A record: `qbms.pro` → VM Public IP
3. Add A record: `www.qbms.pro` → VM Public IP

---

## 📋 GitHub Secrets Checklist

Go to: https://github.com/0irfan/QBMS/settings/secrets/actions

### Server Access (3 secrets)
- [ ] `SSH_PRIVATE_KEY` - Content of Azure private key file
- [ ] `SERVER_HOST` - qbms.pro
- [ ] `SSH_USER` - azureuser

### Database (2 secrets)
- [ ] `DATABASE_URL` - postgresql://qbms:PASSWORD@postgres:5432/qbms
- [ ] `REDIS_URL` - redis://redis:6379

### Auth (2 secrets)
- [ ] `JWT_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `REFRESH_SECRET` - Generate: `openssl rand -base64 32`

### Azure Storage (4 secrets)
- [ ] `AZURE_ACCOUNT_NAME`
- [ ] `AZURE_ACCOUNT_KEY`
- [ ] `AZURE_BLOB_CONNECTION_STRING`
- [ ] `AZURE_CONTAINER_NAME` - qbms

### OpenAI (1 secret)
- [ ] `OPENAI_API_KEY`

### SMTP (5 secrets)
- [ ] `SMTP_HOST` - smtp.hostinger.com
- [ ] `SMTP_PORT` - 587
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `FROM_EMAIL` - info@qbms.pro

**Total: 17 secrets**

---

## 🆘 Quick Troubleshooting

### Can't SSH to VM

```bash
# Check key permissions
# On Windows
icacls qbms_key.pem /inheritance:r
icacls qbms_key.pem /grant:r "%USERNAME%:R"

# On Mac/Linux
chmod 600 ~/Downloads/qbms_key.pem

# Test with verbose output
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro -v
```

### Docker Permission Denied

```bash
# SSH to VM
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Add user to docker group
sudo usermod -aG docker azureuser

# Logout and login
exit
ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro

# Test
docker ps
```

### Port Not Accessible

**Check Azure NSG**:
1. Azure Portal → VM → Networking
2. Verify inbound rules for ports 80, 443

**Check UFW on VM**:
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify all secrets are set
3. Test SSH connection manually
4. Check .env file exists on VM

---

## 📝 Useful Commands

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

### Check Status
```bash
docker ps
docker compose ps
```

### Update Application
```bash
cd /opt/qbms
docker compose pull
docker compose up -d
```

---

## ✅ Success Checklist

- [ ] Can SSH to VM with Azure key
- [ ] Docker installed and working
- [ ] Firewall configured (Azure NSG + UFW)
- [ ] SSL certificate installed
- [ ] .env file created on VM
- [ ] All GitHub Secrets configured
- [ ] Deployment successful
- [ ] Application accessible at https://qbms.pro
- [ ] Health checks passing

---

## 🎯 Summary

**Your Setup**:
- Cloud: Azure VM
- User: `azureuser`
- Key: Azure-provided private key
- Domain: qbms.pro

**Key Points**:
1. Use Azure private key (not generate new one)
2. User is `azureuser` (not root)
3. Need sudo for some commands
4. Configure Azure NSG for ports 80, 443

**Next Steps**:
1. ✅ Add Azure key to GitHub Secrets
2. ✅ Set SSH_USER to "azureuser"
3. ✅ Setup VM (Docker, SSL, directories)
4. ✅ Configure all GitHub Secrets
5. ✅ Push to main to deploy

---

*Quick Start Guide for Azure VM Deployment*
