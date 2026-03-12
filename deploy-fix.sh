#!/bin/bash

# Deployment Script for QBMS Fix
# This script updates the server with the latest code

set -e  # Exit on any error

echo "=========================================="
echo "QBMS Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check current directory
echo -e "${YELLOW}Step 1: Checking current directory...${NC}"
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi
echo -e "${GREEN}✓ Found docker-compose.yml${NC}"
echo ""

# Step 2: Check git status
echo -e "${YELLOW}Step 2: Checking git status...${NC}"
git status
echo ""

# Step 3: Pull latest changes
echo -e "${YELLOW}Step 3: Pulling latest changes from GitHub...${NC}"
git fetch origin main
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 4: Show recent commits
echo -e "${YELLOW}Step 4: Recent commits:${NC}"
git log --oneline -5
echo ""

# Step 5: Stop services
echo -e "${YELLOW}Step 5: Stopping services...${NC}"
docker-compose down
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

# Step 6: Rebuild API
echo -e "${YELLOW}Step 6: Rebuilding API container...${NC}"
docker-compose build --no-cache api
echo -e "${GREEN}✓ API rebuilt${NC}"
echo ""

# Step 7: Start services
echo -e "${YELLOW}Step 7: Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 8: Wait for services to be ready
echo -e "${YELLOW}Step 8: Waiting for services to be ready...${NC}"
sleep 10
echo ""

# Step 9: Check service status
echo -e "${YELLOW}Step 9: Checking service status...${NC}"
docker-compose ps
echo ""

# Step 10: Test API endpoint
echo -e "${YELLOW}Step 10: Testing API endpoint...${NC}"
echo "Testing: http://localhost:4000/api/subjects"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/subjects)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ API endpoint working! (HTTP $RESPONSE)${NC}"
else
    echo -e "${RED}✗ API endpoint returned HTTP $RESPONSE${NC}"
    echo "Checking API logs..."
    docker-compose logs api --tail=50
fi
echo ""

# Step 11: Show API logs
echo -e "${YELLOW}Step 11: Recent API logs:${NC}"
docker-compose logs api --tail=30
echo ""

echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+Delete)"
echo "2. Hard refresh the page (Ctrl+F5)"
echo "3. Try accessing https://qbms.pro/dashboard/subjects"
echo ""
echo "If issues persist, check logs with:"
echo "  docker-compose logs -f api"
echo ""
