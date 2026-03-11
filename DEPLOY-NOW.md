# 🚀 Deploy QBMS Now - Quick Guide

You've confirmed all GitHub secrets are configured. Here's what to do next:

---

## ✅ Pre-Deployment Status

- ✅ Azure VM created (20.121.189.81)
- ✅ All 17 GitHub Secrets configured
- ✅ CI/CD workflows ready
- ✅ Docker images will be built automatically
- ⚠️ VM needs to be prepared for deployment

---

## 🎯 Two Deployment Options

### Option 1: Deploy with IP Address (Fastest - Recommended for Testing)

Use this if you haven't configured DNS yet or want to test quickly.

**Advantages:**
- No DNS configuration needed
- No SSL certificate needed initially
- Can deploy immediately
- Can add SSL later

**Steps:**

1. **Prepare the VM** (5 minutes)
```bash
# SSH into your VM
ssh azureuser@20.121.189.81

# Run automated setup script
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Logout and login again (for docker group changes)
exit
ssh azureuser@20.121.189.81

# Verify Docker is working
docker ps
```

2. **Trigger Deployment**
```bash
# On your local machine
git add .
git commit -m "Initial production deployment"
git push origin main
```

3. **Monitor Deployment**
- Go to: https://github.com/0irfan/QBMS/actions
- Watch the "Deploy to Production" workflow
- Wait for completion (~10-15 minutes)

4. **Access Application**
```bash
# Test health endpoint
curl http://20.121.189.81/health

# Open in browser
http://20.121.189.81
```

---

### Option 2: Deploy with Domain (Full Production Setup)

Use this for complete production deployment with SSL.

**Prerequisites:**
- DNS must be configured (qbms.pro → 20.121.189.81)
- DNS must be propagated (test with `nslookup qbms.pro`)

**Steps:**

1. **Configure DNS First**

Add these DNS records at your domain registrar:
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

2. **Wait for DNS Propagation** (5 mins - 48 hours)
```bash
# Test DNS
nslookup qbms.pro
# Should return: 20.121.189.81

# Or use ping
ping qbms.pro
```

3. **Prepare the VM**
```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Run automated setup
curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash

# Logout and login
exit
ssh azureuser@20.121.189.81
```

4. **Generate SSL Certificate**
```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Generate certificate (only works after DNS is ready!)
sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro

# Copy certificates
sudo cp /etc/letsencrypt/live/qbms.pro/fullchain.pem /opt/qbms/ssl/
sudo cp /etc/letsencrypt/live/qbms.pro/privkey.pem /opt/qbms/ssl/
sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem
chmod 644 /opt/qbms/ssl/fullchain.pem
chmod 600 /opt/qbms/ssl/privkey.pem
```

5. **Update GitHub Secret**

Update `SERVER_HOST` secret from `20.121.189.81` to `qbms.pro`:
- Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
- Click on `SERVER_HOST`
- Update value to: `qbms.pro`
- Save

6. **Deploy**
```bash
# On your local machine
git add .
git commit -m "Production deployment with SSL"
git push origin main
```

7. **Access Application**
```bash
# Test health
curl https://qbms.pro/health

# Open in browser
https://qbms.pro
```

---

## 🎯 Recommended Approach

**For immediate testing:** Use Option 1 (IP Address)
- Deploy now with IP
- Test everything works
- Add DNS and SSL later

**For production:** Use Option 2 (Domain with SSL)
- Configure DNS first
- Wait for propagation
- Deploy with full SSL

---

## 📋 VM Setup Script Details

The automated setup script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Install Certbot (for SSL)
- ✅ Configure UFW firewall
- ✅ Create required directories
- ✅ Set proper permissions
- ✅ Add azureuser to docker group

**Script location:** `scripts/azure-vm-setup.sh`

---

## 🔍 Verify VM Setup

After running the setup script, verify everything:

```bash
# SSH into VM
ssh azureuser@20.121.189.81

# Check Docker
docker --version
# Expected: Docker version 24.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version 2.x or higher

# Check directories
ls -la /opt/qbms
# Should exist and be owned by azureuser

# Check firewall
sudo ufw status
# Should show ports 22, 80, 443 allowed

# Check docker group
groups
# Should include 'docker'
```

---

## 🚀 Deploy Command

Once VM is ready, deploy with:

```bash
git push origin main
```

That's it! GitHub Actions will:
1. ✅ Build Docker images
2. ✅ Push to GitHub Container Registry
3. ✅ SSH to your VM
4. ✅ Pull latest images
5. ✅ Start containers
6. ✅ Run database migrations
7. ✅ Perform health checks

---

## 📊 Monitor Deployment

### GitHub Actions
- URL: https://github.com/0irfan/QBMS/actions
- Watch: "Deploy to Production" workflow
- Duration: ~10-15 minutes

