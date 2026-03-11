# 🚀 Start Deployment - Simple Steps

You've added all GitHub secrets. Here's what to do now:

---

## ⚡ Quick Start (3 Steps)

### Step 1: Prepare Your VM (5 minutes)

```bash
# Connect to your VM
ssh azureuser@20.121.189.81

# Run the automated setup script
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Logout and login again (important for docker group)
exit

# Login again
ssh azureuser@20.121.189.81

# Verify docker works
docker ps
```

**What this does:**
- Installs Docker and Docker Compose
- Configures firewall (ports 22, 80, 443)
- Creates deployment directories
- Sets up permissions

---

### Step 2: Deploy (1 command)

```bash
# On your local machine (Git Bash)
git push origin main
```

**What happens:**
- GitHub Actions automatically builds Docker images
- Deploys to your Azure VM
- Starts all containers
- Runs database migrations
- Performs health checks

**Duration:** ~10-15 minutes

---

### Step 3: Monitor & Verify

**Monitor deployment:**
- Go to: https://github.com/0irfan/QBMS/actions
- Watch the "Deploy to Production" workflow

**After deployment completes:**

```bash
# Test health endpoint
curl http://20.121.189.81/health

# Should return: {"status":"ok","timestamp":"..."}
```

**Open in browser:**
```
http://20.121.189.81
```

**Login with:**
- Email: admin@qbms.pro
- Password: Admin@123

---

## ✅ That's It!

Your QBMS application will be live at: **http://20.121.189.81**

---

## 🔐 Add SSL Later (Optional)

After testing, you can add HTTPS:

1. **Configure DNS** (at your domain registrar)
   ```
   Type: A
   Name: @
   Value: 20.121.189.81
   ```

2. **Wait for DNS propagation** (test with `nslookup qbms.pro`)

3. **Generate SSL certificate**
   ```bash
   ssh azureuser@20.121.189.81
   sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro
   sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/
   sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem
   chmod 644 /opt/qbms/ssl/fullchain.pem
   chmod 600 /opt/qbms/ssl/privkey.pem
   ```

4. **Update GitHub Secret**
   - Change `SERVER_HOST` from `20.121.189.81` to `qbms.pro`

5. **Redeploy**
   ```bash
   git push origin main
   ```

Now accessible at: **https://qbms.pro**

---

## 🐛 Troubleshooting

### VM Setup Fails?
```bash
# SSH to VM and run commands manually
ssh azureuser@20.121.189.81

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Create directories
sudo mkdir -p /opt/qbms /opt/qbms/ssl
sudo chown -R azureuser:azureuser /opt/qbms

# Logout and login
exit
ssh azureuser@20.121.189.81
```

### Deployment Fails?
```bash
# Check GitHub Actions logs
# https://github.com/0irfan/QBMS/actions

# Check if you can SSH manually
ssh azureuser@20.121.189.81

# Verify GitHub Secrets are correct
# https://github.com/0irfan/QBMS/settings/secrets/actions
```

### Containers Not Starting?
```bash
# SSH to VM
ssh azureuser@20.121.189.81
cd /opt/qbms

# Check logs
docker compose logs

# Restart containers
docker compose down
docker compose up -d
```

---

## 📋 Useful Commands

```bash
# Connect to VM
ssh azureuser@20.121.189.81

# View logs
cd /opt/qbms && docker compose logs -f

# Check container status
docker compose ps

# Restart services
docker compose restart

# Check health
curl http://20.121.189.81/health
```

---

## 🎯 Summary

**Before deployment:**
- ✅ Azure VM created (20.121.189.81)
- ✅ GitHub Secrets configured (17 secrets)
- ✅ CI/CD workflows ready

**To deploy:**
1. Setup VM (run script)
2. Push to main branch
3. Wait for deployment
4. Access at http://20.121.189.81

**After deployment:**
- ✅ Application running
- ✅ All containers healthy
- ✅ Database migrated
- ✅ Ready to use

---

## 📚 More Documentation

- **Detailed Guide**: `DEPLOY-NOW.md`
- **Pre-Deployment Checklist**: `PRE-DEPLOYMENT-CHECKLIST.md`
- **Deployment Summary**: `DEPLOYMENT-SUMMARY.md`
- **Azure VM Setup**: `AZURE-VM-SETUP.md`
- **CI/CD Guide**: `docs/CICD-GUIDE.md`

---

**Ready? Start with Step 1! 🚀**

