# Production Deployment Checklist

Complete this checklist before deploying QBMS to production.

## 🔒 Security

### Secrets & Credentials
- [ ] Generate strong JWT_SECRET (32+ characters, random)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Generate strong REFRESH_SECRET (different from JWT_SECRET)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Change PostgreSQL password from default `qbms`
- [ ] Update all secrets in docker-compose.yml or use .env file
- [ ] Never commit .env file to version control
- [ ] Verify .env is in .gitignore

### SSL/TLS
- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Configure nginx for HTTPS (port 443)
- [ ] Redirect HTTP to HTTPS
- [ ] Set secure cookie flags in API
- [ ] Update CORS_ORIGIN to use https://
- [ ] Update APP_URL to use https://

### Access Control
- [ ] Change super admin password from default
- [ ] Disable or remove test accounts (instructor@qbms.local, student@qbms.local)
- [ ] Configure firewall rules (only 80, 443 open)
- [ ] Restrict database access (not publicly accessible)
- [ ] Restrict Redis access (not publicly accessible)
- [ ] Review and adjust rate limits if needed

### Code Security
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update all dependencies to latest stable versions
- [ ] Remove any console.log statements with sensitive data
- [ ] Verify no API keys or secrets in code
- [ ] Enable Helmet.js security headers (already configured)

---

## 📧 Email Configuration

### SMTP Setup
- [ ] Obtain SMTP credentials from email provider
- [ ] Set SMTP_HOST (e.g., smtp.gmail.com, smtp.sendgrid.net)
- [ ] Set SMTP_PORT (usually 587 for TLS)
- [ ] Set SMTP_USER (your email or API username)
- [ ] Set SMTP_PASS (your password or API key)
- [ ] Set FROM_EMAIL (verified sender address)
- [ ] Test email sending:
  ```bash
  # Try password reset to test
  curl -X POST https://yourdomain.com/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"your-test-email@example.com"}'
  ```

### Email Templates
- [ ] Customize email templates if needed (apps/api/src/lib/email.ts)
- [ ] Add company logo to emails (optional)
- [ ] Update email footer with company info
- [ ] Test all email flows:
  - [ ] Registration OTP
  - [ ] Password reset
  - [ ] Instructor invite

---

## 🗄️ Database

### PostgreSQL Setup
- [ ] Use managed PostgreSQL service (recommended) or secure self-hosted
- [ ] Enable automated backups (daily minimum)
- [ ] Set up backup retention policy (7-30 days)
- [ ] Test backup restoration process
- [ ] Configure connection pooling
- [ ] Set appropriate max_connections
- [ ] Enable query logging for debugging (disable in production after testing)
- [ ] Create read replicas for scaling (optional)

### Migrations
- [ ] Run all migrations on production database
  ```bash
  docker exec qbms-api npm run db:migrate
  ```
- [ ] Verify all tables created correctly
- [ ] Check indexes are in place
- [ ] Seed super admin account
  ```bash
  docker exec qbms-api node scripts/seed-superadmin.cjs
  ```

---

## 💾 Redis

### Redis Setup
- [ ] Use managed Redis service (recommended) or secure self-hosted
- [ ] Enable Redis persistence (RDB or AOF)
- [ ] Configure maxmemory policy (allkeys-lru recommended)
- [ ] Set up Redis password authentication
- [ ] Update REDIS_URL with password if configured
- [ ] Test Redis connection from API

---

## 🐳 Docker & Infrastructure

### Docker Configuration
- [ ] Review docker-compose.yml for production settings
- [ ] Set appropriate resource limits (memory, CPU)
- [ ] Configure restart policies (restart: always)
- [ ] Use specific image tags (not :latest)
- [ ] Set up Docker logging driver
- [ ] Configure log rotation

### Nginx
- [ ] Review nginx.conf for production settings
- [ ] Enable gzip compression (already configured)
- [ ] Set appropriate rate limits
- [ ] Configure client_max_body_size for file uploads
- [ ] Add security headers (already configured)
- [ ] Set up access logs
- [ ] Configure error pages (404, 500, etc.)

### Server
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] 20GB+ storage (more for uploads and backups)
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ufw or iptables)
- [ ] SSH key authentication (disable password auth)
- [ ] Non-root user for running services
- [ ] Automatic security updates enabled

---

## 🌐 Domain & DNS

### Domain Setup
- [ ] Purchase domain name
- [ ] Configure DNS A record pointing to server IP
- [ ] Configure DNS AAAA record for IPv6 (optional)
- [ ] Set up www subdomain (optional)
- [ ] Configure DNS TTL appropriately
- [ ] Wait for DNS propagation (up to 48 hours)

### Subdomain (Optional)
- [ ] Create subdomain for API (api.yourdomain.com)
- [ ] Update CORS_ORIGIN and APP_URL accordingly
- [ ] Update nginx configuration for subdomain

---

## 🔍 Monitoring & Logging

### Health Checks
- [ ] Verify health endpoints working:
  - [ ] https://yourdomain.com/health
  - [ ] https://yourdomain.com/health/db
  - [ ] https://yourdomain.com/health/redis
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerts for downtime

