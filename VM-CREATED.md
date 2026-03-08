# ✅ Azure VM Successfully Created!

Your QBMS Azure VM has been created and configured.

---

## 🎉 VM Details

### Basic Information
```
Resource Group:  qbms-rg
VM Name:         qbms-vm
Location:        East US
Size:            Standard_B2s (2 vCPU, 4GB RAM)
Image:           Ubuntu 22.04 LTS
Username:        azureuser
```

### Network Information
```
Public IP:       20.121.189.81
Private IP:      10.0.0.4
MAC Address:     60-45-BD-A8-79-19
```

### Open Ports
```
✅ Port 22  (SSH)
✅ Port 80  (HTTP)
✅ Port 443 (HTTPS)
```

### Status
```
Power State:     VM running
Provisioning:    Succeeded
```

---

## 🔑 SSH Connection

### Connect to VM
```bash
ssh azureuser@20.121.189.81
```

### SSH Key Location
Your SSH private key is located at:
```bash
# On Windows (Git Bash)
~/.ssh/id_rsa
# or
~/.ssh/id_ed25519

# View the key
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```

---

## 📋 Next Steps

### Step 1: Configure DNS for qbms.pro

Point your domain to the VM's public IP:

**DNS Records to Add:**
```
Type: A
Name: @
Value: 20.121.189.81
TTL: 3600

Type: A
Name: www
Value: 20.121.189.81
TTL: 3600
```

**Where to add these:**
- Go to your domain registrar (where you bought qbms.pro)
- Find DNS settings or DNS management
- Add the A records above

### Step 2: Add SSH Key to GitHub Secrets

```bash
# Display your SSH private key
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519

# Copy the ENTIRE output (including BEGIN and END lines)
```

**Add to GitHub:**
1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the entire key content
5. Click "Add secret"

### Step 3: Configure Other GitHub Secrets

Add these secrets to GitHub:

```
SSH_USER        = azureuser
SERVER_HOST     = 20.121.189.81 (or qbms.pro after DNS is configured)
DATABASE_URL    = postgresql://qbms:YOUR_PASSWORD@postgres:5432/qbms
REDIS_URL       = redis://redis:6379
JWT_SECRET      = [Generate: openssl rand -base64 32]
REFRESH_SECRET  = [Generate: openssl rand -base64 32]

# Azure Storage
AZURE_ACCOUNT_NAME              = your-account-name
AZURE_ACCOUNT_KEY               = your-account-key
AZURE_BLOB_CONNECTION_STRING    = your-connection-string
AZURE_CONTAINER_NAME            = qbms

# OpenAI
OPENAI_API_KEY  = your-openai-key

# SMTP
SMTP_HOST       = smtp.hostinger.com
SMTP_PORT       = 587
SMTP_USER       = your-smtp-username
SMTP_PASS       = your-smtp-password
FROM_EMAIL      = info@qbms.pro
```

### Step 4: Setup the VM

**Option A: Automated Setup (Recommended)**

```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Run automated setup script
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Logout and login for docker group changes
exit
ssh azureuser@20.121.189.81
```

**Option B: Manual Setup**

```bash
# SSH into VM
ssh azureuser@20.121.189.81

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
ssh azureuser@20.121.189.81
```

### Step 5: Setup SSL Certificate

**After DNS is configured and pointing to the VM:**

```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Generate certificate (wait until DNS is propagated!)
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

### Step 6: Create .env File on VM

```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Create .env file
nano /opt/qbms/.env

# Copy content from .env.example
# Update with actual credentials
# Save: Ctrl+X, Y, Enter
```

### Step 7: Deploy!

```bash
# On your local machine
git add .
git commit -m "Deploy to Azure VM"
git push origin main

# Watch deployment
# Go to: https://github.com/0irfan/QBMS/actions
```

### Step 8: Verify

```bash
# After DNS is configured and deployment is complete
curl https://qbms.pro/health

# Open browser
https://qbms.pro
```

---

## 🧪 Test SSH Connection Now

```bash
# Test connection
ssh azureuser@20.121.189.81

# If successful, you'll see:
# Welcome to Ubuntu 22.04.x LTS...
# azureuser@qbms-vm:~$

# Type 'exit' to disconnect
```

---

## 📝 Important Notes

### DNS Propagation
- DNS changes can take 5 minutes to 48 hours to propagate
- You can use the IP address (20.121.189.81) until DNS is ready
- Test DNS: `nslookup qbms.pro` or `ping qbms.pro`

### SSL Certificate
- Can only be generated AFTER DNS is pointing to the VM
- If you try before DNS is ready, it will fail
- Use HTTP (port 80) for testing until SSL is setup

### GitHub Secrets
- Use IP address (20.121.189.81) for SERVER_HOST initially
- Change to qbms.pro after DNS is configured
- Update the secret in GitHub when you change it

---

## 🔍 Verification Checklist

- [ ] VM created and running
- [ ] Can SSH to VM: `ssh azureuser@20.121.189.81`
- [ ] DNS configured (A records for qbms.pro and www.qbms.pro)
- [ ] DNS propagated (test with `nslookup qbms.pro`)
- [ ] SSH key added to GitHub Secrets
- [ ] All GitHub Secrets configured
- [ ] VM setup complete (Docker, Docker Compose, etc.)
- [ ] SSL certificate generated
- [ ] .env file created on VM
- [ ] Deployment successful
- [ ] Application accessible

---

## 🆘 Troubleshooting

### Can't SSH to VM

```bash
# Check key permissions
chmod 600 ~/.ssh/id_rsa

# Try with verbose output
ssh -v azureuser@20.121.189.81

# Check if VM is running in Azure Portal
```

### DNS Not Working

```bash
# Test DNS
nslookup qbms.pro

# If not working:
# 1. Check DNS records in your registrar
# 2. Wait for propagation (can take up to 48 hours)
# 3. Use IP address (20.121.189.81) in the meantime
```

### SSL Certificate Fails

```bash
# Make sure DNS is working first
ping qbms.pro

# If DNS works, try certificate again
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro
```

---

## 📚 Documentation

- **Quick Start**: `AZURE-QUICK-START.md`
- **Full Setup**: `AZURE-VM-SETUP.md`
- **Deployment**: `DEPLOYMENT-SUMMARY.md`
- **CI/CD Guide**: `docs/CICD-GUIDE.md`

---

## 🎯 Summary

**VM Created Successfully!**

```
✅ Resource Group: qbms-rg
✅ VM Name: qbms-vm
✅ Public IP: 20.121.189.81
✅ Ports Open: 22, 80, 443
✅ Status: Running
```

**Next Steps:**
1. Configure DNS (point qbms.pro to 20.121.189.81)
2. Add SSH key to GitHub Secrets
3. Setup VM (run automated script)
4. Generate SSL certificate (after DNS)
5. Deploy!

---

*VM Created: $(date)*  
*Location: East US*  
*Status: Ready for Setup*
