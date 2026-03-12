# Fix 502 Bad Gateway Error

## Issue
All API endpoints are returning 502 Bad Gateway, indicating the API server is not responding.

---

## Quick Diagnosis

SSH to your server and run these commands:

```bash
ssh azureuser@qbms.pro

# Check if containers are running
docker-compose ps

# Check API logs
docker-compose logs api --tail=100

# Check if API is listening
docker exec qbms-api netstat -tuln | grep 4000
```

---

## Common Causes and Fixes

### 1. API Container Crashed

**Check:**
```bash
docker-compose ps
```

**If API shows "Exit" or "Restarting":**
```bash
# View error logs
docker-compose logs api --tail=200

# Restart the API
docker-compose restart api

# If that doesn't work, rebuild
docker-compose down
docker-compose up -d
```

### 2. Database Connection Issue

**Check:**
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db --tail=50

# Test database connection
docker exec -it qbms-db psql -U postgres -d qbms -c "SELECT 1;"
```

**Fix:**
```bash
# Restart database
docker-compose restart db

# Wait 10 seconds, then restart API
sleep 10
docker-compose restart api
```

### 3. Environment Variables Missing

**Check:**
```bash
# View API environment
docker exec qbms-api env | grep -E "DATABASE_URL|PORT|NODE_ENV"
```

**Fix:**
```bash
# Ensure .env file exists
cat .env

# If missing variables, recreate from .env.example
cp .env.example .env
nano .env  # Edit with your values

# Restart services
docker-compose down
docker-compose up -d
```

### 4. Port Conflict

**Check:**
```bash
# Check if port 4000 is in use
sudo netstat -tuln | grep 4000
sudo lsof -i :4000
```

**Fix:**
```bash
# Kill process using port 4000
sudo kill -9 $(sudo lsof -t -i:4000)

# Restart API
docker-compose restart api
```

### 5. Nginx Configuration Issue

**Check:**
```bash
# Test nginx configuration
docker exec qbms-nginx nginx -t

# Check nginx logs
docker-compose logs nginx --tail=50
```

**Fix:**
```bash
# Restart nginx
docker-compose restart nginx

# If configuration is invalid, check the config file
docker exec qbms-nginx cat /etc/nginx/conf.d/default.conf
```

---

## Complete Reset (Nuclear Option)

If nothing else works, do a complete reset:

```bash
# Stop all services
docker-compose down -v

# Remove all containers and images
docker system prune -a -f

# Pull latest code
git pull origin main

# Rebuild everything
docker-compose build --no-cache --pull

# Start services
docker-compose up -d

# Monitor startup
docker-compose logs -f
```

---

## Step-by-Step Troubleshooting

### Step 1: Check Container Status
```bash
docker-compose ps
```

**Expected output:**
```
NAME        STATUS          PORTS
qbms-api    Up X minutes    0.0.0.0:4000->4000/tcp
qbms-db     Up X minutes    0.0.0.0:5433->5432/tcp
qbms-web    Up X minutes    0.0.0.0:3000->3000/tcp
qbms-nginx  Up X minutes    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 2: Check API Logs
```bash
docker-compose logs api --tail=100
```

**Look for:**
- ❌ "Error connecting to database"
- ❌ "Port already in use"
- ❌ "Cannot find module"
- ❌ "Syntax error"
- ✅ "Server listening on port 4000"

### Step 3: Check Database Connection
```bash
# From API container
docker exec qbms-api node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB Error:', err);
  else console.log('DB Connected:', res.rows[0]);
  process.exit(err ? 1 : 0);
});
"
```

### Step 4: Test API Directly
```bash
# From inside the server
curl http://localhost:4000/api/health

# If that works, test from outside
curl http://localhost/api/health
```

### Step 5: Check Nginx Proxy
```bash
# View nginx configuration
docker exec qbms-nginx cat /etc/nginx/conf.d/default.conf

# Check if nginx is proxying correctly
docker-compose logs nginx | grep -i error
```

---

## Most Likely Causes

Based on the 502 error pattern, the most likely causes are:

### 1. API Container Not Running (90% probability)
```bash
docker-compose restart api
docker-compose logs api -f
```

### 2. Database Connection Failed (5% probability)
```bash
docker-compose restart db
sleep 10
docker-compose restart api
```

### 3. Recent Deployment Issue (5% probability)
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## Quick Fix Commands

Run these in order:

```bash
# 1. Check status
docker-compose ps

# 2. Restart API
docker-compose restart api

# 3. Wait and check logs
sleep 5
docker-compose logs api --tail=50

# 4. Test endpoint
curl http://localhost:4000/api/health

# 5. If still failing, restart everything
docker-compose restart

# 6. If still failing, rebuild
docker-compose down
docker-compose up -d --build
```

---

## After Fixing

Once the API is back up:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Try logging in again**
4. **Check if all pages load**

---

## Prevention

To prevent this in the future:

1. **Monitor logs regularly:**
   ```bash
   docker-compose logs -f
   ```

2. **Set up health checks** in docker-compose.yml

3. **Enable auto-restart:**
   ```yaml
   services:
     api:
       restart: unless-stopped
   ```

4. **Monitor resource usage:**
   ```bash
   docker stats
   ```

---

## Get Help

If the issue persists, collect this information:

```bash
# Container status
docker-compose ps > status.txt

# API logs
docker-compose logs api --tail=200 > api-logs.txt

# Database logs
docker-compose logs db --tail=100 > db-logs.txt

# Nginx logs
docker-compose logs nginx --tail=100 > nginx-logs.txt

# System resources
docker stats --no-stream > resources.txt
```

Then review the logs to identify the root cause.