### Logging
- [ ] Configure log aggregation (optional: ELK, Datadog, etc.)
- [ ] Set up log rotation
- [ ] Monitor disk space for logs
- [ ] Review logs regularly for errors
- [ ] Set up error alerting (optional)

### Performance Monitoring
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Monitor database performance
- [ ] Monitor Redis memory usage
- [ ] Set up APM (optional: New Relic, Datadog, etc.)

---

## 🧪 Testing

### Pre-deployment Testing
- [ ] Run completeness check
  ```bash
  npm run check
  ```
- [ ] Run API tests
  ```bash
  npm run test:api
  ```
- [ ] Run frontend tests
  ```bash
  npm run test:frontend
  ```
- [ ] Test all user flows manually:
  - [ ] Super admin: Login, invite instructor, view analytics
  - [ ] Instructor: Create subject, topic, question, class, exam
  - [ ] Student: Register, enroll, take exam, view result

### Post-deployment Testing
- [ ] Test registration with real email
- [ ] Test login with all roles
- [ ] Test password reset flow
- [ ] Test exam taking end-to-end
- [ ] Test file uploads (if applicable)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Load test with expected user count (optional)

---

## 📱 Optional Features

### AI Question Generation
- [ ] Obtain OpenAI API key
- [ ] Set OPENAI_API_KEY in environment
- [ ] Test question generation
- [ ] Monitor API usage and costs
- [ ] Set up usage alerts

### File Uploads
- [ ] Configure UPLOAD_DIR
- [ ] Set up file size limits
- [ ] Configure allowed file types
- [ ] Set up virus scanning (optional)
- [ ] Configure CDN for file serving (optional)

---

## 📋 Documentation

### Update Documentation
- [ ] Update README.md with production URL
- [ ] Update CREDENTIALS.md (remove or secure test accounts)
- [ ] Update docs/DEPLOYMENT-GUIDE.md with actual deployment details
- [ ] Create internal documentation for team (optional)
- [ ] Document backup and restore procedures
- [ ] Document incident response procedures

### User Training
- [ ] Create user accounts for staff
- [ ] Provide training for super admins
- [ ] Provide training for instructors
- [ ] Create quick start guide for students
- [ ] Set up support channel (email, chat, etc.)

---

## 🚀 Deployment

### Initial Deployment
- [ ] Clone repository to server
  ```bash
  git clone <repository-url>
  cd qbms
  ```
- [ ] Create .env file with production values
  ```bash
  cp .env.example .env
  nano .env
  ```
- [ ] Build and start services
  ```bash
  docker-compose up -d --build
  ```
- [ ] Wait for services to be healthy
  ```bash
  docker-compose ps
  ```
- [ ] Run migrations
  ```bash
  docker exec qbms-api npm run db:migrate
  ```
- [ ] Create super admin
  ```bash
  docker exec qbms-api node scripts/seed-superadmin.cjs
  ```
- [ ] Verify application is accessible
- [ ] Login and change super admin password

### Post-deployment
- [ ] Monitor logs for errors
  ```bash
  docker-compose logs -f
  ```
- [ ] Check all health endpoints
- [ ] Test critical user flows
- [ ] Monitor server resources
- [ ] Set up automated backups
- [ ] Schedule regular maintenance window

---

## 🔄 Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Weekly: Review security alerts
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and rotate logs
- [ ] Monthly: Test backup restoration
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance review

### Backup Schedule
- [ ] Daily: Database backup
- [ ] Daily: Uploaded files backup
- [ ] Weekly: Full system backup
- [ ] Monthly: Offsite backup copy
- [ ] Test restoration: Monthly

---

## 📞 Support & Incident Response

### Support Setup
- [ ] Create support email (support@yourdomain.com)
- [ ] Set up ticketing system (optional)
- [ ] Create FAQ document
- [ ] Train support staff
- [ ] Document common issues and solutions

### Incident Response
- [ ] Create incident response plan
- [ ] Document escalation procedures
- [ ] Set up emergency contacts
- [ ] Create rollback procedures
- [ ] Test disaster recovery plan

---

## ✅ Final Verification

Before going live:
- [ ] All items in Security section completed
- [ ] All items in Email Configuration completed
- [ ] All items in Database section completed
- [ ] All items in Testing section completed
- [ ] SSL certificate installed and working
- [ ] Backups configured and tested
- [ ] Monitoring and alerts set up
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support channels ready

### Go-Live Checklist
- [ ] Announce maintenance window (if replacing existing system)
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor for 1 hour after deployment
- [ ] Announce system is live
- [ ] Monitor closely for first 24 hours
- [ ] Collect user feedback
- [ ] Address any issues immediately

---

## 🎉 Post-Launch

### Week 1
- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Update documentation based on feedback
- [ ] Optimize performance if needed

### Month 1
- [ ] Review analytics and usage patterns
- [ ] Plan feature enhancements
- [ ] Conduct user satisfaction survey
- [ ] Review and optimize costs
- [ ] Plan scaling if needed

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: _______________

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

*Keep this checklist and update it as you complete items. Store it securely with your deployment documentation.*
