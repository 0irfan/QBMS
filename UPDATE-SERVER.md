# Update Server with Latest Changes

## Issue
The Subjects and Questions pages are showing deprecation warnings because the server is running old code that returns 410 Gone for `GET /api/subjects`.

## Solution
Pull the latest changes and restart the services on your Azure VM.

---

## Steps to Update

### 1. SSH to Your Server
```bash
ssh azureuser@qbms.pro
# or
ssh azureuser@20.121.189.81
```

### 2. Navigate to Project Directory
```bash
cd /path/to/qbms
# If you don't know the path, find it:
find ~ -name "docker-compose.yml" -type f 2>/dev/null
```

### 3. Pull Latest Changes
```bash
git pull origin main
```

### 4. Rebuild and Restart Services
```bash
# Stop current services
docker-compose down

# Rebuild with latest code
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 5. Verify the Fix
```bash
# Check API logs
docker-compose logs -f api

# Test the endpoint
curl http://localhost:4000/api/subjects
```

---

## Alternative: Wait for CI/CD

If you have CI/CD set up to auto-deploy, you can wait for the GitHub Actions workflow to complete. Check:
- https://github.com/0irfan/QBMS/actions

The workflow should:
1. Build Docker images
2. Push to GitHub Container Registry
3. Deploy to your Azure VM

---

## Quick Fix (If Above Doesn't Work)

If the deprecation message persists, it means the old code is cached. Force a complete rebuild:

```bash
# SSH to server
ssh azureuser@qbms.pro

# Navigate to project
cd /path/to/qbms

# Stop everything
docker-compose down -v

# Remove old images
docker system prune -a -f

# Pull latest code
git pull origin main

# Rebuild from scratch
docker-compose build --no-cache --pull

# Start services
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

---

## What Was Fixed

**Commit 6dacea9:**
- Restored `GET /api/subjects` endpoint
- Now returns all subjects instead of 410 Gone
- Maintains backward compatibility with existing UI

**The endpoint now:**
```javascript
// GET /api/subjects
// Returns: Array of all subjects
[
  {
    subjectId: "uuid",
    subjectName: "Mathematics",
    description: "...",
    classId: "uuid",
    createdBy: "uuid",
    createdAt: "timestamp"
  },
  ...
]
```

---

## Verification

After updating, the deprecation warnings should disappear and you should see:
- ✅ Subjects page loads without warnings
- ✅ Questions page loads without warnings
- ✅ You can create and view subjects
- ✅ You can create and view questions

---

## If Issues Persist

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** the page (Ctrl+F5)
3. **Check API logs** for errors:
   ```bash
   docker-compose logs api | grep -i error
   ```
4. **Verify database connection**:
   ```bash
   docker exec -it qbms-db psql -U postgres -d qbms -c "SELECT COUNT(*) FROM subjects;"
   ```

---

## Need Help?

If the issue persists after following these steps, check:
1. Git pull was successful (no conflicts)
2. Docker build completed without errors
3. Services are running (`docker-compose ps`)
4. No errors in logs (`docker-compose logs`)
