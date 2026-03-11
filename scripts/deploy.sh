#!/bin/bash

# QBMS Deployment Script
# This script deploys QBMS to production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="${SERVER_HOST:-qbms.pro}"
SERVER_USER="${SERVER_USER:-azureuser}"
DEPLOY_DIR="/opt/qbms"
BACKUP_DIR="/opt/qbms-backups"

echo -e "${GREEN}🚀 Starting QBMS Deployment${NC}"
echo "=================================="
echo "Server: $SERVER_HOST"
echo "User: $SERVER_USER"
echo "Deploy Directory: $DEPLOY_DIR"
echo ""

# Function to run commands on remote server
remote_exec() {
    ssh "$SERVER_USER@$SERVER_HOST" "$@"
}

# Function to copy files to remote server
remote_copy() {
    scp "$1" "$SERVER_USER@$SERVER_HOST:$2"
}

# Check if we can connect to the server
echo -e "${YELLOW}📡 Checking server connection...${NC}"
if ! remote_exec "echo 'Connection successful'"; then
    echo -e "${RED}❌ Failed to connect to server${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server connection successful${NC}"
echo ""

# Create backup of current deployment
echo -e "${YELLOW}💾 Creating backup...${NC}"
BACKUP_NAME="qbms-backup-$(date +%Y%m%d-%H%M%S)"
remote_exec "mkdir -p $BACKUP_DIR && \
    if [ -d $DEPLOY_DIR ]; then \
        cp -r $DEPLOY_DIR $BACKUP_DIR/$BACKUP_NAME && \
        echo 'Backup created: $BACKUP_NAME'; \
    else \
        echo 'No existing deployment to backup'; \
    fi"
echo ""

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
remote_exec "mkdir -p $DEPLOY_DIR"
echo -e "${GREEN}✅ Directory created${NC}"
echo ""

# Copy docker-compose and nginx config
echo -e "${YELLOW}📦 Copying configuration files...${NC}"
remote_copy "docker-compose.prod.yml" "$DEPLOY_DIR/docker-compose.yml"
remote_copy "docker/nginx.prod.conf" "$DEPLOY_DIR/nginx.conf"
echo -e "${GREEN}✅ Configuration files copied${NC}"
echo ""

# Check if .env exists on server
echo -e "${YELLOW}🔐 Checking environment variables...${NC}"
if ! remote_exec "[ -f $DEPLOY_DIR/.env ]"; then
    echo -e "${RED}⚠️  .env file not found on server${NC}"
    echo "Please create .env file on the server with required variables"
    echo "You can use .env.example as a template"
    exit 1
fi
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Pull latest images
echo -e "${YELLOW}🐳 Pulling Docker images...${NC}"
remote_exec "cd $DEPLOY_DIR && docker-compose pull"
echo -e "${GREEN}✅ Images pulled${NC}"
echo ""

# Stop old containers
echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
remote_exec "cd $DEPLOY_DIR && docker-compose down || true"
echo -e "${GREEN}✅ Old containers stopped${NC}"
echo ""

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
remote_exec "cd $DEPLOY_DIR && docker-compose up -d"
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Checking container status...${NC}"
remote_exec "cd $DEPLOY_DIR && docker-compose ps"
echo ""

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
remote_exec "cd $DEPLOY_DIR && docker-compose exec -T api npm run migrate || echo 'Migration skipped or failed'"
echo ""

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
if curl -f -s "https://$SERVER_HOST/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Rolling back to previous version..."
    remote_exec "cd $DEPLOY_DIR && docker-compose down && \
        cp -r $BACKUP_DIR/$BACKUP_NAME/* $DEPLOY_DIR/ && \
        docker-compose up -d"
    exit 1
fi
echo ""

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
remote_exec "docker image prune -af --filter 'until=24h'"
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Cleanup old backups (keep last 5)
echo -e "${YELLOW}🗑️  Cleaning up old backups...${NC}"
remote_exec "cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf"
echo -e "${GREEN}✅ Old backups cleaned${NC}"
echo ""

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================="
echo "Application URL: https://$SERVER_HOST"
echo "Backup location: $BACKUP_DIR/$BACKUP_NAME"
echo ""
echo "To view logs:"
echo "  ssh $SERVER_USER@$SERVER_HOST 'cd $DEPLOY_DIR && docker-compose logs -f'"
echo ""
echo "To rollback:"
echo "  ssh $SERVER_USER@$SERVER_HOST 'cd $DEPLOY_DIR && docker-compose down && cp -r $BACKUP_DIR/$BACKUP_NAME/* $DEPLOY_DIR/ && docker-compose up -d'"