### Deployment Steps
```
1. Build and Push Docker Images (5-10 min)
   ├─ Build API image
   └─ Build Web image

2. Deploy to Server (2-3 min)
   ├─ Setup SSH
   ├─ Copy files
   ├─ Create .env
   ├─ Pull images
   └─ Start containers

3. Post-Deployment (1 min)
   ├─ Run migrations
   ├─ Health check
   └─ Cleanup old images
```

---

## ✅ Post-Deployment Verification

### 1. Check Containers
```bash
ssh azureuser@20.121.189.81
cd /opt/qbms
docker compose ps

# Expected output:
# qbms-nginx     running   0.0.0.0:80->80/tcp
# qbms-web       running   3000/tcp
# qbms-api       running   3001/tcp
# qbms-postgres  running   5432/tcp
# qbms-redis     running   6379/tcp
```

### 2. Check Logs
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api
docker compose logs -f web
```

### 3. Test Health Endpoints
```bash
# API health
curl http://20.121.189.81/health
# Expected: {"status":"ok","timestamp":"..."}

# Database health
curl http://20.121.189.81/health/db

# Redis health
curl http://20.121.189.81/health/redis
```

### 4. Test Application
```bash
# Open in browser
http://20.121.189.81

# You should see the QBMS login page
```

### 5. Test Login
- Navigate to: http://20.121.189.81/login
- Use default credentials:
  - Email: admin@qbms.pro
  - Password: Admin@123
- Should successfully login

---

## 🐛 Troubleshooting

### Issue: VM Setup Script Fails

```bash
# Run commands manually
ssh azureuser@20.121.189.81

# Update system
sudo apt update && sudo apt upgrade -y

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

### Issue: Deployment Fails at SSH Step

```bash
# Test SSH manually
ssh azureuser@20.121.189.81

# If fails, check:
# 1. SSH_PRIVATE_KEY secret is correct
# 2. SSH_USER is "azureuser"
# 3. SERVER_HOST is "20.121.189.81"
```

### Issue: Containers Not Starting

```bash
# SSH to VM
ssh azureuser@20.121.189.81
cd /opt/qbms

# Check logs
docker compose logs

# Check .env file
cat .env

# Restart containers
docker compose down
docker compose up -d
```

### Issue: Health Check Fails

```bash
# Wait longer (containers need time to start)
sleep 30
curl http://20.121.189.81/health

# Check nginx logs
docker compose logs nginx

# Check if ports are open
sudo netstat -tulpn | grep -E '80|443'
```

---

## 📝 Quick Commands

### Connect to VM
```bash
ssh azureuser@20.121.189.81
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

### Stop Services
```bash
cd /opt/qbms
docker compose down
```

### Start Services
```bash
cd /opt/qbms
docker compose up -d
```

### Check Status
```bash
docker compose ps
docker stats --no-stream
```

---

## 🎉 Success Indicators

You'll know deployment is successful when:

✅ GitHub Actions workflow shows green checkmark
✅ All 5 containers are running
✅ Health endpoint returns `{"status":"ok"}`
✅ Application loads in browser
✅ Can login with default credentials
✅ Dashboard displays correctly

---

## 🔄 Future Deployments

After initial setup, future deployments are automatic:

```bash
# Make changes to code
git add .
git commit -m "Update feature X"
git push origin main

# Deployment happens automatically!
```

No manual steps needed. GitHub Actions handles everything.

---

## 📞 Need Help?

### Check These First
1. GitHub Actions logs: https://github.com/0irfan/QBMS/actions
2. Server logs: `ssh azureuser@20.121.189.81 "cd /opt/qbms && docker compose logs"`
3. Container status: `ssh azureuser@20.121.189.81 "docker ps"`

### Documentation
- Pre-Deployment Checklist: `PRE-DEPLOYMENT-CHECKLIST.md`
- Deployment Summary: `DEPLOYMENT-SUMMARY.md`
- Azure VM Setup: `AZURE-VM-SETUP.md`
- CI/CD Guide: `docs/CICD-GUIDE.md`

---

## 🎯 Next Steps

**Right Now:**

1. **Prepare VM** (5 minutes)
   ```bash
   ssh azureuser@20.121.189.81
   curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash
   exit
   ssh azureuser@20.121.189.81
   ```

2. **Deploy** (1 command)
   ```bash
   git push origin main
   ```

3. **Monitor** (watch GitHub Actions)
   - https://github.com/0irfan/QBMS/actions

4. **Verify** (test in browser)
   - http://20.121.189.81

**Later (Optional):**

5. Configure DNS (qbms.pro → 20.121.189.81)
6. Generate SSL certificate
7. Update SERVER_HOST secret to qbms.pro
8. Redeploy for HTTPS

---

**You're ready to deploy! 🚀**

Start with Option 1 (IP Address) for immediate testing.
Add DNS and SSL later for production.

