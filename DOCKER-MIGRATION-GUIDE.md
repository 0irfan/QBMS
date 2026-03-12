# Docker-Based Migration Guide

## System Refactor - Docker Deployment Instructions

This guide provides Docker-specific commands for running database migrations in your containerized environment.

---

## Prerequisites

- Docker and Docker Compose installed
- Containers running: `docker-compose up -d`
- Database container name: `qbms-db` (or check with `docker ps`)

---

## Phase 2 & 3: Audit Logs Enhancement (Backward Compatible)

### Step 1: Run Audit Logs Migration

```bash
# Execute migration inside the database container
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0008_enhance_audit_logs.sql
```

Or if you prefer to copy the file first:

```bash
# Copy migration file to container
docker cp packages/database/drizzle/0008_enhance_audit_logs.sql qbms-db:/tmp/

# Execute inside container
docker exec -it qbms-db psql -U postgres -d qbms -f /tmp/0008_enhance_audit_logs.sql
```

### Step 2: Restart API Container

```bash
# Restart to pick up schema changes
docker-compose restart api
```

---

## Phase 4: Subjects Under Classes (Breaking Change)

### Step 1: Backup Database

```bash
# Create backup
docker exec qbms-db pg_dump -U postgres qbms > backup_before_phase4_$(date +%Y%m%d_%H%M%S).sql

# Or backup to container and copy out
docker exec qbms-db pg_dump -U postgres qbms -f /tmp/backup.sql
docker cp qbms-db:/tmp/backup.sql ./backup_before_phase4.sql
```

### Step 2: Preview Changes (Dry Run)

```bash
# Run dry-run to see what will happen
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0009_subjects_nested_under_classes_dryrun.sql
```

Review the output carefully to see:
- Which subjects will be migrated
- Which subjects will be deleted (orphans)
- Total counts

### Step 3: Stop Application (Maintenance Mode)

```bash
# Stop API and Web containers (keep database running)
docker-compose stop api web

# Or stop everything
docker-compose down
```

### Step 4: Execute Migration

```bash
# If containers are stopped, start only database
docker-compose up -d db

# Execute migration
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0009_subjects_nested_under_classes.sql
```

### Step 5: Verify Migration

```bash
# Check all subjects have classId
docker exec -it qbms-db psql -U postgres -d qbms -c "SELECT COUNT(*) FROM subjects WHERE class_id IS NULL;"
# Should return 0

# Check classes no longer have subjectId
docker exec -it qbms-db psql -U postgres -d qbms -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'subject_id';"
# Should return no rows

# Check subjects count
docker exec -it qbms-db psql -U postgres -d qbms -c "SELECT COUNT(*) FROM subjects;"
```

### Step 6: Restart Application

```bash
# Start all containers
docker-compose up -d

# Or if you only stopped api and web
docker-compose start api web

# Check logs
docker-compose logs -f api
```

### Step 7: Rollback (If Needed)

```bash
# Stop application
docker-compose stop api web

# Run rollback script
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0009_subjects_nested_under_classes_rollback.sql

# Or restore from backup
docker exec -i qbms-db psql -U postgres -d qbms < backup_before_phase4.sql

# Restart
docker-compose up -d
```

---

## Alternative: Using Docker Compose Exec

If your database service is named differently in docker-compose.yml:

```bash
# Check your service name
docker-compose ps

# Use compose exec (service name, not container name)
docker-compose exec db psql -U postgres -d qbms -f /path/to/migration.sql
```

---

## Production Deployment with Docker

### Option 1: Manual Migration (Recommended for Phase 4)

```bash
# On production server
cd /path/to/qbms

# Backup
docker exec qbms-db pg_dump -U postgres qbms > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Stop app
docker-compose stop api web

# Run migration
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0009_subjects_nested_under_classes.sql

# Pull new code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f api web
```

### Option 2: Automated via CI/CD (For Phases 2 & 3 Only)

Add to your deployment script:

```bash
# In scripts/deploy.sh or .github/workflows/deploy.yml

# After pulling new code
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0008_enhance_audit_logs.sql || true

# Then restart
docker-compose up -d --build
```

---

## Troubleshooting

### Cannot connect to database container

```bash
# Check if container is running
docker ps | grep db

# Check container name
docker ps --format "table {{.Names}}\t{{.Status}}"

# Try with full container name
docker exec -it <full-container-name> psql -U postgres -d qbms
```

### Permission denied

```bash
# Ensure you're in the project directory
cd /path/to/qbms-new

# Use absolute paths
docker exec -i qbms-db psql -U postgres -d qbms < $(pwd)/packages/database/drizzle/0009_subjects_nested_under_classes.sql
```

### Migration fails midway

```bash
# Check what happened
docker exec -it qbms-db psql -U postgres -d qbms

# Inside psql, check tables
\dt
\d subjects
\d classes

# Rollback
docker exec -i qbms-db psql -U postgres -d qbms < packages/database/drizzle/0009_subjects_nested_under_classes_rollback.sql
```

---

## Quick Reference

### Common Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f db

# Execute SQL directly
docker exec -it qbms-db psql -U postgres -d qbms

# Restart specific service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

### Database Commands Inside Container

```bash
# Enter container
docker exec -it qbms-db bash

# Inside container
psql -U postgres -d qbms

# Inside psql
\dt                    # List tables
\d subjects           # Describe subjects table
\d classes            # Describe classes table
SELECT * FROM subjects LIMIT 5;
\q                    # Quit
```

---

## Environment-Specific Notes

### Local Development
- Database: `localhost:5433`
- Container: `qbms-db` or `qbms-new-db-1`
- User: `postgres`
- Database: `qbms`

### Production (Azure VM)
- Database: Inside Docker network
- Container: Check with `docker ps`
- User: `postgres`
- Database: `qbms`

---

## Migration Checklist

### Phase 2 & 3 (Safe)
- [ ] Backup database (optional, backward compatible)
- [ ] Run migration: `0008_enhance_audit_logs.sql`
- [ ] Restart API container
- [ ] Verify audit logs are being created
- [ ] Test admin logs page

### Phase 4 (Breaking)
- [ ] Schedule maintenance window
- [ ] Backup database (REQUIRED)
- [ ] Run dry-run and review output
- [ ] Stop API and Web containers
- [ ] Run migration: `0009_subjects_nested_under_classes.sql`
- [ ] Verify migration success
- [ ] Pull new code
- [ ] Rebuild containers
- [ ] Start all containers
- [ ] Test subject creation within classes
- [ ] Verify GET /api/subjects returns 410
- [ ] Test cascade delete

---

## Notes

- Always backup before Phase 4 migration
- Phase 2 & 3 are backward compatible
- Phase 4 requires application downtime
- Keep backup files for at least 7 days
- Test rollback procedure on staging first
